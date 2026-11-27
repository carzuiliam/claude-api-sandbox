import fs from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';

// Input of a text editor tool call (text_editor_20250728), as Claude sends it.
interface EditorInput {
    command: 'view' | 'create' | 'str_replace' | 'insert';
    path: string;
    view_range?: [number, number];
    file_text?: string;
    old_str?: string;
    new_str?: string;
    insert_line?: number;
    insert_text?: string;
}

// Error whose message goes back to Claude as the tool result.
class EditorError extends Error {}

// Resolves a model-supplied path inside the root and rejects anything that escapes it.
const resolveInRoot = async (root: string, inputPath: string): Promise<string> => {
    if (typeof inputPath !== 'string' || !inputPath.trim()) {
        throw new EditorError('The path is required.');
    }

    const isInside = (target: string) => target === root || target.startsWith(root + path.sep);
    const resolved = path.resolve(root, inputPath.replace(/^[/\\]+/, ''));

    if (!isInside(resolved)) {
        throw new EditorError(`The path ${inputPath} is outside the workspace.`);
    }

    // Follows symlinks of the deepest existing ancestor so a link can't point outside the root.
    let existing = resolved;

    while (!(await exists(existing))) {
        existing = path.dirname(existing);
    }

    if (!isInside(await fs.realpath(existing))) {
        throw new EditorError(`The path ${inputPath} is outside the workspace.`);
    }

    return resolved;
};

const exists = async (target: string) => fs.access(target).then(() => true, () => false);

// Shows a path relative to the root, the way Claude refers to it.
const display = (root: string, target: string) => '/' + path.relative(root, target).split(path.sep).join('/');

// Lists a directory up to two levels deep, skipping hidden entries.
const listDirectory = async (root: string, dir: string, depth = 0): Promise<string[]> => {
    const entries = (await fs.readdir(dir, { withFileTypes: true })).filter((entry) => !entry.name.startsWith('.'));
    const lines: string[] = [];

    for (const entry of entries) {
        const full = path.join(dir, entry.name);

        lines.push(display(root, full) + (entry.isDirectory() ? '/' : ''));

        if (entry.isDirectory() && depth < 1) {
            lines.push(...(await listDirectory(root, full, depth + 1)));
        }
    }

    return lines;
};

const view = async (root: string, target: string, input: EditorInput) => {
    if (!(await exists(target))) {
        throw new EditorError(`The path ${input.path} does not exist.`);
    }

    if ((await fs.stat(target)).isDirectory()) {
        const lines = await listDirectory(root, target);

        return lines.length ? lines.join('\n') : `The directory ${input.path} is empty.`;
    }

    const lines = (await fs.readFile(target, 'utf8')).split('\n');
    let start = 1;
    let end = lines.length;

    if (input.view_range) {
        [start, end] = input.view_range;
        end = end === -1 ? lines.length : end;

        if (start < 1 || start > lines.length || end < start || end > lines.length) {
            throw new EditorError(`Invalid view_range ${JSON.stringify(input.view_range)}: the file has ${lines.length} lines.`);
        }
    }

    return lines
        .slice(start - 1, end)
        .map((line, index) => `${start + index}: ${line}`)
        .join('\n');
};

const create = async (target: string, input: EditorInput) => {
    if (typeof input.file_text !== 'string') {
        throw new EditorError('The file_text is required for create.');
    }

    // Keeps the previous version when overwriting, as the tool docs recommend.
    if (await exists(target)) {
        await fs.copyFile(target, `${target}.bak`);
    }

    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, input.file_text, 'utf8');

    return `File ${input.path} created.`;
};

const readExistingFile = async (target: string, input: EditorInput) => {
    if (!(await exists(target)) || (await fs.stat(target)).isDirectory()) {
        throw new EditorError(`The file ${input.path} does not exist.`);
    }

    return fs.readFile(target, 'utf8');
};

const strReplace = async (target: string, input: EditorInput) => {
    if (typeof input.old_str !== 'string' || !input.old_str) {
        throw new EditorError('The old_str is required for str_replace.');
    }

    const text = await readExistingFile(target, input);
    const matches = text.split(input.old_str).length - 1;

    if (matches === 0) {
        throw new EditorError(`No match for old_str in ${input.path}. Check the exact text, including whitespace.`);
    }

    if (matches > 1) {
        throw new EditorError(`Found ${matches} matches for old_str in ${input.path}. Add more context to make it unique.`);
    }

    await fs.writeFile(target, text.replace(input.old_str, () => input.new_str ?? ''), 'utf8');

    return `File ${input.path} edited.`;
};

const insert = async (target: string, input: EditorInput) => {
    // Older tool versions sent the text as new_str.
    const insertText = input.insert_text ?? input.new_str;

    if (typeof insertText !== 'string' || typeof input.insert_line !== 'number') {
        throw new EditorError('The insert_line and insert_text are required for insert.');
    }

    const lines = (await readExistingFile(target, input)).split('\n');

    if (input.insert_line < 0 || input.insert_line > lines.length) {
        throw new EditorError(`Invalid insert_line ${input.insert_line}: the file has ${lines.length} lines.`);
    }

    lines.splice(input.insert_line, 0, ...insertText.split('\n'));
    await fs.writeFile(target, lines.join('\n'), 'utf8');

    return `Text inserted after line ${input.insert_line} of ${input.path}.`;
};

const runCommand = async (root: string, input: EditorInput): Promise<string> => {
    const target = await resolveInRoot(root, input.path);

    switch (input.command) {
        case 'view':
            return view(root, target, input);
        case 'create':
            return create(target, input);
        case 'str_replace':
            return strReplace(target, input);
        case 'insert':
            return insert(target, input);
        default:
            throw new EditorError(`Unknown command: ${String(input.command)}.`);
    }
};

// Dev server endpoint (POST /files) that runs text editor commands inside the workspace folder.
export const fileEditorPlugin = (workspaceDir: string): Plugin => ({
    name: 'file-editor',
    configureServer: async (server) => {
        const root = path.resolve(workspaceDir);

        await fs.mkdir(root, { recursive: true });

        server.middlewares.use('/files', (request, response) => {
            if (request.method !== 'POST') {
                response.statusCode = 405;
                response.end();
                return;
            }

            let body = '';

            request.on('data', (chunk) => {
                body += chunk;
            });

            request.on('end', async () => {
                response.setHeader('Content-Type', 'application/json');

                try {
                    const content = await runCommand(await fs.realpath(root), JSON.parse(body));

                    response.end(JSON.stringify({ content }));
                } catch (error) {
                    response.statusCode = error instanceof EditorError ? 400 : 500;
                    response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
                }
            });
        });
    },
});

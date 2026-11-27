export class FileService {

    // Sends a text editor tool call to the dev server, which runs it inside the workspace folder.
    runEditorCommand = async (_input: unknown): Promise<string> => {
        const response = await fetch('/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(_input),
        });

        const result = await response.json() as { content?: string; error?: string };

        if (!response.ok) {
            throw new Error(result.error ?? `File request failed with status ${response.status}.`);
        }

        return result.content ?? '';
    };
};

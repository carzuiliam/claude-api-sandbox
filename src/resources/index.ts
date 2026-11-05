const toOptions = (files: Record<string, string>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(files).map(([path, content]) => [
      path.split('/').pop()!.replace(/\.[^.]+$/, ''),
      content,
    ]),
  );

export const agents = toOptions(
  import.meta.glob<string>('./agents/*.md', { query: '?raw', import: 'default', eager: true }),
);

export const schemas = toOptions(
  import.meta.glob<string>('./schemas/*.json', { query: '?raw', import: 'default', eager: true }),
);

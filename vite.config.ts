import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileEditorPlugin } from './server/fileEditor.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), fileEditorPlugin('workspace')],
    server: {
      port: 3000,
      proxy: {
        '/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/anthropic/, ''),
          headers: { 'x-api-key': env.ANTHROPIC_API_KEY },
        },
      },
    },
  };
});

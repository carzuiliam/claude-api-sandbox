/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLAUDE_MODEL: string;
  readonly VITE_CLAUDE_MAX_TOKENS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

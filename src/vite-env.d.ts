/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LEGACY_API_BASE: string;
  readonly VITE_LOCAL_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

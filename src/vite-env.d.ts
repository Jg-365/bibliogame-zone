/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GROQ_API_KEY?: string;
  readonly VITE_GROQ_MODEL?: string;
  readonly VITE_FF_AI_COPILOT?: string;
  readonly VITE_FF_READING_FOCUS_TIMER?: string;
  readonly VITE_FF_WEEKLY_GOAL?: string;
  readonly VITE_FF_RETENTION_METRICS?: string;
  readonly VITE_FF_SMART_RECOMMENDATIONS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

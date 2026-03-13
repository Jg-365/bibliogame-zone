export const GROQ_MODELS = [
  "allam-2-7b",
  "groq/compound",
  "groq/compound-mini",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-guard-4-12b",
  "meta-llama/llama-prompt-guard-2-22m",
  "meta-llama/llama-prompt-guard-2-86m",
  "moonshotai/kimi-k2-instruct",
  "moonshotai/kimi-k2-instruct-0905",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-safeguard-20b",
  "qwen/qwen3-32b",
] as const;

export type GroqModel = (typeof GROQ_MODELS)[number];

export const DEFAULT_PRIMARY_MODEL: GroqModel = "llama-3.1-8b-instant";

export const DEFAULT_FALLBACK_MODELS: readonly GroqModel[] = [
  "groq/compound-mini",
  "groq/compound",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.3-70b-versatile",
  "qwen/qwen3-32b",
  "moonshotai/kimi-k2-instruct",
  "moonshotai/kimi-k2-instruct-0905",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "allam-2-7b",
  "openai/gpt-oss-safeguard-20b",
  "meta-llama/llama-guard-4-12b",
  "meta-llama/llama-prompt-guard-2-86m",
  "meta-llama/llama-prompt-guard-2-22m",
] as const;

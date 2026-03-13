import { supabase } from "@/integrations/supabase/client";

type IngestBookPayload = {
  isbn?: string;
  title?: string;
  force_reingest?: boolean;
};

type AskBookQuestionPayload = {
  book_id?: string;
  user_question: string;
  max_chapters?: number;
  allow_fallback?: boolean;
  current_page?: number;
  current_position?: string;
  mode?: "book-chat" | "recommendations" | "consistency";
  response_style?: "objective" | "detailed";
  avoid_spoilers?: boolean;
};

type AskBookQuestionResponse = {
  success: boolean;
  answer: string;
  confidence?: number;
  chapters_used?: string[];
  used_fallback?: boolean;
  used_local_quota_fallback?: boolean;
  needs_reindex?: boolean;
  context_mode?: "indexed" | "metadata" | "general" | "cached";
  cached?: boolean;
  error?: string;
};

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sessao invalida. Faca login novamente.");
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
  };
};

const resolveApiUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, "")}${path}`;
};

const postLocalApi = async <T>(path: string, body: unknown): Promise<T> => {
  const headers = await getAuthHeaders();
  const response = await fetch(resolveApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => null)) as T | { error?: string } | null;
  if (!response.ok) {
    throw new Error(
      (data && typeof data === "object" && "error" in data && data.error) ||
        `Erro HTTP ${response.status}`,
    );
  }
  return data as T;
};

export const ingestBookKnowledge = async (payload: IngestBookPayload) =>
  postLocalApi<{
    success: boolean;
    code?: string;
    book_id?: string;
    message?: string;
    skipped?: boolean;
    error?: string;
  }>("/api/book-knowledge/ingest", payload);

export const askBookQuestion = async (payload: AskBookQuestionPayload) => {
  const parsed = await postLocalApi<AskBookQuestionResponse>("/api/book-knowledge/ask", payload);
  if (!parsed?.success) {
    throw new Error(parsed?.error || "Resposta invalida do copiloto.");
  }
  return parsed;
};

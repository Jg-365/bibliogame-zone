import { supabase } from "@/integrations/supabase/client";

export type HybridBookSummaryPayload = {
  book_title: string;
  page_number: number;
};

export type HybridBookSummaryResponse = {
  chapter_title: string;
  summary: string;
  key_points: string[];
  source_confidence: "high" | "medium" | "low";
  metadata?: {
    matched_via_supabase: boolean;
    supabase_chapter?: {
      id: string;
      title: string;
      chapter_name: string;
      start_page: number;
      end_page: number;
    } | null;
    brave_query_mode?: string;
    brave_snippet_count?: number;
    deduced_chapter_title?: string | null;
  };
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

export const summarizeBookChapterHybrid = async (
  payload: HybridBookSummaryPayload,
): Promise<HybridBookSummaryResponse> => {
  const headers = await getAuthHeaders();
  const response = await fetch(resolveApiUrl("/api/book-summary/hybrid"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | HybridBookSummaryResponse
    | { error?: string }
    | null;
  if (!response.ok) {
    throw new Error(
      (data && typeof data === "object" && "error" in data && data.error) ||
        `Erro HTTP ${response.status}`,
    );
  }

  return data as HybridBookSummaryResponse;
};

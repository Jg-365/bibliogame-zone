import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import {
  braveSearch,
  callGeminiJson,
  corsHeaders,
  downloadAndSanitizePage,
  normalizeQuestion,
  sha256Hex,
} from "../_shared/book-ai.ts";

type AskRequest = {
  book_id: string;
  user_question: string;
  max_chapters?: number;
  allow_fallback?: boolean;
  current_page?: number;
  current_position?: string;
};

type GeminiAnswerResult = {
  answer: string;
  confidence: number;
  chapters_used?: string[];
  uncertainty_note?: string;
};

type RankedChapter = {
  chapter_id: string;
  chapter_number: number | null;
  chapter_title: string;
  chapter_summary: string;
  relevance_score: number;
};

const clamp = (v: number | undefined, fallback = 0.5) => {
  if (typeof v !== "number" || Number.isNaN(v)) return fallback;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return Number(v.toFixed(3));
};

const boostChaptersByReadingPosition = (params: {
  chapters: RankedChapter[];
  currentPage?: number;
  totalPages?: number | null;
  currentPosition?: string;
  checkpointLabel?: string | null;
}) => {
  const { chapters, currentPage, totalPages, currentPosition, checkpointLabel } = params;
  const currentPositionText = `${currentPosition ?? ""} ${checkpointLabel ?? ""}`.toLowerCase().trim();
  const approximateChapterNumber =
    currentPage && totalPages && chapters.length
      ? Math.min(chapters.length, Math.max(1, Math.ceil((currentPage / totalPages) * chapters.length)))
      : null;

  return [...chapters]
    .map((chapter) => {
      let score = chapter.relevance_score ?? 0;
      if (approximateChapterNumber && chapter.chapter_number === approximateChapterNumber) {
        score += 1.25;
      }
      if (approximateChapterNumber && chapter.chapter_number && Math.abs(chapter.chapter_number - approximateChapterNumber) === 1) {
        score += 0.35;
      }
      if (currentPositionText && chapter.chapter_title.toLowerCase().includes(currentPositionText)) {
        score += 1.6;
      }
      if (checkpointLabel && chapter.chapter_title.toLowerCase().includes(checkpointLabel.toLowerCase())) {
        score += 1.2;
      }
      return { ...chapter, relevance_score: score };
    })
    .sort(
      (a, b) =>
        b.relevance_score - a.relevance_score ||
        (a.chapter_number ?? Number.MAX_SAFE_INTEGER) - (b.chapter_number ?? Number.MAX_SAFE_INTEGER),
    );
};

const buildAnswerPrompt = (params: {
  bookTitle: string;
  question: string;
  chapterContext: string;
  currentPage?: number;
  currentPosition?: string;
  checkpointLabel?: string | null;
}) => `
Voce e um copiloto literario para o livro "${params.bookTitle}".

Use apenas o contexto abaixo para responder.
Nao invente fatos.
Se houver incerteza, explique.
Respeite a parte atual do leitor no livro.

Retorne JSON com:
{
  "answer": "string",
  "confidence": 0.0,
  "chapters_used": ["chapter-id"],
  "uncertainty_note": "string opcional"
}

Regras:
- confidence entre 0 e 1.
- chapters_used deve conter apenas ids do contexto.
- resposta objetiva, interpretativa e coerente com a parte atual do leitor.
- se a pergunta pedir algo alem da parte atual, avise isso com clareza.

Contexto de leitura atual:
Pagina atual: ${params.currentPage ?? "desconhecida"}
Posicao atual: ${params.currentPosition ?? "nao informada"}
Checkpoint mais proximo: ${params.checkpointLabel ?? "nao informado"}

Contexto de capitulos e analises:
${params.chapterContext}

Pergunta do usuario:
${params.question}
`;

const buildFallbackPrompt = (params: {
  bookTitle: string;
  question: string;
  chapterContext: string;
  fallbackWeb: string;
  currentPage?: number;
  currentPosition?: string;
}) => `
Voce e um copiloto literario para o livro "${params.bookTitle}".

A base local esta incompleta; use PRIMEIRO o contexto local.
Use o contexto web apenas para completar lacunas e diga explicitamente quando usar esse complemento.
Mantenha respeito a parte atual do leitor.

Retorne JSON:
{
  "answer": "string",
  "confidence": 0.0,
  "chapters_used": ["chapter-id"],
  "uncertainty_note": "string opcional"
}

Contexto de leitura atual:
Pagina atual: ${params.currentPage ?? "desconhecida"}
Posicao atual: ${params.currentPosition ?? "nao informada"}

Contexto local:
${params.chapterContext}

Contexto web complementar:
${params.fallbackWeb}

Pergunta:
${params.question}
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase env secrets.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const payload = (await req.json()) as AskRequest;
    if (!payload.book_id || !payload.user_question?.trim()) {
      return new Response(JSON.stringify({ error: "book_id and user_question are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const maxChapters = Math.min(Math.max(payload.max_chapters ?? 5, 1), 5);
    const allowFallback = payload.allow_fallback !== false;

    const { data: book, error: bookError } = await adminClient
      .from("books")
      .select("id, user_id, title, author, total_pages")
      .eq("id", payload.book_id)
      .maybeSingle();
    if (bookError || !book) {
      return new Response(JSON.stringify({ error: "Book not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }
    if (book.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const normalizedQ = normalizeQuestion(
      `${payload.user_question}\npage:${payload.current_page ?? ""}\nposition:${payload.current_position ?? ""}`,
    );
    const qHash = await sha256Hex(normalizedQ);
    const nowIso = new Date().toISOString();

    const { data: cacheHit } = await adminClient
      .from("question_cache")
      .select("ai_answer, chapters_used, confidence_score")
      .eq("book_id", book.id)
      .eq("question_hash", qHash)
      .gt("expires_at", nowIso)
      .maybeSingle();

    if (cacheHit) {
      return new Response(
        JSON.stringify({
          success: true,
          answer: cacheHit.ai_answer,
          confidence: clamp(cacheHit.confidence_score ?? 0.85, 0.85),
          chapters_used: cacheHit.chapters_used ?? [],
          cached: true,
          used_fallback: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const { data: rankedChapters, error: rankError } = await adminClient.rpc("search_book_chapters", {
      p_book_id: book.id,
      p_query: payload.user_question,
      p_limit: Math.max(maxChapters * 2, 6),
    });
    if (rankError) throw rankError;

    const currentPage = typeof payload.current_page === "number" ? payload.current_page : undefined;
    const currentPosition = payload.current_position?.trim() || undefined;
    const { data: nearestCheckpoint } = currentPage
      ? await adminClient
          .from("reading_checkpoints")
          .select("chapter_label, page_number")
          .eq("user_id", user.id)
          .eq("book_id", book.id)
          .lte("page_number", currentPage)
          .order("page_number", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

    const boostedChapters = boostChaptersByReadingPosition({
      chapters: ((rankedChapters ?? []) as RankedChapter[]).slice(0, 12),
      currentPage,
      totalPages: book.total_pages,
      currentPosition,
      checkpointLabel: nearestCheckpoint?.chapter_label ?? null,
    });

    const selectedChapters = boostedChapters.slice(0, maxChapters);
    const chapterIds = selectedChapters.map((chapter) => chapter.chapter_id);

    const { data: analyses } = chapterIds.length
      ? await adminClient
          .from("chapter_analysis")
          .select("chapter_id, analysis_text, source_url, source_name, confidence_score")
          .in("chapter_id", chapterIds)
          .limit(200)
      : { data: [] as any[] };

    const { data: events } = chapterIds.length
      ? await adminClient
          .from("chapter_events")
          .select("chapter_id, event_description, importance_score")
          .in("chapter_id", chapterIds)
          .limit(300)
      : { data: [] as any[] };

    const chapterContext = selectedChapters
      .map((chapter) => {
        const chapterAnalyses = (analyses ?? [])
          .filter((analysis) => analysis.chapter_id === chapter.chapter_id)
          .slice(0, 4)
          .map(
            (analysis) =>
              `Analise (${analysis.source_name ?? "fonte"} | conf=${analysis.confidence_score ?? 0.5}): ${analysis.analysis_text}`,
          )
          .join(" | ");
        const chapterEvents = (events ?? [])
          .filter((event) => event.chapter_id === chapter.chapter_id)
          .slice(0, 5)
          .map((event) => `${event.event_description} (imp=${event.importance_score ?? 0.5})`)
          .join(" | ");
        return [
          `[CHAPTER] id=${chapter.chapter_id}`,
          `Numero: ${chapter.chapter_number ?? "n/a"} | Titulo: ${chapter.chapter_title}`,
          `Resumo: ${chapter.chapter_summary}`,
          chapterEvents ? `Eventos: ${chapterEvents}` : "",
          chapterAnalyses ? `Analises: ${chapterAnalyses}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n")
      .slice(0, 40_000);

    const answer1 = await callGeminiJson<GeminiAnswerResult>(
      buildAnswerPrompt({
        bookTitle: book.title,
        question: payload.user_question,
        chapterContext,
        currentPage,
        currentPosition,
        checkpointLabel: nearestCheckpoint?.chapter_label ?? null,
      }),
      {
        temperature: 0.2,
        maxOutputTokens: 2500,
      },
    );

    let finalAnswer = answer1;
    let usedFallback = false;
    const baseConfidence = clamp(answer1.confidence, 0.45);
    const lowConfidence = baseConfidence < 0.55 || selectedChapters.length === 0;

    if (allowFallback && lowConfidence) {
      const searchQuery = `${book.title} ${book.author ?? ""} ${payload.user_question}`;
      const fallbackResults = (await braveSearch(searchQuery, 3)).slice(0, 3);
      const fallbackTexts: string[] = [];
      for (const result of fallbackResults) {
        const text = await downloadAndSanitizePage(result.url, { maxChars: 8_000, minChars: 500 });
        if (!text) continue;
        fallbackTexts.push(`[WEB] ${result.title} | ${result.url}\n${text.slice(0, 5_000)}`);
      }
      if (fallbackTexts.length) {
        const answer2 = await callGeminiJson<GeminiAnswerResult>(
          buildFallbackPrompt({
            bookTitle: book.title,
            question: payload.user_question,
            chapterContext,
            fallbackWeb: fallbackTexts.join("\n\n"),
            currentPage,
            currentPosition,
          }),
          {
            temperature: 0.2,
            maxOutputTokens: 2600,
          },
        );
        finalAnswer = answer2;
        usedFallback = true;
      }
    }

    const finalConfidence = clamp(finalAnswer.confidence, baseConfidence);
    const chaptersUsed = (finalAnswer.chapters_used ?? chapterIds).slice(0, maxChapters);
    const answerText = finalAnswer.answer?.trim() || "Nao foi possivel gerar uma resposta confiavel.";

    await adminClient.from("questions_log").insert({
      book_id: book.id,
      user_question: payload.user_question,
      ai_answer: answerText,
      chapters_used: chaptersUsed,
      confidence_score: finalConfidence,
      used_fallback: usedFallback,
    });

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    await adminClient.from("question_cache").upsert(
      {
        book_id: book.id,
        question_hash: qHash,
        normalized_question: normalizedQ,
        ai_answer: answerText,
        chapters_used: chaptersUsed,
        confidence_score: finalConfidence,
        expires_at: expiresAt,
      },
      {
        onConflict: "book_id,question_hash",
      },
    );

    return new Response(
      JSON.stringify({
        success: true,
        answer: answerText,
        confidence: finalConfidence,
        chapters_used: chaptersUsed,
        used_fallback: usedFallback,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("ask_book_question error", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});

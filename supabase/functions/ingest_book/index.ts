import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import {
  braveSearch,
  corsHeaders,
  downloadAndSanitizePage,
  extractChapterSections,
  extractCharacters,
  extractKeywords,
  fetchGoogleBook,
  sha256Hex,
  splitSentences,
} from "../_shared/book-ai.ts";

type IngestRequest = {
  isbn?: string;
  title?: string;
  force_reingest?: boolean;
};

type StructuredChapter = {
  chapter_number?: number | null;
  title: string;
  summary: string;
  themes?: string[];
  keywords?: string[];
  characters?: string[];
  events?: Array<{
    event_description: string;
    importance_score?: number;
  }>;
  analyses?: Array<{
    analysis_text: string;
    source_url?: string;
    source_name?: string;
    confidence_score?: number;
  }>;
};

const fallbackBookFromInput = (payload: IngestRequest) => {
  const title = payload.title?.trim() || "Livro sem titulo";
  return {
    googleBooksId: null,
    title,
    authors: [],
    author: "Autor desconhecido",
    isbn: payload.isbn?.trim() ?? null,
    description: "",
    coverUrl: null,
    publishedDate: null,
    totalPages: 300,
  };
};

const buildSearchQueries = (title: string) => [
  `${title} chapter summary`,
  `${title} chapter guide`,
  `${title} summary by chapter`,
  `${title} chapter analysis`,
  `${title} characters themes summary`,
];

const clampScore = (value: number | undefined, fallback = 0.5) => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Number(value.toFixed(3));
};

const dedupeByUrl = <T extends { url: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = item.url.trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const buildFallbackGeneralChapter = (text: string): StructuredChapter | null => {
  const sentences = splitSentences(text, 5);
  const summary = sentences.join(" ").slice(0, 1200);
  if (summary.length < 120) return null;
  return {
    chapter_number: 1,
    title: "Visao geral",
    summary,
    themes: extractKeywords(text, 5),
    keywords: extractKeywords(text, 8),
    characters: extractCharacters(text, 6),
    events: sentences.slice(0, 3).map((sentence, index) => ({
      event_description: sentence,
      importance_score: clampScore(0.75 - index * 0.1, 0.45),
    })),
    analyses: [],
  };
};

const buildStructuredChaptersFromSources = (
  sources: Array<{ url: string; site_name: string | null; content_text: string }>,
): StructuredChapter[] => {
  const grouped = new Map<
    string,
    {
      chapter_number: number | null;
      title: string;
      snippets: string[];
      analyses: StructuredChapter["analyses"];
    }
  >();

  sources.forEach((source) => {
    const sections = extractChapterSections(source.content_text, {
      url: source.url,
      siteName: source.site_name ?? undefined,
    });

    sections.forEach((section) => {
      const key = `${section.chapterNumber ?? "x"}:${section.chapterTitle.toLowerCase()}`;
      const current = grouped.get(key) ?? {
        chapter_number: section.chapterNumber,
        title: section.chapterTitle,
        snippets: [],
        analyses: [],
      };
      if (!current.snippets.includes(section.snippet)) {
        current.snippets.push(section.snippet);
      }
      current.analyses?.push({
        analysis_text: section.snippet.slice(0, 900),
        source_url: section.sourceUrl,
        source_name: section.sourceName,
        confidence_score: clampScore(0.72),
      });
      grouped.set(key, current);
    });
  });

  const chapters = [...grouped.values()]
    .map((entry) => {
      const joinedText = entry.snippets.join(" ");
      const summary = splitSentences(joinedText, 4).join(" ").slice(0, 1200);
      if (summary.length < 120) return null;
      return {
        chapter_number: entry.chapter_number,
        title: entry.title,
        summary,
        themes: extractKeywords(joinedText, 5),
        keywords: extractKeywords(joinedText, 8),
        characters: extractCharacters(joinedText, 6),
        events: splitSentences(joinedText, 3).map((sentence, index) => ({
          event_description: sentence,
          importance_score: clampScore(0.8 - index * 0.1, 0.5),
        })),
        analyses: (entry.analyses ?? []).slice(0, 3),
      } satisfies StructuredChapter;
    })
    .filter((chapter): chapter is StructuredChapter => Boolean(chapter))
    .sort((a, b) => {
      const aNum = a.chapter_number ?? Number.MAX_SAFE_INTEGER;
      const bNum = b.chapter_number ?? Number.MAX_SAFE_INTEGER;
      return aNum - bNum || a.title.localeCompare(b.title);
    });

  if (chapters.length) return chapters;

  const fallbackText = sources.map((source) => source.content_text).join(" ").slice(0, 8000);
  const generalChapter = buildFallbackGeneralChapter(fallbackText);
  return generalChapter ? [generalChapter] : [];
};

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

    const payload = (await req.json()) as IngestRequest;
    const isbn = payload.isbn?.trim();
    const title = payload.title?.trim();
    const forceReingest = payload.force_reingest === true;
    if (!isbn && !title) {
      return new Response(JSON.stringify({ error: "Provide isbn or title" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const googleBook = (await fetchGoogleBook({ isbn, title })) ?? fallbackBookFromInput(payload);

    let existingBookId: string | null = null;
    if (googleBook.googleBooksId) {
      const { data } = await adminClient
        .from("books")
        .select("id, knowledge_status")
        .eq("user_id", user.id)
        .eq("google_books_id", googleBook.googleBooksId)
        .maybeSingle();
      if (data) {
        existingBookId = data.id;
        if (data.knowledge_status === "ready" && !forceReingest) {
          return new Response(
            JSON.stringify({
              success: true,
              message: "Book already ingested",
              book_id: data.id,
              skipped: true,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
          );
        }
      }
    }

    if (!existingBookId && googleBook.isbn) {
      const { data } = await adminClient
        .from("books")
        .select("id")
        .eq("user_id", user.id)
        .eq("isbn", googleBook.isbn)
        .maybeSingle();
      if (data) existingBookId = data.id;
    }

    if (!existingBookId && title) {
      const { data } = await adminClient
        .from("books")
        .select("id")
        .eq("user_id", user.id)
        .ilike("title", title)
        .maybeSingle();
      if (data) existingBookId = data.id;
    }

    let bookId = existingBookId;
    if (!bookId) {
      const { data, error } = await adminClient
        .from("books")
        .insert({
          user_id: user.id,
          title: googleBook.title,
          author: googleBook.author,
          authors: googleBook.authors,
          total_pages: googleBook.totalPages,
          pages_read: 0,
          status: "want-to-read",
          cover_url: googleBook.coverUrl,
          google_books_id: googleBook.googleBooksId,
          isbn: googleBook.isbn,
          description: googleBook.description,
          published_date: googleBook.publishedDate,
          knowledge_status: "processing",
          knowledge_error: null,
        })
        .select("id")
        .single();
      if (error) throw error;
      bookId = data.id;
    } else {
      const { error } = await adminClient
        .from("books")
        .update({
          title: googleBook.title,
          author: googleBook.author,
          authors: googleBook.authors,
          cover_url: googleBook.coverUrl,
          isbn: googleBook.isbn,
          description: googleBook.description,
          published_date: googleBook.publishedDate,
          google_books_id: googleBook.googleBooksId,
          knowledge_status: "processing",
          knowledge_error: null,
        })
        .eq("id", bookId)
        .eq("user_id", user.id);
      if (error) throw error;
    }

    const queries = buildSearchQueries(googleBook.title);
    const searchBatches = await Promise.all(queries.map((query) => braveSearch(query, 5)));
    const searchResults = dedupeByUrl(searchBatches.flat()).slice(0, 20);

    const sourcesToInsert: Array<{
      book_id: string;
      url: string;
      title: string;
      site_name: string;
      content_text: string;
      content_hash: string;
      is_valid: boolean;
    }> = [];

    for (const result of searchResults) {
      const cleanText = await downloadAndSanitizePage(result.url, { maxChars: 25_000, minChars: 700 });
      if (!cleanText) continue;
      const hash = await sha256Hex(cleanText);
      sourcesToInsert.push({
        book_id: bookId,
        url: result.url,
        title: result.title,
        site_name: result.siteName,
        content_text: cleanText,
        content_hash: hash,
        is_valid: true,
      });
    }

    if (sourcesToInsert.length) {
      await adminClient.from("sources").upsert(sourcesToInsert, {
        onConflict: "book_id,url",
        ignoreDuplicates: false,
      });
    }

    const { data: dbSources } = await adminClient
      .from("sources")
      .select("url, title, site_name, content_text")
      .eq("book_id", bookId)
      .eq("is_valid", true)
      .order("created_at", { ascending: false })
      .limit(20);

    const validSources = dbSources ?? [];
    const chapters = buildStructuredChaptersFromSources(validSources);
    const coverageLevel =
      chapters.length >= 8 ? "alto" : chapters.length >= 3 ? "medio" : chapters.length >= 1 ? "baixo" : "baixo";

    if (!validSources.length || !chapters.length) {
      await adminClient
        .from("books")
        .update({
          knowledge_status: "failed",
          knowledge_error: "No chapter-level source material found",
        })
        .eq("id", bookId);

      return new Response(
        JSON.stringify({
          success: false,
          code: "insufficient_chapter_coverage",
          error: "Nao foi possivel montar uma base por capitulos para este livro.",
          book_id: bookId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const { data: existingChapters } = await adminClient.from("chapters").select("id").eq("book_id", bookId);
    const existingChapterIds = (existingChapters ?? []).map((chapter) => chapter.id);
    if (existingChapterIds.length) {
      await adminClient.from("chapter_events").delete().in("chapter_id", existingChapterIds);
      await adminClient.from("chapter_analysis").delete().in("chapter_id", existingChapterIds);
      await adminClient.from("chapters").delete().eq("book_id", bookId);
    }

    let insertedChapterCount = 0;
    let insertedEventCount = 0;
    let insertedAnalysisCount = 0;

    for (const chapter of chapters) {
      const { data: insertedChapter, error: chapterErr } = await adminClient
        .from("chapters")
        .insert({
          book_id: bookId,
          chapter_number: chapter.chapter_number ?? null,
          title: chapter.title.trim(),
          summary: chapter.summary.trim(),
          themes: chapter.themes ?? [],
          keywords: chapter.keywords ?? [],
          characters: chapter.characters ?? [],
          coverage_level: coverageLevel,
        })
        .select("id")
        .single();
      if (chapterErr) throw chapterErr;
      insertedChapterCount += 1;

      if (chapter.events?.length) {
        const eventsPayload = chapter.events
          .filter((event) => event.event_description?.trim())
          .map((event) => ({
            chapter_id: insertedChapter.id,
            event_description: event.event_description.trim(),
            importance_score: clampScore(event.importance_score, 0.5),
          }));
        if (eventsPayload.length) {
          const { error: eventsErr } = await adminClient.from("chapter_events").insert(eventsPayload);
          if (eventsErr) throw eventsErr;
          insertedEventCount += eventsPayload.length;
        }
      }

      if (chapter.analyses?.length) {
        const analysesPayload = chapter.analyses
          .filter((analysis) => analysis.analysis_text?.trim())
          .map((analysis) => ({
            chapter_id: insertedChapter.id,
            analysis_text: analysis.analysis_text.trim(),
            source_url: analysis.source_url ?? null,
            source_name: analysis.source_name ?? null,
            confidence_score: clampScore(analysis.confidence_score, 0.5),
          }));
        if (analysesPayload.length) {
          const { error: analysesErr } = await adminClient.from("chapter_analysis").insert(analysesPayload);
          if (analysesErr) throw analysesErr;
          insertedAnalysisCount += analysesPayload.length;
        }
      }
    }

    await adminClient
      .from("books")
      .update({
        knowledge_status: "ready",
        knowledge_last_ingested_at: new Date().toISOString(),
        knowledge_error: null,
      })
      .eq("id", bookId)
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        book_id: bookId,
        title: googleBook.title,
        sources_collected: sourcesToInsert.length,
        chapters_created: insertedChapterCount,
        events_created: insertedEventCount,
        analyses_created: insertedAnalysisCount,
        coverage_level: coverageLevel,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("ingest_book error", error);
    return new Response(
      JSON.stringify({
        success: false,
        code: "unexpected_error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }
});

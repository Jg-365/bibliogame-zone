import http from "node:http";
import { createClient } from "@supabase/supabase-js";
import {
  braveSearch,
  callGeminiJson,
  corsHeaders,
  downloadAndSanitizePage,
  extractChapterSections,
  extractCharacters,
  extractKeywords,
  fetchGoogleBook,
  normalizeQuestion,
  sha256Hex,
  splitSentences,
} from "./book-ai.mjs";
import {
  buildKnowledgePacketFromRows,
  invalidateKnowledgePacket,
  loadKnowledgePacket,
  PACKET_VERSION,
  persistKnowledgePacket,
  selectRelevantPacketChapters,
} from "./knowledge-packet.mjs";
import { ingestBookResearch } from "./book-research.mjs";
import { summarizeBookChapterHybrid } from "./hybrid-book-summary.mjs";
import {
  buildConsistencyFallbackAnswer,
  buildRecommendationContext,
  buildRecommendationFallbackAnswer,
  buildUserLibraryProfile,
} from "./recommendation-engine.mjs";
import { runDeduped } from "./request-coordinator.mjs";

const port = Number(process.env.PORT || process.env.READQUEST_API_PORT || 8787);
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const KNOWLEDGE_FRESH_MS = 1000 * 60 * 60 * 24;
const MAX_SOURCE_RESULTS = 6;
const DEFAULT_CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const DEFAULT_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemma-3-27b";
const RECOMMENDATION_MODEL =
  process.env.GEMINI_RECOMMENDATION_MODEL || DEFAULT_FALLBACK_MODEL || "gemma-3-27b";
const CONSISTENCY_MODEL =
  process.env.GEMINI_CONSISTENCY_MODEL || "gemma-3-12b";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.");
}

const json = (res, status, body) => {
  res.writeHead(status, corsHeaders);
  res.end(JSON.stringify(body));
};

class InvalidJsonBodyError extends Error {
  constructor(message = "Invalid JSON request body.") {
    super(message);
    this.name = "InvalidJsonBodyError";
    this.code = "invalid_json_body";
  }
}

const readJsonBody = async (req) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid JSON request body.";
        reject(new InvalidJsonBodyError(message));
      }
    });
    req.on("error", reject);
  });

const getAuthedClient = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error("UNAUTHORIZED");
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) {
    throw new Error("UNAUTHORIZED");
  }
  return { client, user };
};

const clampScore = (value, fallback = 0.5) => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Number(value.toFixed(3));
};

const dedupeByUrl = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const normalized = item.url.trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const fallbackBookFromInput = (payload) => ({
  googleBooksId: null,
  title: payload.title?.trim() || "Livro sem titulo",
  authors: [],
  author: "Autor desconhecido",
  isbn: payload.isbn?.trim() ?? null,
  description: "",
  coverUrl: null,
  publishedDate: null,
  totalPages: 300,
});

const SOURCE_STOP_WORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "um",
  "uma",
  "the",
  "of",
  "and",
  "to",
  "in",
]);

const tokenize = (value) =>
  normalizeQuestion(value ?? "")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !SOURCE_STOP_WORDS.has(token));

const buildSearchQueries = (book) => {
  const title = book.title?.trim() ?? "";
  const author = book.author?.trim() ?? "";
  const titleWithAuthor = author ? `"${title}" "${author}"` : `"${title}"`;
  return [
    `${titleWithAuthor} chapter summary`,
    `${titleWithAuthor} chapter guide`,
  ];
};

const sourceRelevanceScore = (source, book) => {
  const haystack = normalizeQuestion(`${source.title ?? ""} ${source.site_name ?? ""} ${source.content_text ?? ""}`);
  const normalizedTitle = normalizeQuestion(book.title ?? "");
  const normalizedAuthor = normalizeQuestion(book.author ?? "");
  const titleTokens = tokenize(book.title);
  const authorTokens = tokenize(book.author);

  let score = 0;
  if (normalizedTitle && haystack.includes(normalizedTitle)) score += 10;
  if (normalizedAuthor && haystack.includes(normalizedAuthor)) score += 4;

  const titleMatches = titleTokens.filter((token) => haystack.includes(token)).length;
  const authorMatches = authorTokens.filter((token) => haystack.includes(token)).length;
  score += titleMatches * 2.5;
  score += authorMatches * 1.5;

  if (/chapter|capitulo|capÃ­tulo/i.test(`${source.title ?? ""} ${source.content_text ?? ""}`)) score += 2;
  if (/summary|resumo|analysis|analise|guide|guia/i.test(`${source.title ?? ""} ${source.content_text ?? ""}`)) score += 1.5;

  return score;
};

const isSourceRelevantToBook = (source, book) => {
  const score = sourceRelevanceScore(source, book);
  const normalizedTitle = normalizeQuestion(book.title ?? "");
  const sourceTitle = normalizeQuestion(source.title ?? "");
  return score >= 8 || (normalizedTitle && sourceTitle.includes(normalizedTitle));
};

const buildFallbackGeneralChapter = (text) => {
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

const buildStructuredChaptersFromSources = (sources, book) => {
  const grouped = new Map();
  const totalPages = Number(book?.totalPages ?? book?.total_pages ?? 0);
  const maxPlausibleChapterNumber = Math.max(40, Math.min(140, totalPages ? Math.ceil(totalPages / 4) : 80));

  sources.forEach((source) => {
    const sections = extractChapterSections(source.content_text, {
      url: source.url,
      siteName: source.site_name ?? undefined,
    });
    sections.forEach((section) => {
      if (section.chapterNumber && section.chapterNumber > maxPlausibleChapterNumber) return;
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
      current.analyses.push({
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
        analyses: entry.analyses.slice(0, 3),
      };
    })
    .filter(Boolean)
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

const boostChaptersByReadingPosition = ({ chapters, currentPage, totalPages, currentPosition, checkpointLabel }) => {
  const currentPositionText = `${currentPosition ?? ""} ${checkpointLabel ?? ""}`.toLowerCase().trim();
  const approximateChapterNumber =
    currentPage && totalPages && chapters.length
      ? Math.min(chapters.length, Math.max(1, Math.ceil((currentPage / totalPages) * chapters.length)))
      : null;

  return [...chapters]
    .map((chapter) => {
      let score = chapter.relevance_score ?? 0;
      if (approximateChapterNumber && chapter.chapter_number === approximateChapterNumber) score += 1.25;
      if (approximateChapterNumber && chapter.chapter_number && Math.abs(chapter.chapter_number - approximateChapterNumber) === 1) {
        score += 0.35;
      }
      if (currentPositionText && chapter.chapter_title.toLowerCase().includes(currentPositionText)) score += 1.6;
      if (checkpointLabel && chapter.chapter_title.toLowerCase().includes(checkpointLabel.toLowerCase())) score += 1.2;
      return { ...chapter, relevance_score: score };
    })
    .sort(
      (a, b) =>
        b.relevance_score - a.relevance_score ||
        (a.chapter_number ?? Number.MAX_SAFE_INTEGER) - (b.chapter_number ?? Number.MAX_SAFE_INTEGER),
    );
};

const buildAnswerPrompt = ({ bookTitle, question, chapterContext, currentPage, currentPosition, checkpointLabel }) => `
Voce e um copiloto literario para o livro "${bookTitle}".

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

Contexto de leitura atual:
Pagina atual: ${currentPage ?? "desconhecida"}
Posicao atual: ${currentPosition ?? "nao informada"}
Checkpoint mais proximo: ${checkpointLabel ?? "nao informado"}

Contexto de capitulos e analises:
${chapterContext}

Pergunta do usuario:
${question}
`;

const buildFallbackPrompt = ({ bookTitle, question, chapterContext, fallbackWeb, currentPage, currentPosition }) => `
Voce e um copiloto literario para o livro "${bookTitle}".

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
Pagina atual: ${currentPage ?? "desconhecida"}
Posicao atual: ${currentPosition ?? "nao informada"}

Contexto local:
${chapterContext}

Contexto web complementar:
${fallbackWeb}

Pergunta:
${question}
`;

const buildLocalAnswerFromContext = ({ bookTitle, selectedChapters, analyses, events, currentPage, currentPosition }) => {
  if (!selectedChapters.length) {
    return {
      answer: [
        "## Base local ainda curta",
        "Ainda nao encontrei material suficiente por capitulo para responder com seguranca total.",
        "Posso continuar ajudando com base em metadados e contexto geral do livro, e a indexacao mais profunda entra como bonus quando estiver pronta.",
      ].join("\n\n"),
      confidence: 0.22,
      chapters_used: [],
    };
  }

  const chapterSummaries = selectedChapters
    .map((chapter, index) => {
      const chapterEvents = (events ?? [])
        .filter((event) => event.chapter_id === chapter.chapter_id)
        .slice(0, 2)
        .map((event) => event.event_description.trim())
        .filter(Boolean);
      const chapterAnalysis = (analyses ?? [])
        .filter((analysis) => analysis.chapter_id === chapter.chapter_id)
        .slice(0, 1)
        .map((analysis) => analysis.analysis_text.trim())
        .filter(Boolean);

      return [
        `${index === 0 ? "Parte mais relevante agora" : "Complemento"}: capitulo ${chapter.chapter_number ?? "n/a"} - ${chapter.chapter_title}.`,
        chapter.chapter_summary,
        chapterEvents.length ? `Eventos centrais: ${chapterEvents.join(" | ")}.` : "",
        chapterAnalysis.length ? `Leitura critica indexada: ${chapterAnalysis.join(" ")}` : "",
      ]
        .filter(Boolean)
        .join(" ");
    })
    .join("\n\n");

  const readingHint = [
    currentPage ? `Pagina atual informada: ${currentPage}.` : "",
    currentPosition ? `Posicao atual: ${currentPosition}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    answer: [
      `## Resposta com base local`,
      `Usei a base local ja indexada de **"${bookTitle}"** porque o modelo principal atingiu um limite temporario.`,
      readingHint,
      chapterSummaries,
      "Se quiser, continuo a conversa so com essa base local ate a quota normalizar.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    confidence: 0.48,
    chapters_used: selectedChapters.map((chapter) => chapter.chapter_id),
  };
};

const buildPacketPrompt = ({ packet, selectedChapters, question, currentPage, currentPosition, checkpointLabel }) =>
  JSON.stringify(
    {
      instruction:
        "Responda usando apenas os dados do pacote. Nao invente fatos. Se a pergunta exceder a parte atual do leitor, diga isso claramente. Se o pacote estiver com cobertura baixa ou resumida demais, reduza a confianca e diga isso explicitamente.",
      book: packet.book,
      packet_meta: packet.meta ?? null,
      reading_state: {
        current_page: currentPage ?? null,
        current_position: currentPosition ?? null,
        checkpoint_label: checkpointLabel ?? null,
      },
      chapters: selectedChapters.map((chapter) => ({
        id: chapter.id,
        n: chapter.n ?? null,
        t: chapter.t,
        s: chapter.s,
        k: chapter.k,
        c: chapter.c,
        e: chapter.e,
        a: chapter.a,
      })),
      question,
      output_format: {
        answer: "string",
        confidence: "number 0..1",
        chapters_used: ["chapter-id"],
      },
    },
    null,
    2,
  );

const buildMetadataFirstPrompt = ({
  book,
  packet,
  selectedChapters,
  question,
  currentPage,
  currentPosition,
  checkpointLabel,
  mode,
  responseStyle,
  avoidSpoilers,
  userLibraryProfile,
}) =>
  JSON.stringify(
    {
      instruction:
        "Voce e um copiloto literario premium e deve sempre responder de forma util. Use contexto indexado como bonus quando existir. Se nao houver base indexada, use os metadados do livro e seu conhecimento interno sobre a obra. Se nenhum livro tiver sido selecionado, responda como um copiloto geral de leitura. Nunca exija sincronizacao como pre-requisito para responder. Em modo de recomendacao, indique livros concretos com motivo. Em modo de consistencia, entregue um plano acionavel. Em modo de conversa sobre livro, respeite a parte atual do leitor e evite spoilers quando solicitado. Formate a resposta final em Markdown limpo, escaneavel e elegante, com paragrafos curtos, bullets quando fizer sentido e sem prefacios burocraticos.",
      context_mode: packet && selectedChapters?.length ? "indexed_plus_metadata" : book ? "metadata_first" : "general",
      task_mode: mode ?? "book-chat",
      response_style: responseStyle ?? "objective",
      spoilers_policy: avoidSpoilers ? "avoid_spoilers" : "spoilers_allowed",
      book_metadata: book
        ? {
            id: book.id,
            title: book.title,
            author: book.author,
            authors: book.authors ?? [],
            description: book.description ?? null,
            total_pages: book.total_pages ?? null,
            packet_coverage: packet?.book?.coverage ?? null,
          }
        : null,
      user_library_profile: userLibraryProfile ?? null,
      recommendation_context: userLibraryProfile ? buildRecommendationContext(userLibraryProfile) : null,
      reading_state: {
        current_page: currentPage ?? null,
        current_position: currentPosition ?? null,
        checkpoint_label: checkpointLabel ?? null,
      },
      indexed_context: (selectedChapters ?? []).map((chapter) => ({
        id: chapter.id,
        n: chapter.n ?? null,
        t: chapter.t,
        s: chapter.s,
        k: chapter.k,
        c: chapter.c,
        e: chapter.e,
        a: chapter.a,
      })),
      question,
      output_format: {
        answer: "string em Markdown",
        confidence: "number 0..1",
        chapters_used: ["chapter-id"],
      },
    },
    null,
    2,
  );

const buildMetadataFallbackAnswer = ({
  book,
  question,
  currentPage,
  currentPosition,
  mode,
  userLibraryProfile,
}) => {
  if (mode === "recommendations" && userLibraryProfile) {
    return buildRecommendationFallbackAnswer({ profile: userLibraryProfile });
  }

  if (mode === "consistency" && userLibraryProfile) {
    return buildConsistencyFallbackAnswer({ profile: userLibraryProfile });
  }

  const metadataLines = [
    book?.title ? `Livro foco: ${book.title}.` : "",
    book?.author ? `Autor: ${book.author}.` : "",
    book?.description ? `Descricao conhecida: ${String(book.description).slice(0, 260)}.` : "",
    currentPage ? `Pagina atual informada: ${currentPage}.` : "",
    currentPosition ? `Posicao atual: ${currentPosition}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    answer: [
      "## Resposta em modo flexivel",
      metadataLines || "Nao havia metadados detalhados do livro disponiveis, entao estou usando uma orientacao geral e util.",
      `**Pergunta considerada:** ${question}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    confidence: book ? 0.36 : 0.24,
    chapters_used: [],
  };
};

const buildUserLibraryProfileData = async ({ client, userId, currentBook }) => {
  const [{ data: booksData, error: booksError }, { data: profileData, error: profileError }] = await Promise.all([
    client
      .from("books")
      .select("title, author, total_pages, status, genres, rating")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(80),
    client
      .from("profiles")
      .select("preferred_genres")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (booksError) throw booksError;
  if (profileError) throw profileError;

  return buildUserLibraryProfile({
    books: booksData ?? [],
    preferredGenres: profileData?.preferred_genres ?? [],
    currentBook,
  });
};

const shouldUseNonBlockingAskFallback = (error, allowFallback) => {
  if (!allowFallback) return false;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();
  const code = error?.code;

  return (
    code === "gemini_invalid_json" ||
    message.includes("gemini_invalid_json") ||
    message.includes("unterminated string in json") ||
    message.includes("unexpected token") ||
    message.includes("quota") ||
    message.includes("gemini_error_429")
  );
};

const handleIngest = async (req, res) => {
  const { client, user } = await getAuthedClient(req);
  const payload = await readJsonBody(req);
  const isbn = payload.isbn?.trim();
  const title = payload.title?.trim();
  const forceReingest = payload.force_reingest === true;

  if (!isbn && !title) {
    return json(res, 400, { error: "Provide isbn or title" });
  }

  const dedupeKey = `ingest:${user.id}:${isbn ?? title?.toLowerCase()}`;
  const result = await runDeduped(dedupeKey, async () => {
    const googleBook = (await fetchGoogleBook({ isbn, title })) ?? fallbackBookFromInput(payload);

    let existingBook = null;
    if (googleBook.googleBooksId) {
      const { data } = await client
        .from("books")
        .select("id, knowledge_status, knowledge_last_ingested_at")
        .eq("user_id", user.id)
        .eq("google_books_id", googleBook.googleBooksId)
        .maybeSingle();
      if (data) existingBook = data;
    }

    if (!existingBook && googleBook.isbn) {
      const { data } = await client
        .from("books")
        .select("id, knowledge_status, knowledge_last_ingested_at")
        .eq("user_id", user.id)
        .eq("isbn", googleBook.isbn)
        .maybeSingle();
      if (data) existingBook = data;
    }

    if (!existingBook && title) {
      const { data } = await client
        .from("books")
        .select("id, knowledge_status, knowledge_last_ingested_at")
        .eq("user_id", user.id)
        .ilike("title", title)
        .maybeSingle();
      if (data) existingBook = data;
    }

    const existingPacket = existingBook?.id ? await loadKnowledgePacket(existingBook.id) : null;
    const hasCurrentPacket = Boolean(existingPacket?.meta?.packet_version === PACKET_VERSION);
    const recentlyIngested =
      existingBook?.knowledge_last_ingested_at &&
      Date.now() - new Date(existingBook.knowledge_last_ingested_at).getTime() < KNOWLEDGE_FRESH_MS;

    if (existingBook?.knowledge_status === "ready" && recentlyIngested && hasCurrentPacket && !forceReingest) {
      return {
        success: true,
        message: "Book knowledge is already fresh",
        book_id: existingBook.id,
        skipped: true,
      };
    }

    if (existingBook?.knowledge_status === "ready" && !forceReingest && hasCurrentPacket) {
      return {
        success: true,
        message: "Book already ingested",
        book_id: existingBook.id,
        skipped: true,
      };
    }

    let bookId = existingBook?.id ?? null;
    if (!bookId) {
      const { data, error } = await client
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
      const { error } = await client
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

    if (forceReingest) {
      await client.from("sources").delete().eq("book_id", bookId);
    }

    const { data: existingSources } = await client
      .from("sources")
      .select("url, title, site_name, content_text")
      .eq("book_id", bookId)
      .eq("is_valid", true)
      .order("created_at", { ascending: false })
      .limit(MAX_SOURCE_RESULTS);

    const research = await ingestBookResearch({
      book: googleBook,
      existingSources: forceReingest ? [] : existingSources ?? [],
    });

    if (!research.success) {
      await client
        .from("books")
        .update({
          knowledge_status: "failed",
          knowledge_error: research.error ?? "No chapter-level source material found",
        })
        .eq("id", bookId);

      return {
        success: false,
        code: research.code ?? "insufficient_chapter_coverage",
        error: research.error ?? "Nao foi possivel montar uma base por capitulos para este livro.",
        book_id: bookId,
        diagnostics: research.diagnostics ?? null,
      };
    }

    const chapters = research.chapters;
    const coverageLevel = research.coverageLevel;
    const curatedSources = research.curatedSources;

    await client.from("sources").delete().eq("book_id", bookId);
    await client.from("sources").insert(
      curatedSources.map((source) => ({
        book_id: bookId,
        url: source.url,
        title: source.title,
        site_name: source.site_name,
        content_text: source.content_text,
        content_hash: source.content_hash,
        is_valid: true,
      })),
    );

    const { data: existingChapters } = await client.from("chapters").select("id").eq("book_id", bookId);
    const existingChapterIds = (existingChapters ?? []).map((chapter) => chapter.id);
    if (existingChapterIds.length) {
      await client.from("chapter_events").delete().in("chapter_id", existingChapterIds);
      await client.from("chapter_analysis").delete().in("chapter_id", existingChapterIds);
      await client.from("chapters").delete().eq("book_id", bookId);
    }

    await invalidateKnowledgePacket(bookId);

    let insertedChapterCount = 0;
    let insertedEventCount = 0;
    let insertedAnalysisCount = 0;
    const insertedChapters = [];
    const insertedEvents = [];
    const insertedAnalyses = [];

    for (const chapter of chapters) {
      const { data: insertedChapter, error: chapterErr } = await client
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
        .select("*")
        .single();
      if (chapterErr) throw chapterErr;
      insertedChapterCount += 1;
      insertedChapters.push(insertedChapter);

      if (chapter.events?.length) {
        const eventsPayload = chapter.events
          .filter((event) => event.event_description?.trim())
          .map((event) => ({
            chapter_id: insertedChapter.id,
            event_description: event.event_description.trim(),
            importance_score: clampScore(event.importance_score, 0.5),
          }));
        if (eventsPayload.length) {
          const { data, error } = await client.from("chapter_events").insert(eventsPayload).select("*");
          if (error) throw error;
          insertedEventCount += eventsPayload.length;
          insertedEvents.push(...(data ?? []));
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
          const { data, error } = await client.from("chapter_analysis").insert(analysesPayload).select("*");
          if (error) throw error;
          insertedAnalysisCount += analysesPayload.length;
          insertedAnalyses.push(...(data ?? []));
        }
      }
    }

    const nextPacket = buildKnowledgePacketFromRows({
      book: {
        id: bookId,
        title: googleBook.title,
        author: googleBook.author,
        total_pages: googleBook.totalPages,
      },
      chapters: insertedChapters,
      events: insertedEvents,
      analyses: insertedAnalyses,
    });
    await persistKnowledgePacket(bookId, nextPacket);

    await client
      .from("books")
      .update({
        knowledge_status: "ready",
        knowledge_last_ingested_at: new Date().toISOString(),
        knowledge_error: null,
      })
      .eq("id", bookId)
      .eq("user_id", user.id);

    return {
      success: true,
      book_id: bookId,
      title: googleBook.title,
      sources_collected: curatedSources.length,
      chapters_created: insertedChapterCount,
      events_created: insertedEventCount,
      analyses_created: insertedAnalysisCount,
      coverage_level: coverageLevel,
      diagnostics: research.diagnostics,
    };
  });

  return json(res, 200, result);
};

const handleAsk = async (req, res) => {
  const { client, user } = await getAuthedClient(req);
  const payload = await readJsonBody(req);

  if (!payload.user_question?.trim()) {
    return json(res, 400, { error: "user_question is required" });
  }

  const maxChapters = Math.min(Math.max(payload.max_chapters ?? 5, 1), 5);
  const allowFallback = payload.allow_fallback !== false;
  const bookId = payload.book_id?.trim() || null;
  const mode = typeof payload.mode === "string" ? payload.mode : "book-chat";
  const responseStyle = payload.response_style === "detailed" ? "detailed" : "objective";
  const avoidSpoilers = payload.avoid_spoilers !== false;
  const modelForMode =
    mode === "recommendations"
      ? RECOMMENDATION_MODEL
      : mode === "consistency"
        ? CONSISTENCY_MODEL
        : DEFAULT_CHAT_MODEL;

  let book = null;
  if (bookId) {
    const { data: foundBook, error: bookError } = await client
      .from("books")
      .select("id, user_id, title, author, authors, total_pages, description")
      .eq("id", bookId)
      .maybeSingle();
    if (bookError || !foundBook) return json(res, 404, { error: "Book not found" });
    if (foundBook.user_id !== user.id) return json(res, 403, { error: "Forbidden" });
    book = foundBook;
  }

  const normalizedQ = normalizeQuestion(
    `${payload.user_question}\nmode:${mode}\nstyle:${responseStyle}\nspoilers:${avoidSpoilers ? "avoid" : "allow"}\nbook:${book?.id ?? "general"}\npage:${payload.current_page ?? ""}\nposition:${payload.current_position ?? ""}`,
  );
  const qHash = await sha256Hex(normalizedQ);
  const nowIso = new Date().toISOString();

  if (book) {
    const { data: cacheHit } = await client
      .from("question_cache")
      .select("ai_answer, chapters_used, confidence_score")
      .eq("book_id", book.id)
      .eq("question_hash", qHash)
      .gt("expires_at", nowIso)
      .maybeSingle();
    if (cacheHit) {
      return json(res, 200, {
        success: true,
        answer: cacheHit.ai_answer,
        confidence: clampScore(cacheHit.confidence_score ?? 0.85, 0.85),
        chapters_used: cacheHit.chapters_used ?? [],
        cached: true,
        used_fallback: false,
        model_used: `${modelForMode} (cache)`,
        context_mode: "cached",
      });
    }
  }

  const currentPage = typeof payload.current_page === "number" ? payload.current_page : undefined;
  const currentPosition = payload.current_position?.trim() || undefined;
  const userLibraryProfile = await buildUserLibraryProfileData({
    client,
    userId: user.id,
    currentBook: book,
  });
  const { data: nearestCheckpoint } = currentPage && book
    ? await client
        .from("reading_checkpoints")
        .select("chapter_label, page_number")
        .eq("user_id", user.id)
        .eq("book_id", book.id)
        .lte("page_number", currentPage)
        .order("page_number", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const result = await runDeduped(
    `ask:${user.id}:${book?.id ?? "general"}:${qHash}`,
    async () => {
      const packet = book ? await loadKnowledgePacket(book.id) : null;
      const selectedChapters = packet
        ? selectRelevantPacketChapters({
            packet,
            currentPage,
            currentPosition,
            limit: Math.min(maxChapters, 3),
            question: payload.user_question,
          })
        : [];

      let finalAnswer;
      let usedLocalQuotaFallback = false;

      try {
        finalAnswer = await callGeminiJson(
          buildMetadataFirstPrompt({
            book,
            packet,
            selectedChapters,
            question: payload.user_question,
            currentPage,
            currentPosition,
            checkpointLabel: nearestCheckpoint?.chapter_label ?? null,
            mode,
            responseStyle,
            avoidSpoilers,
            userLibraryProfile,
          }),
          {
            model: modelForMode,
            temperature: 0.15,
            maxOutputTokens: 1200,
          },
        );
      } catch (error) {
        if (shouldUseNonBlockingAskFallback(error, allowFallback)) {
          finalAnswer =
            packet && selectedChapters.length
              ? buildLocalAnswerFromContext({
                  bookTitle: book?.title ?? "leitura atual",
                  selectedChapters: selectedChapters.map((chapter) => ({
                    chapter_id: chapter.id,
                    chapter_number: chapter.n,
                    chapter_title: chapter.t,
                    chapter_summary: chapter.s,
                  })),
                  analyses: selectedChapters.flatMap((chapter) =>
                    chapter.a.map((analysisText) => ({
                      chapter_id: chapter.id,
                      analysis_text: analysisText,
                    })),
                  ),
                  events: selectedChapters.flatMap((chapter) =>
                    chapter.e.map((eventText) => ({
                      chapter_id: chapter.id,
                      event_description: eventText,
                    })),
                  ),
                  currentPage,
                  currentPosition,
                })
              : buildMetadataFallbackAnswer({
                  book,
                  question: payload.user_question,
                  currentPage,
                  currentPosition,
                  mode,
                  userLibraryProfile,
                });
          usedLocalQuotaFallback = true;
        } else {
          throw error;
        }
      }

      const overviewOnly = selectedChapters.every(
        (chapter) => !chapter.n || /resumo geral|visao geral|overview/i.test(String(chapter.t ?? "")),
      );
      const confidenceCap = usedLocalQuotaFallback
        ? 0.48
        : !packet
          ? book
            ? 0.68
            : 0.58
          : overviewOnly
          ? 0.42
          : packet.book?.coverage === "baixo"
            ? 0.58
            : 0.92;
      const finalConfidence = Math.min(confidenceCap, clampScore(finalAnswer.confidence, 0.45));
      const chaptersUsed = (finalAnswer.chapters_used ?? selectedChapters.map((chapter) => chapter.id)).slice(
        0,
        maxChapters,
      );
      const answerText = finalAnswer.answer?.trim() || "Nao foi possivel gerar uma resposta confiavel.";
      const modelUsed =
        finalAnswer.model_used ?? (usedLocalQuotaFallback ? "local-fallback" : modelForMode);

      if (book) {
        await client.from("questions_log").insert({
          book_id: book.id,
          user_question: payload.user_question,
          ai_answer: answerText,
          chapters_used: chaptersUsed,
          confidence_score: finalConfidence,
          used_fallback: false,
        });

        const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
        await client.from("question_cache").upsert(
          {
            book_id: book.id,
            question_hash: qHash,
            normalized_question: normalizedQ,
            ai_answer: answerText,
            chapters_used: chaptersUsed,
            confidence_score: finalConfidence,
            expires_at: expiresAt,
          },
          { onConflict: "book_id,question_hash" },
        );
      }

      return {
        success: true,
        answer: answerText,
        confidence: finalConfidence,
        chapters_used: chaptersUsed,
        used_fallback: false,
        used_local_quota_fallback: usedLocalQuotaFallback,
        model_used: modelUsed,
        context_mode: packet && selectedChapters.length ? "indexed" : book ? "metadata" : "general",
        cached: false,
      };
    },
  );
  return json(res, 200, result);
};

const handleHybridBookSummary = async (req, res) => {
  const { client } = await getAuthedClient(req);
  const payload = await readJsonBody(req);
  const bookTitle = payload.book_title?.trim();
  const pageNumber = Number(payload.page_number);

  if (!bookTitle || !Number.isFinite(pageNumber) || pageNumber <= 0) {
    return json(res, 400, {
      error: "book_title and page_number are required",
    });
  }

  try {
    const result = await summarizeBookChapterHybrid({
      client,
      bookTitle,
      pageNumber,
    });
    return json(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const code = error?.code;

    if (code === "invalid_input") {
      return json(res, 400, { error: message });
    }

    if (code === "missing_api_key" || code === "invalid_api_key") {
      return json(res, 401, { error: message });
    }

    if (code === "rate_limit") {
      return json(res, 429, { error: message });
    }

    if (code === "supabase_query_failed") {
      return json(res, 502, { error: "Falha ao consultar os metadados do livro no banco." });
    }

    return json(res, 500, { error: message });
  }
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(200, corsHeaders);
      res.end();
      return;
    }

    if (req.url === "/api/book-knowledge/ingest" && req.method === "POST") {
      await handleIngest(req, res);
      return;
    }

    if (req.url === "/api/book-knowledge/ask" && req.method === "POST") {
      await handleAsk(req, res);
      return;
    }

    if (req.url === "/api/book-summary/hybrid" && req.method === "POST") {
      await handleHybridBookSummary(req, res);
      return;
    }

    json(res, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      json(res, 401, { error: "Unauthorized" });
      return;
    }
    if (error?.code === "invalid_json_body") {
      json(res, 400, { success: false, error: "JSON invalido no corpo da requisicao." });
      return;
    }
    console.error("local-api error", error);
    json(res, 500, { success: false, error: message });
  }
});

server.listen(port, () => {
  console.log(`ReadQuest local API running on http://localhost:${port}`);
});

import { GoogleGenerativeAI } from "@google/generative-ai";
import { braveSearch, normalizeQuestion } from "./book-ai.mjs";

const DEFAULT_MODEL = process.env.GEMINI_HYBRID_MODEL || process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const FALLBACK_MODELS = [
  DEFAULT_MODEL,
  process.env.GEMINI_FALLBACK_MODEL,
  process.env.GEMINI_MODEL,
  process.env.GEMINI_HYBRID_FALLBACK_MODEL,
  "gemma-3-27b-it",
  "gemma-3-12b-it",
  "gemini-3.1-flash-lite",
].filter((value, index, array) => value && array.indexOf(value) === index);

const JSON_SCHEMA_EXAMPLE = {
  chapter_title: "string",
  summary: "string",
  key_points: ["string"],
  source_confidence: "high|medium|low",
};

const decodeJsonBlock = (raw) => {
  const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1];
  const generic = raw.match(/```\s*([\s\S]*?)\s*```/i);
  if (generic?.[1]) return generic[1];
  return raw;
};

const toConfidenceLabel = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["high", "medium", "low"].includes(normalized)) return normalized;
  return "medium";
};

const normalizeKeyPoints = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 6);
};

const normalizeSummaryResponse = (payload, fallbackChapterTitle) => {
  const chapterTitle = String(payload?.chapter_title ?? fallbackChapterTitle ?? "Capítulo não identificado").trim();
  const summary = String(payload?.summary ?? "").trim();
  const keyPoints = normalizeKeyPoints(payload?.key_points);
  const sourceConfidence = toConfidenceLabel(payload?.source_confidence);

  return {
    chapter_title: chapterTitle || "Capítulo não identificado",
    summary:
      summary ||
      "Resumo não retornado pelo modelo. Ainda assim, a solicitação foi processada e pode ser repetida com mais contexto.",
    key_points: keyPoints.length ? keyPoints : ["Contexto parcial usado para gerar o resumo."],
    source_confidence: sourceConfidence,
  };
};

const containsInsufficientContextLanguage = (text) =>
  /nao tenho contexto suficiente|não tenho contexto suficiente|sem contexto suficiente|insufficient context|not enough context/i.test(
    String(text ?? ""),
  );

const buildEmergencySummary = ({ bookTitle, pageNumber, chapterTitle, braveContext, matchedChapter }) => {
  const snippetPoints = braveContext.snippets
    .map((item) => item.description?.trim())
    .filter(Boolean)
    .slice(0, 3);

  const summary = [
    `A página ${pageNumber} do livro "${bookTitle}" foi tratada como pertencente a "${chapterTitle}".`,
    matchedChapter
      ? `Os metadados do banco indicam o intervalo entre as páginas ${matchedChapter.start_page} e ${matchedChapter.end_page}.`
      : "Como o capítulo não foi localizado no banco, a dedução foi reforçada pelos snippets externos disponíveis.",
    snippetPoints.length
      ? `Com base nos sinais recuperados, o trecho concentra eventos e ideias coerentes com: ${snippetPoints.join(" ")}`
      : "Com base no contexto reunido, o resumo foi reconstruído de forma conservadora usando os sinais mais prováveis do trecho.",
  ].join(" ");

  return {
    chapter_title: chapterTitle,
    summary,
    key_points: snippetPoints.length
      ? snippetPoints
      : [
          "Resumo gerado em modo de contingência.",
          "A dedução do capítulo foi feita a partir dos sinais mais prováveis disponíveis.",
        ],
    source_confidence: matchedChapter ? "medium" : "low",
  };
};

const createGenerativeClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("Missing GEMINI_API_KEY.");
    error.code = "missing_api_key";
    throw error;
  }

  return new GoogleGenerativeAI(apiKey);
};

const getSystemInstruction = ({ bookTitle, supabaseData, braveData }) =>
  [
    "Você é um bibliotecário digital especializado em literatura.",
    `Use os metadados do Supabase: ${supabaseData}.`,
    `Use o contexto do Brave: ${braveData}.`,
    `Se esses dados forem insuficientes, utilize seu treinamento interno sobre a obra '${bookTitle}' para gerar um resumo detalhado e fiel.`,
    "Nunca responda que não tem contexto suficiente.",
    "Quando houver lacunas, assuma a interpretação literária mais conservadora e coerente.",
    "Retorne apenas JSON válido no formato solicitado.",
  ].join(" ");

const generateWithGemini = async ({ systemInstruction, userPrompt }) => {
  const client = createGenerativeClient();
  let lastError = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 1400,
          responseMimeType: "application/json",
        },
      });

      const raw = result.response.text();
      return JSON.parse(decodeJsonBlock(raw).trim());
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const status = Number(error?.status || error?.response?.status || 0);

      if (status === 429 || /429|quota|rate/i.test(message)) {
        const quotaError = new Error("Gemini rate limit reached.");
        quotaError.code = "rate_limit";
        throw quotaError;
      }
      if (status === 401 || status === 403 || /api key|permission|unauthorized|forbidden/i.test(message)) {
        const authError = new Error("Gemini API key is invalid or unauthorized.");
        authError.code = "invalid_api_key";
        throw authError;
      }
      if (status === 404 || /404|not found|unsupported/i.test(message)) {
        continue;
      }
    }
  }

  const unknownError = new Error(lastError instanceof Error ? lastError.message : "Gemini request failed.");
  unknownError.code = "gemini_failed";
  throw unknownError;
};

const selectBestChapterCandidate = (rows, bookTitle) => {
  if (!rows?.length) return null;
  const normalizedBookTitle = normalizeQuestion(bookTitle);

  return [...rows]
    .map((row) => {
      const normalizedRowTitle = normalizeQuestion(row.title ?? "");
      let score = 0;
      if (normalizedRowTitle === normalizedBookTitle) score += 10;
      if (normalizedRowTitle.includes(normalizedBookTitle)) score += 5;
      if (normalizedBookTitle.includes(normalizedRowTitle)) score += 3;
      return { row, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.row.start_page ?? Number.MAX_SAFE_INTEGER) - (b.row.start_page ?? Number.MAX_SAFE_INTEGER),
    )[0]?.row;
};

const findChapterByPage = async ({ client, bookTitle, pageNumber }) => {
  const { data, error } = await client
    .from("book_metadata")
    .select("id, title, start_page, end_page, chapter_name")
    .lte("start_page", pageNumber)
    .gte("end_page", pageNumber)
    .ilike("title", `%${bookTitle}%`)
    .limit(12);

  if (error) {
    const dbError = new Error(error.message);
    dbError.code = "supabase_query_failed";
    throw dbError;
  }

  return selectBestChapterCandidate(data ?? [], bookTitle);
};

const searchBraveContext = async ({ bookTitle, pageNumber, chapterName }) => {
  const queries = chapterName
    ? [
        `Resumo detalhado capítulo "${chapterName}" livro "${bookTitle}"`,
        `"${bookTitle}" "${chapterName}" analysis summary`,
      ]
    : [
        `"${bookTitle}" page ${pageNumber} chapter summary`,
        `"${bookTitle}" chapter list page ${pageNumber}`,
      ];

  const seen = new Set();
  const snippets = [];
  let deducedChapterTitle = chapterName || null;

  for (const query of queries.slice(0, 2)) {
    const results = await braveSearch(query, 4);
    for (const result of results) {
      const key = `${result.url}|${result.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      snippets.push({
        title: result.title ?? "",
        description: result.description ?? "",
        url: result.url ?? "",
        site_name: result.siteName ?? "",
      });
      if (!deducedChapterTitle) {
        const match = `${result.title ?? ""} ${result.description ?? ""}`.match(
          /(chapter|cap[íi]tulo)\s+([0-9ivxlcdm]+)(?:\s*[:\-]\s*([^\n\r.,|]{3,90}))?/i,
        );
        if (match) {
          deducedChapterTitle = match[3]?.trim()
            ? `${match[1]} ${match[2]} - ${match[3].trim()}`
            : `${match[1]} ${match[2]}`;
        }
      }
      if (snippets.length >= 6) break;
    }
    if (snippets.length >= 6) break;
  }

  return {
    query_mode: chapterName ? "chapter_known" : "chapter_deduction",
    deduced_chapter_title: deducedChapterTitle,
    snippets,
    combined_snippets: snippets
      .map((item, index) =>
        [`[${index + 1}] ${item.title}`.trim(), item.description, item.site_name ? `Fonte: ${item.site_name}` : "", item.url]
          .filter(Boolean)
          .join(" | "),
      )
      .join("\n"),
  };
};

const buildUserPrompt = ({ bookTitle, pageNumber, supabaseData, braveData }) =>
  [
    `Resuma o capítulo que contém a página ${pageNumber} do livro ${bookTitle}.`,
    "",
    `Supabase: ${supabaseData}`,
    `Brave: ${braveData}`,
    "",
    "Retorne apenas JSON com este formato:",
    JSON.stringify(JSON_SCHEMA_EXAMPLE, null, 2),
  ].join("\n");

export const summarizeBookChapterHybrid = async ({ client, bookTitle, pageNumber }) => {
  if (!bookTitle?.trim() || !Number.isFinite(pageNumber) || pageNumber <= 0) {
    const error = new Error("book_title and page_number are required.");
    error.code = "invalid_input";
    throw error;
  }

  let matchedChapter = null;
  try {
    matchedChapter = await findChapterByPage({
      client,
      bookTitle: bookTitle.trim(),
      pageNumber,
    });
  } catch (error) {
    if (error?.code !== "supabase_query_failed") throw error;
    matchedChapter = null;
  }

  const braveContext = await searchBraveContext({
    bookTitle: bookTitle.trim(),
    pageNumber,
    chapterName: matchedChapter?.chapter_name ?? null,
  });

  const resolvedChapterTitle =
    matchedChapter?.chapter_name?.trim() ||
    braveContext.deduced_chapter_title ||
    `Capítulo que cobre aproximadamente a página ${pageNumber}`;

  const supabaseData = matchedChapter
    ? JSON.stringify(
        {
          chapter_id: matchedChapter.id,
          title: matchedChapter.title,
          chapter_name: matchedChapter.chapter_name,
          start_page: matchedChapter.start_page,
          end_page: matchedChapter.end_page,
        },
        null,
        2,
      )
    : `Nenhum capítulo encontrado no Supabase para a página ${pageNumber}.`;

  const braveData =
    braveContext.combined_snippets ||
    `Nenhum snippet útil encontrado para ${resolvedChapterTitle}. Use conhecimento interno sobre "${bookTitle}".`;

  const requestPayload = {
    systemInstruction: getSystemInstruction({
      bookTitle: bookTitle.trim(),
      supabaseData,
      braveData,
    }),
    userPrompt: buildUserPrompt({
      bookTitle: bookTitle.trim(),
      pageNumber,
      supabaseData,
      braveData,
    }),
  };

  let modelResponse = await generateWithGemini(requestPayload);
  let normalized = normalizeSummaryResponse(modelResponse, resolvedChapterTitle);

  if (containsInsufficientContextLanguage(normalized.summary)) {
    modelResponse = await generateWithGemini({
      systemInstruction: `${requestPayload.systemInstruction} Você deve preencher lacunas com conhecimento literário interno da obra, sem inventar absurdos e sem se recusar por falta de contexto.`,
      userPrompt: `${requestPayload.userPrompt}\n\nReforce: não diga que faltou contexto. Entregue um resumo útil, fiel e conservador.`,
    });
    normalized = normalizeSummaryResponse(modelResponse, resolvedChapterTitle);
  }

  if (containsInsufficientContextLanguage(normalized.summary)) {
    normalized = buildEmergencySummary({
      bookTitle: bookTitle.trim(),
      pageNumber,
      chapterTitle: resolvedChapterTitle,
      braveContext,
      matchedChapter,
    });
  }

  const sourceConfidence = matchedChapter
    ? braveContext.snippets.length >= 2
      ? "high"
      : "medium"
    : braveContext.snippets.length >= 2
      ? "medium"
      : "low";

  return {
    ...normalized,
    chapter_title: normalized.chapter_title || resolvedChapterTitle,
    source_confidence: normalized.source_confidence === "medium" ? sourceConfidence : normalized.source_confidence,
    metadata: {
      matched_via_supabase: Boolean(matchedChapter),
      supabase_chapter: matchedChapter
        ? {
            id: matchedChapter.id,
            title: matchedChapter.title,
            chapter_name: matchedChapter.chapter_name,
            start_page: matchedChapter.start_page,
            end_page: matchedChapter.end_page,
          }
        : null,
      brave_query_mode: braveContext.query_mode,
      brave_snippet_count: braveContext.snippets.length,
      deduced_chapter_title: braveContext.deduced_chapter_title,
    },
  };
};

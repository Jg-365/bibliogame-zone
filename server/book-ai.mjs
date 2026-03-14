const ENTITY_MAP = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const decodeEntities = (text) =>
  text.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (_full, entity) => {
    if (entity.startsWith("#x")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    }
    return ENTITY_MAP[entity] ?? "";
  });

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Content-Type": "application/json",
};

export const normalizeText = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeQuestion = (value) => normalizeText(value);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const splitSentences = (text, limit = 4) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20)
    .slice(0, limit);

export const extractKeywords = (text, limit = 8) => {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "sobre",
    "para",
    "como",
    "mais",
    "entre",
    "depois",
    "antes",
    "quando",
    "while",
    "chapter",
    "capitulo",
    "livro",
    "book",
    "reader",
    "resumo",
    "summary",
  ]);

  const counts = new Map();
  normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !stopWords.has(word))
    .forEach((word) => {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
};

export const extractCharacters = (text, limit = 6) => {
  const matches =
    text.match(/\b[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ][a-záàãâéêíóôõúç]+(?:\s+[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ][a-záàãâéêíóôõúç]+)?\b/g) ??
    [];
  const blacklist = new Set([
    "Chapter",
    "Capitulo",
    "Capítulo",
    "Resumo",
    "Summary",
    "Google Books",
    "Brave Search",
  ]);
  const counts = new Map();
  matches.forEach((name) => {
    const cleaned = name.trim();
    if (cleaned.length < 3 || blacklist.has(cleaned)) return;
    counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
};

const romanToInt = (raw) => {
  const roman = raw.toUpperCase();
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  let previous = 0;
  for (let i = roman.length - 1; i >= 0; i -= 1) {
    const current = values[roman[i]] ?? 0;
    if (current < previous) total -= current;
    else total += current;
    previous = current;
  }
  return total || null;
};

const parseChapterNumber = (raw) => {
  if (/^\d+$/.test(raw)) return Number(raw);
  if (/^[ivxlcdm]+$/i.test(raw)) return romanToInt(raw);
  return null;
};

export const extractChapterSections = (text, sourceMeta = {}) => {
  const matcher = /(?:^|\s)(chapter|cap[íi]tulo)\s+([0-9ivxlcdm]+)(?:\s*[:\-]\s*([^\n\r]{3,120}))?/gim;
  const matches = [...text.matchAll(matcher)];
  if (!matches.length) return [];

  return matches
    .map((match, index) => {
      const heading = match[0].trim();
      const chapterRaw = match[2]?.trim() ?? "";
      const chapterNumber = parseChapterNumber(chapterRaw);
      const explicitTitle = match[3]?.trim();
      const start = match.index ?? 0;
      const end = matches[index + 1]?.index ?? Math.min(text.length, start + 2800);
      const block = text.slice(start, end).replace(/\s+/g, " ").trim();
      const summarySentences = splitSentences(block.replace(heading, "").trim(), 4);
      const snippet = summarySentences.join(" ").slice(0, 1200);
      if (!snippet || snippet.length < 80) return null;
      return {
        chapterNumber,
        chapterTitle: explicitTitle || `Capitulo ${chapterNumber ?? chapterRaw}`.trim(),
        snippet,
        sourceUrl: sourceMeta.url,
        sourceName: sourceMeta.siteName,
      };
    })
    .filter(Boolean);
};

const parseDateToIso = (raw) => {
  if (!raw) return null;
  if (/^\d{4}$/.test(raw)) return `${raw}-01-01`;
  if (/^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
};

const pickIsbn = (identifiers) => {
  if (!identifiers?.length) return null;
  const isbn13 = identifiers.find((id) => id.type?.toLowerCase().includes("13"))?.identifier;
  if (isbn13) return isbn13;
  return identifiers.find((id) => id.identifier)?.identifier ?? null;
};

const scoreVolumeInfo = (info, titleOrIsbn) => {
  const q = normalizeText(titleOrIsbn);
  let score = 0;
  const title = normalizeText(info.title ?? "");
  const authors = normalizeText((info.authors ?? []).join(" "));
  if (title.includes(q)) score += 8;
  if (q.includes(title) && title.length > 4) score += 5;
  if (authors.includes(q)) score += 3;
  const isbn = normalizeText(pickIsbn(info.industryIdentifiers) ?? "");
  if (isbn && q.includes(isbn)) score += 10;
  return score;
};

export const fetchGoogleBook = async (input) => {
  const query = input.isbn?.trim() ? `isbn:${input.isbn.trim()}` : `intitle:${(input.title ?? "").trim()}`;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
  const response = await fetchWithRetry(url, {}, { timeoutMs: 10000, retries: 2, baseDelayMs: 900 });
  if (!response.ok) {
    throw new Error(`google_books_error_${response.status}`);
  }

  const data = await response.json();
  const items = data.items ?? [];
  if (!items.length) return null;

  const ranked = items
    .map((item) => ({
      item,
      score: scoreVolumeInfo(item.volumeInfo ?? {}, input.isbn ?? input.title ?? ""),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]?.item;
  if (!best?.volumeInfo?.title) return null;

  const info = best.volumeInfo;
  const authors = info.authors ?? [];
  const totalPages = Number.isFinite(info.pageCount) ? Math.max(1, info.pageCount) : 300;
  return {
    googleBooksId: best.id ?? null,
    title: info.title,
    authors,
    author: authors[0] ?? "Autor desconhecido",
    isbn: pickIsbn(info.industryIdentifiers),
    description: info.description?.trim() ?? "",
    coverUrl: info.imageLinks?.large ?? info.imageLinks?.medium ?? info.imageLinks?.thumbnail ?? info.imageLinks?.small ?? null,
    publishedDate: parseDateToIso(info.publishedDate),
    totalPages,
  };
};

const withTimeout = async (url, init, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const fetchWithRetry = async (url, init, options = {}) => {
  const {
    timeoutMs = 10000,
    retries = 3,
    retryStatuses = [429, 500, 502, 503, 504],
    baseDelayMs = 1200,
  } = options;

  let lastResponse = null;
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await withTimeout(url, init, timeoutMs);
      lastResponse = response;
      if (!retryStatuses.includes(response.status) || attempt === retries) {
        return response;
      }

      const retryAfter = Number(response.headers.get("retry-after"));
      const waitMs =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : baseDelayMs * (attempt + 1);
      await sleep(waitMs);
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
      await sleep(baseDelayMs * (attempt + 1));
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError ?? new Error("Request failed after retries.");
};

export const braveSearch = async (query, count = 8) => {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return [];
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
  const response = await fetchWithRetry(
    url,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": key,
      },
    },
    { timeoutMs: 12000, retries: 1, retryStatuses: [500, 502, 503, 504], baseDelayMs: 1200 },
  );
  if (!response.ok) return [];
  const data = await response.json();
  return (data.web?.results ?? [])
    .map((item) => ({
      url: item.url ?? "",
      title: item.title ?? "",
      description: item.description ?? "",
      siteName: item.profile?.name ?? "",
    }))
    .filter((item) => item.url.startsWith("http"));
};

export const htmlToCleanText = (html) => {
  const withoutScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const withoutTags = withoutScript.replace(/<[^>]+>/g, " ");
  const decoded = decodeEntities(withoutTags);
  return decoded.replace(/\s+/g, " ").trim();
};

export const downloadAndSanitizePage = async (url, limits = { maxChars: 30000, minChars: 600 }) => {
  try {
    const response = await fetchWithRetry(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": "ReadQuestBot/1.0 (+http://localhost)",
        },
      },
      { timeoutMs: 10000, retries: 2, baseDelayMs: 1000 },
    );
    if (!response.ok) return null;
    const html = await response.text();
    const text = htmlToCleanText(html).slice(0, limits.maxChars);
    if (text.length < limits.minChars) return null;
    return text;
  } catch {
    return null;
  }
};

const extractJson = (raw) => {
  const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1];
  const plainFence = raw.match(/```\s*([\s\S]*?)\s*```/i);
  if (plainFence?.[1]) return plainFence[1];
  return raw;
};

const normalizeJsonText = (raw) =>
  String(raw ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

const stripTrailingCommas = (raw) => raw.replace(/,\s*([}\]])/g, "$1");

const isolateJsonEnvelope = (raw) => {
  const objectStart = raw.indexOf("{");
  const objectEnd = raw.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd > objectStart) {
    return raw.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = raw.indexOf("[");
  const arrayEnd = raw.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return raw.slice(arrayStart, arrayEnd + 1);
  }

  return raw;
};

const tryParseJsonCandidate = (raw) => {
  const candidate = normalizeJsonText(raw);
  const attempts = [
    candidate,
    isolateJsonEnvelope(candidate),
    stripTrailingCommas(candidate),
    stripTrailingCommas(isolateJsonEnvelope(candidate)),
    isolateJsonEnvelope(candidate.replace(/\n/g, " ")),
    stripTrailingCommas(isolateJsonEnvelope(candidate.replace(/\n/g, " "))),
  ].filter((value, index, array) => value && array.indexOf(value) === index);

  let lastError = null;
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Unable to parse model JSON output.");
};

const repairJsonWithGemini = async ({ url, prompt, rawOutput, opts }) => {
  const repairResponse = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "Converta a resposta abaixo em JSON valido.",
                  "Regras:",
                  "- Preserve o significado.",
                  "- Retorne apenas JSON.",
                  "- Feche strings e objetos corretamente.",
                  prompt ? `- Siga o schema implícito do prompt original: ${prompt.slice(0, 1200)}` : "",
                  "",
                  "Resposta original:",
                  rawOutput,
                ]
                  .filter(Boolean)
                  .join("\n"),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: Math.min(opts.maxOutputTokens ?? 4096, 1600),
          responseMimeType: "application/json",
        },
      }),
    },
    { timeoutMs: 20000, retries: 0, retryStatuses: [500, 502, 503, 504], baseDelayMs: 1200 },
  );

  if (!repairResponse.ok) {
    const body = await repairResponse.text();
    throw new Error(`gemini_repair_error_${repairResponse.status}: ${body.slice(0, 300)}`);
  }

  const repairData = await repairResponse.json();
  const repairedText = repairData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return tryParseJsonCandidate(extractJson(repairedText).trim());
};

export const callGeminiJson = async (prompt, opts = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }
  const configuredModel = opts.model ?? process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";
  const models = [
    configuredModel,
    process.env.GEMINI_FALLBACK_MODEL,
    "gemma-3-27b",
    "gemma-3-12b",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
  ].filter(
    (model, index, array) => model && array.indexOf(model) === index,
  );

  let lastError = "Unknown Gemini error";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetchWithRetry(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: opts.temperature ?? 0.2,
            maxOutputTokens: opts.maxOutputTokens ?? 4096,
            responseMimeType: "application/json",
          },
        }),
      },
      { timeoutMs: 20000, retries: 0, retryStatuses: [500, 502, 503, 504], baseDelayMs: 1200 },
    );

    if (!response.ok) {
      const body = await response.text();
      lastError = `gemini_error_${response.status}: ${body.slice(0, 300)}`;
      if (response.status === 404 || response.status === 400) continue;
      throw new Error(lastError);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const extractedText = extractJson(text).trim();

    try {
      return tryParseJsonCandidate(extractedText);
    } catch (parseError) {
      try {
        return await repairJsonWithGemini({
          url,
          prompt,
          rawOutput: extractedText,
          opts,
        });
      } catch {
        const message = parseError instanceof Error ? parseError.message : "Invalid JSON from Gemini.";
        const error = new Error(`gemini_invalid_json: ${message}`);
        error.code = "gemini_invalid_json";
        throw error;
      }
    }
  }

  throw new Error(lastError);
};

export const sha256Hex = async (value) => {
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

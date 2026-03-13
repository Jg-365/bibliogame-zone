export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GoogleBookVolumeInfo = {
  title?: string;
  authors?: string[];
  description?: string;
  pageCount?: number;
  publishedDate?: string;
  imageLinks?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  industryIdentifiers?: Array<{
    type?: string;
    identifier?: string;
  }>;
};

type GoogleBooksResponse = {
  items?: Array<{
    id?: string;
    volumeInfo?: GoogleBookVolumeInfo;
  }>;
};

export type GoogleBookParsed = {
  googleBooksId: string | null;
  title: string;
  authors: string[];
  author: string;
  isbn: string | null;
  description: string;
  coverUrl: string | null;
  publishedDate: string | null;
  totalPages: number;
};

export type BraveSearchResult = {
  url: string;
  title: string;
  siteName: string;
};

export type ParsedChapterSection = {
  chapterNumber: number | null;
  chapterTitle: string;
  snippet: string;
  sourceUrl?: string;
  sourceName?: string;
};

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: "\"",
  apos: "'",
  nbsp: " ",
};

const decodeEntities = (text: string) =>
  text.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (_full, entity: string) => {
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

export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeQuestion = (value: string) => normalizeText(value);

export const splitSentences = (text: string, limit = 4) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20)
    .slice(0, limit);

export const extractKeywords = (text: string, limit = 8) => {
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

  const counts = new Map<string, number>();
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

export const extractCharacters = (text: string, limit = 6) => {
  const matches = text.match(/\b[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ][a-záàãâéêíóôõúç]+(?:\s+[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ][a-záàãâéêíóôõúç]+)?\b/g) ?? [];
  const blacklist = new Set([
    "Chapter",
    "Capitulo",
    "Capítulo",
    "Resumo",
    "Summary",
    "Google Books",
    "Brave Search",
  ]);
  const counts = new Map<string, number>();
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

const romanToInt = (raw: string) => {
  const roman = raw.toUpperCase();
  const values: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };
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

const parseChapterNumber = (raw: string) => {
  if (/^\d+$/.test(raw)) return Number(raw);
  if (/^[ivxlcdm]+$/i.test(raw)) return romanToInt(raw);
  return null;
};

export const extractChapterSections = (
  text: string,
  sourceMeta?: { url?: string; siteName?: string },
): ParsedChapterSection[] => {
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
        sourceUrl: sourceMeta?.url,
        sourceName: sourceMeta?.siteName,
      };
    })
    .filter((value): value is ParsedChapterSection => Boolean(value));
};

const parseDateToIso = (raw: string | undefined) => {
  if (!raw) return null;
  if (/^\d{4}$/.test(raw)) return `${raw}-01-01`;
  if (/^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
};

const pickIsbn = (identifiers?: GoogleBookVolumeInfo["industryIdentifiers"]) => {
  if (!identifiers?.length) return null;
  const isbn13 = identifiers.find((id) => id.type?.toLowerCase().includes("13"))?.identifier;
  if (isbn13) return isbn13;
  return identifiers.find((id) => id.identifier)?.identifier ?? null;
};

const scoreVolumeInfo = (info: GoogleBookVolumeInfo, titleOrIsbn: string) => {
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

export const fetchGoogleBook = async (input: { isbn?: string; title?: string }) => {
  const query = input.isbn?.trim()
    ? `isbn:${input.isbn.trim()}`
    : `intitle:${(input.title ?? "").trim()}`;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`google_books_error_${response.status}`);
  }

  const data = (await response.json()) as GoogleBooksResponse;
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
  const totalPages = Number.isFinite(info.pageCount) ? Math.max(1, info.pageCount as number) : 300;
  const parsed: GoogleBookParsed = {
    googleBooksId: best.id ?? null,
    title: info.title,
    authors,
    author: authors[0] ?? "Autor desconhecido",
    isbn: pickIsbn(info.industryIdentifiers),
    description: info.description?.trim() ?? "",
    coverUrl:
      info.imageLinks?.large ??
      info.imageLinks?.medium ??
      info.imageLinks?.thumbnail ??
      info.imageLinks?.small ??
      null,
    publishedDate: parseDateToIso(info.publishedDate),
    totalPages,
  };
  return parsed;
};

const withTimeout = async (url: string, init: RequestInit, timeoutMs = 10_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const braveSearch = async (query: string, count = 8): Promise<BraveSearchResult[]> => {
  const key = Deno.env.get("BRAVE_SEARCH_API_KEY");
  if (!key) return [];
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
  const response = await withTimeout(
    url,
    {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": key,
      },
    },
    12_000,
  );
  if (!response.ok) return [];

  const data = (await response.json()) as {
    web?: {
      results?: Array<{
        url?: string;
        title?: string;
        profile?: { name?: string };
      }>;
    };
  };

  return (data.web?.results ?? [])
    .map((item) => ({
      url: item.url ?? "",
      title: item.title ?? "",
      siteName: item.profile?.name ?? "",
    }))
    .filter((item) => item.url.startsWith("http"));
};

export const htmlToCleanText = (html: string) => {
  const withoutScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const withoutTags = withoutScript.replace(/<[^>]+>/g, " ");
  const decoded = decodeEntities(withoutTags);
  return decoded.replace(/\s+/g, " ").trim();
};

export const downloadAndSanitizePage = async (
  url: string,
  limits = { maxChars: 30_000, minChars: 600 },
) => {
  try {
    const response = await withTimeout(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": "ReadQuestBot/1.0 (+https://bibliogame-zone.vercel.app)",
        },
      },
      10_000,
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

const extractJson = (raw: string) => {
  const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1];
  const plainFence = raw.match(/```\s*([\s\S]*?)\s*```/i);
  if (plainFence?.[1]) return plainFence[1];
  return raw;
};

export const callGeminiJson = async <T>(
  prompt: string,
  opts: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  } = {},
): Promise<T> => {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY secret.");
  }
  const configuredModel = opts.model ?? Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash";
  const models = [configuredModel, "gemini-2.0-flash", "gemini-2.5-flash"]
    .filter(Boolean)
    .filter((model, index, array) => array.indexOf(model) === index);

  let lastError = "Unknown Gemini error";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await withTimeout(
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
      20_000,
    );

    if (!response.ok) {
      const body = await response.text();
      lastError = `gemini_error_${response.status}: ${body.slice(0, 300)}`;
      if (response.status === 404 || response.status === 400) {
        continue;
      }
      throw new Error(lastError);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonText = extractJson(text).trim();
    return JSON.parse(jsonText) as T;
  }

  throw new Error(lastError);
};

export const sha256Hex = async (value: string) => {
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

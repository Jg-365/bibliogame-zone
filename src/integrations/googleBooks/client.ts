import type { GoogleBook } from "@/shared/types";

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_BOOKS_API_KEY = String(import.meta.env.VITE_GOOGLE_BOOKS_API_KEY ?? "").trim();

const SEARCH_CACHE_TTL_MS = 15 * 60 * 1000;
const MIN_REQUEST_INTERVAL_MS = 800;
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000;

type SearchResult = { items: GoogleBook[]; totalItems: number };
type SearchCacheEntry = { result: SearchResult; expiresAt: number };

const searchCache = new Map<string, SearchCacheEntry>();
const inFlightRequests = new Map<string, Promise<SearchResult>>();

let lastRequestAt = 0;
let rateLimitedUntil = 0;

const emptySearchResult = (): SearchResult => ({ items: [], totalItems: 0 });

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const getCacheKey = (query: string, page: number, pageSize: number) =>
  `${normalise(query)}::${page}::${pageSize}`;

const getCachedResult = (cacheKey: string, allowStale = false): SearchResult | null => {
  const cached = searchCache.get(cacheKey);
  if (!cached) return null;
  if (!allowStale && cached.expiresAt < Date.now()) return null;
  return cached.result;
};

const cacheResult = (cacheKey: string, result: SearchResult) => {
  searchCache.set(cacheKey, {
    result,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });
};

const waitForRequestSlot = async () => {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
  }
  lastRequestAt = Date.now();
};

const getRetryAfterMs = (response: Response) => {
  const retryAfterSeconds = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }
  return RATE_LIMIT_COOLDOWN_MS;
};

const fetchWithGuards = async (url: string, cacheKey: string): Promise<SearchResult> => {
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) return inFlight;

  const requestPromise = (async () => {
    if (Date.now() < rateLimitedUntil) {
      return getCachedResult(cacheKey, true) ?? emptySearchResult();
    }

    await waitForRequestSlot();

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
    });

    if (response.status === 429) {
      rateLimitedUntil = Date.now() + getRetryAfterMs(response);
      return getCachedResult(cacheKey, true) ?? emptySearchResult();
    }

    if (!response.ok) {
      return getCachedResult(cacheKey, true) ?? emptySearchResult();
    }

    const data = (await response.json()) as {
      items?: GoogleBook[];
      totalItems?: number;
    };

    const result: SearchResult = {
      items: data.items ?? [],
      totalItems: data.totalItems ?? 0,
    };

    cacheResult(cacheKey, result);
    return result;
  })();

  inFlightRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
};

/**
 * Normalises a string for scoring: lowercase, strip punctuation/symbols, collapse whitespace.
 */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score a single GoogleBook result against the query tokens.
 * Higher score = more relevant.
 *
 * Weight table:
 *   title contains token          +6
 *   title word starts with token  +2 (partial prefix)
 *   author contains token         +4
 *   category contains token       +2
 *   ISBN contains token           +8
 *   exact full-title match        +10
 */
function scoreItem(item: GoogleBook, tokens: string[]): number {
  const info = item.volumeInfo ?? ({} as NonNullable<GoogleBook["volumeInfo"]>);

  const title = info.title ? normalise(info.title) : "";
  const authors = info.authors?.length ? normalise(info.authors.join(" ")) : "";
  const categories = info.categories?.length ? normalise(info.categories.join(" ")) : "";
  const isbn = info.industryIdentifiers?.map((id) => id.identifier).join(" ") ?? "";

  let score = 0;

  for (const t of tokens) {
    if (!t) continue;
    if (title.includes(t)) score += 6;
    if (title.split(" ").some((w) => w.startsWith(t))) score += 2;
    if (authors.includes(t)) score += 4;
    if (categories.includes(t)) score += 2;
    if (isbn.includes(t)) score += 8;
  }

  if (tokens.length && title === tokens.join(" ")) score += 10;

  return score;
}

/**
 * Search the Google Books API and return relevance-ranked results.
 *
 * @param query    User search string
 * @param page     Zero-based page index
 * @param pageSize Results per page (max 40 per the API)
 */
export async function searchGoogleBooks(
  query: string,
  page = 0,
  pageSize = 10,
): Promise<{ items: GoogleBook[]; totalItems: number }> {
  try {
    const startIndex = page * pageSize;
    const baseQuery = `q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${pageSize}`;
    const keyParam = GOOGLE_BOOKS_API_KEY ? `&key=${encodeURIComponent(GOOGLE_BOOKS_API_KEY)}` : "";
    const url = `${GOOGLE_BOOKS_API}?${baseQuery}${keyParam}`;

    const cacheKey = getCacheKey(query, page, pageSize);
    const { items, totalItems } = await fetchWithGuards(url, cacheKey);

    const tokens = normalise(query).split(" ").filter(Boolean);

    const ranked = items
      .map((item) => ({ item, score: scoreItem(item, tokens) }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);

    return { items: ranked, totalItems };
  } catch (error) {
    console.warn("[googleBooks] search error:", error);
    return { items: [], totalItems: 0 };
  }
}

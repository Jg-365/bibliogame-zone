import type { GoogleBook } from "@/shared/types";

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

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
    const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${pageSize}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      items?: GoogleBook[];
      totalItems?: number;
    };

    const items: GoogleBook[] = data.items ?? [];
    const totalItems: number = data.totalItems ?? 0;

    const tokens = normalise(query).split(" ").filter(Boolean);

    const ranked = items
      .map((item) => ({ item, score: scoreItem(item, tokens) }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);

    return { items: ranked, totalItems };
  } catch (error) {
    console.error("[googleBooks] search error:", error);
    return { items: [], totalItems: 0 };
  }
}

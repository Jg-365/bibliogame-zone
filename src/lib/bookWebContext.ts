interface BookWebContextInput {
  title: string;
  author?: string;
  isbn?: string;
}

interface BookWebContextResult {
  contextText: string;
  sources: string[];
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const cleanSnippet = (value?: string, max = 420) => {
  if (!value) return "";
  const normalized = value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
};

const cacheKey = (title: string, author?: string) =>
  `rq:web-book-context:${normalize(`${title} ${author ?? ""}`)}`;

const readCache = (key: string): BookWebContextResult | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { createdAt: number; data: BookWebContextResult };
    if (!parsed?.createdAt || !parsed?.data) return null;
    if (Date.now() - parsed.createdAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const writeCache = (key: string, data: BookWebContextResult) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        createdAt: Date.now(),
        data,
      }),
    );
  } catch {
    // best effort
  }
};

const scoreGoogleBook = (
  item: {
    volumeInfo?: {
      title?: string;
      authors?: string[];
    };
  },
  title: string,
  author?: string,
) => {
  const itemTitle = normalize(item.volumeInfo?.title ?? "");
  const itemAuthors = normalize((item.volumeInfo?.authors ?? []).join(" "));
  const targetTitle = normalize(title);
  const targetAuthor = normalize(author ?? "");
  let score = 0;
  if (itemTitle.includes(targetTitle)) score += 8;
  if (targetTitle.includes(itemTitle) && itemTitle.length > 4) score += 6;
  if (targetAuthor && itemAuthors.includes(targetAuthor)) score += 5;
  return score;
};

const fetchGoogleBooksContext = async (input: BookWebContextInput) => {
  const query = [`intitle:${input.title}`, input.author ? `inauthor:${input.author}` : ""]
    .filter(Boolean)
    .join("+");
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`google_books_${response.status}`);
  const json = (await response.json()) as {
    items?: Array<{
      volumeInfo?: {
        title?: string;
        authors?: string[];
        description?: string;
        categories?: string[];
        pageCount?: number;
        publishedDate?: string;
        averageRating?: number;
        ratingsCount?: number;
        previewLink?: string;
        infoLink?: string;
      };
    }>;
  };

  const candidate = (json.items ?? [])
    .map((item) => ({ item, score: scoreGoogleBook(item, input.title, input.author) }))
    .sort((a, b) => b.score - a.score)[0]?.item;

  const info = candidate?.volumeInfo;
  if (!info) return { text: "", source: "" };

  const text = [
    `Web/Google Books: ${cleanSnippet(info.description, 700)}`,
    info.categories?.length ? `Categorias: ${info.categories.slice(0, 6).join(", ")}.` : "",
    info.pageCount ? `Paginas estimadas: ${info.pageCount}.` : "",
    info.publishedDate ? `Publicacao: ${info.publishedDate}.` : "",
    typeof info.averageRating === "number"
      ? `Avaliacao media web: ${info.averageRating} (${info.ratingsCount ?? 0} avaliacoes).`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    text,
    source: info.infoLink || info.previewLink || "https://books.google.com",
  };
};

const fetchOpenLibraryContext = async (input: BookWebContextInput) => {
  const params = new URLSearchParams();
  params.set("title", input.title);
  if (input.author) params.set("author", input.author);
  params.set("limit", "3");
  const url = `https://openlibrary.org/search.json?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`open_library_${response.status}`);
  const json = (await response.json()) as {
    docs?: Array<{
      key?: string;
      title?: string;
      author_name?: string[];
      first_publish_year?: number;
      subject?: string[];
      edition_count?: number;
    }>;
  };
  const doc = (json.docs ?? [])[0];
  if (!doc) return { text: "", source: "" };

  const text = [
    "Web/Open Library:",
    doc.subject?.length ? `Temas recorrentes: ${doc.subject.slice(0, 8).join(", ")}.` : "",
    doc.first_publish_year ? `Primeira publicacao: ${doc.first_publish_year}.` : "",
    doc.edition_count ? `Edicoes catalogadas: ${doc.edition_count}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    text,
    source: doc.key ? `https://openlibrary.org${doc.key}` : "https://openlibrary.org",
  };
};

export const fetchBookWebContext = async (
  input: BookWebContextInput,
): Promise<BookWebContextResult> => {
  const key = cacheKey(input.title, input.author);
  const cached = readCache(key);
  if (cached) return cached;

  const tasks = await Promise.allSettled([
    fetchGoogleBooksContext(input),
    fetchOpenLibraryContext(input),
  ]);

  const entries = tasks
    .filter(
      (task): task is PromiseFulfilledResult<{ text: string; source: string }> =>
        task.status === "fulfilled",
    )
    .map((task) => task.value)
    .filter((value) => value.text);

  const result: BookWebContextResult = {
    contextText: entries
      .map((entry) => entry.text)
      .join(" ")
      .trim(),
    sources: entries.map((entry) => entry.source).filter(Boolean),
  };

  writeCache(key, result);
  return result;
};

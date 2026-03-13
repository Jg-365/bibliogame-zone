const RECOMMENDATION_CATALOG = [
  {
    title: "A Floresta Sombria",
    author: "Cixin Liu",
    genres: ["ficcao cientifica", "hard sci-fi", "space opera"],
    pages: 416,
    hooks: ["escala cosmica", "estrategia", "primeiro contato", "ideias grandes"],
    why: "Amplia o mesmo eixo de escala cosmica, paranoia estrategica e ciencia especulativa.",
  },
  {
    title: "O Problema dos Três Corpos",
    author: "Cixin Liu",
    genres: ["ficcao cientifica", "hard sci-fi", "primeiro contato"],
    pages: 320,
    hooks: ["primeiro contato", "fisica", "civilizacoes", "misterio"],
    why: "Vale reler ou indicar para fechar o arco inteiro da trilogia com o contexto completo.",
  },
  {
    title: "Children of Time",
    author: "Adrian Tchaikovsky",
    genres: ["ficcao cientifica", "hard sci-fi", "space opera"],
    pages: 600,
    hooks: ["evolucao", "civilizacao", "escala", "biologia"],
    why: "Mistura especulacao biologica, evolucao e ambicao de longo prazo com ritmo forte.",
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    genres: ["ficcao cientifica", "hard sci-fi", "aventura"],
    pages: 496,
    hooks: ["problema cientifico", "humor", "sobrevivencia", "espaco"],
    why: "Entrega ciencia acessivel, tensao constante e um senso de descoberta muito recompensador.",
  },
  {
    title: "The Martian",
    author: "Andy Weir",
    genres: ["ficcao cientifica", "hard sci-fi", "sobrevivencia"],
    pages: 384,
    hooks: ["engenharia", "sobrevivencia", "problemas", "ritmo"],
    why: "Excelente para quem gosta de resolver problemas tecnicos dentro de uma narrativa direta.",
  },
  {
    title: "Hyperion",
    author: "Dan Simmons",
    genres: ["ficcao cientifica", "space opera", "literario"],
    pages: 480,
    hooks: ["escala", "estrutura", "personagens", "mistica"],
    why: "Combina grande imaginacao com estrutura literaria mais densa e memoravel.",
  },
  {
    title: "Fundação",
    author: "Isaac Asimov",
    genres: ["ficcao cientifica", "classico", "space opera"],
    pages: 296,
    hooks: ["civilizacoes", "politica", "historia", "ideias"],
    why: "Perfeito se voce curte macroestruturas historicas e civilizacoes em movimento.",
  },
  {
    title: "Duna",
    author: "Frank Herbert",
    genres: ["ficcao cientifica", "space opera", "politico"],
    pages: 544,
    hooks: ["ecologia", "politica", "religiao", "escala"],
    why: "Une densidade politica, construçao de mundo e ambicao intelectual de alto nivel.",
  },
  {
    title: "Neuromancer",
    author: "William Gibson",
    genres: ["ficcao cientifica", "cyberpunk", "classico"],
    pages: 272,
    hooks: ["tecnologia", "ritmo", "ambiente", "estilo"],
    why: "Boa troca de atmosfera se voce quiser sair do cosmo e entrar num sci-fi mais urbano e cortante.",
  },
  {
    title: "A Mão Esquerda da Escuridão",
    author: "Ursula K. Le Guin",
    genres: ["ficcao cientifica", "classico", "sociologico"],
    pages: 304,
    hooks: ["sociedade", "antropologia", "politica", "identidade"],
    why: "Excelente para quem aprecia ficcao cientifica com camada humana e reflexiva.",
  },
  {
    title: "Solaris",
    author: "Stanislaw Lem",
    genres: ["ficcao cientifica", "classico", "filosofico"],
    pages: 240,
    hooks: ["contato", "mente", "misterio", "filosofia"],
    why: "Se voce gosta de especulacao intelectual e do limite da compreensao humana, funciona muito bem.",
  },
  {
    title: "Blindsight",
    author: "Peter Watts",
    genres: ["ficcao cientifica", "hard sci-fi", "filosofico"],
    pages: 384,
    hooks: ["contato", "consciencia", "neurociencia", "escuridao"],
    why: "Leitura mais exigente e brilhante para quem quer ciencia dura com provocacao filosofica.",
  },
  {
    title: "Oceano no Fim do Caminho",
    author: "Neil Gaiman",
    genres: ["fantasia", "literario", "sombrio"],
    pages: 208,
    hooks: ["imaginaçao", "sensibilidade", "estranheza"],
    why: "Uma rota de descanso elegante se voce quiser variar sem perder atmosfera e impacto.",
  },
  {
    title: "A Invenção de Morel",
    author: "Adolfo Bioy Casares",
    genres: ["ficcao cientifica", "classico", "filosofico"],
    pages: 144,
    hooks: ["conceito", "identidade", "realidade"],
    why: "Curto, inventivo e historicamente importante para quem aprecia premissas poderosas.",
  },
];

const normalizeValue = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const uniqueNormalized = (values) => {
  const seen = new Set();
  return values.filter((value) => {
    const normalized = normalizeValue(value);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

export const buildUserLibraryProfile = ({ books = [], preferredGenres = [], currentBook = null }) => {
  const completedBooks = books.filter((book) => ["completed", "lido"].includes(String(book.status ?? "")));
  const readingBooks = books.filter((book) => ["reading", "lendo"].includes(String(book.status ?? "")));

  const genreCountMap = new Map();
  const authorCountMap = new Map();

  books.forEach((book) => {
    const genres = Array.isArray(book.genres) ? book.genres : [];
    genres.forEach((genre) => {
      const key = normalizeValue(genre);
      if (!key) return;
      genreCountMap.set(key, {
        name: genre,
        count: (genreCountMap.get(key)?.count ?? 0) + 1,
      });
    });

    const authorKey = normalizeValue(book.author);
    if (authorKey) {
      authorCountMap.set(authorKey, {
        name: book.author,
        count: (authorCountMap.get(authorKey)?.count ?? 0) + 1,
      });
    }
  });

  const topGenres = [
    ...uniqueNormalized(preferredGenres).map((genre) => ({ name: genre, count: 3 })),
    ...[...genreCountMap.values()].sort((a, b) => b.count - a.count),
  ]
    .filter((genre, index, array) => index === array.findIndex((item) => normalizeValue(item.name) === normalizeValue(genre.name)))
    .slice(0, 6);

  const favoriteAuthors = [...authorCountMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  const avgPages =
    completedBooks.length > 0
      ? Math.round(
          completedBooks.reduce((sum, book) => sum + Number(book.total_pages || 0), 0) /
            Math.max(1, completedBooks.length),
        )
      : 0;

  const avgRating =
    completedBooks.length > 0
      ? completedBooks.reduce((sum, book) => sum + Number(book.rating || 0), 0) /
        Math.max(1, completedBooks.filter((book) => Number(book.rating || 0) > 0).length || 1)
      : 0;

  return {
    completedCount: completedBooks.length,
    readingCount: readingBooks.length,
    knownTitles: books.map((book) => book.title).filter(Boolean),
    currentBook: currentBook
      ? {
          title: currentBook.title,
          author: currentBook.author,
          genres: currentBook.genres ?? [],
          total_pages: currentBook.total_pages ?? null,
        }
      : null,
    topGenres,
    favoriteAuthors,
    averageCompletedPages: avgPages,
    averageRating: Number.isFinite(avgRating) ? Number(avgRating.toFixed(2)) : 0,
    topCompletedBooks: completedBooks
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 5)
      .map((book) => ({
        title: book.title,
        author: book.author,
        rating: Number(book.rating || 0),
        genres: book.genres ?? [],
      })),
  };
};

export const buildRecommendationCandidates = ({ profile, limit = 5 }) => {
  const ownedTitles = new Set(
    [
      ...(profile.knownTitles ?? []),
      ...(profile.topCompletedBooks ?? []).map((book) => book.title),
      profile.currentBook?.title ?? "",
    ]
      .map(normalizeValue)
      .filter(Boolean),
  );

  const normalizedGenres = new Set((profile.topGenres ?? []).map((genre) => normalizeValue(genre.name)));
  const normalizedAuthors = new Set((profile.favoriteAuthors ?? []).map((author) => normalizeValue(author.name)));
  const currentBookGenres = new Set((profile.currentBook?.genres ?? []).map(normalizeValue));
  const targetPages = Number(profile.averageCompletedPages || profile.currentBook?.total_pages || 0);

  return RECOMMENDATION_CATALOG.map((item) => {
    let score = 0;

    if (ownedTitles.has(normalizeValue(item.title))) score -= 50;

    item.genres.forEach((genre) => {
      const normalized = normalizeValue(genre);
      if (normalizedGenres.has(normalized)) score += 3;
      if (currentBookGenres.has(normalized)) score += 2;
    });

    item.hooks.forEach((hook) => {
      if (normalizeValue(profile.currentBook?.title).includes("fim da morte")) {
        if (["escala cosmica", "ideias grandes", "civilizacao", "contato", "espaco"].includes(hook)) {
          score += 1.5;
        }
      }
    });

    if (normalizedAuthors.has(normalizeValue(item.author))) score += 1.2;

    if (targetPages > 0) {
      const pageDistance = Math.abs(item.pages - targetPages);
      if (pageDistance <= 80) score += 1.5;
      else if (pageDistance <= 180) score += 0.75;
    }

    return { ...item, score };
  })
    .filter((item) => item.score > -40)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
};

export const buildRecommendationContext = (profile) =>
  JSON.stringify(
    {
      reading_profile: {
        completed_count: profile.completedCount,
        reading_count: profile.readingCount,
        average_completed_pages: profile.averageCompletedPages,
        average_rating: profile.averageRating,
      },
      current_book: profile.currentBook,
      top_genres: profile.topGenres,
      favorite_authors: profile.favoriteAuthors,
      top_completed_books: profile.topCompletedBooks,
      recommendation_candidates: buildRecommendationCandidates({ profile, limit: 6 }).map((item) => ({
        title: item.title,
        author: item.author,
        genres: item.genres,
        why: item.why,
      })),
    },
    null,
    2,
  );

export const buildRecommendationFallbackAnswer = ({ profile }) => {
  const picks = buildRecommendationCandidates({ profile, limit: 5 });
  if (!picks.length) {
    return {
      answer:
        "Posso recomendar melhor quando houver pelo menos alguns livros ou generos no seu historico. Mesmo assim, para ficcao cientifica de alto nivel eu comecaria por Duna, Fundacao e Children of Time.",
      confidence: 0.42,
      chapters_used: [],
    };
  }

  const intro = profile.currentBook?.title
    ? `Com base no clima de "${profile.currentBook.title}" e no seu historico de leitura, eu seguiria por estas opcoes:`
    : "Com base no seu historico de leitura, estas sao as proximas melhores apostas:";

  const lines = picks.map(
    (item, index) => `${index + 1}. ${item.title}, de ${item.author} — ${item.why}`,
  );

  const closing = profile.topGenres?.length
    ? `Se quiser, depois eu monto uma trilha separando por ${profile.topGenres
        .slice(0, 3)
        .map((genre) => genre.name)
        .join(", ")}.`
    : "Se quiser, depois eu reorganizo essas indicacoes por densidade, ritmo ou ambicao conceitual.";

  return {
    answer: [intro, ...lines, closing].join("\n\n"),
    confidence: 0.61,
    chapters_used: [],
  };
};

export const buildConsistencyFallbackAnswer = ({ profile }) => {
  const pace = profile.averageCompletedPages || 30;
  const focusBooks = Math.max(1, Math.min(2, profile.readingCount || 1));

  return {
    answer: [
      "Plano semanal sugerido para manter constancia sem perder prazer de leitura:",
      `1. Foque em ${focusBooks} livro(s) por vez para reduzir friccao de retomada.`,
      `2. Meta diaria sugerida: ${Math.max(15, Math.min(40, Math.round(pace / 12) || 20))} paginas em um bloco curto.`,
      "3. Reserve um bloco maior no fim de semana para avancar nas partes mais densas.",
      "4. Sempre feche a sessao anotando a proxima cena, ideia ou objetivo para facilitar a volta.",
      "5. Se a semana apertar, priorize continuidade em vez de volume: ler pouco ainda conta.",
    ].join("\n"),
    confidence: 0.56,
    chapters_used: [],
  };
};

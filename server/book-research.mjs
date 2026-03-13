import {
  braveSearch,
  callGeminiJson,
  downloadAndSanitizePage,
  extractChapterSections,
  extractCharacters,
  extractKeywords,
  normalizeText,
  sha256Hex,
  splitSentences,
} from "./book-ai.mjs";

const MAX_SEARCH_STAGES = 3;
const MAX_RESULTS_PER_STAGE = 4;
const MAX_DOWNLOADS = 6;
const MAX_CURATED_SOURCES = 4;
const MAX_EVIDENCE_CHARS = 2400;
const MIN_SOURCE_SCORE = 12;
const MIN_IDENTITY_SCORE = 9;
const MIN_BOOK_MATCH_CONFIDENCE = 0.68;
const PROMO_TERMS = [
  "buy",
  "purchase",
  "shipping",
  "price",
  "discount",
  "publisher",
  "paperback",
  "hardcover",
  "kindle",
  "ebook",
  "edition",
  "imprint",
  "category",
  "categories",
  "add to cart",
  "pre order",
  "newsletter",
  "shop",
  "loja",
  "preco",
  "desconto",
  "editora",
  "carrinho",
];
const CATALOG_TERMS = [
  "related books",
  "more books",
  "books like this",
  "list of books",
  "livros relacionados",
  "lista de livros",
  "outros livros",
  "biblioteca",
  "book list",
  "all books",
];
const SUMMARY_TERMS = [
  "summary",
  "plot",
  "synopsis",
  "overview",
  "resumo",
  "sinopse",
  "enredo",
  "visao geral",
];
const ANALYSIS_TERMS = [
  "analysis",
  "interpretation",
  "themes",
  "characters",
  "motifs",
  "analise",
  "interpretacao",
  "temas",
  "personagens",
];
const DOMAIN_BONUSES = [
  [/wikipedia\.org$/i, 2.5],
  [/sparknotes\.com$/i, 3.5],
  [/litcharts\.com$/i, 3.5],
  [/supersummary\.com$/i, 3.5],
  [/gradesaver\.com$/i, 3.2],
  [/fandom\.com$/i, 1.8],
  [/wiki/i, 1.2],
  [/goodreads\.com$/i, 1.5],
  [/\.edu$/i, 2.5],
  [/\.org$/i, 1.2],
];
const DOMAIN_PENALTIES = [
  [/amazon\./i, 8],
  [/mercadolivre|shopee|ebay|walmart|magazineluiza|americanas|submarino/i, 8],
  [/publisher|press|editora/i, 2.4],
];
const TOKEN_STOP_WORDS = new Set([
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
  "for",
]);

const clamp = (value, min = 0, max = 1) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const toFixedNumber = (value, digits = 3) => Number(clamp(value, -9999, 9999).toFixed(digits));

const tokenize = (value) =>
  normalizeText(value ?? "")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !TOKEN_STOP_WORDS.has(token));

const countHits = (text, terms) => {
  const haystack = normalizeText(text ?? "");
  return terms.reduce((count, term) => count + (haystack.includes(normalizeText(term)) ? 1 : 0), 0);
};

const getHostname = (url) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
};

const scoreDomain = (url) => {
  const host = getHostname(url);
  let score = 0;
  DOMAIN_BONUSES.forEach(([pattern, bonus]) => {
    if (pattern.test(host)) score += bonus;
  });
  DOMAIN_PENALTIES.forEach(([pattern, penalty]) => {
    if (pattern.test(host)) score -= penalty;
  });
  return score;
};

const buildSearchPlan = (book) => {
  const exact = book.author ? `"${book.title}" "${book.author}"` : `"${book.title}"`;
  const isbnPart = book.isbn ? ` "${book.isbn}"` : "";
  return [
    { stage: "identity", query: `${exact}${isbnPart}`, count: 3 },
    { stage: "chapters", query: `${exact} chapter summary`, count: 4 },
    { stage: "analysis", query: `${exact} themes characters analysis`, count: 4 },
  ].slice(0, MAX_SEARCH_STAGES);
};

const preRankSearchResult = (result, book, stage) => {
  const titleText = `${result.title ?? ""} ${result.description ?? ""} ${result.siteName ?? ""}`;
  const normalized = normalizeText(titleText);
  const normalizedTitle = normalizeText(book.title ?? "");
  const normalizedAuthor = normalizeText(book.author ?? "");
  const titleTokens = tokenize(book.title);
  const authorTokens = tokenize(book.author);
  const isbnDigits = String(book.isbn ?? "").replace(/\D/g, "");

  let score = scoreDomain(result.url);
  if (normalizedTitle && normalized.includes(normalizedTitle)) score += 8;
  if (normalizedAuthor && normalized.includes(normalizedAuthor)) score += 3.5;
  score += titleTokens.filter((token) => normalized.includes(token)).length * 1.8;
  score += authorTokens.filter((token) => normalized.includes(token)).length * 1.1;
  if (isbnDigits && titleText.replace(/\D/g, "").includes(isbnDigits)) score += 5;
  if (stage === "chapters" && /chapter|capitulo|capitulo/i.test(titleText)) score += 2.5;
  if (stage === "analysis" && /analysis|themes|characters|analise|temas|personagens/i.test(titleText)) score += 2;
  if (countHits(titleText, PROMO_TERMS) >= 2) score -= 4;
  if (countHits(titleText, CATALOG_TERMS) >= 1) score -= 3;

  return score;
};

const getMaxPlausibleChapterNumber = (book) => {
  const totalPages = Number(book.totalPages ?? book.total_pages ?? 0);
  return Math.max(40, Math.min(140, totalPages ? Math.ceil(totalPages / 4) : 80));
};

const summarizeEvidenceText = (text, chapterSections) => {
  if (chapterSections.length) {
    return chapterSections
      .slice(0, 8)
      .map((section) =>
        [`chapter ${section.chapterNumber ?? "?"}`, section.chapterTitle ? `title: ${section.chapterTitle}` : "", section.snippet]
          .filter(Boolean)
          .join(" | "),
      )
      .join("\n")
      .slice(0, MAX_EVIDENCE_CHARS);
  }

  return splitSentences(text, 10).join(" ").slice(0, MAX_EVIDENCE_CHARS);
};

const classifySource = ({ plausibleSections, chapterSignal, summarySignal, analysisSignal, promoPenalty, catalogPenalty }) => {
  if (promoPenalty >= 5 || catalogPenalty >= 3.5) return "catalog";
  if (plausibleSections.length >= 2 || chapterSignal >= 4.5) return "chapter_guide";
  if (analysisSignal >= 2.5 || summarySignal >= 2.5) return "overview";
  return "weak";
};

const analyzeSource = async ({ result, stage, book, usedHashes, existingContentText }) => {
  const contentText =
    existingContentText?.slice(0, 22000) ??
    (await downloadAndSanitizePage(result.url, { maxChars: 22000, minChars: 900 }));
  if (!contentText) {
    return null;
  }

  const contentHash = await sha256Hex(contentText);
  if (usedHashes.has(contentHash)) {
    return null;
  }
  usedHashes.add(contentHash);

  const metaText = `${result.title ?? ""} ${result.description ?? ""} ${result.siteName ?? ""} ${contentText}`;
  const normalized = normalizeText(metaText);
  const normalizedTitle = normalizeText(book.title ?? "");
  const normalizedAuthor = normalizeText(book.author ?? "");
  const titleTokens = tokenize(book.title);
  const authorTokens = tokenize(book.author);
  const isbnDigits = String(book.isbn ?? "").replace(/\D/g, "");
  const chapterSections = extractChapterSections(contentText, {
    url: result.url,
    siteName: result.siteName ?? undefined,
  });
  const maxChapterNumber = getMaxPlausibleChapterNumber(book);
  const plausibleSections = chapterSections.filter(
    (section) => !section.chapterNumber || (section.chapterNumber >= 1 && section.chapterNumber <= maxChapterNumber),
  );
  const uniqueChapterCount = new Set(plausibleSections.map((section) => section.chapterNumber).filter(Boolean)).size;
  const summarySignal = Math.min(3, countHits(metaText, SUMMARY_TERMS) * 0.9);
  const analysisSignal = Math.min(3.5, countHits(metaText, ANALYSIS_TERMS) * 0.9);
  const promoPenalty = Math.min(8, countHits(metaText, PROMO_TERMS) * 1.4);
  const catalogPenalty = Math.min(6, countHits(metaText, CATALOG_TERMS) * 1.6);
  const characterSignal = Math.min(2.2, extractCharacters(contentText, 8).length * 0.35);
  const sentenceSignal = Math.min(1.8, splitSentences(contentText, 12).length * 0.12);
  const titleCoverage = titleTokens.length
    ? titleTokens.filter((token) => normalized.includes(token)).length / titleTokens.length
    : 0;
  const authorCoverage = authorTokens.length
    ? authorTokens.filter((token) => normalized.includes(token)).length / authorTokens.length
    : 0;
  const identityScore =
    (normalizedTitle && normalized.includes(normalizedTitle) ? 10 : titleCoverage * 6) +
    (normalizedAuthor && normalized.includes(normalizedAuthor) ? 4 : authorCoverage * 2.2) +
    (isbnDigits && metaText.replace(/\D/g, "").includes(isbnDigits) ? 6 : 0);
  const domainScore = scoreDomain(result.url);
  const chapterSignal = Math.min(9, plausibleSections.length * 1.15 + uniqueChapterCount * 0.9);
  const intentBoost = stage === "chapters" ? 1.5 : stage === "analysis" ? 1.1 : 0.7;
  const classification = classifySource({
    plausibleSections,
    chapterSignal,
    summarySignal,
    analysisSignal,
    promoPenalty,
    catalogPenalty,
  });
  const finalScore =
    identityScore +
    domainScore +
    chapterSignal +
    summarySignal +
    analysisSignal +
    characterSignal +
    sentenceSignal +
    intentBoost -
    promoPenalty -
    catalogPenalty;
  const accepted =
    identityScore >= MIN_IDENTITY_SCORE &&
    finalScore >= MIN_SOURCE_SCORE &&
    classification !== "catalog" &&
    classification !== "weak";

  return {
    url: result.url,
    title: result.title ?? "",
    site_name: result.siteName ?? "",
    content_text: contentText,
    content_hash: contentHash,
    is_valid: accepted,
    diagnostics: {
      stage,
      classification,
      identity_score: toFixedNumber(identityScore),
      domain_score: toFixedNumber(domainScore),
      chapter_signal: toFixedNumber(chapterSignal),
      summary_signal: toFixedNumber(summarySignal),
      analysis_signal: toFixedNumber(analysisSignal),
      promo_penalty: toFixedNumber(promoPenalty),
      catalog_penalty: toFixedNumber(catalogPenalty),
      final_score: toFixedNumber(finalScore),
      plausible_chapter_count: plausibleSections.length,
      unique_chapter_count: uniqueChapterCount,
    },
    chapter_sections: plausibleSections,
    evidence_excerpt: summarizeEvidenceText(contentText, plausibleSections),
    keywords: extractKeywords(contentText, 10),
    characters: extractCharacters(contentText, 8),
  };
};

const dedupeByUrl = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
};

const hasEnoughEvidence = (curatedSources) => {
  const chapterSources = curatedSources.filter((source) => source.diagnostics.classification === "chapter_guide");
  const totalPlausibleSections = curatedSources.reduce(
    (sum, source) => sum + (source.diagnostics.plausible_chapter_count ?? 0),
    0,
  );
  const totalScore = curatedSources.reduce((sum, source) => sum + (source.diagnostics.final_score ?? 0), 0);
  return (
    totalPlausibleSections >= 6 ||
    (chapterSources.length >= 2 && totalPlausibleSections >= 3) ||
    totalScore >= 40
  );
};

const seedExistingSources = async (existingSources, book) => {
  const usedHashes = new Set();
  const seeded = [];

  for (const source of existingSources ?? []) {
    if (!source?.content_text) continue;
    const candidate = await analyzeSource(
      {
        result: {
          url: source.url,
          title: source.title,
          description: "",
          siteName: source.site_name,
        },
        stage: "seed",
        book,
        usedHashes,
        existingContentText: source.content_text,
      },
    );
    if (candidate?.is_valid) {
      seeded.push(candidate);
    }
  }

  return { usedHashes, seeded };
};

const downloadLayeredSources = async ({ book, existingSources }) => {
  const diagnostics = {
    stages: [],
    rejected_results: [],
    reused_sources: 0,
    downloads: 0,
  };
  const { usedHashes, seeded } = await seedExistingSources(existingSources, book);
  const curated = [...seeded];
  diagnostics.reused_sources = seeded.length;
  const seenUrls = new Set(curated.map((source) => source.url));
  const searchPlan = buildSearchPlan(book);

  for (const plan of searchPlan) {
    if (curated.length >= MAX_CURATED_SOURCES || diagnostics.downloads >= MAX_DOWNLOADS || hasEnoughEvidence(curated)) {
      break;
    }

    const rawResults = await braveSearch(plan.query, Math.min(plan.count, MAX_RESULTS_PER_STAGE));
    const rankedResults = dedupeByUrl(rawResults)
      .map((result) => ({
        ...result,
        meta_score: preRankSearchResult(result, book, plan.stage),
      }))
      .sort((a, b) => b.meta_score - a.meta_score)
      .slice(0, MAX_RESULTS_PER_STAGE);

    diagnostics.stages.push({
      stage: plan.stage,
      query: plan.query,
      candidates: rankedResults.length,
    });

    for (const result of rankedResults) {
      if (curated.length >= MAX_CURATED_SOURCES || diagnostics.downloads >= MAX_DOWNLOADS) break;
      if (seenUrls.has(result.url)) continue;
      seenUrls.add(result.url);
      diagnostics.downloads += 1;

      const analyzed = await analyzeSource({ result, stage: plan.stage, book, usedHashes });
      if (!analyzed) continue;

      if (analyzed.is_valid) {
        curated.push(analyzed);
      } else {
        diagnostics.rejected_results.push({
          url: analyzed.url,
          stage: plan.stage,
          score: analyzed.diagnostics.final_score,
          classification: analyzed.diagnostics.classification,
        });
      }
    }
  }

  const curatedSorted = curated
    .sort((a, b) => b.diagnostics.final_score - a.diagnostics.final_score)
    .slice(0, MAX_CURATED_SOURCES);

  return { curatedSources: curatedSorted, diagnostics };
};

const buildEvidenceBundle = (book, curatedSources) => {
  const sources = curatedSources.map((source, index) => ({
    ref: `s${index + 1}`,
    url: source.url,
    title: source.title,
    site_name: source.site_name,
    classification: source.diagnostics.classification,
    score: source.diagnostics.final_score,
    plausible_chapter_count: source.diagnostics.plausible_chapter_count,
    keywords: source.keywords.slice(0, 8),
    characters: source.characters.slice(0, 6),
    evidence_excerpt: source.evidence_excerpt,
    chapter_sections: source.chapter_sections.slice(0, 10).map((section) => ({
      chapter_number: section.chapterNumber ?? null,
      chapter_title: section.chapterTitle ?? null,
      snippet: section.snippet,
    })),
  }));

  return {
    book: {
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? null,
      total_pages: book.totalPages ?? book.total_pages ?? null,
      max_plausible_chapter_number: getMaxPlausibleChapterNumber(book),
    },
    research_summary: {
      source_count: sources.length,
      total_plausible_sections: curatedSources.reduce(
        (sum, source) => sum + (source.diagnostics.plausible_chapter_count ?? 0),
        0,
      ),
      average_source_score: toFixedNumber(
        curatedSources.reduce((sum, source) => sum + (source.diagnostics.final_score ?? 0), 0) /
          Math.max(1, curatedSources.length),
      ),
    },
    sources,
  };
};

const buildStructuringPrompt = (bundle) => `
You are structuring trusted book knowledge.

Use ONLY the evidence bundle below.
Do not invent chapter information.
Reject promotional or mismatched evidence.
Prefer fewer accurate chapters over many speculative ones.

Return strict JSON with this shape:
{
  "book_match_confidence": 0.0,
  "coverage_level": "alto|medio|baixo",
  "overall_summary": "string",
  "chapters": [
    {
      "chapter_number": 1,
      "title": "string",
      "summary": "string",
      "themes": ["string"],
      "keywords": ["string"],
      "characters": ["string"],
      "events": [{ "event_description": "string", "importance_score": 0.0 }],
      "analysis_text": "string",
      "source_refs": ["s1", "s2"]
    }
  ],
  "rejected_source_refs": ["s3"],
  "notes": "string"
}

Rules:
- only include a chapter if the evidence supports it
- do not create chapter numbers above ${bundle.book.max_plausible_chapter_number}
- if the bundle only supports a general overview, return at most 1 chapter and set coverage_level to "baixo"
- if the evidence does not clearly match the target book, set book_match_confidence below 0.68 and return an empty chapters array

Evidence bundle:
${JSON.stringify(bundle, null, 2)}
`;

const normalizeStringArray = (value, fallback = []) => {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 10);
};

const normalizeEvents = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item) return null;
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (!trimmed) return null;
        return {
          event_description: trimmed,
          importance_score: toFixedNumber(0.8 - index * 0.1),
        };
      }
      const description = String(item.event_description ?? "").trim();
      if (!description) return null;
      return {
        event_description: description,
        importance_score: toFixedNumber(clamp(Number(item.importance_score ?? 0.65))),
      };
    })
    .filter(Boolean)
    .slice(0, 4);
};

const mergeHeuristicChapters = (curatedSources, book) => {
  const grouped = new Map();
  const maxChapterNumber = getMaxPlausibleChapterNumber(book);

  curatedSources.forEach((source) => {
    source.chapter_sections.forEach((section) => {
      if (section.chapterNumber && section.chapterNumber > maxChapterNumber) return;
      const key = `${section.chapterNumber ?? "x"}:${normalizeText(section.chapterTitle ?? "")}`;
      const entry = grouped.get(key) ?? {
        chapter_number: section.chapterNumber ?? null,
        title: section.chapterTitle?.trim() || `Chapter ${section.chapterNumber ?? "?"}`,
        snippets: [],
        supporting_sources: [],
      };
      if (!entry.snippets.includes(section.snippet)) {
        entry.snippets.push(section.snippet);
      }
      if (!entry.supporting_sources.find((item) => item.url === source.url)) {
        entry.supporting_sources.push({
          url: source.url,
          site_name: source.site_name,
          score: source.diagnostics.final_score,
        });
      }
      grouped.set(key, entry);
    });
  });

  return [...grouped.values()]
    .map((entry) => {
      const joinedText = entry.snippets.join(" ");
      const summary = splitSentences(joinedText, 5).join(" ").slice(0, 1300);
      if (summary.length < 100) return null;
      const firstSource = [...entry.supporting_sources].sort((a, b) => b.score - a.score)[0];
      return {
        chapter_number: entry.chapter_number,
        title: entry.title,
        summary,
        themes: extractKeywords(joinedText, 5),
        keywords: extractKeywords(joinedText, 8),
        characters: extractCharacters(joinedText, 6),
        events: splitSentences(joinedText, 3).map((sentence, index) => ({
          event_description: sentence,
          importance_score: toFixedNumber(0.82 - index * 0.12),
        })),
        analyses: [
          {
            analysis_text: summary.slice(0, 900),
            source_url: firstSource?.url ?? null,
            source_name: firstSource?.site_name ?? null,
            confidence_score: toFixedNumber(0.62),
          },
        ],
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.chapter_number ?? Number.MAX_SAFE_INTEGER) - (b.chapter_number ?? Number.MAX_SAFE_INTEGER));
};

const normalizeStructuredChapters = ({ structured, bundle, curatedSources, book }) => {
  const sourceMap = new Map(bundle.sources.map((source) => [source.ref, source]));
  const maxChapterNumber = getMaxPlausibleChapterNumber(book);
  const bookMatchConfidence = clamp(Number(structured?.book_match_confidence ?? 0));
  const rejectedSourceRefs = new Set(normalizeStringArray(structured?.rejected_source_refs, []));
  const modelChapters = Array.isArray(structured?.chapters) ? structured.chapters : [];

  const normalizedChapters = modelChapters
    .map((chapter) => {
      const chapterNumber = Number.isFinite(Number(chapter.chapter_number))
        ? Number(chapter.chapter_number)
        : null;
      if (chapterNumber && (chapterNumber < 1 || chapterNumber > maxChapterNumber)) return null;

      const title = String(chapter.title ?? "").trim() || (chapterNumber ? `Chapter ${chapterNumber}` : "Resumo geral");
      const summary = String(chapter.summary ?? "").trim().slice(0, 1500);
      if (summary.length < 90) return null;

      const sourceRefs = normalizeStringArray(chapter.source_refs, []).filter(
        (ref) => sourceMap.has(ref) && !rejectedSourceRefs.has(ref),
      );
      const primarySource = sourceMap.get(sourceRefs[0]) ?? bundle.sources[0] ?? null;
      const analysisText = String(chapter.analysis_text ?? "").trim().slice(0, 1000);

      return {
        chapter_number: chapterNumber,
        title,
        summary,
        themes: normalizeStringArray(chapter.themes, extractKeywords(summary, 5)).slice(0, 5),
        keywords: normalizeStringArray(chapter.keywords, extractKeywords(summary, 8)).slice(0, 8),
        characters: normalizeStringArray(chapter.characters, extractCharacters(summary, 6)).slice(0, 6),
        events: normalizeEvents(chapter.events),
        analyses: analysisText
          ? [
              {
                analysis_text: analysisText,
                source_url: primarySource?.url ?? null,
                source_name: primarySource?.site_name ?? null,
                confidence_score: toFixedNumber(Math.max(bookMatchConfidence, 0.62)),
              },
            ]
          : [],
      };
    })
    .filter(Boolean)
    .filter((chapter, index, array) => {
      const duplicateIndex = array.findIndex(
        (item) =>
          item.chapter_number === chapter.chapter_number &&
          normalizeText(item.title) === normalizeText(chapter.title),
      );
      return duplicateIndex === index;
    });

  const heuristicFallback = mergeHeuristicChapters(
    curatedSources.filter((source) => !rejectedSourceRefs.has(source.ref)),
    book,
  );

  const chapters = normalizedChapters.length ? normalizedChapters : heuristicFallback;
  let coverageLevel = String(structured?.coverage_level ?? "").trim().toLowerCase();
  if (!["alto", "medio", "baixo"].includes(coverageLevel)) {
    coverageLevel = chapters.length >= 8 ? "alto" : chapters.length >= 3 ? "medio" : "baixo";
  }

  if (!chapters.length) {
    const overviewSummary = String(structured?.overall_summary ?? "").trim();
    if (
      overviewSummary.length >= 140 &&
      bookMatchConfidence >= 0.82 &&
      bundle.sources.length >= 2 &&
      bundle.research_summary.average_source_score >= 14
    ) {
      return {
        chapters: [
          {
            chapter_number: null,
            title: "Resumo geral",
            summary: overviewSummary.slice(0, 1500),
            themes: extractKeywords(overviewSummary, 5),
            keywords: extractKeywords(overviewSummary, 8),
            characters: extractCharacters(overviewSummary, 6),
            events: normalizeEvents(splitSentences(overviewSummary, 3)),
            analyses: [],
          },
        ],
        coverageLevel: "baixo",
        bookMatchConfidence,
      };
    }
  }

  return {
    chapters,
    coverageLevel,
    bookMatchConfidence,
  };
};

export const ingestBookResearch = async ({ book, existingSources = [] }) => {
  const { curatedSources, diagnostics } = await downloadLayeredSources({ book, existingSources });

  if (!curatedSources.length) {
    return {
      success: false,
      code: "no_curated_sources",
      error: "Nao foi possivel validar fontes confiaveis para esse livro.",
      diagnostics,
    };
  }

  const evidenceBundle = buildEvidenceBundle(book, curatedSources);
  let structured = null;
  let structuringMode = "gemini";

  try {
    structured = await callGeminiJson(buildStructuringPrompt(evidenceBundle), {
      temperature: 0.1,
      maxOutputTokens: 2600,
    });
  } catch (error) {
    structuringMode = "heuristic";
    structured = {
      book_match_confidence: 0.74,
      coverage_level: evidenceBundle.research_summary.total_plausible_sections >= 6 ? "medio" : "baixo",
      chapters: [],
      rejected_source_refs: [],
      notes: error instanceof Error ? error.message.slice(0, 200) : "structuring_failed",
    };
  }

  const sourcesWithRefs = curatedSources.map((source, index) => ({ ...source, ref: `s${index + 1}` }));
  const normalized = normalizeStructuredChapters({
    structured,
    bundle: evidenceBundle,
    curatedSources: sourcesWithRefs,
    book,
  });

  if (normalized.bookMatchConfidence < MIN_BOOK_MATCH_CONFIDENCE || !normalized.chapters.length) {
    return {
      success: false,
      code: normalized.bookMatchConfidence < MIN_BOOK_MATCH_CONFIDENCE ? "book_match_low_confidence" : "chapter_coverage_low",
      error: "As fontes encontradas nao sustentam uma base confiavel para esse livro.",
      diagnostics: {
        ...diagnostics,
        book_match_confidence: toFixedNumber(normalized.bookMatchConfidence),
        structuring_mode: structuringMode,
      },
      curatedSources,
    };
  }

  return {
    success: true,
    chapters: normalized.chapters,
    coverageLevel: normalized.coverageLevel,
    curatedSources,
    diagnostics: {
      ...diagnostics,
      book_match_confidence: toFixedNumber(normalized.bookMatchConfidence),
      structuring_mode: structuringMode,
      source_count: curatedSources.length,
      total_plausible_sections: evidenceBundle.research_summary.total_plausible_sections,
    },
  };
};

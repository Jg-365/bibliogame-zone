import fs from "node:fs/promises";
import path from "node:path";

const packetCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 15;
const CACHE_DIR = path.resolve(process.cwd(), ".cache", "book-packets");
export const PACKET_VERSION = 3;

const ensureCacheDir = async () => {
  await fs.mkdir(CACHE_DIR, { recursive: true });
};

const getPacketPath = (bookId) => path.join(CACHE_DIR, `${bookId}.json`);

const normalizeArray = (value, limit = 6) => {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean).map(String).slice(0, limit);
};

const compactChapter = (chapter, events = [], analyses = []) => ({
  id: chapter.id,
  n: chapter.chapter_number,
  t: chapter.title,
  s: chapter.summary,
  k: normalizeArray(chapter.keywords, 8),
  c: normalizeArray(chapter.characters, 6),
  e: events.map((event) => event.event_description).filter(Boolean).slice(0, 4),
  a: analyses.map((analysis) => analysis.analysis_text).filter(Boolean).slice(0, 2),
});

export const buildKnowledgePacketFromRows = ({ book, chapters, events, analyses }) => {
  const compactChapters = chapters.map((chapter) => {
    const chapterEvents = events.filter((event) => event.chapter_id === chapter.id);
    const chapterAnalyses = analyses.filter((analysis) => analysis.chapter_id === chapter.id);
    return compactChapter(chapter, chapterEvents, chapterAnalyses);
  });

  return {
    book: {
      id: book.id,
      title: book.title,
      author: book.author,
      total_pages: book.total_pages ?? null,
      coverage: compactChapters.length >= 8 ? "alto" : compactChapters.length >= 3 ? "medio" : "baixo",
    },
    chapters: compactChapters,
    meta: {
      packet_version: PACKET_VERSION,
      chapter_count: compactChapters.length,
      updated_at: new Date().toISOString(),
    },
  };
};

export const persistKnowledgePacket = async (bookId, packet) => {
  await ensureCacheDir();
  await fs.writeFile(getPacketPath(bookId), JSON.stringify(packet), "utf8");
  packetCache.set(bookId, {
    packet,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

export const invalidateKnowledgePacket = async (bookId) => {
  packetCache.delete(bookId);
  try {
    await fs.unlink(getPacketPath(bookId));
  } catch (_error) {
    // ignore cache misses
  }
};

export const loadKnowledgePacket = async (bookId) => {
  const memoryHit = packetCache.get(bookId);
  if (memoryHit && memoryHit.expiresAt > Date.now()) {
    return memoryHit.packet;
  }

  try {
    const raw = await fs.readFile(getPacketPath(bookId), "utf8");
    const packet = JSON.parse(raw);
    packetCache.set(bookId, {
      packet,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return packet?.meta?.packet_version === PACKET_VERSION ? packet : null;
  } catch (_error) {
    return null;
  }
};

export const selectRelevantPacketChapters = ({ packet, currentPage, currentPosition, limit = 3, question }) => {
  const normalizedQuestion = `${question ?? ""} ${currentPosition ?? ""}`.toLowerCase();
  const chapters = packet?.chapters ?? [];
  if (!chapters.length) return [];

  const approximateChapterNumber =
    currentPage && packet.book?.total_pages
      ? Math.min(chapters.length, Math.max(1, Math.ceil((currentPage / packet.book.total_pages) * chapters.length)))
      : null;

  return [...chapters]
    .map((chapter) => {
      let score = 0;
      if (approximateChapterNumber && chapter.n === approximateChapterNumber) score += 3;
      if (approximateChapterNumber && chapter.n && Math.abs(chapter.n - approximateChapterNumber) === 1) score += 1;
      if (normalizedQuestion && chapter.t?.toLowerCase().includes(normalizedQuestion)) score += 2;
      if (normalizedQuestion && chapter.s?.toLowerCase().includes(normalizedQuestion)) score += 1.5;
      if (chapter.k.some((keyword) => normalizedQuestion.includes(String(keyword).toLowerCase()))) score += 1.2;
      if (chapter.c.some((character) => normalizedQuestion.includes(String(character).toLowerCase()))) score += 1.2;
      return { ...chapter, _score: score };
    })
    .sort((a, b) => b._score - a._score || (a.n ?? Number.MAX_SAFE_INTEGER) - (b.n ?? Number.MAX_SAFE_INTEGER))
    .slice(0, limit);
};

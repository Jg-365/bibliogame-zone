import type { ReadingStats } from "@/shared/types";

// Level thresholds - Sistema baseado em múltiplos critérios
export const levelThresholds = {
  Iniciante: { points: 0, books: 0, streak: 0, pages: 0 },
  Explorador: {
    points: 100,
    books: 1,
    streak: 3,
    pages: 100,
  },
  Aventureiro: {
    points: 300,
    books: 3,
    streak: 7,
    pages: 500,
  },
  Mestre: {
    points: 750,
    books: 7,
    streak: 15,
    pages: 1500,
  },
  Lenda: {
    points: 1500,
    books: 15,
    streak: 30,
    pages: 3000,
  },
  "Grande Mestre": {
    points: 3000,
    books: 25,
    streak: 50,
    pages: 6000,
  },
  Imortal: {
    points: 5000,
    books: 50,
    streak: 100,
    pages: 12000,
  },
} as const;

export type LevelName = keyof typeof levelThresholds;

export interface LevelRequirement {
  points: number;
  books: number;
  streak: number;
  pages: number;
}

export interface UserProgress {
  points: number;
  books_completed: number;
  longest_streak: number;
  total_pages_read: number;
}

/**
 * Verifica se o usuário pode subir de nível
 */
export const canLevelUp = (userStats: UserProgress, currentLevel: string): boolean => {
  const nextLevel = getNextLevel(currentLevel);
  if (nextLevel === currentLevel) return false;

  const requirements = levelThresholds[nextLevel as LevelName];
  if (!requirements) return false;

  return (
    userStats.points >= requirements.points &&
    userStats.books_completed >= requirements.books &&
    userStats.longest_streak >= requirements.streak &&
    userStats.total_pages_read >= requirements.pages
  );
};

/**
 * Determina o nível atual baseado nas estatísticas
 */
export const determineCurrentLevel = (userStats: UserProgress): LevelName => {
  const levels = Object.keys(levelThresholds) as LevelName[];
  let currentLevel: LevelName = "Iniciante";

  for (let i = levels.length - 1; i >= 0; i--) {
    const level = levels[i];
    const requirements = levelThresholds[level];

    if (
      userStats.points >= requirements.points &&
      userStats.books_completed >= requirements.books &&
      userStats.longest_streak >= requirements.streak &&
      userStats.total_pages_read >= requirements.pages
    ) {
      currentLevel = level;
      break;
    }
  }

  return currentLevel;
};

/**
 * Obtém o próximo nível
 */
export const getNextLevel = (currentLevel: string): LevelName => {
  const levels = Object.keys(levelThresholds) as LevelName[];
  const currentIndex = levels.indexOf(currentLevel as LevelName);

  if (currentIndex === -1 || currentIndex >= levels.length - 1) {
    return currentLevel as LevelName;
  }

  return levels[currentIndex + 1];
};

/**
 * Obtém os requisitos para o próximo nível
 */
export const getNextLevelThreshold = (currentLevel: string): LevelRequirement | null => {
  const nextLevel = getNextLevel(currentLevel);
  return nextLevel !== currentLevel ? levelThresholds[nextLevel] : null;
};

/**
 * Obtém os requisitos para um nível específico
 */
export const getLevelRequirements = (level: string): LevelRequirement | null => {
  return levelThresholds[level as LevelName] || null;
};

/**
 * Obtém os requisitos do nível anterior
 */
export const getPreviousLevelThreshold = (currentLevel: string): LevelRequirement => {
  const levels = Object.keys(levelThresholds) as LevelName[];
  const currentIndex = levels.indexOf(currentLevel as LevelName);

  if (currentIndex <= 0) {
    return levelThresholds.Iniciante;
  }

  return levelThresholds[levels[currentIndex - 1]];
};

/**
 * Calcula o progresso até o próximo nível (0-100)
 */
export const calculateLevelProgress = (userStats: UserProgress, currentLevel: string): number => {
  const nextLevelReqs = getNextLevelThreshold(currentLevel);
  const currentLevelReqs = getPreviousLevelThreshold(currentLevel);

  if (!nextLevelReqs) return 100; // Já no nível máximo

  // Calcula progresso baseado na média dos critérios
  const progressMetrics = [
    Math.min(
      (userStats.points - currentLevelReqs.points) /
        (nextLevelReqs.points - currentLevelReqs.points),
      1
    ),
    Math.min(
      (userStats.books_completed - currentLevelReqs.books) /
        (nextLevelReqs.books - currentLevelReqs.books),
      1
    ),
    Math.min(
      (userStats.longest_streak - currentLevelReqs.streak) /
        (nextLevelReqs.streak - currentLevelReqs.streak),
      1
    ),
    Math.min(
      (userStats.total_pages_read - currentLevelReqs.pages) /
        (nextLevelReqs.pages - currentLevelReqs.pages),
      1
    ),
  ];

  // Retorna a média do progresso
  const averageProgress =
    progressMetrics.reduce((sum, progress) => sum + progress, 0) / progressMetrics.length;
  return Math.round(averageProgress * 100);
};

/**
 * Obtém informações completas sobre o nível atual e progresso
 */
export const getLevelInfo = (userStats: UserProgress) => {
  const currentLevel = determineCurrentLevel(userStats);
  const nextLevel = getNextLevel(currentLevel);
  const canUpgrade = canLevelUp(userStats, currentLevel);
  const progress = calculateLevelProgress(userStats, currentLevel);
  const requirements = getLevelRequirements(currentLevel);
  const nextRequirements = getNextLevelThreshold(currentLevel);

  return {
    currentLevel,
    nextLevel,
    canUpgrade,
    progress,
    requirements,
    nextRequirements,
    isMaxLevel: currentLevel === "Imortal",
  };
};

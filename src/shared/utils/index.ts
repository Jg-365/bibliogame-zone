import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  ReadingStatus,
  AchievementRarity,
  ActivityType,
} from "@/shared/types";

// Export responsive utilities
export * from "./responsive";
export * from "./errorHandling";
export * from "./performance";

// Tailwind utility function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date utilities
export const formatDate = (date: string | Date): string => {
  const dateObj =
    typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
};

export const formatRelativeTime = (
  date: string | Date
): string => {
  const dateObj =
    typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - dateObj.getTime()) / 1000
  );

  if (diffInSeconds < 60) return "Agora";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d`;

  return formatDate(dateObj);
};

export const getDaysInMonth = (
  year: number,
  month: number
): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const isToday = (date: string | Date): boolean => {
  const dateObj =
    typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
};

// Number utilities
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

export const calculatePercentage = (
  current: number,
  total: number
): number => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

export const clamp = (
  value: number,
  min: number,
  max: number
): number => {
  return Math.min(Math.max(value, min), max);
};

// String utilities
export const truncateText = (
  text: string,
  maxLength: number
): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export const capitalizeFirst = (text: string): string => {
  return (
    text.charAt(0).toUpperCase() +
    text.slice(1).toLowerCase()
  );
};

// Reading utilities
export const getStatusColor = (
  status: ReadingStatus
): string => {
  const colors = {
    "não lido": "bg-gray-100 text-gray-800",
    lendo: "bg-blue-100 text-blue-800",
    lido: "bg-green-100 text-green-800",
    abandonado: "bg-red-100 text-red-800",
  };
  return colors[status];
};

export const getStatusIcon = (
  status: ReadingStatus
): string => {
  const icons = {
    "não lido": "📚",
    lendo: "📖",
    lido: "✅",
    abandonado: "❌",
  };
  return icons[status];
};

export const calculateReadingProgress = (
  pagesRead: number,
  totalPages: number
): number => {
  return calculatePercentage(pagesRead, totalPages);
};

export const estimateReadingTime = (
  totalPages: number,
  pagesPerHour = 30
): number => {
  return Math.ceil(totalPages / pagesPerHour);
};

// Achievement utilities
export const getRarityColor = (
  rarity: AchievementRarity
): string => {
  const colors = {
    common: "text-gray-600 bg-gray-100",
    rare: "text-blue-600 bg-blue-100",
    epic: "text-purple-600 bg-purple-100",
    legendary: "text-yellow-600 bg-yellow-100",
  };
  return colors[rarity];
};

export const getRarityIcon = (
  rarity: AchievementRarity
): string => {
  const icons = {
    common: "🏅",
    rare: "🥈",
    epic: "🥇",
    legendary: "👑",
  };
  return icons[rarity];
};

// Activity utilities
export const getActivityMessage = (
  type: ActivityType,
  metadata?: Record<string, unknown>
): string => {
  const messages = {
    book_completed: `completou a leitura de "${
      metadata?.bookTitle || "um livro"
    }"`,
    book_added: `adicionou "${
      metadata?.bookTitle || "um livro"
    }" à sua biblioteca`,
    achievement_unlocked: `desbloqueou a conquista "${
      metadata?.achievementTitle || "uma conquista"
    }"`,
    review_posted: `avaliou "${
      metadata?.bookTitle || "um livro"
    }" com ${metadata?.rating || 0} estrelas`,
    reading_session: `leu ${
      metadata?.pagesRead || 0
    } páginas`,
    goal_reached: `alcançou a meta de ${
      metadata?.goalType || "leitura"
    }`,
  };
  return messages[type] || "realizou uma atividade";
};

export const getActivityIcon = (
  type: ActivityType
): string => {
  const icons = {
    book_completed: "✅",
    book_added: "📚",
    achievement_unlocked: "🏆",
    review_posted: "⭐",
    reading_session: "📖",
    goal_reached: "🎯",
  };
  return icons[type] || "📝";
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (
  password: string
): boolean => {
  return password.length >= 8;
};

export const isValidISBN = (isbn: string): boolean => {
  const cleaned = isbn.replace(/[-\s]/g, "");
  return /^(97[89])?\d{9}[\dX]$/.test(cleaned);
};

// Local Storage utilities
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(
        "Failed to save to localStorage:",
        error
      );
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(
        "Failed to remove from localStorage:",
        error
      );
    }
  },
};

// Error handling utilities
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Ocorreu um erro inesperado";
};

export const createError = (
  message: string,
  code?: string
): Error => {
  const error = new Error(message);
  if (code) (error as any).code = code;
  return error;
};

// Array utilities
export const groupBy = <T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const key = getKey(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(
  array: T[],
  getKey: (item: T) => string | number,
  direction: "asc" | "desc" = "asc"
): T[] => {
  return [...array].sort((a, b) => {
    const aKey = getKey(a);
    const bKey = getKey(b);

    if (aKey < bKey) return direction === "asc" ? -1 : 1;
    if (aKey > bKey) return direction === "asc" ? 1 : -1;
    return 0;
  });
};

export const uniqueBy = <T, K>(
  array: T[],
  getKey: (item: T) => K
): T[] => {
  const seen = new Set<K>();
  return array.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

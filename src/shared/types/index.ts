// Core Domain Types
export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  total_pages: number;
  pages_read: number;
  status: ReadingStatus;
  cover_url?: string;
  google_books_id?: string;
  date_added: string;
  date_completed?: string;
  created_at: string;
  updated_at: string;
  isbn?: string;
  description?: string;
  published_date?: string;
  genres?: string[];
  rating?: number;
  review?: string;
  is_favorite?: boolean;
  reading_started_at?: string;
}

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
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
    categories?: string[];
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    averageRating?: number;
    ratingsCount?: number;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  requirementType: string;
  requirementValue: number;
  unlocked?: boolean;
  unlockedAt?: string;
}

export interface Profile {
  id: string;
  userId: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  preferredGenres?: string[];
  points: number;
  level: string;
  booksCompleted: number;
  totalPagesRead: number;
  readingStreak: number;
  bestStreak: number;
  lastActivity: string;
  theme: Theme;
  notificationsEnabled: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  pagesRead: number;
  sessionDate: string;
  notes?: string;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  targetType: TargetType;
  targetValue: number;
  startDate: string;
  endDate: string;
  rewardPoints: number;
  createdBy?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: {
    id: string;
    username?: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

export interface LeaderboardEntry {
  id: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  points: number;
  booksCompleted: number;
  totalPagesRead: number;
  level: string;
}

export interface ReadingStats {
  booksCompleted: number;
  totalPagesRead: number;
  currentStreak: number;
  bestStreak: number;
  points: number;
  level: string;
  averageRating: number;
}

export interface CustomBookData {
  title: string;
  author: string;
  totalPages: number;
  coverImage?: File;
  description?: string;
  genres?: string[];
  publishedDate?: string;
  isbn?: string;
}

// Enum Types
export type ReadingStatus =
  | "não lido"
  | "lendo"
  | "lido"
  | "abandonado"
  | "want-to-read" // Legacy compatibility
  | "reading" // Legacy compatibility
  | "completed"; // Legacy compatibility
export type AchievementRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary";
export type Theme = "light" | "dark";
export type ChallengeType =
  | "individual"
  | "community"
  | "club";
export type TargetType = "books" | "pages" | "streak";
export type ActivityType =
  | "book_completed"
  | "book_added"
  | "achievement_unlocked"
  | "review_posted"
  | "reading_session"
  | "goal_reached"
  | "book_started" // Legacy compatibility
  | "reading_progress" // Legacy compatibility
  | "challenge_completed" // Legacy compatibility
  | "review_added"; // Legacy compatibility

// Navigation Types
export type NavigationPage =
  | "dashboard"
  | "social"
  | "profile"
  | "achievements"
  | "challenges"
  | "clubs";

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form Types
export interface BookFormData {
  title: string;
  author: string;
  totalPages: number;
  currentPage?: number;
  status: ReadingStatus;
  rating?: number;
  review?: string;
  genres?: string[];
  coverUrl?: string;
  googleBooksId?: string;
}

export interface ProfileFormData {
  username?: string;
  fullName?: string;
  bio?: string;
  preferredGenres?: string[];
  isPrivate: boolean;
  theme: Theme;
  notificationsEnabled: boolean;
}

// Query Keys
export const QUERY_KEYS = {
  books: (userId: string) => ["books", userId],
  achievements: (userId: string) => [
    "achievements",
    userId,
  ],
  profile: (userId: string) => ["profile", userId],
  activity: (userId: string) => ["activity-feed", userId],
  stats: (userId: string) => ["reading-stats", userId],
  leaderboard: ["leaderboard"],
  challenges: ["challenges"],
  follows: (userId: string) => ["follows", userId],
  followers: (userId: string) => ["followers", userId],
  following: (userId: string) => ["following", userId],
} as const;

// Error Types
export interface AppError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface AsyncAction<T = void> {
  execute: (...args: unknown[]) => Promise<T>;
  isLoading: boolean;
  error?: string | null;
}

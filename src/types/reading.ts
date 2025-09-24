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
  // Additional fields from second migration
  isbn?: string;
  description?: string;
  published_date?: string;
  genres?: string[];
  rating?: number;
  review?: string;
  is_favorite?: boolean;
  reading_started_at?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  requirementType: string;
  requirementValue: number;
  unlocked?: boolean;
  unlockedAt?: string;
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
  theme: "light" | "dark";
  notificationsEnabled: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
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
  type: "individual" | "community" | "club";
  targetType: "books" | "pages" | "streak";
  targetValue: number;
  startDate: string;
  endDate: string;
  rewardPoints: number;
  createdBy?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  currentProgress: number;
  completed: boolean;
  completedAt?: string;
  joinedAt: string;
  challenge?: Challenge;
}

export interface BookClub {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  coverImage?: string;
  isPrivate: boolean;
  memberLimit?: number;
  createdAt: string;
}

export interface BookClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: "admin" | "moderator" | "member";
  joinedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  type:
    | "book_completed"
    | "book_started"
    | "reading_progress"
    | "achievement_unlocked"
    | "challenge_completed"
    | "review_added";
  data: Record<string, any>;
  isPublic: boolean;
  createdAt: string;
  user?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  profile?: {
    username?: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

export interface BookRecommendation {
  id: string;
  userId: string;
  recommendedBookData: Record<string, any>;
  score?: number;
  reason?: string;
  createdAt: string;
}

export interface BookComment {
  id: string;
  userId: string;
  bookId: string;
  comment: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
  likesCount?: number;
  userHasLiked?: boolean;
}

export interface CommentLike {
  id: string;
  userId: string;
  commentId: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  points: number;
  level: string;
  booksCompleted: number;
  totalPagesRead: number;
  readingStreak: number;
  rank: number;
}

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  points: number;
  level: string;
  booksCompleted: number;
  totalPagesRead: number;
  joinDate: Date;
}

export interface RankingUser {
  id: string;
  name: string;
  points: number;
  level: string;
  booksCompleted: number;
  rank: number;
}

export type ReadingStatus =
  | "want-to-read"
  | "reading"
  | "completed";

export type ActivityType =
  | "book_completed"
  | "book_started"
  | "achievement_unlocked"
  | "challenge_completed"
  | "review_added";

export type ChallengeType =
  | "individual"
  | "community"
  | "club";

export type ChallengeTargetType =
  | "books"
  | "pages"
  | "streak";

export type AchievementRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary";

export type UserRole = "admin" | "moderator" | "member";

export type Theme = "light" | "dark";

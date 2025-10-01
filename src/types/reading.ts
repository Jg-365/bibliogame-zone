// This file is deprecated. Please import from @/shared/types instead.
// This is kept for backward compatibility during migration.

// Re-export all types from shared/types
export * from "@/shared/types";

// Additional legacy types that were only in the old file
export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  currentProgress: number;
  completed: boolean;
  completedAt?: string;
  joinedAt: string;
  challenge?: import("@/shared/types").Challenge;
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

export interface BookRecommendation {
  id: string;
  userId: string;
  recommendedBookData: Record<string, unknown>;
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
  profile?: import("@/shared/types").Profile;
  likesCount?: number;
  userHasLiked?: boolean;
}

export interface CommentLike {
  id: string;
  userId: string;
  commentId: string;
  createdAt: string;
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

export type UserRole = "admin" | "moderator" | "member";
export type ChallengeTargetType =
  | "books"
  | "pages"
  | "streak";

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  pagesRead: number;
  status: "want-to-read" | "reading" | "completed";
  dateAdded: Date;
  dateCompleted?: Date;
  cover?: string;
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

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlocked: boolean;
  unlockedAt?: Date;
  requirement: {
    type: "books_read" | "pages_read" | "streak_days" | "genre_master";
    value: number;
  };
}

export interface RankingUser {
  id: string;
  name: string;
  points: number;
  level: string;
  booksCompleted: number;
  rank: number;
}
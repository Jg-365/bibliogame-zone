import { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useBooks } from "@/hooks/useBooks";
import { getLevelInfo } from "../utils/levelUtils";
import type { UserProgress } from "../utils/levelUtils";

export const useDashboard = () => {
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading } =
    useProfile();
  const { books, isLoading: booksLoading } = useBooks();

  const [selectedTab, setSelectedTab] =
    useState("overview");

  // Calculate user statistics
  const userStats: UserProgress = useMemo(() => {
    if (!profile) {
      return {
        points: 0,
        books_completed: 0,
        best_streak: 0,
        total_pages_read: 0,
      };
    }

    return {
      points: profile.points || 0,
      books_completed: profile.books_completed || 0,
      best_streak:
        profile.longest_streak ||
        profile.current_streak ||
        0,
      total_pages_read: profile.total_pages_read || 0,
    };
  }, [profile]);

  // Calculate level information
  const levelInfo = useMemo(() => {
    return getLevelInfo(userStats);
  }, [userStats]);

  // Filter books by status
  const booksByStatus = useMemo(() => {
    if (!books)
      return {
        reading: [],
        completed: [],
        wantToRead: [],
        abandoned: [],
      };

    return {
      reading: books.filter(
        (book) =>
          book.status === "lendo" ||
          book.status === "reading"
      ),
      completed: books.filter(
        (book) =>
          book.status === "lido" ||
          book.status === "completed"
      ),
      wantToRead: books.filter(
        (book) =>
          book.status === "não lido" ||
          book.status === "want-to-read"
      ),
      abandoned: books.filter(
        (book) => book.status === "abandonado"
      ),
    };
  }, [books]);

  // Calculate reading statistics
  const readingStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const completedThisYear =
      booksByStatus.completed.filter(
        (book) =>
          new Date(
            book.date_completed || book.updated_at
          ).getFullYear() === currentYear
      );

    return {
      totalBooks: books?.length || 0,
      completedBooks: booksByStatus.completed.length,
      completedThisYear: completedThisYear.length,
      currentlyReading: booksByStatus.reading.length,
      wantToRead: booksByStatus.wantToRead.length,
      averageRating: books?.length
        ? books
            .filter((book) => book.rating)
            .reduce(
              (sum, book) => sum + (book.rating || 0),
              0
            ) / books.filter((book) => book.rating).length
        : 0,
    };
  }, [books, booksByStatus]);

  // Loading state
  const isLoading = profileLoading || booksLoading;

  // Dashboard actions
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
  };

  return {
    // User data
    user,
    profile,
    books,

    // Calculated data
    userStats,
    levelInfo,
    booksByStatus,
    readingStats,

    // UI state
    selectedTab,
    isLoading,

    // Actions
    handleSignOut,
    handleTabChange,
  };
};

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useProfile } from "@/hooks/useProfile";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { isBookCompletedInYear } from "@/lib/readingProgress";
import { getLevelInfo, type UserProgress } from "../utils/levelUtils";

export const useDashboard = () => {
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { books, isLoading: booksLoading } = useBooks();
  const { sessions = [] } = useReadingSessions();
  const [selectedTab, setSelectedTab] = useState("overview");

  const userStats: UserProgress = useMemo(() => {
    if (!profile) {
      return {
        points: 0,
        books_completed: 0,
        longest_streak: 0,
        total_pages_read: 0,
      };
    }

    return {
      points: (profile as any).points || (profile as any).experience_points || 0,
      books_completed: (profile as any).books_completed || 0,
      longest_streak: (profile as any).longest_streak || 0,
      total_pages_read: (profile as any).total_pages_read || (profile as any).total_pages || 0,
    };
  }, [profile]);

  const levelInfo = useMemo(() => getLevelInfo(userStats), [userStats]);

  const booksByStatus = useMemo(() => {
    if (!books || !Array.isArray(books)) {
      return {
        reading: [],
        completed: [],
        wantToRead: [],
        abandoned: [],
      };
    }

    try {
      return {
        reading:
          books.filter((book) => book && (book.status === "lendo" || book.status === "reading")) ||
          [],
        completed:
          books.filter((book) => book && (book.status === "lido" || book.status === "completed")) ||
          [],
        wantToRead:
          books.filter(
            (book) => book && (book.status === "não lido" || book.status === "want-to-read"),
          ) || [],
        abandoned: books.filter((book) => book && book.status === "abandonado") || [],
      };
    } catch (error) {
      console.error("Error filtering books:", error);
      return {
        reading: [],
        completed: [],
        wantToRead: [],
        abandoned: [],
      };
    }
  }, [books]);

  const readingStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const completedThisYear = booksByStatus.completed.filter((book) =>
      isBookCompletedInYear(book, currentYear, sessions),
    );

    return {
      totalBooks: books?.length || 0,
      completedBooks: booksByStatus.completed.length,
      completedThisYear: completedThisYear.length,
      currentlyReading: booksByStatus.reading.length,
      wantToRead: booksByStatus.wantToRead.length,
      averageRating: books?.length
        ? books.filter((book) => book.rating).reduce((sum, book) => sum + (book.rating || 0), 0) /
          books.filter((book) => book.rating).length
        : 0,
    };
  }, [books, booksByStatus, sessions]);

  const isLoading = profileLoading || booksLoading;

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
    user,
    profile,
    books,
    userStats,
    levelInfo,
    booksByStatus,
    readingStats,
    selectedTab,
    isLoading,
    handleSignOut,
    handleTabChange,
  };
};

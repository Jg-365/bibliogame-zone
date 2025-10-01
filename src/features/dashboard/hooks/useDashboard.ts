import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useBooks } from "@/hooks/useBooks";
import { getLevelInfo } from "../utils/levelUtils";
import type { UserProgress } from "../utils/levelUtils";

export const useDashboard = () => {
  try {
    const { user, signOut } = useAuth();
    const { profile, isLoading: profileLoading } = useProfile();
    const { books, isLoading: booksLoading } = useBooks();

    const [selectedTab, setSelectedTab] = useState("overview");

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
        points: (profile as any).points || (profile as any).experience_points || 0,
        books_completed: (profile as any).books_completed || 0,
        best_streak:
          (profile as any).longest_streak ||
          (profile as any).best_streak ||
          (profile as any).current_streak ||
          0,
        total_pages_read: (profile as any).total_pages_read || (profile as any).total_pages || 0,
      };
    }, [profile]);

    // Calculate level information
    const levelInfo = useMemo(() => {
      return getLevelInfo(userStats);
    }, [userStats]);

    // Filter books by status
    const booksByStatus = useMemo(() => {
      if (!books || !Array.isArray(books))
        return {
          reading: [],
          completed: [],
          wantToRead: [],
          abandoned: [],
        };

      try {
        return {
          reading:
            books.filter(book => book && (book.status === "lendo" || book.status === "reading")) ||
            [],
          completed:
            books.filter(book => book && (book.status === "lido" || book.status === "completed")) ||
            [],
          wantToRead:
            books.filter(
              book => book && (book.status === "não lido" || book.status === "want-to-read")
            ) || [],
          abandoned: books.filter(book => book && book.status === "abandonado") || [],
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

    // Calculate reading statistics
    const readingStats = useMemo(() => {
      const currentYear = new Date().getFullYear();
      const completedThisYear = booksByStatus.completed.filter(
        book => new Date(book.date_completed || book.updated_at).getFullYear() === currentYear
      );

      return {
        totalBooks: books?.length || 0,
        completedBooks: booksByStatus.completed.length,
        completedThisYear: completedThisYear.length,
        currentlyReading: booksByStatus.reading.length,
        wantToRead: booksByStatus.wantToRead.length,
        averageRating: books?.length
          ? books.filter(book => book.rating).reduce((sum, book) => sum + (book.rating || 0), 0) /
            books.filter(book => book.rating).length
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
  } catch (error) {
    console.error("Error in useDashboard:", error);
    // Return safe defaults on error
    return {
      user: null,
      profile: null,
      books: [],
      userStats: {
        points: 0,
        books_completed: 0,
        best_streak: 0,
        total_pages_read: 0,
      },
      levelInfo: {
        currentLevel: "Iniciante" as const,
        nextLevel: "Explorador" as const,
        progress: 0,
        pointsForNext: 1000,
        totalPointsForNext: 1000,
        canUpgrade: false,
        isMaxLevel: false,
        requirements: {
          points: 0,
          books: 0,
          streak: 0,
          pages: 0,
        },
        nextRequirements: {
          points: 1000,
          books: 5,
          streak: 7,
          pages: 1000,
        },
      },
      booksByStatus: {
        reading: [],
        completed: [],
        wantToRead: [],
        abandoned: [],
      },
      readingStats: {
        totalBooks: 0,
        completedBooks: 0,
        completedThisYear: 0,
        currentlyReading: 0,
        wantToRead: 0,
        averageRating: 0,
      },
      selectedTab: "overview",
      isLoading: false,
      handleSignOut: async () => {},
      handleTabChange: () => {},
    };
  }
};

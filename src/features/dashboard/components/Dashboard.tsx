import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "./DashboardHeader";
import { LevelProgressCard } from "./LevelProgressCard";
import { ReadingStatsCards } from "./ReadingStatsCards";
import { useDashboard } from "../hooks/useDashboard";
import { useAccountGuard } from "@/hooks/useAccountGuard";
import { useResponsive } from "@/shared/utils/responsive";

// Import other existing components that will be part of dashboard tabs
import { BookSearch } from "@/components/BookSearch";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { Leaderboard } from "@/components/Leaderboard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { SocialSection } from "@/components/SocialSection";
import { MobileNavbar } from "@/components/MobileNavbar";
import { BookActionButtons } from "@/components/BookActionButtons";
import { BookLibrary } from "@/components/BookLibrary";

// Level calculation function
const calculateUserLevel = (pagesRead: number) => {
  if (pagesRead >= 10000) return "Mestre dos Livros";
  if (pagesRead >= 5000) return "Bibliófilo Experiente";
  if (pagesRead >= 2500) return "Bibliófilo";
  if (pagesRead >= 1000) return "Leitor Dedicado";
  if (pagesRead >= 500) return "Leitor Ativo";
  if (pagesRead >= 100) return "Explorador";
  return "Iniciante";
};

const getNextLevelInfo = (pagesRead: number) => {
  const levels = [
    { name: "Iniciante", pages: 0 },
    { name: "Explorador", pages: 100 },
    { name: "Leitor Ativo", pages: 500 },
    { name: "Leitor Dedicado", pages: 1000 },
    { name: "Bibliófilo", pages: 2500 },
    { name: "Bibliófilo Experiente", pages: 5000 },
    { name: "Mestre dos Livros", pages: 10000 },
  ];

  const currentLevelIndex = levels.findIndex(level => pagesRead < level.pages) - 1;
  const currentLevel = levels[Math.max(0, currentLevelIndex)];
  const nextLevel = levels[currentLevelIndex + 1];

  if (!nextLevel) {
    return {
      currentLevel: currentLevel.name,
      nextLevel: null,
      progress: 100,
      pagesNeeded: 0,
    };
  }

  const progress =
    ((pagesRead - currentLevel.pages) / (nextLevel.pages - currentLevel.pages)) * 100;

  return {
    currentLevel: currentLevel.name,
    nextLevel: nextLevel.name,
    progress: Math.min(progress, 100),
    pagesNeeded: nextLevel.pages - pagesRead,
  };
};

export const Dashboard: React.FC = () => {
  // Protect against deleted accounts
  useAccountGuard();

  const { isMobile } = useResponsive();

  const {
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
  } = useDashboard();

  const [showBookActions, setShowBookActions] = useState(false);

  // Calculate correct level based on pages read
  const correctLevelInfo = getNextLevelInfo(userStats?.total_pages_read || 0);

  const handleAddBook = () => {
    setShowBookActions(true);
  };

  const handleSearchBook = () => {
    // Navigate to book search
    handleTabChange("books");
    setShowBookActions(false);
  };

  const handleScanBook = () => {
    // Future implementation for barcode scan
    console.log("Scan book functionality");
    setShowBookActions(false);
  };

  const handleManualAdd = () => {
    // Future implementation for manual book entry
    console.log("Manual add book functionality");
    setShowBookActions(false);
  };

  const handleProfileClick = () => {
    handleTabChange("profile");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-8" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Carregando seu perfil...</h2>
          <p className="text-muted-foreground">
            Por favor, aguarde enquanto carregamos suas informações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header fixo no topo */}
      <DashboardHeader
        userFullName={profile.full_name}
        userAvatarUrl={profile.avatar_url}
        currentLevel={correctLevelInfo.currentLevel as any}
        points={userStats?.total_pages_read || 0}
        onSignOut={handleSignOut}
        onProfileClick={handleProfileClick}
      />

      {/* Conteúdo principal */}
      <div className={`container mx-auto p-4 space-y-6 ${isMobile ? "pb-20" : "pb-6"}`}>
        {/* Stats Overview - apenas no desktop */}
        {!isMobile && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ReadingStatsCards
                totalBooks={readingStats.totalBooks}
                completedBooks={readingStats.completedBooks}
                completedThisYear={readingStats.completedThisYear}
                currentlyReading={readingStats.currentlyReading}
                wantToRead={readingStats.wantToRead}
                averageRating={readingStats.averageRating}
                totalPages={userStats.total_pages_read}
                currentStreak={profile.current_streak || 0}
              />
            </div>

            <LevelProgressCard
              currentLevel={correctLevelInfo.currentLevel as any}
              nextLevel={correctLevelInfo.nextLevel as any}
              progress={correctLevelInfo.progress}
              canUpgrade={correctLevelInfo.pagesNeeded === 0}
              isMaxLevel={!correctLevelInfo.nextLevel}
              requirements={
                levelInfo?.requirements || {
                  points: 0,
                  books: 0,
                  streak: 0,
                  pages: userStats?.total_pages_read || 0,
                }
              }
              nextRequirements={
                levelInfo?.nextRequirements || {
                  points: correctLevelInfo.pagesNeeded,
                  books: 0,
                  streak: 0,
                  pages: correctLevelInfo.pagesNeeded,
                }
              }
              currentPoints={userStats?.total_pages_read || 0}
              currentBooks={userStats?.books_completed || 0}
              currentStreak={userStats?.best_streak || 0}
              currentPages={userStats?.total_pages_read || 0}
            />
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
          {/* Desktop Tabs */}
          {!isMobile && (
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="books">Biblioteca</TabsTrigger>
              <TabsTrigger value="achievements">Conquistas</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="w-full">
                <ActivityFeed />
              </div>
              <div className="w-full">
                <Leaderboard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="books" className="space-y-6">
            <BookSearch />
            <BookLibrary />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <AchievementsPanel />
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <SocialSection />
          </TabsContent>

          {/* Mobile Profile Tab - Statistics */}
          {isMobile && (
            <TabsContent value="profile" className="space-y-6">
              <div className="space-y-4">
                {/* User Stats for Mobile */}
                <ReadingStatsCards
                  totalBooks={readingStats.totalBooks}
                  completedBooks={readingStats.completedBooks}
                  completedThisYear={readingStats.completedThisYear}
                  currentlyReading={readingStats.currentlyReading}
                  wantToRead={readingStats.wantToRead}
                  averageRating={readingStats.averageRating}
                  totalPages={userStats.total_pages_read}
                  currentStreak={profile.current_streak || 0}
                />

                {/* Level Progress for Mobile */}
                <LevelProgressCard
                  currentLevel={correctLevelInfo.currentLevel as any}
                  nextLevel={correctLevelInfo.nextLevel as any}
                  progress={correctLevelInfo.progress}
                  canUpgrade={correctLevelInfo.pagesNeeded === 0}
                  isMaxLevel={!correctLevelInfo.nextLevel}
                  requirements={
                    levelInfo?.requirements || {
                      points: 0,
                      books: 0,
                      streak: 0,
                      pages: userStats?.total_pages_read || 0,
                    }
                  }
                  nextRequirements={
                    levelInfo?.nextRequirements || {
                      points: correctLevelInfo.pagesNeeded,
                      books: 0,
                      streak: 0,
                      pages: correctLevelInfo.pagesNeeded,
                    }
                  }
                  currentPoints={userStats?.total_pages_read || 0}
                  currentBooks={userStats?.books_completed || 0}
                  currentStreak={userStats?.best_streak || 0}
                  currentPages={userStats?.total_pages_read || 0}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavbar
          activeTab={selectedTab}
          onTabChange={handleTabChange}
          onAddBook={handleAddBook}
        />
      )}

      {/* Book Action Buttons (FAB for desktop, integrated in mobile navbar) */}
      {!isMobile && <BookActionButtons onAddBook={handleAddBook} />}
    </div>
  );
};

import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "./DashboardHeader";
import { LevelProgressCard } from "./LevelProgressCard";
import { ReadingStatsCards } from "./ReadingStatsCards";
import { useDashboard } from "../hooks/useDashboard";
import { useAccountGuard } from "@/hooks/useAccountGuard";

// Import other existing components that will be part of dashboard tabs
import { BookSearch } from "@/components/BookSearch";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { Leaderboard } from "@/components/Leaderboard";
import { ActivityFeed } from "@/components/ActivityFeed";

export const Dashboard: React.FC = () => {
  // Protect against deleted accounts
  useAccountGuard();

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
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Carregando seu perfil...
          </h2>
          <p className="text-muted-foreground">
            Por favor, aguarde enquanto carregamos suas
            informações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <DashboardHeader
        userFullName={profile.full_name}
        userAvatarUrl={profile.avatar_url}
        currentLevel={levelInfo.currentLevel}
        points={userStats.points}
        onSignOut={handleSignOut}
      />

      {/* Level Progress */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ReadingStatsCards
            totalBooks={readingStats.totalBooks}
            completedBooks={readingStats.completedBooks}
            completedThisYear={
              readingStats.completedThisYear
            }
            currentlyReading={readingStats.currentlyReading}
            wantToRead={readingStats.wantToRead}
            averageRating={readingStats.averageRating}
            totalPages={userStats.total_pages_read}
            currentStreak={profile.current_streak || 0}
          />
        </div>

        <LevelProgressCard
          currentLevel={levelInfo.currentLevel}
          nextLevel={levelInfo.nextLevel}
          progress={levelInfo.progress}
          canUpgrade={levelInfo.canUpgrade}
          isMaxLevel={levelInfo.isMaxLevel}
          requirements={levelInfo.requirements}
          nextRequirements={levelInfo.nextRequirements}
          currentPoints={userStats.points}
          currentBooks={userStats.books_completed}
          currentStreak={userStats.best_streak}
          currentPages={userStats.total_pages_read}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="books">
            Biblioteca
          </TabsTrigger>
          <TabsTrigger value="achievements">
            Conquistas
          </TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <ActivityFeed />
            <Leaderboard />
          </div>
        </TabsContent>

        <TabsContent value="books" className="space-y-6">
          <BookSearch />
          {/* Here we would add BookLibrary component showing user's books */}
        </TabsContent>

        <TabsContent
          value="achievements"
          className="space-y-6"
        >
          <AchievementsPanel />
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <ActivityFeed />
            <Leaderboard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

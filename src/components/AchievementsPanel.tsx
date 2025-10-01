import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Zap,
  BookOpen,
  Flame,
  Award,
} from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { useProfile } from "@/hooks/useProfile";
import type { AchievementRarity } from "@/types/reading";

const getAchievementIcon = (iconName: string) => {
  const icons = {
    Trophy,
    Medal,
    Crown,
    Star,
    Zap,
    BookOpen,
    Flame,
    Award,
  };

  const Icon =
    icons[iconName as keyof typeof icons] || Trophy;
  return <Icon className="h-5 w-5" />;
};

const getRarityColor = (rarity: AchievementRarity) => {
  const colors = {
    common: "bg-gray-100 text-gray-800 border-gray-200",
    rare: "bg-blue-100 text-blue-800 border-blue-200",
    epic: "bg-purple-100 text-purple-800 border-purple-200",
    legendary:
      "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  return colors[rarity] || colors.common;
};

const getRarityLabel = (rarity: AchievementRarity) => {
  const labels = {
    common: "Comum",
    rare: "Rara",
    epic: "Épica",
    legendary: "Lendária",
  };

  return labels[rarity] || labels.common;
};

const calculateProgress = (
  achievement: any,
  userStats: any
) => {
  if (achievement.unlocked) return 100;

  const { requirementType, requirementValue } = achievement;

  switch (requirementType) {
    case "books_read":
      return Math.min(
        100,
        (userStats.booksCompleted / requirementValue) * 100
      );
    case "pages_read":
      return Math.min(
        100,
        (userStats.totalPagesRead / requirementValue) * 100
      );
    case "streak_days":
      return Math.min(
        100,
        (userStats.readingStreak / requirementValue) * 100
      );
    default:
      return 0;
  }
};

export const AchievementsPanel = () => {
  const {
    achievements,
    isLoading,
    unlockedCount,
    totalCount,
  } = useAchievements();
  const { profile } = useProfile();

  const safeProfile = profile || {
    books_completed: 0,
    total_pages_read: 0,
    current_streak: 0,
  };

  const userStats = {
    booksCompleted: safeProfile.books_completed || 0,
    totalPagesRead: safeProfile.total_pages_read || 0,
    readingStreak: safeProfile.current_streak || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-2 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const unlockedAchievements = achievements.filter(
    (a) => a.unlocked
  );
  const lockedAchievements = achievements.filter(
    (a) => !a.unlocked
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Suas Conquistas
          </CardTitle>
          <CardDescription>
            Você desbloqueou {unlockedCount} de {totalCount}{" "}
            conquistas disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={(unlockedCount / totalCount) * 100}
            className="h-2"
          />
          <p className="text-sm text-gray-600 mt-2">
            {Math.round((unlockedCount / totalCount) * 100)}
            % completado
          </p>
        </CardContent>
      </Card>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Conquistas Desbloqueadas (
            {unlockedAchievements.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unlockedAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                className="border-green-200 bg-green-50"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg text-green-700">
                        {getAchievementIcon(
                          achievement.icon
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium text-green-900">
                          {achievement.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-green-700">
                          {achievement.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={`text-xs ${getRarityColor(
                        achievement.rarity as AchievementRarity
                      )}`}
                    >
                      {getRarityLabel(
                        achievement.rarity as AchievementRarity
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Concluído
                    </span>
                    {achievement.unlockedAt && (
                      <span className="text-xs text-green-600">
                        {new Date(
                          achievement.unlockedAt
                        ).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Próximas Conquistas ({lockedAchievements.length}
            )
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lockedAchievements.map((achievement) => {
              const progress = calculateProgress(
                achievement,
                userStats
              );

              return (
                <Card
                  key={achievement.id}
                  className="border-gray-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                          {getAchievementIcon(
                            achievement.icon
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {achievement.title}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {achievement.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        className={`text-xs ${getRarityColor(
                          achievement.rarity as AchievementRarity
                        )}`}
                      >
                        {getRarityLabel(
                          achievement.rarity as AchievementRarity
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <Progress
                      value={progress}
                      className="h-2"
                    />
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>
                        {Math.round(progress)}% concluído
                      </span>
                      <span>
                        {achievement.requirementType ===
                          "books_read" &&
                          `${userStats.booksCompleted}/${achievement.requirementValue} livros`}
                        {achievement.requirementType ===
                          "pages_read" &&
                          `${userStats.totalPagesRead}/${achievement.requirementValue} páginas`}
                        {achievement.requirementType ===
                          "streak_days" &&
                          `${userStats.readingStreak}/${achievement.requirementValue} dias`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

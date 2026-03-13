import React from "react";
import { Award, BookOpen, Flame, Star, Target, TrendingUp, Trophy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Achievement } from "@/shared/types";
import { Card, CardContent } from "@/components/ui/card";

interface AchievementWithProgress extends Achievement {
  unlocked: boolean;
  unlockedAt?: string;
  unlocked_at?: string | null;
  requirementType?: string;
  requirementValue?: number;
}

interface ProfileAchievementsTabProps {
  achievements: AchievementWithProgress[];
  isLoading: boolean;
  unlockedCount: number;
  totalCount: number;
}

const getAchievementIcon = (icon: string) => {
  switch (icon) {
    case "Star":
      return <Star className="h-6 w-6 text-accent-foreground" />;
    case "Trophy":
      return <Trophy className="h-6 w-6 text-accent-foreground" />;
    case "Award":
      return <Award className="h-6 w-6 text-muted-foreground" />;
    case "Book":
      return <BookOpen className="h-6 w-6 text-success" />;
    case "Books":
      return <BookOpen className="h-6 w-6 text-success" />;
    case "Flame":
    case "Fire":
      return <Flame className="h-6 w-6 text-orange-500" />;
    case "Target":
      return <Target className="h-6 w-6 text-primary" />;
    case "Runner":
    case "Rocket":
      return <TrendingUp className="h-6 w-6 text-primary" />;
    default:
      return <Award className="h-6 w-6 text-muted-foreground" />;
  }
};

export const ProfileAchievementsTab = ({
  achievements,
  isLoading,
  unlockedCount,
  totalCount,
}: ProfileAchievementsTabProps) => {
  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!achievements.length) {
    return (
      <Card className="border-dashed p-12 text-center">
        <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Nenhuma conquista disponível</h3>
        <p className="text-sm text-muted-foreground">As conquistas aparecerão em breve.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-muted-foreground">
        {unlockedCount} de {totalCount} conquistas desbloqueadas
      </div>

      {unlockedAchievements.length > 0 ? (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-accent-foreground" />
            Desbloqueadas ({unlockedAchievements.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unlockedAchievements.map((achievement) => {
              const unlockedDate = achievement.unlockedAt || achievement.unlocked_at || undefined;

              return (
                <Card
                  key={achievement.id}
                  className="border-accent/35 bg-accent/10 transition-all hover:shadow-md"
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="text-4xl">{getAchievementIcon(achievement.icon)}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {unlockedDate ? (
                        <p className="mt-1 text-xs font-medium text-accent-foreground">
                          ✓ {format(new Date(unlockedDate), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}

      {lockedAchievements.length > 0 ? (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-muted-foreground">
            <Award className="h-5 w-5" />
            Bloqueadas ({lockedAchievements.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lockedAchievements.map((achievement) => (
              <Card key={achievement.id} className="opacity-65 transition-all hover:shadow-md">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="text-4xl grayscale">{getAchievementIcon(achievement.icon)}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-muted-foreground">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {achievement.requirementType === "books_read"
                        ? `Leia ${achievement.requirementValue} ${achievement.requirementValue === 1 ? "livro" : "livros"}`
                        : achievement.requirementType === "pages_read"
                          ? `Leia ${achievement.requirementValue} páginas`
                          : `${achievement.requirementValue ?? ""} ${achievement.requirementType ?? ""}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

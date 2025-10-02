import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Trophy, Target, CheckCircle, Clock } from "lucide-react";
import { useEnhancedAchievements, EnhancedAchievement } from "@/hooks/useEnhancedSocial";
import { cn } from "@/lib/utils";

const getAchievementIcon = (icon: string) => {
  if (icon && /[\u{1F300}-\u{1F9FF}]/u.test(icon)) {
    return icon;
  }

  const iconMap: Record<string, string> = {
    books_read: "📚",
    pages_read: "📖",
    streak_days: "🔥",
    posts_created: "✍️",
    likes_received: "❤️",
    books_added: "➕",
    reviews_written: "⭐",
    default: "🏆",
  };

  return iconMap[icon] || iconMap.default;
};

const getRarityColors = (rarity: EnhancedAchievement["rarity"]) => {
  const colors = {
    common: "bg-gray-100 text-gray-800",
    rare: "bg-blue-100 text-blue-800",
    epic: "bg-purple-100 text-purple-800",
    legendary: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
  };
  return colors[rarity];
};

const AchievementCard: React.FC<{ achievement: EnhancedAchievement }> = ({ achievement }) => {
  const icon = getAchievementIcon(achievement.icon);
  const rarityColor = getRarityColors(achievement.rarity);

  return (
    <Card
      className={cn(
        "relative transition-all duration-200 hover:shadow-md",
        achievement.unlocked ? "bg-gradient-to-br from-green-50 to-emerald-50" : "bg-white"
      )}
    >
      {achievement.unlocked && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{icon}</div>
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">{achievement.title}</CardTitle>
            <Badge variant="secondary" className={cn("mt-1 text-xs", rarityColor)}>
              {achievement.rarity}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-sm mt-2">{achievement.description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {!achievement.unlocked && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{achievement.progress_text}</span>
            </div>
            <Progress value={achievement.progress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {achievement.progress.toFixed(1)}% completo
            </div>
          </div>
        )}

        {achievement.unlocked && achievement.unlocked_at && (
          <div className="flex items-center text-sm text-green-600">
            <Trophy className="w-4 h-4 mr-1" />
            Desbloqueada em {new Date(achievement.unlocked_at).toLocaleDateString("pt-BR")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const AchievementsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | "unlocked" | "locked">("all");
  const {
    achievements,
    isLoading,
    unlockedCount,
    totalCount,
    checkAchievements,
    isCheckingAchievements,
  } = useEnhancedAchievements();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const filteredAchievements = achievements.filter(achievement => {
    switch (activeTab) {
      case "unlocked":
        return achievement.unlocked;
      case "locked":
        return !achievement.unlocked;
      default:
        return true;
    }
  });

  const completionPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Conquistas
          </h2>
          <p className="text-muted-foreground mt-1">
            {unlockedCount} de {totalCount} conquistas desbloqueadas (
            {completionPercentage.toFixed(1)}%)
          </p>
        </div>

        <Button
          onClick={() => checkAchievements()}
          disabled={isCheckingAchievements}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isCheckingAchievements && "animate-spin")} />
          Verificar Conquistas
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progresso Geral</span>
              <span>
                {unlockedCount}/{totalCount}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Todas ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="unlocked" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Desbloqueadas ({unlockedCount})
          </TabsTrigger>
          <TabsTrigger value="locked" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Bloqueadas ({totalCount - unlockedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredAchievements.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    Nenhuma conquista encontrada
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {activeTab === "unlocked"
                      ? "Continue lendo para desbloquear suas primeiras conquistas!"
                      : activeTab === "locked"
                      ? "Parabéns! Você desbloqueou todas as conquistas!"
                      : "Não há conquistas disponíveis no momento."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAchievements.map(achievement => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

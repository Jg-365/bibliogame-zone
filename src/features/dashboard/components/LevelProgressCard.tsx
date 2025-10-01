import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award } from "lucide-react";
import { cn } from "@/shared/utils";
import type { BaseComponentProps } from "@/shared/types";
import type {
  LevelName,
  LevelRequirement,
} from "../utils/levelUtils";

interface LevelProgressCardProps
  extends BaseComponentProps {
  currentLevel: LevelName;
  nextLevel: LevelName;
  progress: number;
  canUpgrade: boolean;
  isMaxLevel: boolean;
  requirements?: LevelRequirement | null;
  nextRequirements?: LevelRequirement | null;
  currentPoints: number;
  currentBooks: number;
  currentStreak: number;
  currentPages: number;
}

export const LevelProgressCard: React.FC<
  LevelProgressCardProps
> = ({
  currentLevel,
  nextLevel,
  progress,
  canUpgrade,
  isMaxLevel,
  requirements,
  nextRequirements,
  currentPoints,
  currentBooks,
  currentStreak,
  currentPages,
  className,
}) => {
  if (isMaxLevel) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Nível Máximo Alcançado!
          </CardTitle>
          <CardDescription>
            Parabéns! Você alcançou o nível mais alto:{" "}
            {currentLevel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentPoints.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Pontos
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentBooks}
              </div>
              <div className="text-sm text-muted-foreground">
                Livros
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Progresso do Nível
        </CardTitle>
        <CardDescription>
          {currentLevel} → {nextLevel}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso geral</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {canUpgrade && (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800"
          >
            Pronto para subir de nível!
          </Badge>
        )}

        {nextRequirements && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">
                Pontos
              </div>
              <div
                className={cn(
                  "font-semibold",
                  currentPoints >= nextRequirements.points
                    ? "text-green-600"
                    : "text-muted-foreground"
                )}
              >
                {currentPoints.toLocaleString()} /{" "}
                {nextRequirements.points.toLocaleString()}
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">
                Livros
              </div>
              <div
                className={cn(
                  "font-semibold",
                  currentBooks >= nextRequirements.books
                    ? "text-green-600"
                    : "text-muted-foreground"
                )}
              >
                {currentBooks} / {nextRequirements.books}
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">
                Sequência
              </div>
              <div
                className={cn(
                  "font-semibold",
                  currentStreak >= nextRequirements.streak
                    ? "text-green-600"
                    : "text-muted-foreground"
                )}
              >
                {currentStreak} / {nextRequirements.streak}{" "}
                dias
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">
                Páginas
              </div>
              <div
                className={cn(
                  "font-semibold",
                  currentPages >= nextRequirements.pages
                    ? "text-green-600"
                    : "text-muted-foreground"
                )}
              >
                {currentPages.toLocaleString()} /{" "}
                {nextRequirements.pages.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

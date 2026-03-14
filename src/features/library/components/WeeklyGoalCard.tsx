import React, { useEffect, useMemo, useState } from "react";
import { CalendarRange, PencilLine, Target } from "lucide-react";
import { startOfWeek } from "date-fns";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReadingSession } from "@/hooks/useReadingSessions";

interface WeeklyGoalCardProps {
  sessions: ReadingSession[];
  weeklyGoalPages?: number;
}

export const WeeklyGoalCard = ({ sessions, weeklyGoalPages = 120 }: WeeklyGoalCardProps) => {
  const { profile, updateProfileAsync, isUpdating } = useProfile();
  const persistedGoal = Math.max(35, Number(profile?.daily_page_goal || 0) * 7 || weeklyGoalPages);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(persistedGoal));

  useEffect(() => {
    setGoalInput(String(persistedGoal));
  }, [persistedGoal]);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const pagesThisWeek = useMemo(
    () =>
      sessions
        .filter((session) => new Date(session.session_date).getTime() >= weekStart.getTime())
        .reduce((sum, session) => sum + Math.max(0, session.pages_read || 0), 0),
    [sessions, weekStart],
  );

  const effectiveWeeklyGoal = Math.max(35, Number(goalInput) || persistedGoal);
  const progress = Math.min(100, Math.round((pagesThisWeek / effectiveWeeklyGoal) * 100));
  const remaining = Math.max(0, effectiveWeeklyGoal - pagesThisWeek);

  const handleSaveGoal = async () => {
    const parsedGoal = Math.max(35, Number(goalInput) || persistedGoal);
    await updateProfileAsync({
      daily_page_goal: Math.max(5, Math.round(parsedGoal / 7)),
    });
    setGoalInput(String(parsedGoal));
    setIsEditingGoal(false);
  };

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="h-4 w-4 text-primary" />
            Meta semanal
          </CardTitle>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => setIsEditingGoal((prev) => !prev)}
          >
            <PencilLine className="mr-1 h-3.5 w-3.5" />
            {isEditingGoal ? "Fechar" : "Editar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{pagesThisWeek}</p>
            <p className="text-xs text-muted-foreground">páginas nesta semana</p>
          </div>
          <Badge variant={progress >= 100 ? "success" : "secondary"}>{progress}%</Badge>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {remaining === 0
            ? "Meta batida. Excelente ritmo."
            : `Faltam ${remaining} páginas para a meta.`}
        </p>
        {isEditingGoal ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="number"
              min={35}
              step={5}
              value={goalInput}
              onChange={(event) => setGoalInput(event.target.value)}
              className="h-9"
            />
            <Button onClick={() => void handleSaveGoal()} disabled={isUpdating} size="sm">
              {isUpdating ? "Salvando..." : "Salvar meta"}
            </Button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
            <Target className="h-3.5 w-3.5" />
            Objetivo: {effectiveWeeklyGoal} páginas
          </div>
        )}
      </CardContent>
    </Card>
  );
};

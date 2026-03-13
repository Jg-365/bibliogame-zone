import React, { useMemo } from "react";
import { CalendarRange, Target } from "lucide-react";
import { startOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ReadingSession } from "@/hooks/useReadingSessions";

interface WeeklyGoalCardProps {
  sessions: ReadingSession[];
  weeklyGoalPages?: number;
}

export const WeeklyGoalCard = ({ sessions, weeklyGoalPages = 120 }: WeeklyGoalCardProps) => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const pagesThisWeek = useMemo(
    () =>
      sessions
        .filter((session) => new Date(session.session_date).getTime() >= weekStart.getTime())
        .reduce((sum, session) => sum + Math.max(0, session.pages_read || 0), 0),
    [sessions, weekStart],
  );

  const progress = Math.min(100, Math.round((pagesThisWeek / weeklyGoalPages) * 100));
  const remaining = Math.max(0, weeklyGoalPages - pagesThisWeek);

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="h-4 w-4 text-primary" />
          Meta semanal
        </CardTitle>
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
        <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
          <Target className="h-3.5 w-3.5" />
          Objetivo: {weeklyGoalPages} páginas
        </div>
      </CardContent>
    </Card>
  );
};

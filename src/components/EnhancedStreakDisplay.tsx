import { useEffect, useState } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Flame,
  Calendar,
  Target,
  Trophy,
  Snowflake,
  Star,
  TrendingUp,
  Award,
  Zap,
  Crown,
  Sparkles,
  Shield,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { cn } from "@/lib/utils";
import { format, startOfDay, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EnhancedStreakDisplayProps {
  className?: string;
  compact?: boolean;
}

interface Milestone {
  days: number;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const MILESTONES: Milestone[] = [
  {
    days: 3,
    label: "Aquecendo",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-100/80 dark:bg-orange-500/20",
  },
  {
    days: 7,
    label: "Uma Semana",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100/80 dark:bg-yellow-500/20",
  },
  {
    days: 14,
    label: "Duas Semanas",
    icon: TrendingUp,
    color: "text-blue-500",
    bgColor: "bg-blue-100/80 dark:bg-blue-500/20",
  },
  {
    days: 30,
    label: "Um Mês",
    icon: Award,
    color: "text-purple-500",
    bgColor: "bg-purple-100/80 dark:bg-purple-500/20",
  },
  {
    days: 90,
    label: "Trimestre",
    icon: Zap,
    color: "text-pink-500",
    bgColor: "bg-pink-100/80 dark:bg-pink-500/20",
  },
  {
    days: 365,
    label: "Ano Completo",
    icon: Crown,
    color: "text-amber-500",
    bgColor: "bg-amber-100/80 dark:bg-amber-500/20",
  },
];

export const EnhancedStreakDisplay = ({
  className,
  compact = false,
}: EnhancedStreakDisplayProps) => {
  const { profile } = useProfile();
  const { sessions } = useReadingSessions();
  const [showAnimation, setShowAnimation] = useState(false);

  const currentStreak = (profile as any)?.current_streak || 0;
  const longestStreak = (profile as any)?.longest_streak || 0;
  const streakFreezes = (profile as any)?.streak_freezes || 0;
  const dailyPageGoal = (profile as any)?.daily_page_goal || 20;

  // Get current milestone
  const currentMilestone =
    MILESTONES.slice()
      .reverse()
      .find((m) => currentStreak >= m.days) || MILESTONES[0];

  const nextMilestone = MILESTONES.find((m) => m.days > currentStreak);

  // Calculate progress to next milestone
  const progressToNext = nextMilestone
    ? ((currentStreak % nextMilestone.days) / nextMilestone.days) * 100
    : 100;

  // Check if read today
  const today = startOfDay(new Date());
  const hasReadToday = sessions?.some((session) => {
    const sessionDate = startOfDay(new Date(session.session_date));
    return isSameDay(sessionDate, today) && session.pages_read > 0;
  });

  // Get today's pages
  const todayPages =
    sessions
      ?.filter((session) => {
        const sessionDate = startOfDay(new Date(session.session_date));
        return isSameDay(sessionDate, today);
      })
      .reduce((sum, session) => sum + (session.pages_read || 0), 0) || 0;

  // Calculate heatmap data (last 8 weeks = 56 days)
  const getHeatmapData = () => {
    const days = [];
    const endDate = new Date();

    for (let i = 55; i >= 0; i--) {
      const date = subDays(endDate, i);
      const dateStr = format(date, "yyyy-MM-dd");

      const daySessions =
        sessions?.filter((session) => {
          const sessionDate = format(new Date(session.session_date), "yyyy-MM-dd");
          return sessionDate === dateStr;
        }) || [];

      const pagesRead = daySessions.reduce((sum, s) => sum + (s.pages_read || 0), 0);

      days.push({
        date,
        dateStr,
        pagesRead,
        hasSession: pagesRead > 0,
        isToday: isSameDay(date, today),
      });
    }

    return days;
  };

  const heatmapData = getHeatmapData();

  // Get intensity for heatmap
  const getIntensity = (pages: number) => {
    if (pages === 0) return "bg-slate-200 dark:bg-slate-700";
    if (pages < 10) return "bg-emerald-200 dark:bg-emerald-900";
    if (pages < 20) return "bg-emerald-300 dark:bg-emerald-700";
    if (pages < 40) return "bg-emerald-400 dark:bg-emerald-600";
    return "bg-emerald-500 dark:bg-emerald-500";
  };

  // Streak message
  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return "Comece sua sequência hoje! 🚀";
    }
    if (!hasReadToday) {
      return "Continue sua sequência! Leia hoje! 🔥";
    }
    if (currentStreak >= 365) {
      return "Você é uma LENDA! 👑";
    }
    if (currentStreak >= 90) {
      return "Dedicação extraordinária! 💎";
    }
    if (currentStreak >= 30) {
      return "Um mês incrível! Continue! 🌟";
    }
    if (currentStreak >= 7) {
      return "Uma semana forte! 💪";
    }
    return "Ótimo começo! 🎯";
  };

  // Time until midnight
  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl",
                  currentMilestone.bgColor,
                )}
              >
                <currentMilestone.icon className={cn("w-6 h-6", currentMilestone.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{currentStreak}</span>
                  <span className="text-sm text-muted-foreground">dias</span>
                </div>
                <p className="text-xs text-muted-foreground">{currentMilestone.label}</p>
              </div>
            </div>

            {streakFreezes > 0 && (
              <div className="flex items-center gap-1 rounded-lg bg-blue-100/80 px-3 py-1.5 dark:bg-blue-500/20">
                <Snowflake className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  ×{streakFreezes}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Sequência de Leitura
          </CardTitle>

          {streakFreezes > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {streakFreezes} {streakFreezes === 1 ? "Proteção" : "Proteções"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Streak */}
        <div className="text-center space-y-2">
          <div
            className={cn(
              "inline-flex items-center justify-center w-20 h-20 rounded-2xl",
              currentMilestone.bgColor,
            )}
          >
            <currentMilestone.icon className={cn("w-10 h-10", currentMilestone.color)} />
          </div>

          <div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold">{currentStreak}</span>
              <span className="text-xl text-muted-foreground">dias</span>
            </div>
            <p className="text-lg font-medium text-muted-foreground mt-1">
              {currentMilestone.label}
            </p>
          </div>

          <p className="text-sm text-muted-foreground italic">{getStreakMessage()}</p>
        </div>

        {/* Today's Progress */}
        {!hasReadToday && currentStreak > 0 && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-amber-100/80 dark:bg-amber-500/20 border border-amber-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-300" />
              <span className="font-medium text-amber-900 dark:text-amber-200">Atenção!</span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-200/90">
              Você ainda não leu hoje. Tempo restante: <strong>{timeLeft}</strong>
            </p>
            {streakFreezes > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-2">
                💡 Você tem {streakFreezes} {streakFreezes === 1 ? "proteção" : "proteções"}{" "}
                disponível
              </p>
            )}
          </m.div>
        )}

        {/* Today's Reading */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Hoje</span>
            <span className="font-medium">
              {todayPages} / {dailyPageGoal} páginas
            </span>
          </div>
          <Progress value={(todayPages / dailyPageGoal) * 100} className="h-2" />
        </div>

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Próximo Marco</span>
              <span className="font-medium flex items-center gap-1">
                <nextMilestone.icon className="w-4 h-4" />
                {nextMilestone.label} ({nextMilestone.days} dias)
              </span>
            </div>
            <Progress value={progressToNext} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              Faltam {nextMilestone.days - currentStreak} dias
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <div className="text-2xl font-bold">{longestStreak}</div>
            <div className="text-xs text-muted-foreground">Recorde</div>
          </div>

          <div className="text-center">
            <Sparkles className="w-5 h-5 mx-auto mb-1 text-purple-500" />
            <div className="text-2xl font-bold">
              {MILESTONES.filter((m) => currentStreak >= m.days).length}
            </div>
            <div className="text-xs text-muted-foreground">Marcos</div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Últimas 8 semanas</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Menos</span>
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-3 rounded bg-emerald-200 dark:bg-emerald-900" />
                <div className="h-3 w-3 rounded bg-emerald-300 dark:bg-emerald-700" />
                <div className="h-3 w-3 rounded bg-emerald-400 dark:bg-emerald-600" />
                <div className="h-3 w-3 rounded bg-emerald-500 dark:bg-emerald-500" />
              </div>
              <span>Mais</span>
            </div>
          </div>

          <div className="grid grid-cols-8 gap-1">
            {heatmapData.map((day, index) => (
              <m.div
                key={day.dateStr}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className="group relative"
              >
                <div
                  className={cn(
                    "w-full aspect-square rounded transition-all cursor-pointer",
                    getIntensity(day.pagesRead),
                    day.isToday && "ring-2 ring-primary ring-offset-1",
                    "hover:scale-110 hover:shadow-lg",
                  )}
                />

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    <div className="font-medium">
                      {format(day.date, "dd MMM", { locale: ptBR })}
                    </div>
                    <div>{day.pagesRead > 0 ? `${day.pagesRead} páginas` : "Sem leitura"}</div>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>

        {/* Freeze Info */}
        {currentStreak >= 7 && (
          <div className="rounded-lg border border-blue-300/70 bg-blue-100/80 p-3 dark:border-blue-500/40 dark:bg-blue-500/20">
            <div className="flex items-start gap-2">
              <Snowflake className="w-4 h-4 text-blue-600 dark:text-blue-300 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-medium">Proteções de Sequência</p>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-200/90">
                  Ganhe 1 proteção a cada 7 dias de streak. Use para proteger um dia perdido. Você
                  tem <strong>{streakFreezes}/3</strong> proteções.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

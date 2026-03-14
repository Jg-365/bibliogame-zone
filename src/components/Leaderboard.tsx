import React, { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Crown,
  Medal,
  Trophy,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboardWithFilters } from "@/hooks/social";
import { toSecureAssetUrl } from "@/lib/media";

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-accent-foreground" />;
    case 2:
      return <Trophy className="h-5 w-5 text-muted-foreground" />;
    case 3:
      return <Medal className="h-5 w-5 text-orange-500" />;
    default:
      return <Award className="h-4 w-4 text-muted-foreground" />;
  }
};

const getRankTone = (rank: number) => {
  switch (rank) {
    case 1:
      return "border-accent/40 bg-accent/10";
    case 2:
      return "border-border/70 bg-muted/30";
    case 3:
      return "border-orange-500/40 bg-orange-500/10";
    default:
      return "border-border/70 bg-card";
  }
};

const getInitials = (name?: string) => {
  if (!name) return "?";

  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const metricLabels = {
  points: "pontos",
  pages: "páginas",
  books: "livros",
  streak: "dias",
} as const;

export const Leaderboard = () => {
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => ["all", ...Array.from({ length: 4 }, (_, index) => String(currentYear - index))],
    [currentYear],
  );
  const [metric, setMetric] = useState<"points" | "pages" | "books" | "streak">("points");
  const [period, setPeriod] = useState<string>("all");
  const [expanded, setExpanded] = useState(false);

  const { data: leaderboard, isLoading } = useLeaderboardWithFilters({
    metric,
    period: period === "all" ? "all" : Number(period),
  });

  const minUsers = 4;
  const maxUsers = 20;
  const displayCount = expanded
    ? Math.min(leaderboard?.length || 0, maxUsers)
    : Math.min(leaderboard?.length || 0, minUsers);
  const visibleUsers = leaderboard?.slice(0, displayCount) || [];
  const canExpand = (leaderboard?.length || 0) > minUsers;
  const metricLabel = metricLabels[metric];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ranking de leitores
          </CardTitle>
          <CardDescription>Carregando posições...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/70 p-3"
              >
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ranking de leitores
          </CardTitle>
          <CardDescription>O ranking ainda não tem dados suficientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Trophy className="mx-auto mb-3 h-10 w-10" />
            <p>Seja o primeiro no ranking.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Ranking de leitores
            </CardTitle>
            <CardDescription>
              Top {displayCount} de {leaderboard.length} leitores em {metricLabel}
              {period === "all" ? " no histórico completo." : ` no ano de ${period}.`}
            </CardDescription>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Select value={metric} onValueChange={(value) => setMetric(value as typeof metric)}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="points">Pontos</SelectItem>
                <SelectItem value="pages">Páginas</SelectItem>
                <SelectItem value="books">Livros</SelectItem>
                <SelectItem value="streak">Sequência</SelectItem>
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all" ? "Todo período" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visibleUsers.map((user) => (
            <div
              key={user.id}
              className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-3 transition-colors hover:bg-muted/40 sm:items-center ${getRankTone(user.rank)}`}
            >
              <div className="flex h-8 w-8 items-center justify-center">
                {user.rank <= 3 ? (
                  getRankIcon(user.rank)
                ) : (
                  <span className="text-sm font-bold">{user.rank}</span>
                )}
              </div>

              <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                <AvatarImage src={toSecureAssetUrl(user.avatarUrl) || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(user.fullName || user.username)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="truncate text-sm font-medium">{user.fullName || user.username}</h4>
                  {user.username && user.fullName ? (
                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{user.level}</Badge>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {user.booksCompleted} livros
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {user.readingStreak} dias
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-bold sm:text-lg">
                  {(user.metricValue ?? user.points).toLocaleString("pt-BR")}
                </div>
                <div className="text-xs text-muted-foreground">{metricLabel}</div>
              </div>
            </div>
          ))}
        </div>

        {canExpand ? (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" onClick={() => setExpanded((prev) => !prev)}>
              {expanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Ver mais ({Math.min(leaderboard.length, maxUsers)} total)
                </>
              )}
            </Button>
          </div>
        ) : null}

        <div className="mt-6 rounded-[var(--radius-md)] border border-accent/40 bg-accent/10 p-4 text-sm text-foreground">
          <div className="mb-2 inline-flex items-center gap-2 font-medium">
            <Trophy className="h-4 w-4 text-accent-foreground" />
            Como subir no ranking
          </div>
          <p className="text-xs text-muted-foreground">
            Pontuação oficial: 1 ponto por página lida + 50 pontos por livro concluído.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/90">
            Compare o histórico completo com recortes anuais para entender quem mantém ritmo ao
            longo do tempo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

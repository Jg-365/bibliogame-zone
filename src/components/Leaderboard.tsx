import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  TrendingUp,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLeaderboard } from "@/hooks/useSocial";

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-600" />;
    case 2:
      return <Trophy className="h-5 w-5 text-slate-600" />;
    case 3:
      return <Medal className="h-5 w-5 text-orange-600" />;
    default:
      return <Award className="h-4 w-4 text-slate-700" />;
  }
};

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-yellow-50 border-yellow-200";
    case 2:
      return "bg-gray-50 border-gray-200";
    case 3:
      return "bg-orange-50 border-orange-200";
    default:
      return "bg-white border-gray-200";
  }
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export const Leaderboard = () => {
  const { data: leaderboard, isLoading } = useLeaderboard();
  const [expanded, setExpanded] = useState(false);

  // Show minimum 4 users, maximum 20
  const minUsers = 4;
  const maxUsers = 20;
  const displayCount = expanded
    ? Math.min(leaderboard?.length || 0, maxUsers)
    : Math.min(leaderboard?.length || 0, minUsers);
  const visibleUsers = leaderboard?.slice(0, displayCount) || [];
  const canExpand = (leaderboard?.length || 0) > minUsers;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ranking de Leitores
          </CardTitle>
          <CardDescription>Carregando ranking...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
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
            <TrendingUp className="h-5 w-5" />
            Ranking de Leitores
          </CardTitle>
          <CardDescription>O ranking ainda não tem dados suficientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-600 font-medium">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Seja o primeiro no ranking!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Ranking de Leitores
        </CardTitle>
        <CardDescription className="text-slate-600">
          Top {displayCount} de {leaderboard.length} leitores mais ativos da comunidade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visibleUsers.map((user, index) => (
            <div
              key={user.userId}
              className={`flex items-start sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border transition-colors hover:shadow-sm ${getRankColor(
                user.rank
              )}`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                {user.rank <= 3 ? (
                  getRankIcon(user.rank)
                ) : (
                  <span className="text-xs sm:text-sm font-bold text-gray-600">{user.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(user.fullName || user.username)}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <h4 className="font-medium text-sm truncate">{user.fullName || user.username}</h4>
                  {user.username && user.fullName && (
                    <span className="text-xs text-slate-600 font-medium truncate">
                      @{user.username}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {user.level}
                  </Badge>
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {user.booksCompleted} livros
                  </span>
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {user.readingStreak} dias
                  </span>
                </div>
              </div>

              {/* Points */}
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-base sm:text-lg">{user.points.toLocaleString()}</div>
                <div className="text-xs text-slate-600 font-medium">pontos</div>
              </div>
            </div>
          ))}
        </div>

        {/* Expand/Collapse Button */}
        {canExpand && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Ver mais ({Math.min(leaderboard?.length || 0, maxUsers)} total)
                </>
              )}
            </Button>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Como subir no ranking</span>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• Complete livros para ganhar pontos (10 pontos por livro)</p>
            <p>• Mantenha uma sequência de leitura diária</p>
            <p>• Ganhe pontos extras por páginas lidas (1 ponto a cada 50 páginas)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  Heart,
  MessageCircle,
  Trophy,
  BookOpen,
  Star,
  TrendingUp,
} from "lucide-react";
import {
  useFollows,
  useLeaderboard,
  useActivity,
  useFollowUser,
  useUnfollowUser,
  useIsFollowing,
} from "@/hooks/useSocial";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const SocialPage = () => {
  const { user } = useAuth();
  const { data: activities = [], isLoading: activitiesLoading } = useActivity();
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useLeaderboard();
  const { followers, following } = useFollows();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "book_completed":
        return <BookOpen className="w-4 h-4 text-green-500" />;
      case "achievement_unlocked":
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case "reading_progress":
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Agora há pouco";
    if (diffInHours < 24) return `${diffInHours}h atrás`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;

    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Trophy className="h-5 w-5 text-slate-600" />;
      case 3:
        return <Trophy className="h-5 w-5 text-orange-500" />;
      default:
        return <span className="text-sm font-bold text-gray-600">{rank}</span>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Comunidade de Leitores
        </h1>
        <p className="text-muted-foreground">
          Descubra o que outros leitores estão fazendo e conecte-se com a comunidade
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Feed de Atividades */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 p-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-2">Nenhuma atividade recente</p>
                  <p className="text-sm">
                    Complete livros e desbloqueie conquistas para ver suas atividades aqui!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div
                      key={activity.id}
                      className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={activity.user?.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {activity.user?.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">
                                {activity.user?.fullName || activity.user?.username || "Usuário"}
                              </span>{" "}
                              {activity.description}
                            </p>

                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-slate-600 font-medium">
                                {getTimeAgo(activity.createdAt)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {activity.type === "book_completed" && "Livro Concluído"}
                                {activity.type === "reading_progress" && "Progresso"}
                                {activity.type === "achievement_unlocked" && "Conquista"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                          <Heart className="h-4 w-4 text-slate-600 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ranking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ranking de Leitores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
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
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum leitor no ranking ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((user, index) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(user.rank)}
                      </div>

                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {user.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user.fullName || user.username}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <span>{user.points} pontos</span>
                          <span>•</span>
                          <span>{user.booksCompleted} livros</span>
                        </div>
                      </div>

                      <Badge variant="secondary" className="text-xs">
                        {user.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas dos Seguidores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Suas Conexões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {followers.data?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Seguidores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {following.data?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Seguindo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

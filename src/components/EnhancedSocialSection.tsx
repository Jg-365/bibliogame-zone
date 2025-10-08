import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  Trophy,
  BookOpen,
  Eye,
  Star,
  TrendingUp,
  Activity,
  User as UserIcon,
  Calendar,
} from "lucide-react";
import {
  usePublicActivityFeed,
  usePublicProfiles,
  usePublicUserSearch,
  useEnhancedLeaderboard,
} from "@/hooks/useEnhancedSocial";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const EnhancedSocialSection: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("feed");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { data: activityFeed = [], isLoading: feedLoading } = usePublicActivityFeed();
  const { data: publicProfiles = [], isLoading: profilesLoading } = usePublicProfiles(10);
  const { data: searchResults = [] } = usePublicUserSearch(searchTerm);
  const { data: leaderboard = [], isLoading: leaderboardLoading } =
    useEnhancedLeaderboard("points");

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "book_completed":
        return <BookOpen className="w-4 h-4 text-green-500" />;
      case "achievement_unlocked":
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case "reading_progress":
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
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
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Trophy className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="text-sm font-bold text-gray-600">#{rank}</span>;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Comunidade de Leitores
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Descubra o que outros leitores estão fazendo, conecte-se com a comunidade e acompanhe suas
          atividades de leitura
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leitores..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchResults.length > 0 && searchTerm && (
            <Card className="absolute top-full left-0 right-0 mt-2 z-10 max-h-60 overflow-y-auto">
              <CardContent className="p-2">
                {searchResults.map(profile => (
                  <Button
                    key={profile.user_id}
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto"
                    onClick={() => {
                      setSelectedUser(profile.user_id);
                      setSearchTerm("");
                    }}
                  >
                    <Avatar className="w-8 h-8 mr-3">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback>
                        {(profile.full_name || profile.username || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium">{profile.full_name || profile.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.points} pontos • {profile.books_completed} livros
                      </p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Feed</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Ranking</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Estatísticas</span>
          </TabsTrigger>
        </TabsList>

        {/* Activity Feed Tab */}
        <TabsContent value="feed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Atividades Recentes da Comunidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 p-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activityFeed.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="mb-2">Nenhuma atividade recente encontrada</p>
                  <p className="text-sm">
                    Complete livros e desbloqueie conquistas para aparecer aqui!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityFeed.map(activity => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(activity.user_id)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={activity.user.avatar_url || ""} />
                        <AvatarFallback>
                          {(activity.user.full_name || activity.user.username || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.description}
                            </p>

                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(activity.created_at)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {activity.type === "book_completed" && "Livro Concluído"}
                                {activity.type === "achievement_unlocked" && "Conquista"}
                                {activity.type === "reading_progress" && "Progresso"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Leitores Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profilesLoading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex gap-3 p-3 animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {publicProfiles.map(profile => (
                    <motion.div
                      key={profile.user_id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex gap-3 p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedUser(profile.user_id)}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback>
                          {(profile.full_name || profile.username || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {profile.full_name || profile.username}
                        </h4>
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        {profile.bio && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {profile.bio}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{profile.points} pontos</span>
                          <span>{profile.books_completed} livros</span>
                          <span>{profile.current_streak} dias</span>
                        </div>
                      </div>

                      <Badge variant="secondary">{profile.level}</Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Ranking de Leitores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 20).map(user => (
                    <motion.div
                      key={user.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(user.user_id)}
                    >
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(user.rank)}
                      </div>

                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback>
                          {(user.full_name || user.username || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.full_name || user.username}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{user.points} pontos</span>
                          <span>{user.books_completed} livros</span>
                          <span>{user.total_pages_read} páginas</span>
                        </div>
                      </div>

                      <Badge variant="secondary">{user.level}</Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{publicProfiles.length}</p>
                    <p className="text-sm text-muted-foreground">Leitores Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {leaderboard.reduce((sum, user) => sum + (user.books_completed || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Livros Lidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{activityFeed.length}</p>
                    <p className="text-sm text-muted-foreground">Atividades Recentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Star className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        leaderboard.reduce((sum, user) => sum + (user.total_pages_read || 0), 0) /
                          1000
                      )}
                      k
                    </p>
                    <p className="text-sm text-muted-foreground">Páginas Lidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas da Comunidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Média de pontos por usuário</p>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      leaderboard.reduce((sum, user) => sum + (user.points || 0), 0) /
                        leaderboard.length || 0
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Maior sequência da comunidade
                  </p>
                  <p className="text-2xl font-bold">
                    {Math.max(...leaderboard.map(user => user.longest_streak || 0), 0)} dias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSocialSection;

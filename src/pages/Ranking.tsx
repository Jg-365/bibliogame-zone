import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Medal,
  Award,
  BookOpen,
  Target,
  Flame,
  Crown,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

interface RankingUser {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  books_completed: number;
  total_pages_read: number;
  current_streak: number;
  points: number;
  level: string;
  position?: number;
}

type RankingType = "books" | "pages" | "streak" | "points";

export const RankingPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<RankingType>("books");

  // Fetch ranking data
  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ["rankings", activeTab],
    queryFn: async () => {
      let orderBy = "books_completed";

      switch (activeTab) {
        case "pages":
          orderBy = "total_pages_read";
          break;
        case "streak":
          orderBy = "current_streak";
          break;
        case "points":
          orderBy = "points";
          break;
        default:
          orderBy = "books_completed";
      }

      let query = supabase
        .from("profiles")
        .select(
          "user_id, username, avatar_url, books_completed, total_pages_read, current_streak, points, level"
        );

      // Para ranking de sequência, só mostrar usuários com sequência > 0
      if (activeTab === "streak") {
        query = query.gt("current_streak", 0);
      }

      const { data, error } = await query.order(orderBy, { ascending: false }).limit(50);

      if (error) throw error;

      // Add position to each user
      return (data as RankingUser[]).map((user, index) => ({
        ...user,
        position: index + 1,
      }));
    },
  });

  // Get current user position
  const currentUserPosition = rankings.find(r => r.user_id === user?.id)?.position;

  const getRankingValue = (user: RankingUser) => {
    switch (activeTab) {
      case "books":
        return user.books_completed;
      case "pages":
        return user.total_pages_read;
      case "streak":
        return user.current_streak;
      case "points":
        return user.points;
      default:
        return 0;
    }
  };

  const getRankingLabel = () => {
    switch (activeTab) {
      case "books":
        return "Livros Concluídos";
      case "pages":
        return "Páginas Lidas";
      case "streak":
        return "Sequência de Dias";
      case "points":
        return "Pontos XP";
      default:
        return "";
    }
  };

  const getRankingIcon = () => {
    switch (activeTab) {
      case "books":
        return <BookOpen className="w-4 h-4" />;
      case "pages":
        return <Target className="w-4 h-4" />;
      case "streak":
        return <Flame className="w-4 h-4" />;
      case "points":
        return <Star className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default:
        return "bg-background border";
    }
  };

  const rankingTabs = [
    {
      id: "books" as RankingType,
      label: "Livros",
      icon: <BookOpen className="w-4 h-4" />,
      description: "Mais livros lidos",
    },
    {
      id: "pages" as RankingType,
      label: "Páginas",
      icon: <Target className="w-4 h-4" />,
      description: "Maior número de páginas",
    },
    {
      id: "streak" as RankingType,
      label: "Sequência",
      icon: <Flame className="w-4 h-4" />,
      description: "Maior sequência ativa",
    },
    {
      id: "points" as RankingType,
      label: "Pontos",
      icon: <Star className="w-4 h-4" />,
      description: "Mais pontos XP",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 pt-16 md:pt-20 pb-20 md:pb-8">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">
            🏆 Ranking Global
          </h1>
          <p className="text-muted-foreground">
            Veja onde você está entre os melhores leitores da plataforma
          </p>
        </motion.div>

        {/* Current User Position */}
        {currentUserPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-2 border-primary/50 bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12 border-2 border-primary">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Sua Posição</p>
                      <p className="text-sm text-muted-foreground">{getRankingLabel()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      {getPositionIcon(currentUserPosition)}
                      <span className="text-2xl font-bold text-primary">
                        {getRankingValue(rankings.find(r => r.user_id === user?.id)!)}
                        {activeTab === "streak" && " dias"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      #{currentUserPosition} de {rankings.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Ranking Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as RankingType)}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {rankingTabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col space-y-1 h-auto py-3"
                >
                  <div className="flex items-center space-x-1">
                    {tab.icon}
                    <span className="text-xs md:text-sm font-medium">{tab.label}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {rankingTabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {tab.icon}
                      <span>Ranking por {tab.label}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {isLoading ? (
                          <div className="space-y-3">
                            {[...Array(10)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                  duration: 0.3,
                                  delay: i * 0.05,
                                }}
                                className="flex items-center space-x-3 p-3 rounded-lg animate-pulse"
                              >
                                <div className="w-8 h-8 bg-gray-300 rounded-full" />
                                <div className="w-8 h-8 bg-gray-300 rounded-full" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-300 rounded w-1/3" />
                                  <div className="h-3 bg-gray-300 rounded w-1/4" />
                                </div>
                                <div className="h-6 bg-gray-300 rounded w-16" />
                              </motion.div>
                            ))}
                          </div>
                        ) : rankings.length === 0 ? (
                          <motion.div
                            initial={{
                              opacity: 0,
                              scale: 0.9,
                            }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                            }}
                            transition={{ duration: 0.5 }}
                            className="text-center py-12"
                          >
                            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Nenhum dado ainda</h3>
                            <p className="text-muted-foreground">
                              Os rankings aparecerão conforme os usuários começarem a ler
                            </p>
                          </motion.div>
                        ) : (
                          rankings.map((rankingUser, index) => (
                            <motion.div
                              key={rankingUser.user_id}
                              initial={{
                                opacity: 0,
                                x: -20,
                              }}
                              animate={{
                                opacity: 1,
                                x: 0,
                              }}
                              transition={{
                                duration: 0.3,
                                delay: index * 0.05,
                              }}
                              className={`flex items-center space-x-3 p-3 rounded-lg transition-all hover:scale-[1.02] ${getPositionColor(
                                rankingUser.position!
                              )} ${rankingUser.user_id === user?.id ? "ring-2 ring-primary" : ""}`}
                            >
                              <div className="flex-shrink-0">
                                {getPositionIcon(rankingUser.position!)}
                              </div>

                              <Avatar className="w-10 h-10">
                                <AvatarImage src={rankingUser.avatar_url || ""} />
                                <AvatarFallback>
                                  {rankingUser.username?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {rankingUser.username || "Usuário Anônimo"}
                                  {rankingUser.user_id === user?.id && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      Você
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Nível {rankingUser.level}
                                </p>
                              </div>

                              <div className="text-right">
                                <div className="flex items-center space-x-1">
                                  {getRankingIcon()}
                                  <span className="font-bold text-lg">
                                    {getRankingValue(rankingUser).toLocaleString()}
                                    {activeTab === "streak" && " dias"}
                                  </span>
                                </div>
                                {rankingUser.position! <= 3 && (
                                  <motion.div
                                    animate={{
                                      scale: [1, 1.1, 1],
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                    }}
                                  >
                                    <TrendingUp className="w-3 h-3 text-green-500 mx-auto" />
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {rankingTabs.map((tab, index) => {
            const topUser = rankings[0];
            const value = topUser ? getRankingValue(topUser) : 0;

            return (
              <Card key={tab.id} className="text-center">
                <CardContent className="p-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.5,
                    }}
                  >
                    {tab.icon}
                  </motion.div>
                  <p className="text-2xl font-bold text-primary mt-2">{value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Líder em {tab.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

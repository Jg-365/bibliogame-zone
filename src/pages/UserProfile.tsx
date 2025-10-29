import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  Book,
  Trophy,
  Target,
  Flame,
  Users,
  BookOpen,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatProfileLevel } from "@/shared/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_books_read: number;
  current_streak: number;
  total_pages_read: number;
  points: number;
}

interface UserBook {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  status: string;
}

interface ReadingSession {
  id: string;
  book_id: string;
  session_date: string;
  pages_read: number;
  notes: string | null;
  created_at: string;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievements: {
    id: string;
    title: string;
    description: string;
    icon: string;
    rarity: string;
  };
}

export const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedBook, setSelectedBook] =
    useState<UserBook | null>(null);
  const [showSessionsDialog, setShowSessionsDialog] =
    useState(false);

  // Follow/Unfollow functionality
  const handleFollowToggle = async () => {
    if (!currentUser || !userId) return;

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", userId);
        setIsFollowing(false);
      } else {
        await supabase.from("follows").insert({
          follower_id: currentUser.id,
          following_id: userId,
        });
        setIsFollowing(true);
      }

      queryClient.invalidateQueries({
        queryKey: ["social-stats", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["is-following", currentUser.id, userId],
      });
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  // Check if current user is following this profile
  useQuery({
    queryKey: ["is-following", currentUser?.id, userId],
    queryFn: async () => {
      if (
        !currentUser ||
        !userId ||
        currentUser.id === userId
      )
        return false;

      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", userId)
        .maybeSingle();

      const following = !!data;
      setIsFollowing(following);
      return following;
    },
    enabled:
      !!currentUser &&
      !!userId &&
      currentUser.id !== userId,
  });

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } =
    useQuery({
      queryKey: ["user-profile", userId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) throw error;
        return data as UserProfile;
      },
      enabled: !!userId,
    });

  // Fetch user's books
  const { data: books, isLoading: booksLoading } = useQuery(
    {
      queryKey: ["user-books", userId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(9);

        if (error) throw error;
        return data as UserBook[];
      },
      enabled: !!userId,
    }
  );

  // Fetch user achievements
  const {
    data: achievements,
    isLoading: achievementsLoading,
  } = useQuery({
    queryKey: ["user-achievements", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select(
          `
          id,
          achievement_id,
          unlocked_at,
          achievements (
            id,
            title,
            description,
            icon,
            rarity
          )
        `
        )
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false });

      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!userId,
  });

  // Fetch reading sessions for selected book
  const {
    data: readingSessions,
    isLoading: sessionsLoading,
  } = useQuery({
    queryKey: ["book-reading-sessions", selectedBook?.id],
    queryFn: async () => {
      if (!selectedBook) return [];

      console.log(
        "🔍 Fetching sessions for book:",
        selectedBook.id
      );
      const { data, error } = await supabase
        .from("reading_sessions")
        .select("*")
        .eq("book_id", selectedBook.id)
        .order("session_date", { ascending: false });

      console.log("📚 Sessions data:", data);
      console.log("❌ Sessions error:", error);

      if (error) {
        console.error(
          "Error fetching reading sessions:",
          error
        );
        throw error;
      }
      return data as ReadingSession[];
    },
    enabled: !!selectedBook,
  });

  // Fetch followers/following counts
  const { data: socialStats } = useQuery({
    queryKey: ["social-stats", userId],
    queryFn: async () => {
      const [followersRes, followingRes] =
        await Promise.all([
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", userId),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", userId),
        ]);

      return {
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
      };
    },
    enabled: !!userId,
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p>Usuário não encontrado</p>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  // Prefer explicit points, fallback to total_pages_read for level derivation
  const displayPoints =
    (profile.points ?? profile.total_pages_read) || 0;
  const displayLevel = formatProfileLevel({
    ...(profile as any),
    total_pages_read: displayPoints,
  });

  return (
    <div className="container max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-3 sm:mb-4 text-xs sm:text-sm"
          size="sm"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Voltar
        </Button>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 shrink-0">
                <AvatarImage
                  src={profile.avatar_url || ""}
                />
                <AvatarFallback className="text-lg sm:text-xl md:text-2xl">
                  {profile.full_name
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left w-full">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
                  {profile.full_name}
                </h1>

                <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Trophy className="h-3 w-3" />
                    {displayLevel}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-start text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>
                      {socialStats?.followers || 0}{" "}
                      seguidores
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>
                      {socialStats?.following || 0} seguindo
                    </span>
                  </div>
                </div>

                {!isOwnProfile && currentUser && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={
                        isFollowing ? "outline" : "default"
                      }
                      onClick={handleFollowToggle}
                      size="sm"
                      className="text-xs sm:text-sm w-full sm:w-auto"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden xs:inline">
                            Deixar de Seguir
                          </span>
                          <span className="xs:hidden">
                            Seguindo
                          </span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Seguir
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6">
              <Card>
                <CardContent className="p-3 sm:p-4 text-center">
                  <Book className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mx-auto mb-1 sm:mb-2 text-primary" />
                  <p className="text-lg sm:text-xl md:text-2xl font-bold">
                    {profile.total_books_read || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Livros Lidos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4 text-center">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mx-auto mb-1 sm:mb-2 text-primary" />
                  <p className="text-lg sm:text-xl md:text-2xl font-bold">
                    {profile.total_pages_read || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Páginas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4 text-center">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mx-auto mb-1 sm:mb-2 text-orange-500" />
                  <p className="text-lg sm:text-xl md:text-2xl font-bold">
                    {profile.current_streak || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Dias Streak
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4 text-center">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mx-auto mb-1 sm:mb-2 text-primary" />
                  <p className="text-lg sm:text-xl md:text-2xl font-bold">
                    {profile.points || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Pontos
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Books Grid */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Book className="h-4 w-4 sm:h-5 sm:w-5" />
            Livros ({books?.length || 0})
          </CardTitle>
          {/* Debug button */}
          <Button
            onClick={() => {
              console.log("Test button clicked!");
              console.log("Books:", books);
              if (books && books[0]) {
                setSelectedBook(books[0]);
                setShowSessionsDialog(true);
              }
            }}
            variant="outline"
            size="sm"
          >
            🧪 Testar Dialog (clique aqui)
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {booksLoading ? (
            <p className="text-center text-muted-foreground text-sm">
              Carregando livros...
            </p>
          ) : books && books.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => {
                    console.log(
                      "🎯 CLICK DETECTADO! Livro:",
                      book.title
                    );
                    alert(`Clicou em: ${book.title}`);
                    setSelectedBook(book);
                    setShowSessionsDialog(true);
                  }}
                  className="aspect-[2/3] relative rounded-md sm:rounded-lg overflow-hidden cursor-pointer shadow-md sm:shadow-lg hover:ring-2 hover:ring-primary transition-all bg-blue-500"
                  style={{ border: "3px solid red" }}
                >
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center pointer-events-none">
                      <Book className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-1.5 sm:p-2 pointer-events-none">
                    <div className="text-white text-[10px] sm:text-xs text-center w-full mb-1">
                      <p className="font-semibold truncate">
                        {book.title}
                      </p>
                      <p className="truncate text-white/80 text-[9px] sm:text-xs">
                        {book.author}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-white/90 text-[9px] sm:text-xs">
                      <BookOpen className="h-3 w-3" />
                      <span>Ver sessões</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
              Nenhum livro registrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Reading Sessions Dialog */}
      <Dialog
        open={showSessionsDialog}
        onOpenChange={setShowSessionsDialog}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Sessões de Leitura
            </DialogTitle>
            <DialogDescription>
              {selectedBook && (
                <div className="flex items-start gap-3 mt-2">
                  {selectedBook.cover_url ? (
                    <img
                      src={selectedBook.cover_url}
                      alt={selectedBook.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-muted flex items-center justify-center rounded">
                      <Book className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">
                      {selectedBook.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBook.author}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1"
                    >
                      {selectedBook.status}
                    </Badge>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {sessionsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 border rounded-lg animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : readingSessions &&
              readingSessions.length > 0 ? (
              <div className="space-y-3">
                {readingSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-semibold">
                          {format(
                            new Date(session.session_date),
                            "dd 'de' MMMM 'de' yyyy",
                            {
                              locale: ptBR,
                            }
                          )}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {session.pages_read} páginas
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(
                            new Date(session.created_at),
                            "HH:mm",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>
                          {session.pages_read} páginas lidas
                        </span>
                      </div>
                    </div>

                    {session.notes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-sm text-foreground">
                            {session.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Total de sessões:{" "}
                    <span className="font-semibold">
                      {readingSessions.length}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total de páginas:{" "}
                    <span className="font-semibold">
                      {readingSessions.reduce(
                        (sum, s) => sum + s.pages_read,
                        0
                      )}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">
                  Nenhuma sessão de leitura registrada
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Achievements */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
            Conquistas ({achievements?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {achievementsLoading ? (
            <p className="text-center text-muted-foreground text-sm">
              Carregando conquistas...
            </p>
          ) : achievements && achievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {achievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">
                      {achievement.achievements.icon}
                    </div>
                    <p className="font-semibold text-xs sm:text-sm line-clamp-1">
                      {achievement.achievements.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">
                      {achievement.achievements.description}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs"
                    >
                      {achievement.achievements.rarity}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
              Nenhuma conquista desbloqueada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

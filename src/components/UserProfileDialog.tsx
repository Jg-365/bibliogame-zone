import { useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useFollowUser, useUnfollowUser, useIsFollowing } from "@/hooks/useSocial";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Trophy, Calendar, Star, User, BookOpen, Clock, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

interface UserProfileDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReadingSession {
  id: string;
  book_id: string;
  session_date: string;
  pages_read: number;
  notes: string | null;
  created_at: string;
}

export const UserProfileDialog = ({ userId, open, onOpenChange }: UserProfileDialogProps) => {
  const { data: userProfileData, isLoading } = useUserProfile(userId);
  const { data: isFollowing } = useIsFollowing(userId);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  // Fetch reading sessions for selected book
  const { data: readingSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["book-reading-sessions", selectedBook?.id],
    queryFn: async () => {
      if (!selectedBook) return [];

      const { data, error } = await supabase
        .from("reading_sessions")
        .select("*")
        .eq("book_id", selectedBook.id)
        .order("session_date", { ascending: false });

      if (error) {
        console.error("Error fetching reading sessions:", error);
        throw error;
      }
      return data as ReadingSession[];
    },
    enabled: !!selectedBook,
  });

  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!userProfileData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-8">
            <p>Usuário não encontrado</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { profile, books, achievements, stats } = userProfileData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 sm:p-6 pb-3">
          <DialogTitle className="text-lg sm:text-xl">Perfil do Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Header do Perfil - Responsivo */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>
                <User className="h-8 w-8 sm:h-10 sm:w-10" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left w-full">
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                {profile.full_name || profile.username}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">@{profile.username}</p>
              {profile.bio && (
                <p className="mt-1 sm:mt-2 text-sm sm:text-base line-clamp-2">{profile.bio}</p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mt-2 sm:mt-3">
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {stats.level}
                </Badge>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {stats.points} <span className="hidden xs:inline">páginas lidas</span>
                  <span className="xs:hidden">pgs</span>
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Sequência: {stats.currentStreak}d
                </span>
              </div>
            </div>

            <Button
              onClick={handleFollowToggle}
              variant={isFollowing ? "outline" : "default"}
              disabled={followMutation.isPending || unfollowMutation.isPending}
              size="sm"
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              {isFollowing ? "Deixar de seguir" : "Seguir"}
            </Button>
          </div>

          {/* Stats Cards - Grid Responsivo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <Book className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-primary" />
                <div className="text-lg sm:text-2xl font-bold">{stats.completedBooks}</div>
                <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
                  Livros
                  <span className="hidden xs:inline"> Completos</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-yellow-500" />
                <div className="text-lg sm:text-2xl font-bold">{stats.totalAchievements}</div>
                <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
                  Conquistas
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <Star className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-purple-500" />
                <div className="text-lg sm:text-2xl font-bold">{stats.totalPagesRead}</div>
                <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
                  Páginas
                  <span className="hidden xs:inline"> Lidas</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-green-500" />
                <div className="text-lg sm:text-2xl font-bold">{stats.currentStreak}</div>
                <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
                  Sequência
                  <span className="hidden xs:inline"> Atual</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs para Livros e Conquistas */}
          <Tabs defaultValue="books" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="books" className="text-xs sm:text-sm py-2">
                📚 Livros ({books.length})
              </TabsTrigger>
              <TabsTrigger value="achievements" className="text-xs sm:text-sm py-2">
                🏆 Conquistas ({achievements.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="books" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              {books.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-80 sm:max-h-96 overflow-y-auto pr-2">
                  {books.map(book => (
                    <Card
                      key={book.id}
                      className="cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => {
                        setSelectedBook(book);
                        setShowSessionsDialog(true);
                      }}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex gap-2 sm:gap-3">
                          {book.cover_url && (
                            <img
                              src={book.cover_url}
                              alt={book.title}
                              className="w-12 h-16 sm:w-16 sm:h-20 object-cover rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base line-clamp-2">
                              {book.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {book.author}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                              <Badge
                                variant={
                                  book.status === "completed"
                                    ? "default"
                                    : book.status === "reading"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {book.status === "completed"
                                  ? "Completo"
                                  : book.status === "reading"
                                  ? "Lendo"
                                  : "Quer Ler"}
                              </Badge>
                              {book.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs sm:text-sm">{book.rating}</span>
                                </div>
                              )}
                            </div>
                            {book.total_pages && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {book.pages_read || 0} / {book.total_pages} páginas
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-sm text-muted-foreground">
                  Nenhum livro encontrado
                </div>
              )}
            </TabsContent>

            <TabsContent value="achievements" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-80 sm:max-h-96 overflow-y-auto pr-2">
                  {achievements.map(userAchievement => (
                    <Card key={userAchievement.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="text-xl sm:text-2xl flex-shrink-0">
                            {userAchievement.achievements.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base truncate">
                              {userAchievement.achievements.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                              {userAchievement.achievements.description}
                            </p>
                            <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                              {new Date(userAchievement.unlocked_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-sm text-muted-foreground">
                  Nenhuma conquista desbloqueada
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Reading Sessions Dialog - Responsivo */}
      <Dialog open={showSessionsDialog} onOpenChange={setShowSessionsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 sm:p-6 pb-3">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              Sessões de Leitura
            </DialogTitle>
            <DialogDescription>
              {selectedBook && (
                <div className="flex items-start gap-2 sm:gap-3 mt-2">
                  {selectedBook.cover_url ? (
                    <img
                      src={selectedBook.cover_url}
                      alt={selectedBook.title}
                      className="w-12 h-16 sm:w-16 sm:h-24 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-16 sm:w-16 sm:h-24 bg-muted flex items-center justify-center rounded">
                      <Book className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                      {selectedBook.title}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {selectedBook.author}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {selectedBook.status === "completed"
                        ? "Completo"
                        : selectedBook.status === "reading"
                        ? "Lendo"
                        : "Quer Ler"}
                    </Badge>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4 px-4 sm:px-6 pb-4 sm:pb-6">
            {sessionsLoading ? (
              <div className="space-y-2 sm:space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 sm:p-4 border rounded-lg animate-pulse">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : readingSessions && readingSessions.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {readingSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                        <span className="font-semibold text-xs sm:text-sm">
                          {format(new Date(session.session_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {session.pages_read} pgs
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(session.created_at), "HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span className="text-xs sm:text-sm">{session.pages_read} pgs</span>
                      </div>
                    </div>

                    {session.notes && (
                      <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-muted/50 rounded-md">
                        <div className="flex items-start gap-2">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-xs sm:text-sm text-foreground">{session.notes}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                <div className="text-center pt-3 sm:pt-4 border-t">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total de sessões:{" "}
                    <span className="font-semibold">{readingSessions.length}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total de páginas:{" "}
                    <span className="font-semibold">
                      {readingSessions.reduce((sum, s) => sum + s.pages_read, 0)}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-20" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma sessão de leitura registrada
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

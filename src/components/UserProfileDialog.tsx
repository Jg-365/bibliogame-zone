import { useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  useFollowUser,
  useUnfollowUser,
  useIsFollowing,
} from "@/hooks/useSocial";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Book,
  Trophy,
  Calendar,
  Star,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserProfileDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileDialog = ({
  userId,
  open,
  onOpenChange,
}: UserProfileDialogProps) => {
  const { data: userProfileData, isLoading } =
    useUserProfile(userId);
  const { data: isFollowing } = useIsFollowing(userId);

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

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

  const { profile, books, achievements, stats } =
    userProfileData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Perfil do Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header do Perfil */}
          <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={profile.avatar_url || undefined}
              />
              <AvatarFallback>
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {profile.full_name || profile.username}
              </h2>
              <p className="text-muted-foreground">
                @{profile.username}
              </p>
              {profile.bio && (
                <p className="mt-2">{profile.bio}</p>
              )}

              <div className="flex items-center gap-4 mt-3">
                <Badge variant="secondary">
                  {stats.level}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {stats.points} páginas lidas
                </span>
                <span className="text-sm text-muted-foreground">
                  Sequência: {stats.currentStreak} dias
                </span>
              </div>
            </div>

            <Button
              onClick={handleFollowToggle}
              variant={isFollowing ? "outline" : "default"}
              disabled={
                followMutation.isPending ||
                unfollowMutation.isPending
              }
            >
              {isFollowing ? "Deixar de seguir" : "Seguir"}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Book className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">
                  {stats.completedBooks}
                </div>
                <div className="text-sm text-muted-foreground">
                  Livros Completos
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">
                  {stats.totalAchievements}
                </div>
                <div className="text-sm text-muted-foreground">
                  Conquistas
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">
                  {stats.totalPagesRead}
                </div>
                <div className="text-sm text-muted-foreground">
                  Páginas Lidas
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">
                  {stats.currentStreak}
                </div>
                <div className="text-sm text-muted-foreground">
                  Sequência Atual
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs para Livros e Conquistas */}
          <Tabs defaultValue="books" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="books">
                Livros ({books.length})
              </TabsTrigger>
              <TabsTrigger value="achievements">
                Conquistas ({achievements.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="books"
              className="space-y-4"
            >
              {books.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {books.map((book) => (
                    <Card key={book.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          {book.cover_url && (
                            <img
                              src={book.cover_url}
                              alt={book.title}
                              className="w-16 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold line-clamp-2">
                              {book.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {book.author}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={
                                  book.status ===
                                  "completed"
                                    ? "default"
                                    : book.status ===
                                      "reading"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {book.status === "completed"
                                  ? "Completo"
                                  : book.status ===
                                    "reading"
                                  ? "Lendo"
                                  : "Quer Ler"}
                              </Badge>
                              {book.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">
                                    {book.rating}
                                  </span>
                                </div>
                              )}
                            </div>
                            {book.total_pages && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {book.pages_read || 0} /{" "}
                                {book.total_pages} páginas
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum livro encontrado
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="achievements"
              className="space-y-4"
            >
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {achievements.map((userAchievement) => (
                    <Card key={userAchievement.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {
                              userAchievement.achievements
                                .icon
                            }
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {
                                userAchievement.achievements
                                  .title
                              }
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {
                                userAchievement.achievements
                                  .description
                              }
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Desbloqueada em{" "}
                              {new Date(
                                userAchievement.unlocked_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma conquista desbloqueada
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

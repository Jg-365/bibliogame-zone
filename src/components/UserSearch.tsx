import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Book, Users, UserPlus, UserMinus, Trophy, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchUsers, useFollowUser, useUnfollowUser, useIsFollowing } from "@/hooks/useSocial";
import { UserProfileDialog } from "@/components/UserProfileDialog";

interface UserWithStats {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  points: number;
  level: string;
  booksCompleted: number;
  totalPagesRead: number;
  readingStreak: number;
}

const UserCard = ({ userProfile }: { userProfile: UserWithStats }) => {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <Card
        className="hover:shadow-lg transition-all cursor-pointer"
        onClick={() => setShowProfile(true)}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Avatar */}
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 ring-2 ring-background shadow-md">
              <AvatarImage src={userProfile.avatarUrl || ""} />
              <AvatarFallback className="text-lg sm:text-xl font-semibold">
                {userProfile.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg truncate">
                {userProfile.fullName}
              </h3>
              {userProfile.username && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  @{userProfile.username}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  <span className="font-medium">{userProfile.points}</span> pts
                </span>
                <span className="flex items-center gap-1">
                  <Book className="h-3 w-3 text-primary" />
                  <span className="font-medium">{userProfile.booksCompleted}</span> livros
                </span>
              </div>

              {/* Level Badge */}
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {userProfile.level}
                </span>
              </div>
            </div>

            {/* Seta indicadora */}
            <Eye className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>

      <UserProfileDialog
        userId={userProfile.userId}
        open={showProfile}
        onOpenChange={setShowProfile}
      />
    </>
  );
};

export const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const searchUsers = useSearchUsers();

  const handleSearch = React.useCallback(() => {
    if (searchQuery.length >= 2) {
      searchUsers.mutate(searchQuery);
    }
  }, [searchQuery, searchUsers]);

  // Trigger search when user stops typing for 500ms
  React.useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers.mutate(searchQuery);
      } else if (searchQuery.length === 0) {
        searchUsers.reset(); // Clear results when search is empty
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]); // Removido searchUsers das dependências

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Search Input */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 sm:pb-6">
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            Pesquisar Usuários
          </h2>
          <p className="text-sm text-muted-foreground">
            Encontre outros leitores para seguir e se inspirar
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              placeholder="Digite nome ou usuário..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 sm:pl-11 h-11 sm:h-12 text-base"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.length >= 2 && (
        <div className="space-y-3 sm:space-y-4">
          {searchUsers.isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Pesquisando usuários...</p>
              </div>
            </div>
          ) : searchUsers.error ? (
            <Card className="p-6 sm:p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-3 sm:p-4">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base sm:text-lg">Erro ao pesquisar</h3>
                  <p className="text-sm text-destructive">{searchUsers.error.message}</p>
                </div>
              </div>
            </Card>
          ) : !searchUsers.data || searchUsers.data.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-muted p-3 sm:p-4">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base sm:text-lg">Nenhum usuário encontrado</h3>
                  <p className="text-sm text-muted-foreground">
                    Nenhum resultado para "{searchQuery}"
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground px-1">
                {searchUsers.data.length}{" "}
                {searchUsers.data.length === 1 ? "resultado encontrado" : "resultados encontrados"}
              </p>
              {searchUsers.data.map(userProfile => (
                <UserCard key={userProfile.userId} userProfile={userProfile} />
              ))}
            </>
          )}
        </div>
      )}

      {searchQuery.length < 2 && (
        <Card className="p-8 sm:p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-muted p-3 sm:p-4">
              <Search className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base sm:text-lg">Busque por usuários</h3>
              <p className="text-sm text-muted-foreground">
                Digite pelo menos 2 caracteres para começar
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

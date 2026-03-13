import React, { useState } from "react";
import { Book, Eye, Search, Trophy, Users } from "lucide-react";
import { useSearchUsers } from "@/hooks/useSocial";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface UserWithStats {
  userId?: string;
  id?: string;
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
  const resolvedUserId = userProfile.userId ?? userProfile.id ?? "";

  return (
    <>
      <Card
        className="cursor-pointer border-border/70 transition-all hover:-translate-y-0.5 hover:shadow-md"
        onClick={() => setShowProfile(true)}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-background shadow-sm sm:h-14 sm:w-14">
              <AvatarImage src={userProfile.avatarUrl || ""} />
              <AvatarFallback className="text-lg font-semibold sm:text-xl">
                {userProfile.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold sm:text-lg">
                {userProfile.fullName}
              </h3>
              {userProfile.username ? (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                  @{userProfile.username}
                </p>
              ) : null}

              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
                <span className="inline-flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-accent-foreground" />
                  <span className="font-medium">{userProfile.points}</span> pts
                </span>
                <span className="inline-flex items-center gap-1">
                  <Book className="h-3 w-3 text-primary" />
                  <span className="font-medium">{userProfile.booksCompleted}</span> livros
                </span>
              </div>

              <div className="mt-2">
                <Badge variant="secondary">{userProfile.level}</Badge>
              </div>
            </div>

            <Eye className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <UserProfileDialog userId={resolvedUserId} open={showProfile} onOpenChange={setShowProfile} />
    </>
  );
};

export const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const searchUsers = useSearchUsers();

  const handleSearch = React.useCallback(() => {
    if (searchQuery.length >= 2) {
      searchUsers.mutate(searchQuery);
    }
  }, [searchQuery, searchUsers]);

  React.useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers.mutate(searchQuery);
      } else if (searchQuery.length === 0) {
        searchUsers.reset();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, searchUsers]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-6">
      <Card className="sticky top-0 z-10 border-border/70 bg-background/95 backdrop-blur-sm">
        <CardContent className="space-y-2 p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            Pesquisar usuários
          </h2>
          <p className="text-sm text-muted-foreground">
            Encontre outros leitores para se conectar e se inspirar.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:h-5 sm:w-5" />
            <Input
              placeholder="Digite nome ou usuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 text-base sm:h-12 sm:pl-11"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {searchQuery.length >= 2 ? (
        <div className="space-y-3 sm:space-y-4">
          {searchUsers.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchUsers.error ? (
            <Card className="p-6 text-center sm:p-8">
              <div className="space-y-1">
                <h3 className="text-base font-semibold sm:text-lg">Erro ao pesquisar</h3>
                <p className="text-sm text-destructive">{searchUsers.error.message}</p>
              </div>
            </Card>
          ) : !searchUsers.data || searchUsers.data.length === 0 ? (
            <Card className="p-8 text-center sm:p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-muted p-3 sm:p-4">
                  <Users className="h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold sm:text-lg">Nenhum usuário encontrado</h3>
                  <p className="text-sm text-muted-foreground">
                    Nenhum resultado para "{searchQuery}".
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <p className="px-1 text-sm text-muted-foreground">
                {searchUsers.data.length}{" "}
                {searchUsers.data.length === 1 ? "resultado encontrado" : "resultados encontrados"}
              </p>
              {searchUsers.data.map((userProfile) => (
                <UserCard key={userProfile.userId ?? userProfile.id} userProfile={userProfile} />
              ))}
            </>
          )}
        </div>
      ) : (
        <Card className="p-8 text-center sm:p-12">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-muted p-3 sm:p-4">
              <Search className="h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold sm:text-lg">Busque por usuários</h3>
              <p className="text-sm text-muted-foreground">
                Digite pelo menos 2 caracteres para começar.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

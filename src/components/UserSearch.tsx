import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Search,
  Book,
  Users,
  UserPlus,
  UserMinus,
  Trophy,
  Eye,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useSearchUsers,
  useFollowUser,
  useUnfollowUser,
  useIsFollowing,
} from "@/hooks/useSocial";
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

const UserCard = ({
  userProfile,
}: {
  userProfile: UserWithStats;
}) => {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const searchUsers = useSearchUsers();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const { data: isFollowing, isLoading: isCheckingFollow } =
    useIsFollowing(userProfile.userId);

  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowUser.mutate(userProfile.userId);
    } else {
      followUser.mutate(userProfile.userId);
    }
  };

  const isOwnProfile = user?.id === userProfile.userId;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={userProfile.avatarUrl || ""}
            />
            <AvatarFallback>
              {userProfile.fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {userProfile.fullName}
              </h3>
              {userProfile.username && (
                <span className="text-sm text-muted-foreground">
                  @{userProfile.username}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {userProfile.points} pts
              </span>
              <span className="flex items-center gap-1">
                <Book className="h-3 w-3" />
                {userProfile.booksCompleted} livros
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {userProfile.level}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Ver Perfil
          </Button>
          {!isOwnProfile && (
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollowToggle}
              disabled={
                isCheckingFollow ||
                followUser.isPending ||
                unfollowUser.isPending
              }
            >
              {isFollowing ? (
                <>
                  <UserMinus className="h-4 w-4 mr-1" />
                  Seguindo
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Seguir
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <UserProfileDialog
        userId={userProfile.userId}
        open={showProfile}
        onOpenChange={setShowProfile}
      />
    </Card>
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Pesquisar Usuários
        </CardTitle>
        <CardDescription>
          Encontre outros leitores para seguir e se inspirar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou nome de usuário..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div className="space-y-3">
            {searchUsers.isPending ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">
                  Pesquisando usuários...
                </p>
              </div>
            ) : searchUsers.error ? (
              <div className="text-center py-4">
                <p className="text-sm text-destructive">
                  Erro ao pesquisar usuários:{" "}
                  {searchUsers.error.message}
                </p>
              </div>
            ) : !searchUsers.data ||
              searchUsers.data.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Nenhum usuário encontrado com "
                  {searchQuery}"
                </p>
              </div>
            ) : (
              searchUsers.data.map((userProfile) => (
                <UserCard
                  key={userProfile.userId}
                  userProfile={userProfile}
                />
              ))
            )}
          </div>
        )}

        {searchQuery.length < 2 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              Digite pelo menos 2 caracteres para pesquisar
              usuários
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

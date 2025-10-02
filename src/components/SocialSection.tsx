import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { Plus, MessageCircle } from "lucide-react";

export const SocialSection: React.FC = () => {
  const { posts, isLoading, refetch } = usePosts();

  const handlePostCreated = () => {
    refetch();
  };

  const handlePostDeleted = () => {
    refetch();
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header - otimizado para mobile */}
      <div className="text-center space-y-2 px-4 sm:px-0">
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Compartilhe sua paixão pela leitura e conecte-se com outros leitores
        </p>
      </div>

      {/* Create Post Section - sticky no mobile */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:static px-4 py-3 sm:px-0 sm:py-0 space-y-4">
        <CreatePost onPostCreated={handlePostCreated} />
      </div>

      {/* Posts Feed - otimizado para mobile */}
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse shadow-sm">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 sm:h-4 bg-gray-300 rounded w-20 sm:w-24"></div>
                      <div className="h-2 sm:h-3 bg-gray-300 rounded w-12 sm:w-16"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="h-3 sm:h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-3 sm:h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-24 sm:h-32 bg-gray-300 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="text-center py-8 sm:py-12 mx-auto max-w-md shadow-sm">
            <CardContent className="px-4 sm:px-6">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-primary/10 rounded-full">
                  <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="mb-2 text-lg sm:text-xl">Nenhum post ainda</CardTitle>
              <CardDescription className="mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
                Seja o primeiro a compartilhar sua experiência de leitura!
              </CardDescription>
              <CreatePost
                trigger={
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Post
                  </Button>
                }
                onPostCreated={handlePostCreated}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

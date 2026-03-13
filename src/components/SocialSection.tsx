import React from "react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { usePosts } from "@/hooks/usePostsOptimized";
import { PostListSkeleton, ErrorState } from "@/components/ui/LoadingStates";
import { Plus, MessageCircle } from "lucide-react";

export const SocialSection: React.FC = () => {
  const { posts: rawPosts, isLoading, error, refetch } = usePosts();
  const posts = Array.isArray(rawPosts) ? rawPosts : [];

  const handlePostCreated = () => {
    refetch();
  };

  const handlePostDeleted = () => {
    refetch();
  };

  return (
    <div className="space-y-5 pb-20 sm:space-y-6 sm:pb-8">
      {/* Create Post Section - sticky no mobile */}
      <div className="sticky top-14 z-20 -mx-4 border-b border-border/60 bg-background/92 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-none sm:bg-transparent sm:px-0 sm:py-4 sm:backdrop-blur-none">
        <CreatePost onPostCreated={handlePostCreated} />
      </div>

      {/* Posts Feed */}
      <div className="space-y-4 sm:space-y-6">
        {isLoading ? (
          <PostListSkeleton count={3} />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} message="Erro ao carregar o feed social" />
        ) : posts.length === 0 ? (
          <Card className="mx-auto max-w-md py-12 text-center shadow-sm">
            <CardContent className="px-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="mb-2 text-xl">Nenhum post ainda</CardTitle>
              <CardDescription className="mb-6 leading-relaxed">
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
          <div className="space-y-4 sm:space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

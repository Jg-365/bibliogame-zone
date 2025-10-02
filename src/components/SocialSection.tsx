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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">
          Compartilhe sua paixão pela leitura e conecte-se com outros leitores
        </p>
      </div>

      {/* Create Post Section */}
      <div className="space-y-4">
        <CreatePost onPostCreated={handlePostCreated} />
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-32 bg-gray-300 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="mb-2">Nenhum post ainda</CardTitle>
              <CardDescription className="mb-6">
                Seja o primeiro a compartilhar sua experiência de leitura!
              </CardDescription>
              <CreatePost
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Post
                  </Button>
                }
                onPostCreated={handlePostCreated}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

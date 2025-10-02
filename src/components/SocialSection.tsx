import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { useResponsive } from "@/shared/utils/responsive";
import { Users, TrendingUp, Plus, Heart, MessageCircle } from "lucide-react";

export const SocialSection: React.FC = () => {
  const { posts, isLoading, refetch } = usePosts();
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState("posts");

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
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          📚 Instagram de Livros
        </h1>
        <p className="text-muted-foreground">
          Compartilhe sua paixão pela leitura e conecte-se com outros leitores
        </p>
      </div>

      {/* Tabs for different social features */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>Posts</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Atividades</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Ranking</span>
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-6">
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
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <ActivityFeed />
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Leaderboard />
        </TabsContent>
      </Tabs>

      {/* Future Features Teaser */}
      <Card className="border-dashed border-2 bg-gradient-to-r from-primary/5 to-purple-500/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>🚀 Próximas Funcionalidades</CardTitle>
          <CardDescription>
            Estamos trabalhando em recursos incríveis para tornar sua experiência ainda melhor!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>✅ Posts sobre
              leituras (Concluído!)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>✅ Curtidas e
              comentários (Concluído!)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              🔄 Sistema de seguir amigos
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              🔄 Grupos de leitura
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              💡 Recomendações de livros
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              💡 Desafios de leitura em grupo
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

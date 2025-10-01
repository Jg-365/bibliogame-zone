import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  MessageCircle,
  Share2,
  BookOpen,
  Trophy,
  Camera,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Post {
  id: string;
  user_id: string;
  content: string;
  type:
    | "reading_session"
    | "achievement"
    | "reflection"
    | "photo";
  metadata: Record<string, any>;
  created_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export const SocialPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState("");
  const [postType, setPostType] = useState<
    "reflection" | "photo"
  >("reflection");

  // Fetch feed posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["social-feed", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes_count:post_likes(count),
          comments_count:post_comments(count),
          is_liked:post_likes!inner(user_id)
        `
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Post[];
    },
    enabled: !!user?.id,
  });

  // Create post mutation
  const createPost = useMutation({
    mutationFn: async ({
      content,
      type,
      metadata,
    }: {
      content: string;
      type: string;
      metadata?: Record<string, any>;
    }) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content,
          type,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["social-feed"],
      });
      setNewPost("");
      toast({
        title: "Post criado!",
        description:
          "Sua publicação foi compartilhada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Like post mutation
  const likePost = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["social-feed"],
      });
    },
  });

  const handleCreatePost = () => {
    if (!newPost.trim()) return;

    createPost.mutate({
      content: newPost,
      type: postType,
      metadata: {},
    });
  };

  const handleLike = (postId: string) => {
    likePost.mutate(postId);
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case "reading_session":
        return (
          <BookOpen className="w-4 h-4 text-blue-500" />
        );
      case "achievement":
        return (
          <Trophy className="w-4 h-4 text-yellow-500" />
        );
      case "reflection":
        return (
          <Sparkles className="w-4 h-4 text-purple-500" />
        );
      case "photo":
        return (
          <Camera className="w-4 h-4 text-green-500" />
        );
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case "reading_session":
        return "Sessão de Leitura";
      case "achievement":
        return "Conquista";
      case "reflection":
        return "Reflexão";
      case "photo":
        return "Foto";
      default:
        return "Post";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 pt-16 md:pt-20 pb-20 md:pb-8">
      <div className="container mx-auto px-4 max-w-2xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Feed Social
          </h1>
          <p className="text-muted-foreground">
            Compartilhe suas leituras e descubra o que
            outros estão lendo
          </p>
        </motion.div>

        {/* Create Post Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url}
                  />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Compartilhe uma reflexão sobre sua leitura..."
                    value={newPost}
                    onChange={(e) =>
                      setNewPost(e.target.value)
                    }
                    rows={3}
                    className="resize-none border-none shadow-none focus-visible:ring-0 p-0 text-base"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={
                      postType === "reflection"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setPostType("reflection")
                    }
                    className="text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Reflexão
                  </Button>
                  <Button
                    variant={
                      postType === "photo"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setPostType("photo")}
                    className="text-xs"
                  >
                    <Camera className="w-3 h-3 mr-1" />
                    Foto
                  </Button>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={
                    !newPost.trim() || createPost.isPending
                  }
                  size="sm"
                  className="px-6"
                >
                  {createPost.isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Publicar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Posts Feed */}
        <div className="space-y-4">
          <AnimatePresence>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.1,
                    }}
                  >
                    <Card className="animate-pulse">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-300 rounded w-1/4" />
                            <div className="h-3 bg-gray-300 rounded w-1/6" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-full" />
                          <div className="h-4 bg-gray-300 rounded w-3/4" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12"
              >
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Nenhum post ainda
                </h3>
                <p className="text-muted-foreground mb-4">
                  Seja o primeiro a compartilhar suas
                  leituras!
                </p>
              </motion.div>
            ) : (
              posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                  }}
                  layout
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={
                                post.profiles?.avatar_url ||
                                ""
                              }
                            />
                            <AvatarFallback>
                              {post.profiles?.username
                                ?.charAt(0)
                                .toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">
                              {post.profiles?.username ||
                                "Usuário"}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>
                                {format(
                                  new Date(post.created_at),
                                  "dd 'de' MMM 'às' HH:mm",
                                  { locale: ptBR }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          <div className="flex items-center space-x-1">
                            {getPostIcon(post.type)}
                            <span>
                              {getPostTypeLabel(post.type)}
                            </span>
                          </div>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed mb-4">
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center space-x-4">
                          <motion.button
                            onClick={() =>
                              handleLike(post.id)
                            }
                            className={`flex items-center space-x-1 text-sm ${
                              post.is_liked
                                ? "text-red-500"
                                : "text-muted-foreground hover:text-red-500"
                            } transition-colors`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                post.is_liked
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                            <span>
                              {post.likes_count || 0}
                            </span>
                          </motion.button>

                          <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            <span>
                              {post.comments_count || 0}
                            </span>
                          </button>
                        </div>

                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {!isLoading && posts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Users className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">
              Feed vazio
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Comece seguindo outros leitores ou crie sua
              primeira publicação para ver o feed ganhar
              vida!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

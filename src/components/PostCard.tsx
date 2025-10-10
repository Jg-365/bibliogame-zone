import React, { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Heart,
  MessageCircle,
  Share2,
  BookOpen,
  MoreHorizontal,
  Trash2,
  Send,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import {
  usePosts,
  usePostComments,
  type SocialPost,
} from "@/hooks/usePostsOptimized";
import { useResponsive } from "@/shared/utils/responsive";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: SocialPost;
  onPostDeleted?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostDeleted,
}) => {
  const { user } = useAuth();
  const {
    toggleLike,
    deletePost,
    isTogglingLike,
    isDeletingPost,
  } = usePosts();
  const { comments, createComment, isCreatingComment } =
    usePostComments(post.id);
  const { isMobile } = useResponsive();

  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const isOwnPost = post.user_id === user?.id;

  const handleLike = () => {
    toggleLike({
      postId: post.id,
      isLiked: post.is_liked,
    });
  };

  const handleComment = () => {
    if (!newComment.trim()) return;

    createComment(
      {
        post_id: post.id,
        content: newComment.trim(),
      },
      {
        onSuccess: () => {
          setNewComment("");
        },
      }
    );
  };

  const handleDeletePost = () => {
    deletePost(post.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        onPostDeleted?.();
      },
    });
  };

  const handleDeleteComment = (commentId: string) => {
    console.log(
      "Delete comment não implementado ainda:",
      commentId
    );
  };

  const timeAgo = formatDistanceToNow(
    new Date(post.created_at),
    {
      addSuffix: true,
      locale: ptBR,
    }
  );

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-md hover:shadow-lg transition-shadow border rounded-lg overflow-hidden">
      <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage
                src={post.user_avatar_url || ""}
              />
              <AvatarFallback className="text-xs sm:text-sm">
                {post.user_username
                  ?.charAt(0)
                  .toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs sm:text-sm truncate">
                {post.user_username || "Usuario"}
              </p>
              <p className="text-xs text-muted-foreground">
                {timeAgo}
              </p>
            </div>
          </div>

          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Conteúdo do post */}
        <div className="space-y-3">
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {/* Livro relacionado */}
          {post.book_id && post.book_title && (
            <Card className="bg-muted/50 border-0">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  {post.book_cover_url ? (
                    <img
                      src={post.book_cover_url}
                      alt={post.book_title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-sm">
                      {post.book_title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {post.book_author}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Imagem do post */}
          {post.image_url && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={post.image_url}
                alt="Post image"
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
        </div>

        {/* Estatísticas e ações */}
        <div className="space-y-3">
          {/* Contadores */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              {post.likes_count > 0 && (
                <span className="flex items-center space-x-1">
                  <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                  <span>{post.likes_count}</span>
                </span>
              )}
              {post.comments_count > 0 && (
                <span className="flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{post.comments_count}</span>
                </span>
              )}
            </div>
          </div>

          {/* Botões de ação - otimizados para mobile */}
          <div className="flex items-center justify-between border-t pt-2 sm:pt-3">
            <div className="flex items-center space-x-0 sm:space-x-1 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isTogglingLike}
                className={cn(
                  "flex items-center space-x-1 sm:space-x-2 flex-1 justify-center sm:justify-start sm:flex-none",
                  post.is_liked && "text-red-500"
                )}
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    post.is_liked && "fill-current"
                  )}
                />
                <span className="hidden sm:inline">
                  Curtir
                </span>
                {post.likes_count > 0 && (
                  <span className="text-xs sm:hidden">
                    ({post.likes_count})
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setShowComments(!showComments)
                }
                className="flex items-center space-x-1 sm:space-x-2 flex-1 justify-center sm:justify-start sm:flex-none"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Comentar
                </span>
                {comments.length > 0 && (
                  <span className="text-xs sm:hidden">
                    ({comments.length})
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 sm:space-x-2 flex-1 justify-center sm:justify-start sm:flex-none"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Compartilhar
                </span>
              </Button>
            </div>
          </div>

          {/* Seção de comentários - otimizada para mobile */}
          {showComments && (
            <div className="space-y-2 sm:space-y-3 border-t pt-2 sm:pt-3">
              {/* Lista de comentários */}
              {comments.length > 0 && (
                <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex space-x-2 sm:space-x-3"
                    >
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage
                          src={
                            comment.user_avatar_url || ""
                          }
                        />
                        <AvatarFallback className="text-xs">
                          {comment.user_username
                            ?.charAt(0)
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted rounded-lg p-2 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-xs truncate pr-2">
                            {comment.user_username ||
                              "Usuario"}
                          </p>
                          {comment.user_id === user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteComment(
                                  comment.id
                                )
                              }
                              disabled={false}
                              className="h-4 w-4 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm mt-1">
                          {comment.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(
                            new Date(comment.created_at),
                            {
                              addSuffix: true,
                              locale: ptBR,
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Campo para novo comentário - otimizado para mobile */}
              <div className="flex space-x-2">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url}
                  />
                  <AvatarFallback className="text-xs">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-1 sm:space-x-2">
                  <Textarea
                    placeholder={
                      isMobile
                        ? "Comentar..."
                        : "Escreva um comentário..."
                    }
                    value={newComment}
                    onChange={(e) =>
                      setNewComment(e.target.value)
                    }
                    rows={1}
                    className="resize-none text-sm min-w-0 flex-1"
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey
                      ) {
                        e.preventDefault();
                        handleComment();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleComment}
                    disabled={
                      !newComment.trim() ||
                      isCreatingComment
                    }
                    className="px-2 sm:px-3"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Dialog de confirmação para excluir post */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir post</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este post? Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeletingPost}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              disabled={isDeletingPost}
            >
              {isDeletingPost ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BookOpen,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePostComments, usePosts, type SocialPost } from "@/hooks/usePostsOptimized";
import { useResponsive } from "@/shared/utils/responsive";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/haptics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: SocialPost;
  onPostDeleted?: () => void;
}

export const PostCard = React.memo<PostCardProps>(({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { toggleLike, deletePost, isTogglingLike, isDeletingPost } = usePosts();
  const { comments, createComment, deleteComment, isCreatingComment, isDeletingComment } =
    usePostComments(post.id);
  const { isMobile } = useResponsive();

  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isOwnPost = post.user_id === user?.id;

  const handleLike = () => {
    triggerHapticFeedback(12);
    toggleLike({
      postId: post.id,
      isLiked: post.is_liked,
    });
  };

  const handleComment = () => {
    if (!newComment.trim()) return;
    triggerHapticFeedback(10);

    createComment(
      {
        post_id: post.id,
        content: newComment.trim(),
      },
      {
        onSuccess: () => {
          setNewComment("");
        },
      },
    );
  };

  const handleShare = async () => {
    triggerHapticFeedback(14);
    const shareText = `${post.user_username || "Leitor"} no ReadQuest:\n\n${post.content}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "ReadQuest - Post de leitura",
          text: shareText,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        throw new Error("Compartilhamento indisponivel");
      }

      toast({
        title: "Conteudo pronto para compartilhar",
        description: "Texto copiado/compartilhado com sucesso.",
      });
    } catch {
      toast({
        title: "Nao foi possivel compartilhar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
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
    triggerHapticFeedback(10);
    deleteComment(commentId);
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="mx-auto w-full max-w-3xl border-border/70 bg-card/95 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="px-4 pb-3 pt-4 sm:px-6 sm:pt-6">
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center space-x-3">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage src={post.user_avatar_url || ""} />
              <AvatarFallback className="text-xs sm:text-sm">
                {post.user_username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold sm:text-sm">
                {post.user_username || "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>

          {isOwnPost ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="h-8 w-8 sm:h-9 sm:w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="space-y-3">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed sm:text-base">
            {post.content}
          </p>

          {post.book_id && post.book_title ? (
            <Card className="border-border/70 bg-muted/30">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  {post.book_cover_url ? (
                    <img
                      src={post.book_cover_url}
                      alt={post.book_title}
                      className="h-16 w-12 rounded object-cover dark:brightness-90 dark:contrast-110"
                    />
                  ) : (
                    <div className="flex h-16 w-12 items-center justify-center rounded bg-muted">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="line-clamp-1 text-sm font-medium">{post.book_title}</h4>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{post.book_author}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {post.image_url ? (
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border/70">
              <img
                src={post.image_url}
                alt={`Imagem do post de ${post.user_username ?? "usuário"}`}
                className="max-h-96 w-full object-cover dark:brightness-90 dark:contrast-110"
              />
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              {post.likes_count > 0 ? (
                <span className="flex items-center space-x-1">
                  <Heart className="h-3 w-3 fill-destructive text-destructive" />
                  <span>{post.likes_count}</span>
                </span>
              ) : null}
              {post.comments_count > 0 ? (
                <span className="flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{post.comments_count}</span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/70 pt-2 sm:pt-3">
            <div className="flex w-full items-center space-x-0 sm:space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isTogglingLike}
                className={cn(
                  "min-h-10 flex-1 justify-center space-x-1 sm:flex-none sm:justify-start sm:space-x-2",
                  post.is_liked && "text-destructive",
                )}
              >
                <Heart className={cn("h-4 w-4", post.is_liked && "fill-current")} />
                <span className="hidden sm:inline">Curtir</span>
                {post.likes_count > 0 ? (
                  <span className="text-xs sm:hidden">({post.likes_count})</span>
                ) : null}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments((prev) => !prev)}
                className="min-h-10 flex-1 justify-center space-x-1 sm:flex-none sm:justify-start sm:space-x-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Comentar</span>
                {comments.length > 0 ? (
                  <span className="text-xs sm:hidden">({comments.length})</span>
                ) : null}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="min-h-10 flex-1 justify-center space-x-1 sm:flex-none sm:justify-start sm:space-x-2"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
            </div>
          </div>

          {showComments ? (
            <div className="space-y-2 border-t border-border/70 pt-2 sm:space-y-3 sm:pt-3">
              {comments.length > 0 ? (
                <div className="max-h-64 space-y-2 overflow-y-auto sm:space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-2 sm:space-x-3">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage src={comment.user_avatar_url || ""} />
                        <AvatarFallback className="text-xs">
                          {comment.user_username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 rounded-[var(--radius-md)] bg-muted p-2">
                        <div className="flex items-center justify-between">
                          <p className="truncate pr-2 text-xs font-medium">
                            {comment.user_username || "Usuário"}
                          </p>
                          {comment.user_id === user?.id ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-5 w-5 p-0"
                              disabled={isDeletingComment}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm">{comment.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex space-x-2">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 space-x-1 sm:space-x-2">
                  <Textarea
                    placeholder={isMobile ? "Comentar..." : "Escreva um comentário..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={1}
                    className="min-w-0 flex-1 resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleComment();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleComment}
                    disabled={!newComment.trim() || isCreatingComment}
                    className="px-2 sm:px-3"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir post</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.
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
            <Button variant="destructive" onClick={handleDeletePost} disabled={isDeletingPost}>
              {isDeletingPost ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
});
PostCard.displayName = "PostCard";

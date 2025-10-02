import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Camera, BookOpen, PenTool, X, Upload, Plus, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { usePosts, useImageUpload } from "@/hooks/usePosts";
import { useResponsive } from "@/shared/utils/responsive";

interface CreatePostProps {
  trigger?: React.ReactNode;
  onPostCreated?: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ trigger, onPostCreated }) => {
  const { user } = useAuth();
  const { books } = useBooks();
  const { createPost, isCreatingPost } = usePosts();
  const { uploadImage, isUploading } = useImageUpload();
  const { isMobile } = useResponsive();

  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      let imageUrl: string | null = null;

      // Upload da imagem se existir
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Criar o post
      createPost(
        {
          content: content.trim(),
          book_id: selectedBookId || undefined,
          image_url: imageUrl || undefined,
        },
        {
          onSuccess: () => {
            // Reset form
            setContent("");
            setSelectedBookId("");
            setImageFile(null);
            setImagePreview("");
            setIsOpen(false);
            onPostCreated?.();
          },
        }
      );
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const selectedBook = books?.find(book => book.id === selectedBookId);

  const defaultTrigger = (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 bg-muted rounded-full px-4 py-2 text-muted-foreground">
            Compartilhe sua experiência de leitura...
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <BookOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className={`${isMobile ? "w-full h-full" : "max-w-2xl"}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <PenTool className="h-5 w-5" />
            <span>Criar Novo Post</span>
          </DialogTitle>
          <DialogDescription>
            Compartilhe sua experiência de leitura com a comunidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Usuário */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {user?.user_metadata?.username || user?.email?.split("@")[0] || "Você"}
              </p>
              <Badge variant="secondary" className="text-xs">
                Público
              </Badge>
            </div>
          </div>

          {/* Conteúdo do post */}
          <div className="space-y-2">
            <Label htmlFor="content">O que você está pensando?</Label>
            <Textarea
              id="content"
              placeholder="Compartilhe suas impressões sobre o livro, uma citação favorita, ou qualquer coisa relacionada à sua jornada de leitura..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">{content.length}/500</div>
          </div>

          {/* Seleção de livro */}
          <div className="space-y-2">
            <Label htmlFor="book">Livro relacionado (opcional)</Label>
            <Select value={selectedBookId} onValueChange={setSelectedBookId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um livro..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum livro</SelectItem>
                {books?.map(book => (
                  <SelectItem key={book.id} value={book.id}>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{book.title}</span>
                      <span className="text-muted-foreground">- {book.author}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview do livro selecionado */}
          {selectedBook && (
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  {selectedBook.cover_url ? (
                    <img
                      src={selectedBook.cover_url}
                      alt={selectedBook.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-sm">{selectedBook.title}</h4>
                    <p className="text-sm text-muted-foreground">{selectedBook.author}</p>
                    {selectedBook.status === "reading" && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Lendo atualmente
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload de imagem */}
          <div className="space-y-2">
            <Label>Imagem (opcional)</Label>

            {!imagePreview ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clique para adicionar uma imagem
                  </span>
                </Label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreatingPost || isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isCreatingPost || isUploading}
            >
              {isCreatingPost || isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? "Enviando..." : "Publicando..."}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Publicar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

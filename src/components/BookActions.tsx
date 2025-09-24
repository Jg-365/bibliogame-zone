import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  BookOpen,
  CheckCircle,
  Clock,
  Heart,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/types/reading";

interface BookActionsProps {
  book: Book;
  onBookUpdate?: () => void;
}

export const BookActions: React.FC<BookActionsProps> = ({
  book,
  onBookUpdate,
}) => {
  const { updateBook, deleteBook, addReadingSession } =
    useBooks();
  const { updateProfile } = useProfile();
  const { toast } = useToast();

  const [showUpdateDialog, setShowUpdateDialog] =
    useState(false);
  const [showReadingDialog, setShowReadingDialog] =
    useState(false);
  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const [updateData, setUpdateData] = useState({
    pages_read: book.pages_read || 0,
    status: book.status,
    rating: book.rating || 0,
    review: book.review || "",
    is_favorite: book.is_favorite || false,
  });

  const [readingSessionData, setReadingSessionData] =
    useState({
      pages_read: 0,
      notes: "",
    });

  const handleUpdateBook = async () => {
    try {
      await updateBook({
        id: book.id,
        updates: updateData,
      });
      setShowUpdateDialog(false);
      onBookUpdate?.();
      toast({
        title: "Livro atualizado!",
        description:
          "As informações do livro foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o livro.",
        variant: "destructive",
      });
    }
  };

  const handleAddReadingSession = async () => {
    if (readingSessionData.pages_read <= 0) {
      toast({
        title: "Páginas inválidas",
        description:
          "Informe um número válido de páginas lidas.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addReadingSession({
        book_id: book.id,
        pages_read: readingSessionData.pages_read,
        notes: readingSessionData.notes,
      });

      setShowReadingDialog(false);
      setReadingSessionData({ pages_read: 0, notes: "" });
      onBookUpdate?.();

      toast({
        title: "Progresso registrado!",
        description: `${readingSessionData.pages_read} páginas adicionadas ao seu progresso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao registrar progresso",
        description:
          "Não foi possível salvar seu progresso.",
        variant: "destructive",
      });
    }
  };

  const handleSetCurrentBook = async () => {
    try {
      await updateProfile({ current_book_id: book.id });
      toast({
        title: "Livro atual definido!",
        description: `"${book.title}" é agora seu livro atual.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description:
          "Não foi possível definir o livro atual.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBook = async () => {
    try {
      await deleteBook(book.id);
      setShowDeleteDialog(false);
      onBookUpdate?.();
      toast({
        title: "Livro removido",
        description:
          "O livro foi removido da sua biblioteca.",
      });
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o livro.",
        variant: "destructive",
      });
    }
  };

  const progressPercentage = Math.min(
    ((book.pages_read || 0) / book.total_pages) * 100,
    100
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {book.title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              por {book.author}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                book.status === "completed"
                  ? "default"
                  : book.status === "reading"
                  ? "secondary"
                  : "outline"
              }
            >
              {book.status === "want-to-read"
                ? "Quero ler"
                : book.status === "reading"
                ? "Lendo"
                : "Concluído"}
            </Badge>
            {book.is_favorite && (
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>
              {book.pages_read || 0} / {book.total_pages}{" "}
              páginas
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {progressPercentage.toFixed(1)}% concluído
          </div>
        </div>

        {/* Rating */}
        {book.rating && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Avaliação:
            </span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= book.rating!
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Review */}
        {book.review && (
          <div className="space-y-2">
            <span className="text-sm font-medium">
              Resenha:
            </span>
            <p className="text-sm text-muted-foreground p-3 bg-secondary rounded-md">
              {book.review}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSetCurrentBook}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Definir como atual
          </Button>

          <Dialog
            open={showReadingDialog}
            onOpenChange={setShowReadingDialog}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar progresso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Registrar Progresso de Leitura
                </DialogTitle>
                <DialogDescription>
                  Adicione as páginas que você leu hoje
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pages">
                    Páginas lidas
                  </Label>
                  <Input
                    id="pages"
                    type="number"
                    value={readingSessionData.pages_read}
                    onChange={(e) =>
                      setReadingSessionData((prev) => ({
                        ...prev,
                        pages_read:
                          parseInt(e.target.value) || 0,
                      }))
                    }
                    min="1"
                    max={
                      book.total_pages -
                      (book.pages_read || 0)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="notes">
                    Notas (opcional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Seus pensamentos sobre a leitura de hoje..."
                    value={readingSessionData.notes}
                    onChange={(e) =>
                      setReadingSessionData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    setShowReadingDialog(false)
                  }
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddReadingSession}>
                  Registrar Progresso
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showUpdateDialog}
            onOpenChange={setShowUpdateDialog}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Livro</DialogTitle>
                <DialogDescription>
                  Atualize as informações do livro
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={updateData.status}
                    onValueChange={(value) =>
                      setUpdateData((prev) => ({
                        ...prev,
                        status: value as any,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="want-to-read">
                        Quero ler
                      </SelectItem>
                      <SelectItem value="reading">
                        Lendo
                      </SelectItem>
                      <SelectItem value="completed">
                        Concluído
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pages_read">
                    Páginas lidas
                  </Label>
                  <Input
                    id="pages_read"
                    type="number"
                    value={updateData.pages_read}
                    onChange={(e) =>
                      setUpdateData((prev) => ({
                        ...prev,
                        pages_read:
                          parseInt(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    max={book.total_pages}
                  />
                </div>

                <div>
                  <Label htmlFor="rating">
                    Avaliação (1-5 estrelas)
                  </Label>
                  <Input
                    id="rating"
                    type="number"
                    value={updateData.rating}
                    onChange={(e) =>
                      setUpdateData((prev) => ({
                        ...prev,
                        rating:
                          parseInt(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    max="5"
                  />
                </div>

                <div>
                  <Label htmlFor="review">Resenha</Label>
                  <Textarea
                    id="review"
                    placeholder="Sua resenha do livro..."
                    value={updateData.review}
                    onChange={(e) =>
                      setUpdateData((prev) => ({
                        ...prev,
                        review: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_favorite"
                    checked={updateData.is_favorite}
                    onChange={(e) =>
                      setUpdateData((prev) => ({
                        ...prev,
                        is_favorite: e.target.checked,
                      }))
                    }
                  />
                  <Label htmlFor="is_favorite">
                    Marcar como favorito
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowUpdateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateBook}>
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remover Livro</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja remover "
                  {book.title}" da sua biblioteca? Esta ação
                  não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteBook}
                >
                  Remover
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

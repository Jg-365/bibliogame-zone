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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  BookOpen,
  CheckCircle,
  Clock,
  Heart,
  Edit,
  Trash2,
  Plus,
  MoreVertical,
  Target,
  Calendar,
} from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/types/reading";

interface BookCardProps {
  book: Book;
  onUpdate?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onUpdate,
}) => {
  const {
    updateBook,
    deleteBook,
    addReadingSession,
    isUpdatingBook,
  } = useBooks();
  const { updateProfile, isUpdating } = useProfile();
  const { toast } = useToast();

  const [showUpdateDialog, setShowUpdateDialog] =
    useState(false);
  const [showReadingDialog, setShowReadingDialog] =
    useState(false);
  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const [updateData, setUpdateData] = useState({
    pages_read: book.pages_read || 0,
    total_pages: book.total_pages || 0,
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

  const handleUpdateBook = () => {
    updateBook({
      id: book.id,
      updates: updateData,
    });
    setShowUpdateDialog(false);
    onUpdate?.();
  };

  const handleSetCurrentBook = () => {
    updateProfile({ current_book_id: book.id });

    // Se o livro não estiver como "reading", atualizar para "reading"
    if (book.status !== "reading") {
      updateBook({
        id: book.id,
        updates: { status: "reading" },
      });
    }

    onUpdate?.();
  };

  const handleAddReadingSession = () => {
    addReadingSession({
      book_id: book.id,
      pages_read: readingSessionData.pages_read,
      notes: readingSessionData.notes,
    });

    // Atualizar o total de páginas lidas do livro
    const newTotalPages =
      book.pages_read + readingSessionData.pages_read;
    const newStatus =
      newTotalPages >= book.total_pages
        ? "completed"
        : book.status;

    updateBook({
      id: book.id,
      updates: {
        pages_read: newTotalPages,
        status: newStatus,
        ...(newStatus === "completed" && {
          date_completed: new Date().toISOString(),
        }),
      },
    });

    setShowReadingDialog(false);
    setReadingSessionData({ pages_read: 0, notes: "" });
    onUpdate?.();
  };

  const handleDeleteBook = () => {
    deleteBook(book.id);
    setShowDeleteDialog(false);
    onUpdate?.();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            Concluído
          </Badge>
        );
      case "reading":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            Lendo
          </Badge>
        );
      case "want-to-read":
        return <Badge variant="outline">Quero Ler</Badge>;
      default:
        return (
          <Badge variant="secondary">Desconhecido</Badge>
        );
    }
  };

  const progressPercentage =
    book.total_pages > 0
      ? (book.pages_read / book.total_pages) * 100
      : 0;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {book.is_favorite && (
                <Heart className="h-4 w-4 text-red-500 fill-current" />
              )}
              {book.title}
            </CardTitle>
            <CardDescription className="text-sm">
              por {book.author}
            </CardDescription>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(book.status)}
              {book.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-600">
                    {book.rating}/5
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Menu de Ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleSetCurrentBook}
              >
                <Target className="h-4 w-4 mr-2" />
                Definir como Atual
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setShowReadingDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Páginas
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setShowUpdateDialog(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Livro
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Livro
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Progresso de Leitura */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progresso</span>
              <span>
                {book.pages_read} / {book.total_pages}{" "}
                páginas
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(progressPercentage)}% concluído
            </div>
          </div>

          {/* Review preview se existir */}
          {book.review && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              <p className="line-clamp-2">{book.review}</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Dialog para Adicionar Páginas */}
      <Dialog
        open={showReadingDialog}
        onOpenChange={setShowReadingDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Registrar Progresso de Leitura
            </DialogTitle>
            <DialogDescription>
              Adicione as páginas lidas de "{book.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pages">Páginas Lidas</Label>
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
                max={book.total_pages - book.pages_read}
                placeholder="Ex: 25"
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo: {book.total_pages - book.pages_read}{" "}
                páginas restantes
              </p>
            </div>
            <div>
              <Label htmlFor="notes">
                Notas (opcional)
              </Label>
              <Textarea
                id="notes"
                value={readingSessionData.notes}
                onChange={(e) =>
                  setReadingSessionData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Suas impressões sobre esta sessão de leitura..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReadingDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddReadingSession}>
              Registrar Progresso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Livro */}
      <Dialog
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Livro</DialogTitle>
            <DialogDescription>
              Atualize as informações de "{book.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={updateData.status}
                onValueChange={(value: any) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    status: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want-to-read">
                    Quero Ler
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
                Páginas Lidas
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
                max={updateData.total_pages}
              />
            </div>

            <div>
              <Label htmlFor="total_pages">
                Total de Páginas
              </Label>
              <Input
                id="total_pages"
                type="number"
                value={updateData.total_pages}
                onChange={(e) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    total_pages:
                      parseInt(e.target.value) || 0,
                  }))
                }
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="rating">
                Avaliação (1-5 estrelas)
              </Label>
              <Select
                value={updateData.rating.toString()}
                onValueChange={(value) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    rating: parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    Sem avaliação
                  </SelectItem>
                  <SelectItem value="1">
                    1 estrela
                  </SelectItem>
                  <SelectItem value="2">
                    2 estrelas
                  </SelectItem>
                  <SelectItem value="3">
                    3 estrelas
                  </SelectItem>
                  <SelectItem value="4">
                    4 estrelas
                  </SelectItem>
                  <SelectItem value="5">
                    5 estrelas
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="review">Resenha</Label>
              <Textarea
                id="review"
                value={updateData.review}
                onChange={(e) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    review: e.target.value,
                  }))
                }
                placeholder="Sua opinião sobre o livro..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="favorite"
                checked={updateData.is_favorite}
                onChange={(e) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    is_favorite: e.target.checked,
                  }))
                }
              />
              <Label htmlFor="favorite">
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
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Confirmar Exclusão */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Livro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover "{book.title}"
              da sua biblioteca? Esta ação não pode ser
              desfeita.
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
    </Card>
  );
};

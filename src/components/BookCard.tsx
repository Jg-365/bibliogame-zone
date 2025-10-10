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
import { useStreakUpdate } from "@/hooks/useStreakUpdate";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/shared/types";

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
  const { checkStreakUpdate } = useStreakUpdate();
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
    rating: book.rating || null,
    review: book.review || "",
    is_favorite: book.is_favorite || false,
  });

  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [readingSessionData, setReadingSessionData] =
    useState({
      pages_read: 0,
      notes: "",
    });

  const handleUpdateBook = async () => {
    // Verificar se houve mudança nas páginas lidas
    const pagesChanged =
      updateData.pages_read !== (book.pages_read || 0);
    const pagesIncreased =
      updateData.pages_read > (book.pages_read || 0);
    const pagesAdded = pagesIncreased
      ? updateData.pages_read - (book.pages_read || 0)
      : 0;

    // Se as páginas aumentaram, registrar uma sessão de leitura primeiro
    if (pagesIncreased && pagesAdded > 0) {
      try {
        // Registrar sessão de leitura para manter streak com data customizada
        const sessionDateTime = new Date(
          sessionDate + "T12:00:00.000Z"
        ).toISOString();
        addReadingSession({
          book_id: book.id,
          pages_read: pagesAdded,
          notes: `Atualização manual: +${pagesAdded} páginas em ${new Date(
            sessionDate
          ).toLocaleDateString("pt-BR")}`,
          session_date: sessionDateTime,
        });

        // Aguardar a sessão ser registrada, depois atualizar outros campos se necessário
        setTimeout(() => {
          const { pages_read, ...otherUpdates } =
            updateData;
          if (Object.keys(otherUpdates).length > 0) {
            updateBook({
              id: book.id,
              updates: otherUpdates,
            });
          }
        }, 1000); // Pequeno delay para garantir que a sessão foi processada
      } catch (error) {
        console.error(
          "Error adding reading session:",
          error
        );
        // Se falhar, fazer update normal
        updateBook({
          id: book.id,
          updates: updateData,
        });
      }
    } else {
      // Se não houve aumento de páginas, fazer update normal
      updateBook({
        id: book.id,
        updates: updateData,
      });
    }

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
    // Apenas adicionar a sessão - o hook já cuida da atualização do livro
    addReadingSession({
      book_id: book.id,
      pages_read: readingSessionData.pages_read,
      notes: readingSessionData.notes,
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
              {book.rating && book.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-600">
                    {book.rating}/5
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex items-center gap-1">
            {/* Botão de Adicionar Páginas */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReadingDialog(true)}
              disabled={book.status === "completed"}
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* Botão de Definir como Atual */}
            {book.status !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetCurrentBook}
              >
                <Target className="h-4 w-4" />
              </Button>
            )}

            {/* Menu de Ações Extras */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleSetCurrentBook}
                  disabled={book.status === "completed"}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Definir como Atual
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setShowReadingDialog(true)}
                  disabled={book.status === "completed"}
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
              {updateData.pages_read >
                (book.pages_read || 0) && (
                <div className="mt-2">
                  <Label
                    htmlFor="session_date"
                    className="text-sm text-blue-600"
                  >
                    Data da leitura (para páginas
                    adicionadas)
                  </Label>
                  <Input
                    id="session_date"
                    type="date"
                    value={sessionDate}
                    onChange={(e) =>
                      setSessionDate(e.target.value)
                    }
                    max={
                      new Date().toISOString().split("T")[0]
                    }
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    +
                    {updateData.pages_read -
                      (book.pages_read || 0)}{" "}
                    páginas serão registradas nesta data
                  </p>
                </div>
              )}
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
                value={updateData.rating?.toString() || "0"}
                onValueChange={(value) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    rating:
                      value === "0"
                        ? null
                        : parseInt(value),
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

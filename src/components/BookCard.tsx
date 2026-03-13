import React, { useState } from "react";
import { Calendar, Edit, Heart, MoreVertical, Plus, Star, Target, Trash2 } from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import { getApiErrorMessage } from "@/lib/apiError";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Book } from "@/shared/types";

interface BookCardProps {
  book: Book;
  onUpdate?: () => void;
}

export const BookCard = React.memo<BookCardProps>(({ book, onUpdate }) => {
  const { updateBook, updateBookAsync, deleteBook, addReadingSession, addReadingSessionAsync } =
    useBooks();
  const { updateProfile } = useProfile();
  const { toast } = useToast();

  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showReadingDialog, setShowReadingDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [updateData, setUpdateData] = useState({
    pages_read: book.pages_read || 0,
    total_pages: book.total_pages || 0,
    status: book.status,
    rating: book.rating || null,
    review: book.review || "",
    is_favorite: book.is_favorite || false,
  });

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);

  const [readingSessionData, setReadingSessionData] = useState({
    pages_read: 0,
    notes: "",
  });

  const handleUpdateBook = async () => {
    const pagesIncreased = updateData.pages_read > (book.pages_read || 0);
    const pagesAdded = pagesIncreased ? updateData.pages_read - (book.pages_read || 0) : 0;

    if (pagesIncreased && pagesAdded > 0) {
      try {
        const sessionDateTime = new Date(`${sessionDate}T12:00:00.000Z`).toISOString();
        const remaining = (book.total_pages || 0) - (book.pages_read || 0);

        if (pagesAdded > remaining) {
          toast({
            title: "Páginas inválidas",
            description: `Tentativa de adicionar ${pagesAdded} páginas, mas restam apenas ${remaining}.`,
            variant: "destructive",
          });
          return;
        }

        await addReadingSessionAsync({
          book_id: book.id,
          pages_read: pagesAdded,
          notes: `Atualização manual: +${pagesAdded} páginas em ${new Date(sessionDate).toLocaleDateString("pt-BR")}`,
          session_date: sessionDateTime,
        });

        const { pages_read: _pagesRead, ...otherUpdates } = updateData;
        if (Object.keys(otherUpdates).length > 0) {
          await updateBookAsync({
            id: book.id,
            updates: otherUpdates,
          });
        }
      } catch (error: unknown) {
        toast({
          title: "Erro ao registrar sessão",
          description: getApiErrorMessage(error as Error, "Erro ao registrar sessão"),
          variant: "destructive",
        });
        try {
          await updateBookAsync({
            id: book.id,
            updates: updateData,
          });
        } catch {
          // noop fallback
        }
      }
    } else {
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
      case "lido":
        return <Badge variant="success">Concluído</Badge>;
      case "reading":
      case "lendo":
        return <Badge variant="default">Lendo</Badge>;
      case "want-to-read":
      case "não lido":
        return <Badge variant="outline">Quero ler</Badge>;
      default:
        return <Badge variant="secondary">Sem status</Badge>;
    }
  };

  const progressPercentage = book.total_pages > 0 ? (book.pages_read / book.total_pages) * 100 : 0;

  return (
    <Card className="h-full border-border/70 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="line-clamp-2 text-base sm:text-lg">
              <span className="inline-flex items-center gap-2">
                {book.is_favorite ? (
                  <Heart className="h-4 w-4 fill-current text-destructive" />
                ) : null}
                {book.title}
              </span>
            </CardTitle>
            <CardDescription>por {book.author}</CardDescription>
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(book.status)}
              {book.rating && book.rating > 0 ? (
                <Badge variant="accent">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  {book.rating}/5
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setShowReadingDialog(true)}
              disabled={book.status === "completed"}
              aria-label="Adicionar sessão de leitura"
            >
              <Plus className="h-4 w-4" />
            </Button>

            {book.status !== "completed" ? (
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleSetCurrentBook}
                aria-label="Definir como livro atual"
              >
                <Target className="h-4 w-4" />
              </Button>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Mais opções">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleSetCurrentBook}
                  disabled={book.status === "completed"}
                >
                  <Target className="mr-2 h-4 w-4" />
                  Definir como atual
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowReadingDialog(true)}
                  disabled={book.status === "completed"}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar páginas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowUpdateDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar livro
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover livro
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">
              {book.pages_read} / {book.total_pages} páginas
            </span>
          </div>
          <Progress
            value={progressPercentage}
            size="sm"
            color={progressPercentage >= 100 ? "success" : "primary"}
          />
          <div className="text-xs text-muted-foreground">
            {Math.round(progressPercentage)}% concluído
          </div>
        </div>

        {book.review ? (
          <div className="rounded-[var(--radius-md)] border border-border/70 bg-muted/40 p-2.5 text-sm text-muted-foreground">
            <p className="line-clamp-2">{book.review}</p>
          </div>
        ) : null}
      </CardContent>

      <Dialog open={showReadingDialog} onOpenChange={setShowReadingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar progresso</DialogTitle>
            <DialogDescription>Adicione as páginas lidas de "{book.title}".</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pages">Páginas lidas</Label>
              <Input
                id="pages"
                type="number"
                value={readingSessionData.pages_read}
                onChange={(e) =>
                  setReadingSessionData((prev) => ({
                    ...prev,
                    pages_read: parseInt(e.target.value) || 0,
                  }))
                }
                min="1"
                max={book.total_pages - book.pages_read}
                placeholder="Ex: 25"
              />
              <p className="text-xs text-muted-foreground">
                Máximo: {book.total_pages - book.pages_read} páginas restantes.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={readingSessionData.notes}
                onChange={(e) =>
                  setReadingSessionData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Registre insights desta sessão..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReadingDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddReadingSession}>Salvar sessão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar livro</DialogTitle>
            <DialogDescription>Atualize as informações de "{book.title}".</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={updateData.status}
                onValueChange={(value: "want-to-read" | "reading" | "completed") =>
                  setUpdateData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want-to-read">Quero ler</SelectItem>
                  <SelectItem value="reading">Lendo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pages_read">Páginas lidas</Label>
              <Input
                id="pages_read"
                type="number"
                value={updateData.pages_read}
                onChange={(e) =>
                  setUpdateData((prev) => ({ ...prev, pages_read: parseInt(e.target.value) || 0 }))
                }
                min="0"
                max={updateData.total_pages}
              />

              {updateData.pages_read > (book.pages_read || 0) ? (
                <div className="space-y-1.5 rounded-[var(--radius-md)] border border-primary/30 bg-primary/5 p-3">
                  <Label
                    htmlFor="session_date"
                    className="inline-flex items-center gap-1 text-primary"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Data da sessão
                  </Label>
                  <Input
                    id="session_date"
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    +{updateData.pages_read - (book.pages_read || 0)} páginas serão registradas
                    nessa data.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="total_pages">Total de páginas</Label>
              <Input
                id="total_pages"
                type="number"
                value={updateData.total_pages}
                onChange={(e) =>
                  setUpdateData((prev) => ({ ...prev, total_pages: parseInt(e.target.value) || 0 }))
                }
                min="1"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rating">Avaliação</Label>
              <Select
                value={updateData.rating?.toString() || "0"}
                onValueChange={(value) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    rating: value === "0" ? null : parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem avaliação</SelectItem>
                  <SelectItem value="1">1 estrela</SelectItem>
                  <SelectItem value="2">2 estrelas</SelectItem>
                  <SelectItem value="3">3 estrelas</SelectItem>
                  <SelectItem value="4">4 estrelas</SelectItem>
                  <SelectItem value="5">5 estrelas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="review">Resenha</Label>
              <Textarea
                id="review"
                value={updateData.review}
                onChange={(e) => setUpdateData((prev) => ({ ...prev, review: e.target.value }))}
                placeholder="Sua opinião sobre o livro..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border/70 p-3">
              <Checkbox
                id="favorite"
                checked={updateData.is_favorite}
                onCheckedChange={(checked) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    is_favorite: Boolean(checked),
                  }))
                }
              />
              <Label htmlFor="favorite" className="cursor-pointer">
                Marcar como favorito
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateBook}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover livro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover "{book.title}" da sua biblioteca? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteBook}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
});
BookCard.displayName = "BookCard";

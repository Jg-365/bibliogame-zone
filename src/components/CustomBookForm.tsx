import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  useCustomBooks,
  CustomBookData,
} from "@/hooks/useCustomBooks";
import { Upload, BookPlus, Image } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const GENRES = [
  "Ficção",
  "Romance",
  "Mistério",
  "Fantasia",
  "Ficção Científica",
  "Terror",
  "Biografia",
  "História",
  "Filosofia",
  "Autoajuda",
  "Negócios",
  "Culinária",
  "Viagem",
  "Poesia",
  "Drama",
  "Comédia",
  "Aventura",
  "Suspense",
  "Educação",
  "Religião",
  "Outro",
];

interface CustomBookFormProps {
  onClose?: () => void;
}

export const CustomBookForm = ({
  onClose,
}: CustomBookFormProps) => {
  const { createCustomBook, isCreating } = useCustomBooks();
  const [formData, setFormData] = useState<CustomBookData>({
    title: "",
    author: "",
    description: "",
    pages: 0,
    cover_url: "",
    isbn: "",
    genre: "",
    published_year: new Date().getFullYear(),
  });
  const [coverFile, setCoverFile] = useState<File | null>(
    null
  );
  const [coverPreview, setCoverPreview] =
    useState<string>("");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione uma imagem.",
          variant: "destructive",
        });
        return;
      }

      setCoverFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.author.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e autor são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.pages <= 0) {
      toast({
        title: "Número de páginas inválido",
        description:
          "O livro deve ter pelo menos 1 página.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCustomBook.mutateAsync({
        ...formData,
        coverFile: coverFile || undefined,
      });

      // Reset form
      setFormData({
        title: "",
        author: "",
        description: "",
        pages: 0,
        cover_url: "",
        isbn: "",
        genre: "",
        published_year: new Date().getFullYear(),
      });
      setCoverFile(null);
      setCoverPreview("");

      onClose?.();
    } catch (error) {
      console.error("Erro ao criar livro:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookPlus className="w-5 h-5" />
          Adicionar Livro Personalizado
        </CardTitle>
        <CardDescription>
          Adicione um livro que não está disponível na nossa
          base de dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value,
                  })
                }
                placeholder="Digite o título do livro"
                required
              />
            </div>
            <div>
              <Label htmlFor="author">Autor *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    author: e.target.value,
                  })
                }
                placeholder="Digite o nome do autor"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              placeholder="Breve descrição do livro (opcional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pages">
                Número de Páginas *
              </Label>
              <Input
                id="pages"
                type="number"
                min="1"
                value={formData.pages || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pages: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Ex: 250"
                required
              />
            </div>
            <div>
              <Label htmlFor="genre">Gênero</Label>
              <Select
                value={formData.genre}
                onValueChange={(value) =>
                  setFormData({ ...formData, genre: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="published_year">
                Ano de Publicação
              </Label>
              <Input
                id="published_year"
                type="number"
                min="1000"
                max={new Date().getFullYear()}
                value={formData.published_year || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    published_year:
                      parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="Ex: 2023"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="isbn">ISBN (Opcional)</Label>
            <Input
              id="isbn"
              value={formData.isbn}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isbn: e.target.value,
                })
              }
              placeholder="Ex: 978-3-16-148410-0"
            />
          </div>

          <div>
            <Label htmlFor="cover">Capa do Livro</Label>
            <div className="mt-2 space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document
                      .getElementById("cover-input")
                      ?.click()
                  }
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Fazer Upload da Capa
                </Button>
                <input
                  id="cover-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground">
                  Máximo 5MB - JPG, PNG, WebP
                </span>
              </div>

              {coverPreview && (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={coverPreview}
                      alt="Preview da capa"
                      className="w-20 h-28 object-cover rounded border"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Preview da capa
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {coverFile?.name}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview("");
                      }}
                      className="mt-1 p-0 h-auto text-xs"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              )}

              {!coverPreview && (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center">
                  <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma imagem selecionada
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? "Criando..." : "Criar Livro"}
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isCreating}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export const CustomBookDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <BookPlus className="w-4 h-4" />
          Adicionar Livro Personalizado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Novo Livro Personalizado
          </DialogTitle>
          <DialogDescription>
            Adicione um livro que não encontrou em nossa
            busca
          </DialogDescription>
        </DialogHeader>
        <CustomBookForm onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

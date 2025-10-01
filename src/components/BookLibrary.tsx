import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/shared/utils/responsive";
import { useBooks } from "@/hooks/useBooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/BookCard";
import { BookOpen, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BookLibraryProps {
  className?: string;
}

export const BookLibrary: React.FC<BookLibraryProps> = ({ className = "" }) => {
  const { isMobile } = useResponsive();
  const { books = [], isLoading } = useBooks();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");

  // Categorize books by status
  const booksByStatus = useMemo(() => {
    if (!books || !Array.isArray(books)) {
      return {
        reading: [],
        completed: [],
        wantToRead: [],
      };
    }
    return {
      reading: books.filter(book => book.status === "reading" || book.status === "lendo"),
      completed: books.filter(book => book.status === "completed" || book.status === "lido"),
      wantToRead: books.filter(
        book => book.status === "want-to-read" || book.status === "não lido"
      ),
    };
  }, [books]);

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    if (!books || !Array.isArray(books)) return [];
    let filtered = books;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        book =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.genres?.some(genre => genre.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filterBy !== "all") {
      switch (filterBy) {
        case "reading":
          filtered = filtered.filter(book => book.status === "reading" || book.status === "lendo");
          break;
        case "completed":
          filtered = filtered.filter(book => book.status === "completed" || book.status === "lido");
          break;
        case "want-to-read":
          filtered = filtered.filter(
            book => book.status === "want-to-read" || book.status === "não lido"
          );
          break;
        case "favorites":
          filtered = filtered.filter(book => book.is_favorite);
          break;
      }
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        return filtered.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      case "title":
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case "author":
        return filtered.sort((a, b) => a.author.localeCompare(b.author));
      case "rating":
        return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "progress":
        return filtered.sort((a, b) => {
          const progressA = a.total_pages > 0 ? (a.pages_read || 0) / a.total_pages : 0;
          const progressB = b.total_pages > 0 ? (b.pages_read || 0) / b.total_pages : 0;
          return progressB - progressA;
        });
      default:
        return filtered;
    }
  }, [books, searchQuery, sortBy, filterBy]);

  // Callback para atualizar a lista após ações nos livros
  const handleBookUpdate = () => {
    // O hook useBooks já atualiza automaticamente
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="bg-slate-200 rounded w-20 h-28"></div>
                <div className="flex-1 space-y-2">
                  <div className="bg-slate-200 h-4 rounded w-3/4"></div>
                  <div className="bg-slate-200 h-3 rounded w-1/2"></div>
                  <div className="bg-slate-200 h-2 rounded w-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Minha Biblioteca</h2>
          <p className="text-slate-600">
            {books?.length || 0} {(books?.length || 0) === 1 ? "livro" : "livros"} na sua coleção
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
            {booksByStatus?.reading?.length || 0} lendo
          </span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
            {booksByStatus?.completed?.length || 0} concluídos
          </span>
          <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded font-medium">
            {booksByStatus?.wantToRead?.length || 0} quero ler
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por título, autor ou gênero..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="reading">Lendo</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="want-to-read">Quero Ler</SelectItem>
              <SelectItem value="favorites">Favoritos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais Recente</SelectItem>
              <SelectItem value="title">Título</SelectItem>
              <SelectItem value="author">Autor</SelectItem>
              <SelectItem value="rating">Avaliação</SelectItem>
              <SelectItem value="progress">Progresso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Books List */}
      {filteredAndSortedBooks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAndSortedBooks.map(book => (
            <BookCard key={book.id} book={book} onUpdate={handleBookUpdate} />
          ))}
        </div>
      ) : !books || books.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Sua biblioteca está vazia</h3>
            <p className="text-slate-500 mb-6">Comece adicionando alguns livros à sua coleção!</p>
            <Button onClick={() => (window.location.href = "#books")}>
              <BookOpen className="h-4 w-4 mr-2" />
              Adicionar Primeiro Livro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-8">
          <CardContent>
            <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum livro encontrado</h3>
            <p className="text-slate-500">Tente ajustar seus filtros de busca.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

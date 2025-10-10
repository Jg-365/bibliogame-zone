import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, BookOpen } from "lucide-react";
import {
  useBooks,
  searchGoogleBooks,
} from "@/hooks/useBooks";
import { useToast } from "@/hooks/use-toast";
import type { GoogleBook } from "@/shared/types";

export const BookSearch = () => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    GoogleBook[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { addBook, isAddingBook } = useBooks();
  const { toast } = useToast();

  // Força a renderização quando o componente é montado
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchGoogleBooks(query);
      setSearchResults(results);
      if (results.length === 0) {
        toast({
          title: "Nenhum resultado",
          description:
            "Não encontramos livros com este termo. Tente outra pesquisa.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na pesquisa",
        description:
          "Não foi possível pesquisar livros. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddBook = (book: GoogleBook) => {
    const { volumeInfo } = book;

    addBook({
      title: volumeInfo.title,
      author:
        volumeInfo.authors?.join(", ") ||
        "Autor desconhecido",
      total_pages: volumeInfo.pageCount || 0,
      cover_url: volumeInfo.imageLinks?.thumbnail,
      google_books_id: book.id,
      description: volumeInfo.description,
      published_date: volumeInfo.publishedDate,
      genres: volumeInfo.categories,
      isbn: volumeInfo.industryIdentifiers?.[0]?.identifier,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Garantir que o componente seja renderizado
  if (!isInitialized) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              Carregando pesquisa de livros...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Pesquisar livros por título, autor ou ISBN..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          size="sm"
        >
          <Search className="h-4 w-4" />
          {isSearching ? "Pesquisando..." : "Pesquisar"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchResults.map((book) => {
          const { volumeInfo } = book;
          return (
            <Card key={book.id} className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex gap-3">
                  {volumeInfo.imageLinks?.thumbnail ? (
                    <img
                      src={volumeInfo.imageLinks.thumbnail}
                      alt={volumeInfo.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm leading-tight line-clamp-2">
                      {volumeInfo.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {volumeInfo.authors?.join(", ") ||
                        "Autor desconhecido"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="flex flex-wrap gap-1">
                  {volumeInfo.pageCount && (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                    >
                      {volumeInfo.pageCount} páginas
                    </Badge>
                  )}
                  {volumeInfo.publishedDate && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {new Date(
                        volumeInfo.publishedDate
                      ).getFullYear()}
                    </Badge>
                  )}
                </div>

                {volumeInfo.categories && (
                  <div className="flex flex-wrap gap-1">
                    {volumeInfo.categories
                      .slice(0, 2)
                      .map((category, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {category}
                        </Badge>
                      ))}
                  </div>
                )}

                {volumeInfo.description && (
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {volumeInfo.description}
                  </p>
                )}

                <Button
                  onClick={() => handleAddBook(book)}
                  disabled={isAddingBook}
                  size="sm"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar à Biblioteca
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {searchResults.length === 0 &&
        query &&
        !isSearching && (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>
              Nenhum livro encontrado. Tente uma pesquisa
              diferente.
            </p>
          </div>
        )}
    </div>
  );
};

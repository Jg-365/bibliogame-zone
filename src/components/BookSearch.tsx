import React, { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Plus, Search } from "lucide-react";
import { useBooks, searchGoogleBooks } from "@/hooks/useBooks";
import { useToast } from "@/hooks/use-toast";
import type { GoogleBook } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toBookCoverUrl } from "@/lib/media";

const DEBOUNCE_MS = 400;

export const BookSearch = () => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const { addBook, isAddingBook } = useBooks();
  const { toast } = useToast();

  const executeSearch = useCallback(
    async (searchQuery: string, searchPage: number) => {
      if (!searchQuery.trim()) return;

      setIsSearching(true);
      try {
        const { items, totalItems: total } = await searchGoogleBooks(
          searchQuery,
          searchPage,
          pageSize,
        );
        setSearchResults(items);
        setTotalItems(total);

        if ((items || []).length === 0) {
          toast({
            title: "Nenhum resultado",
            description: "Não encontramos livros com este termo. Tente outra pesquisa.",
          });
        }
      } catch {
        toast({
          title: "Erro na pesquisa",
          description: "Não foi possível pesquisar livros. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    },
    [pageSize, toast],
  );

  const handleSearch = useCallback(() => {
    clearTimeout(debounceTimer.current);
    executeSearch(query, page);
  }, [query, page, executeSearch]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(0);
    clearTimeout(debounceTimer.current);

    if (!value.trim()) {
      setSearchResults([]);
      setTotalItems(0);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      executeSearch(value, 0);
    }, DEBOUNCE_MS);
  };

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  useEffect(() => {
    if (!query.trim()) return;
    executeSearch(query, page);
  }, [page, query, executeSearch]);

  const handleAddBook = (book: GoogleBook) => {
    const { volumeInfo } = book;

    addBook({
      title: volumeInfo.title,
      author: volumeInfo.authors?.join(", ") || "Autor desconhecido",
      total_pages: volumeInfo.pageCount || 0,
      cover_url: toBookCoverUrl(volumeInfo.imageLinks?.thumbnail),
      google_books_id: book.id,
      description: volumeInfo.description,
      published_date: volumeInfo.publishedDate,
      genres: volumeInfo.categories,
      isbn: volumeInfo.industryIdentifiers?.[0]?.identifier,
    });
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Pesquisar livros por título, autor ou ISBN..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching || !query.trim()} size="sm">
              <Search className="mr-2 h-4 w-4" />
              {isSearching ? "Pesquisando..." : "Pesquisar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isSearching && searchResults.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent className="space-y-3 p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-16 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {searchResults.map((book) => {
          const { volumeInfo } = book;

          return (
            <Card key={book.id} className="h-full border-border/70">
              <CardHeader className="pb-3">
                <div className="flex gap-3">
                  {volumeInfo.imageLinks?.thumbnail ? (
                    <img
                      src={toBookCoverUrl(volumeInfo.imageLinks.thumbnail)}
                      alt={volumeInfo.title}
                      className="h-16 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-12 items-center justify-center rounded bg-muted">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="line-clamp-2 text-sm leading-tight">
                      {volumeInfo.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      {volumeInfo.authors?.join(", ") || "Autor desconhecido"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-1">
                  {volumeInfo.pageCount ? (
                    <Badge variant="secondary">{volumeInfo.pageCount} páginas</Badge>
                  ) : null}
                  {volumeInfo.publishedDate ? (
                    <Badge variant="outline">
                      {new Date(volumeInfo.publishedDate).getFullYear()}
                    </Badge>
                  ) : null}
                </div>

                {volumeInfo.categories ? (
                  <div className="flex flex-wrap gap-1">
                    {volumeInfo.categories.slice(0, 2).map((category, index) => (
                      <Badge key={index} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {volumeInfo.description ? (
                  <p className="line-clamp-3 text-xs text-muted-foreground">
                    {volumeInfo.description}
                  </p>
                ) : null}

                <Button
                  onClick={() => handleAddBook(book)}
                  disabled={isAddingBook}
                  size="sm"
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar à biblioteca
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalItems > 0 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {Math.min(page * pageSize + 1, totalItems)} -{" "}
            {Math.min((page + 1) * pageSize, totalItems)} de {totalItems}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * pageSize >= totalItems}
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}

      {searchResults.length === 0 && query && !isSearching ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Nenhum livro encontrado</p>
            <p className="text-sm text-muted-foreground">
              Tente outra combinação de título, autor ou ISBN.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

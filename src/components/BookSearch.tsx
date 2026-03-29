import React, { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus, Search, Sparkles } from "lucide-react";
import { useBooks, searchGoogleBooks } from "@/hooks/useBooks";
import { useToast } from "@/hooks/use-toast";
import type { GoogleBook } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toBookCoverUrl } from "@/lib/media";

const MIN_QUERY_LENGTH = 2;

const getRecommendationQueries = ({
  topGenres,
  currentAuthor,
}: {
  topGenres: string[];
  currentAuthor?: string;
}) => {
  const queries: string[] = [];

  if (currentAuthor) {
    queries.push(`inauthor:"${currentAuthor}" fiction`);
  }

  topGenres.slice(0, 1).forEach((genre) => {
    queries.push(`subject:"${genre}"`);
  });

  if (!queries.length) {
    queries.push('subject:"Science Fiction"');
  }

  return queries.slice(0, 1);
};

const RecommendationShelf = ({
  books,
  onAdd,
  onSearchByGenre,
  isAdding,
}: {
  books: GoogleBook[];
  onAdd: (book: GoogleBook) => void;
  onSearchByGenre: (genre: string) => void;
  isAdding: boolean;
}) => {
  if (!books.length) return null;

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Recomendados para você
        </CardTitle>
        <CardDescription>
          Seleção baseada nos gêneros e autores que já aparecem na sua biblioteca.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => {
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
                    {(volumeInfo.categories ?? []).slice(0, 2).map((category) => (
                      <Badge
                        key={category}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => onSearchByGenre(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    onClick={() => onAdd(book)}
                    disabled={isAdding}
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
      </CardContent>
    </Card>
  );
};

export const BookSearch = () => {
  const [queryInput, setQueryInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const { books, addBook, isAddingBook } = useBooks();
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

  const triggerSearch = useCallback(
    async (rawQuery: string, nextPage = 0) => {
      const normalized = rawQuery.trim();

      if (normalized.length < MIN_QUERY_LENGTH) {
        toast({
          title: "Busca muito curta",
          description: "Digite pelo menos 2 caracteres para pesquisar.",
        });
        return;
      }

      setActiveQuery(normalized);
      setPage(nextPage);
      await executeSearch(normalized, nextPage);
    },
    [executeSearch, toast],
  );

  const libraryGenreChips = useMemo(() => {
    const counts = new Map<string, number>();
    books.forEach((book) => {
      (book.genres ?? []).forEach((genre) => {
        counts.set(genre, (counts.get(genre) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([genre]) => genre);
  }, [books]);

  const currentAuthor = useMemo(
    () => books.find((book) => book.status === "reading" || book.status === "lendo")?.author,
    [books],
  );

  const recommendationQueries = useMemo(
    () => getRecommendationQueries({ topGenres: libraryGenreChips, currentAuthor }),
    [libraryGenreChips, currentAuthor],
  );

  const recommendationResults = useQuery({
    queryKey: [
      "book-search-recommendations",
      recommendationQueries,
      books.map((book) => book.id).join(","),
    ],
    enabled: recommendationQueries.length > 0 && !activeQuery.trim(),
    staleTime: 1000 * 60 * 60 * 12,
    queryFn: async () => {
      const libraryKeys = new Set(
        books.map((book) => `${book.google_books_id ?? ""}:${book.title.toLowerCase().trim()}`),
      );

      const batches = await Promise.all(
        recommendationQueries.map((recommendationQuery) =>
          searchGoogleBooks(recommendationQuery, 0, 6),
        ),
      );

      const seen = new Set<string>();
      return batches
        .flatMap((batch) => batch.items)
        .filter((book) => {
          const key = `${book.id}:${book.volumeInfo.title.toLowerCase().trim()}`;
          const libraryKey = `${book.id}:${book.volumeInfo.title.toLowerCase().trim()}`;
          if (seen.has(key) || libraryKeys.has(libraryKey)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 6);
    },
  });

  const handleQueryChange = useCallback((value: string) => {
    setQueryInput(value);

    if (!value.trim()) {
      setActiveQuery("");
      setPage(0);
      setSearchResults([]);
      setTotalItems(0);
    }
  }, []);

  const handleSearch = useCallback(() => {
    void triggerSearch(queryInput, 0);
  }, [queryInput, triggerSearch]);

  const handlePrevPage = useCallback(() => {
    if (!activeQuery.trim() || page === 0) return;
    const nextPage = Math.max(0, page - 1);
    void triggerSearch(activeQuery, nextPage);
  }, [activeQuery, page, triggerSearch]);

  const handleNextPage = useCallback(() => {
    if (!activeQuery.trim() || (page + 1) * pageSize >= totalItems) return;
    const nextPage = page + 1;
    void triggerSearch(activeQuery, nextPage);
  }, [activeQuery, page, pageSize, totalItems, triggerSearch]);

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
        <CardContent className="space-y-4 p-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <Input
              placeholder="Pesquisar livros por título, autor ou ISBN..."
              value={queryInput}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching || !queryInput.trim()} size="sm">
              <Search className="mr-2 h-4 w-4" />
              {isSearching ? "Pesquisando..." : "Pesquisar"}
            </Button>
          </form>

          {libraryGenreChips.length ? (
            <div className="flex flex-wrap gap-2">
              {libraryGenreChips.map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    setQueryInput(genre);
                    void triggerSearch(genre, 0);
                  }}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {!activeQuery.trim() ? (
        recommendationResults.isLoading ? (
          <Card className="border-border/70">
            <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
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
            </CardContent>
          </Card>
        ) : (
          <RecommendationShelf
            books={recommendationResults.data ?? []}
            onAdd={handleAddBook}
            onSearchByGenre={(genre) => {
              setQueryInput(genre);
              void triggerSearch(genre, 0);
            }}
            isAdding={isAddingBook}
          />
        )
      ) : null}

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
            <Button size="sm" variant="outline" onClick={handlePrevPage} disabled={page === 0}>
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNextPage}
              disabled={(page + 1) * pageSize >= totalItems}
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}

      {searchResults.length === 0 && activeQuery && !isSearching ? (
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

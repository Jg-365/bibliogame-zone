import React from "react";
import { BookLibrary } from "@/components/BookLibrary";
import { BookActionButtons } from "@/components/BookActionButtons";
import { useBooks } from "@/hooks/useBooks";

export const LibraryPage = () => {
  const { books = [] } = useBooks();

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
          📚 Minha Biblioteca
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {books?.length || 0} {(books?.length || 0) === 1 ? "livro" : "livros"} na sua coleção
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <BookActionButtons />
        <BookLibrary />
      </div>
    </div>
  );
};

export default LibraryPage;

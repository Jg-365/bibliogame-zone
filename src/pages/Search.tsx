import React, { useState } from "react";
import { Search, Book, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookSearch } from "@/components/BookSearch";
import { UserSearch } from "@/components/UserSearch";

export const SearchPage = () => {
  const [searchType, setSearchType] = useState<"books" | "users">("users");

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">🔍 Buscar</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Encontre livros ou outros leitores
          </p>
        </div>

        <Tabs value={searchType} onValueChange={value => setSearchType(value as "books" | "users")}>
          <TabsList className="grid w-full grid-cols-2 h-auto max-w-md mx-auto">
            <TabsTrigger
              value="users"
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3"
            >
              <Users className="w-4 h-4" />
              <span className="hidden xs:inline">Usuários</span>
              <span className="xs:hidden">�</span>
            </TabsTrigger>
            <TabsTrigger
              value="books"
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3"
            >
              <Book className="w-4 h-4" />
              <span className="hidden xs:inline">Livros</span>
              <span className="xs:hidden">�</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6 sm:mt-8 focus-visible:outline-none">
            <UserSearch />
          </TabsContent>

          <TabsContent value="books" className="mt-6 sm:mt-8 focus-visible:outline-none">
            <BookSearch />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SearchPage;

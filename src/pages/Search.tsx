import React, { useState } from "react";
import { Book, Search, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookSearch } from "@/components/BookSearch";
import { UserSearch } from "@/components/UserSearch";
import { PageHeader, PageShell, PageSection } from "@/components/layout/PageLayout";

export const SearchPage = () => {
  const [searchType, setSearchType] = useState<"books" | "users">("users");

  return (
    <PageShell containerClassName="max-w-5xl space-y-6">
      <PageHeader
        icon={Search}
        title="Explorar"
        description="Encontre livros, autores e leitores para expandir sua jornada de leitura."
      />

      <PageSection>
        <Tabs
          value={searchType}
          onValueChange={(value) => setSearchType(value as "books" | "users")}
        >
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-[var(--radius-lg)] p-1 sm:max-w-md">
            <TabsTrigger
              value="users"
              className="flex items-center justify-center gap-1.5 py-2.5 text-sm sm:gap-2 sm:text-base"
            >
              <Users className="h-4 w-4" />
              <span>Usuários</span>
            </TabsTrigger>
            <TabsTrigger
              value="books"
              className="flex items-center justify-center gap-1.5 py-2.5 text-sm sm:gap-2 sm:text-base"
            >
              <Book className="h-4 w-4" />
              <span>Livros</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6 focus-visible:outline-none">
            <UserSearch />
          </TabsContent>

          <TabsContent value="books" className="mt-6 focus-visible:outline-none">
            <BookSearch />
          </TabsContent>
        </Tabs>
      </PageSection>
    </PageShell>
  );
};

export default SearchPage;

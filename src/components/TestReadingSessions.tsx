import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";

export const TestReadingSessions = () => {
  const { user } = useAuth();
  const [selectedBookId, setSelectedBookId] = useState("");
  const [pagesRead, setPagesRead] = useState(50);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Fetch user's books
  const { data: books } = useQuery({
    queryKey: ["user-books", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleAddSession = async () => {
    if (!user || !selectedBookId) {
      alert("Selecione um livro primeiro!");
      return;
    }

    const { data, error } = await supabase.from("reading_sessions").insert({
      user_id: user.id,
      book_id: selectedBookId,
      pages_read: pagesRead,
      session_date: sessionDate,
      notes: notes || null,
    });

    if (error) {
      console.error("Erro ao adicionar sessão:", error);
      alert("Erro ao adicionar sessão: " + error.message);
    } else {
      alert("Sessão adicionada com sucesso!");
      setPagesRead(50);
      setNotes("");
    }
  };

  if (!user) {
    return <p>Faça login para testar as sessões de leitura</p>;
  }

  return (
    <Card className="max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Testar Sessões de Leitura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="book">Selecione um Livro</Label>
          <select
            id="book"
            className="w-full p-2 border rounded"
            value={selectedBookId}
            onChange={e => setSelectedBookId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {books?.map(book => (
              <option key={book.id} value={book.id}>
                {book.title} - {book.author}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="pages">Páginas Lidas</Label>
          <Input
            id="pages"
            type="number"
            min="1"
            value={pagesRead}
            onChange={e => setPagesRead(Number(e.target.value))}
          />
        </div>

        <div>
          <Label htmlFor="date">Data da Sessão</Label>
          <Input
            id="date"
            type="date"
            value={sessionDate}
            onChange={e => setSessionDate(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Adicione suas anotações sobre a leitura..."
          />
        </div>

        <Button onClick={handleAddSession} className="w-full">
          Adicionar Sessão de Leitura
        </Button>
      </CardContent>
    </Card>
  );
};

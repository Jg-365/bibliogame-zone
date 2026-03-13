import React, { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/shared/types";
import { askBookQuestion } from "@/lib/bookKnowledgeApi";

interface AIReadingCopilotCardProps {
  userId?: string;
  books: Book[];
}

export const AIReadingCopilotCard = ({ userId, books }: AIReadingCopilotCardProps) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const currentBook = books.find((book) => book.status === "reading" || book.status === "lendo");

  const submit = async () => {
    if (!userId || prompt.trim().length < 2) return;
    setLoading(true);
    try {
      const response = await askBookQuestion({
        book_id: currentBook?.id,
        user_question: prompt,
        max_chapters: 4,
        allow_fallback: true,
        current_page: currentBook?.pages_read || undefined,
      });
      setAnswer(response.answer);
    } catch (error: unknown) {
      toast({
        title: "Copiloto indisponivel",
        description: error instanceof Error ? error.message : "Nao foi possivel gerar resposta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4 text-primary" />
          Copiloto de leitura IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">gemini backend</Badge>
          <Badge variant="secondary">{currentBook ? "livro atual" : "modo livre"}</Badge>
          <Badge variant="secondary">cache server-side</Badge>
        </div>
        <Textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: qual o principal conflito ate aqui?"
        />
        <Button
          onClick={submit}
          size="sm"
          disabled={!userId || loading || prompt.trim().length < 2}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "Consultando base..." : "Perguntar ao copiloto"}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/copilot">Abrir chat completo</Link>
        </Button>
        {answer ? (
          <div className="rounded-md border border-border/70 bg-card p-3">
            <p className="whitespace-pre-wrap text-sm">{answer}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

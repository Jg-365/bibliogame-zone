import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Bot, Search, Send, Settings2, Sparkles, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, PageSection, PageShell } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useToast } from "@/hooks/use-toast";
import { askBookQuestion, ingestBookKnowledge } from "@/lib/bookKnowledgeApi";
import { useFeatureFlags } from "@/lib/featureFlags";

type CopilotMode = "book-chat" | "recommendations" | "consistency";
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pendingQuestion?: string;
  needsSpoilerConsent?: boolean;
};

const SPOILER_PATTERN =
  /spoiler|final|desfecho|twist|revela|revelacao|morre|morreu|o que acontece|explica o fim/i;

const modeCopy: Record<CopilotMode, string> = {
  "book-chat": "Converse sobre o trecho atual do livro com foco em compreensão.",
  recommendations: "Recomende próximos livros com justificativa objetiva.",
  consistency: "Crie um plano semanal de leitura com metas realistas.",
};

const knowledgeStatusMeta: Record<
  string,
  { label: string; variant: "success" | "accent" | "destructive" | "muted" | "secondary" }
> = {
  ready: { label: "Base pronta", variant: "success" },
  processing: { label: "Indexando", variant: "accent" },
  pending: { label: "Aguardando sync", variant: "secondary" },
  failed: { label: "Metadados apenas", variant: "muted" },
};

const chatKey = (userId: string) => `rq:copilot:chat:${userId}`;
const posKey = (userId: string, bookId: string) => `rq:copilot:position:${userId}:${bookId}`;
const parseChat = (raw: string | null): ChatMessage[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const CopilotPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { books = [] } = useBooks();
  const flags = useFeatureFlags();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<CopilotMode>("book-chat");
  const [selectedBookId, setSelectedBookId] = useState("auto");
  const [avoidSpoilers, setAvoidSpoilers] = useState(true);
  const [allowFallbackWeb, setAllowFallbackWeb] = useState(true);
  const [detailedAnswer, setDetailedAnswer] = useState(false);
  const [currentPageInput, setCurrentPageInput] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [knowledgeSearchHint, setKnowledgeSearchHint] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const readingBook = useMemo(
    () => books.find((book) => book.status === "reading" || book.status === "lendo"),
    [books],
  );

  const selectedBook = useMemo(
    () =>
      selectedBookId === "auto"
        ? readingBook
        : (books.find((book) => book.id === selectedBookId) ?? readingBook),
    [books, readingBook, selectedBookId],
  );

  const knowledgeStatus = (selectedBook as { knowledge_status?: string } | undefined)
    ?.knowledge_status;
  const knowledgeStatusBadge = selectedBook
    ? knowledgeStatus
      ? (knowledgeStatusMeta[knowledgeStatus] ?? {
          label: knowledgeStatus,
          variant: "muted" as const,
        })
      : { label: "Sem base", variant: "muted" as const }
    : { label: "Modo livre", variant: "secondary" as const };

  useEffect(() => {
    if (!user?.id) return;
    setMessages(parseChat(window.localStorage.getItem(chatKey(user.id))));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    window.localStorage.setItem(chatKey(user.id), JSON.stringify(messages.slice(-80)));
  }, [messages, user?.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (!user?.id || !selectedBook?.id) {
      setCurrentPosition("");
      setCurrentPageInput("");
      return;
    }
    setCurrentPageInput(selectedBook.pages_read ? String(selectedBook.pages_read) : "");
    setCurrentPosition(window.localStorage.getItem(posKey(user.id, selectedBook.id)) ?? "");
  }, [selectedBook?.id, selectedBook?.pages_read, user?.id]);

  useEffect(() => {
    if (!user?.id || !selectedBook?.id) return;
    window.localStorage.setItem(posKey(user.id, selectedBook.id), currentPosition);
  }, [currentPosition, selectedBook?.id, user?.id]);

  const currentPage = useMemo(() => {
    const parsed = Number(currentPageInput);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return selectedBook?.pages_read ?? 0;
  }, [currentPageInput, selectedBook?.pages_read]);

  const buildEnhancedQuestion = (question: string, allowSpoilers: boolean) =>
    [
      `MODO: ${modeCopy[mode]}`,
      selectedBook ? `LIVRO FOCO: ${selectedBook.title} - ${selectedBook.author}` : "",
      currentPage ? `PAGINA ATUAL: ${currentPage}` : "",
      currentPosition ? `POSICAO EXATA: ${currentPosition}` : "",
      knowledgeSearchHint ? `PESQUISA NA BASE: ${knowledgeSearchHint}` : "",
      allowSpoilers ? "SPOILERS: PERMITIDO NESTA RESPOSTA" : "SPOILERS: EVITAR",
      detailedAnswer ? "FORMATO: detalhado" : "FORMATO: objetivo",
      `PERGUNTA: ${question}`,
    ]
      .filter(Boolean)
      .join("\n");

  const askCopilot = async (question: string, allowSpoilers: boolean) => {
    setLoading(true);
    try {
      const response = await askBookQuestion({
        book_id: selectedBook?.id,
        user_question: buildEnhancedQuestion(question, allowSpoilers),
        max_chapters: 5,
        allow_fallback: allowFallbackWeb,
        current_page: currentPage || undefined,
        current_position: currentPosition || undefined,
      });

      const suffixFlags = [
        response.context_mode === "indexed"
          ? "base indexada"
          : response.context_mode === "metadata"
            ? "metadados"
            : response.context_mode === "general"
              ? "modo livre"
              : "",
        response.used_local_quota_fallback ? "base local" : "",
        response.cached ? "cache" : "",
      ]
        .filter(Boolean)
        .join(" | ");

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `${response.answer}\n\n[confianca: ${(response.confidence ?? 0.5).toFixed(2)}${
            suffixFlags ? ` | ${suffixFlags}` : ""
          }]`,
        },
      ]);
    } catch (error: unknown) {
      toast({
        title: "Copiloto indisponível",
        description: error instanceof Error ? error.message : "Falha ao consultar a base do livro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: question }]);

    if (avoidSpoilers && SPOILER_PATTERN.test(question)) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Essa pergunta pode conter spoilers. Posso liberar spoilers só para esta resposta?",
          pendingQuestion: question,
          needsSpoilerConsent: true,
        },
      ]);
      return;
    }

    await askCopilot(question, !avoidSpoilers);
  };

  const resolveSpoilerConsent = async (msgId: string, allow: boolean) => {
    const pending = messages.find((m) => m.id === msgId)?.pendingQuestion;
    if (!pending) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              needsSpoilerConsent: false,
              pendingQuestion: undefined,
              content: allow
                ? "Spoilers autorizados para esta resposta."
                : "Perfeito, sem spoilers.",
            }
          : m,
      ),
    );
    await askCopilot(pending, allow);
  };

  const runIngestion = async () => {
    if (!selectedBook) {
      toast({
        title: "Selecione um livro",
        description: "Escolha um livro para pesquisar e indexar a base.",
        variant: "destructive",
      });
      return;
    }
    setIngesting(true);
    try {
      const result = await ingestBookKnowledge({
        isbn: selectedBook.isbn ?? undefined,
        title: selectedBook.title,
        force_reingest: true,
      });
      await queryClient.invalidateQueries({ queryKey: ["books", user?.id] });
      if (!result.success) {
        toast({
          title: "Pesquisa parcial",
          description: result.error || "Nao houve base suficiente para indexar este livro agora.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: result.skipped ? "Base já pronta" : "Pesquisa concluída",
        description: result.skipped
          ? "Esse livro já estava indexado."
          : "A base de conhecimento do livro foi atualizada com sucesso.",
      });
    } catch (error: unknown) {
      toast({
        title: "Falha na pesquisa",
        description: error instanceof Error ? error.message : "Não foi possível ingerir o livro.",
        variant: "destructive",
      });
    } finally {
      setIngesting(false);
    }
  };

  if (!flags.enableAiCopilot) {
    return (
      <PageShell containerClassName="max-w-5xl space-y-4" density="compact">
        <PageHeader icon={Bot} title="Copiloto" description="Recurso desativado no momento." />
      </PageShell>
    );
  }

  return (
    <PageShell containerClassName="max-w-5xl space-y-4" density="compact">
      <PageHeader
        icon={Bot}
        title="Copiloto"
        description="Chat-first com Gemini no backend. Metadados funcionam como base, e a indexação entra como reforço quando existir."
        actions={
          <>
            <Badge variant="secondary">Gemini backend</Badge>
            <Badge variant={knowledgeStatusBadge.variant}>{knowledgeStatusBadge.label}</Badge>
          </>
        }
      />

      <PageSection>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Chat
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              disabled={!messages.length}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <div ref={scrollRef} className="h-[62vh] space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/70 bg-card"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    {message.needsSpoilerConsent ? (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => void resolveSpoilerConsent(message.id, true)}
                          disabled={loading}
                        >
                          Sim, com spoilers
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void resolveSpoilerConsent(message.id, false)}
                          disabled={loading}
                        >
                          Não, sem spoilers
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {loading ? (
                <p className="text-sm text-muted-foreground">Consultando base...</p>
              ) : null}
            </div>

            <div className="border-t border-border/60 p-4">
              <div className="space-y-3">
                <Textarea
                  rows={3}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte sobre o livro com base na pesquisa já indexada..."
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    {selectedBook ? `${selectedBook.title} (pag ${currentPage || 0})` : "Sem livro"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon" aria-label="Abrir configurações">
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[380px] overflow-y-auto sm:w-[420px]">
                        <SheetHeader>
                          <SheetTitle>Configurações do Copilot</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4 space-y-4">
                          <div className="rounded-md border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
                            Modelo atual do backend: <strong>Gemini</strong>. A seleção de modelo
                            continua centralizada no servidor por enquanto.
                          </div>

                          <div className="space-y-2">
                            <Label>Modo</Label>
                            <Select value={mode} onValueChange={(v) => setMode(v as CopilotMode)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="book-chat">Conversar livro</SelectItem>
                                <SelectItem value="recommendations">Recomendações</SelectItem>
                                <SelectItem value="consistency">Consistência</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Livro</Label>
                            <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">Automático</SelectItem>
                                {books.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            onClick={() => void runIngestion()}
                            disabled={ingesting || !selectedBook}
                            className="w-full"
                          >
                            <Search className="mr-2 h-4 w-4" />
                            {ingesting
                              ? "Pesquisando e indexando..."
                              : "Pesquisar e atualizar base do livro"}
                          </Button>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label>Página atual</Label>
                              <Input
                                type="number"
                                min={1}
                                value={currentPageInput}
                                onChange={(e) => setCurrentPageInput(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Posição</Label>
                              <Input
                                value={currentPosition}
                                onChange={(e) => setCurrentPosition(e.target.value)}
                                placeholder="Capítulo 7"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Pesquisa na base</Label>
                            <Input
                              value={knowledgeSearchHint}
                              onChange={(e) => setKnowledgeSearchHint(e.target.value)}
                              placeholder="Ex.: conflito entre personagens"
                            />
                          </div>

                          <div className="flex items-center justify-between rounded-md border p-3">
                            <Label>Evitar spoilers</Label>
                            <Switch checked={avoidSpoilers} onCheckedChange={setAvoidSpoilers} />
                          </div>
                          <div className="flex items-center justify-between rounded-md border p-3">
                            <Label>Permitir fallback web</Label>
                            <Switch
                              checked={allowFallbackWeb}
                              onCheckedChange={setAllowFallbackWeb}
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-md border p-3">
                            <Label>Resposta detalhada</Label>
                            <Switch checked={detailedAnswer} onCheckedChange={setDetailedAnswer} />
                          </div>

                          <Separator />
                          <p className="text-xs text-muted-foreground">
                            Esta tela usa apenas base pré-indexada no fluxo principal. Busca web só
                            ocorre como fallback controlado no backend.
                          </p>
                        </div>
                      </SheetContent>
                    </Sheet>

                    <Button onClick={() => void handleSend()} disabled={loading || !input.trim()}>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageSection>
    </PageShell>
  );
};

export default CopilotPage;

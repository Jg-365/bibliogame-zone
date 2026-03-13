# Book AI Backend (Supabase)

Este projeto agora possui um backend completo para:

- ingestão de conhecimento por livro (`ingest_book`)
- perguntas com contexto pré-indexado (`ask_book_question`)

## 1) Migration

Nova migration:

- `supabase/migrations/20260312200000_book_knowledge_pipeline.sql`

Ela adiciona:

- extensão de `books` com status de conhecimento
- tabelas `sources`, `chapters`, `chapter_events`, `chapter_analysis`, `questions_log`, `question_cache`
- índices de performance
- função SQL `search_book_chapters`
- RLS para todas as tabelas novas

## 2) Edge Functions

### `ingest_book`

Arquivo:

- `supabase/functions/ingest_book/index.ts`

Fluxo:

1. recebe `isbn` ou `title`
2. consulta Google Books
3. cria/atualiza livro
4. busca web via Brave
5. sanitiza conteúdo de páginas
6. persiste fontes
7. chama Gemini para estruturar capítulos/eventos/análises
8. persiste estrutura no banco

### `ask_book_question`

Arquivo:

- `supabase/functions/ask_book_question/index.ts`

Fluxo:

1. recebe `book_id` e `user_question`
2. consulta cache de pergunta
3. busca capítulos relevantes via RPC `search_book_chapters`
4. monta contexto estruturado
5. chama Gemini para responder
6. salva em `questions_log` + `question_cache`
7. fallback web (raro) se baixa confiança

## 3) Helpers compartilhados

Arquivo:

- `supabase/functions/_shared/book-ai.ts`

Contém:

- Google Books
- Brave Search
- sanitização HTML
- chamada Gemini (JSON mode)
- hash SHA-256 para cache

## 4) Secrets necessários

Configure no Supabase:

- `BRAVE_SEARCH_API_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (opcional, default: `gemini-1.5-flash`)

Já usados nativamente:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 5) Deploy

```bash
supabase db push
supabase functions deploy ingest_book
supabase functions deploy ask_book_question
```

## 6) Exemplos de chamada

### Ingestão

```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/ingest_book" \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"isbn":"9780132350884"}'
```

### Pergunta

```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/ask_book_question" \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"book_id":"<BOOK_ID>","user_question":"Qual o principal conflito até este ponto?"}'
```


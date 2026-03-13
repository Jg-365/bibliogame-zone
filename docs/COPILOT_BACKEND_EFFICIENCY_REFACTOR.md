# Copilot Backend Efficiency Refactor

## Objective

Transform the current Copilot service into a compact, cache-first architecture that is dramatically more efficient in:

- external API requests
- token usage
- duplicate processing
- repeated ingestion
- repeated context assembly
- repeated question answering for the same state

The target is not a cosmetic reduction. The target is structural efficiency.

## Root Cause Analysis

### Why there are too many requests today

1. A single book ingestion currently triggers multiple Brave queries for the same book.
2. Each Brave query returns multiple URLs, and the backend downloads many pages.
3. Re-ingestion can happen again for books that are already ready.
4. Batch sync in profile can iterate through the whole library and trigger the same expensive pipeline repeatedly.
5. The ask flow still builds context dynamically every time instead of reusing a compact prebuilt knowledge packet.
6. Gemini may still be called even when the backend already has enough structured chapter knowledge to answer locally or to send a much smaller prompt.
7. Retry behavior amplifies traffic when providers are rate-limiting.

### Current anti-patterns

- wide fan-out search on ingestion
- many source fetches per book
- no compact per-book packet cache
- no in-flight deduplication for repeated ingest/ask calls
- no robust stale-vs-fresh ingestion policy
- no hard cap on useful context size before LLM usage
- fallback behavior still capable of generating extra request bursts

## Target Architecture

### Core principle

The backend should not act as a thin proxy to Gemini.

It should:

1. ingest book knowledge once
2. normalize and compact that knowledge
3. persist a reusable "knowledge packet"
4. answer future questions by sending only a tiny targeted JSON context to Gemini
5. skip Gemini entirely when the answer can be served acceptably from local structured data

### New architecture layers

#### 1. Ingestion layer

- one primary Brave search query per book
- one fallback Brave query only if the primary query yields poor coverage
- hard cap on downloaded sources
- chapter extraction from downloaded text
- normalization into structured chapters/events/analysis
- compact packet generation
- packet persisted to cache

#### 2. Packet layer

Each book gets one normalized packet:

```json
{
  "book": {
    "id": "...",
    "title": "...",
    "author": "...",
    "total_pages": 300,
    "coverage": "alto"
  },
  "chapters": [
    {
      "id": "...",
      "n": 1,
      "t": "Capitulo 1",
      "s": "Resumo curto",
      "k": ["palavra", "tema"],
      "c": ["Personagem"],
      "e": ["evento 1", "evento 2"],
      "a": ["analise curta"]
    }
  ],
  "meta": {
    "chapter_count": 12,
    "updated_at": "..."
  }
}
```

This packet is the main context object.

#### 3. Ask layer

- load compact packet
- infer current reading position
- select only 1-3 relevant chapters
- build tiny JSON prompt
- call Gemini once
- if quota/rate limit happens, respond from local packet only

#### 4. Coordination layer

- deduplicate concurrent ingestion per book
- deduplicate concurrent ask requests by `(book_id + normalized_question + page + position)`
- short TTL memory cache for recent packet reads
- skip recent books during manual sync unless truly stale

## File-by-File Action Plan

### 1. `docs/COPILOT_BACKEND_EFFICIENCY_REFACTOR.md`

Purpose:

- define the architecture
- document the execution plan
- serve as the canonical refactor guide

### 2. `server/book-ai.mjs`

Problems today:

- provider helpers still allow too much retry pressure
- helpers do not enforce a compact-query mindset

Changes:

- stop retrying on `429`
- keep retries only for transient `5xx`
- reduce Brave search fan-out defaults
- enforce smaller max payloads

Expected effect:

- fewer provider calls
- no request explosion under rate limit

### 3. `server/index.mjs`

Problems today:

- too much orchestration in one place
- no durable packet flow
- ingestion still too broad
- ask flow rebuilds too much every time

Changes:

- limit ingestion to one primary query plus one fallback query
- hard cap number of fetched sources
- introduce recent-ingestion skip rule
- introduce in-flight deduplication
- remove web fallback from ask flow
- use compact packet in ask flow
- local-response fallback on Gemini quota

Expected effect:

- major reduction in Brave + Gemini requests
- single compact LLM request per useful ask

### 4. `server/knowledge-packet.mjs`

New file.

Purpose:

- build compact packet from DB rows
- cache packet in memory
- persist packet to disk cache for reuse after restarts
- expose helpers to select only relevant chapters for ask flow

Expected effect:

- stop rebuilding heavy context repeatedly
- make ask flow deterministic and cheap

### 5. `server/request-coordinator.mjs`

New file.

Purpose:

- deduplicate in-flight `ingest`
- deduplicate in-flight `ask`
- prevent duplicate pressure during repeated clicks or multiple renders

Expected effect:

- no duplicate work storms

### 6. `src/lib/bookKnowledgeApi.ts`

Problems today:

- client is fine functionally, but backend semantics changed

Changes:

- preserve stable local API interface
- support packet-backed responses and local-quota fallbacks

Expected effect:

- frontend remains thin

### 7. `src/pages/Profile.tsx`

Problems today:

- sync-all can still trigger unnecessary re-ingestion

Changes:

- stop forcing re-ingest for every book
- sync only books with `pending`, `failed`, or stale knowledge
- keep small pacing between books

Expected effect:

- batch sync becomes bounded and predictable

### 8. `src/pages/Copilot.tsx`

Problems today:

- user can ask before packet is stable
- answer status is not explicit enough

Changes:

- show when response came from compact packet path
- show when answer used local fallback
- rely on the backend packet selection model

Expected effect:

- clearer product behavior

## Execution Order

1. create documentation
2. extract packet/cache module
3. extract request coordinator
4. refactor ingestion to compact mode
5. refactor ask flow to packet mode
6. reduce frontend re-ingest pressure
7. validate

## Success Criteria

- one book ingestion uses at most 1 primary Brave query and 1 fallback query
- one ask uses at most 1 Gemini request
- no ask performs web fallback by default
- repeated asks hit cache
- repeated ingestion requests dedupe
- recent ready books skip re-ingestion
- Gemini quota no longer breaks chat
- profile sync no longer floods providers

## Definition of Done

- architecture documented
- packet service implemented
- coordinator implemented
- request fan-out reduced
- retries no longer amplify `429`
- packet-backed answers active
- frontend aligned
- type-check passes

# Book Knowledge Research Architecture

## Objective

Create a robust backend research pipeline that only saves book knowledge when the collected evidence actually matches the target book.

This architecture is designed for:

- exact book identification
- low request pressure
- chapter-level evidence when available
- controlled Gemini usage
- reproducible source validation
- no web search during normal chat answering

## Core Principle

The backend is not a thin proxy to Gemini.

It must:

1. identify the book precisely
2. collect evidence in layers
3. validate each source against the book identity
4. classify source intent and quality
5. consolidate only the trusted evidence
6. use Gemini once to transform that evidence into structured chapter knowledge
7. answer future questions only from the indexed packet

## Research Layers

### Layer 1: Metadata Resolution

File: `server/book-ai.mjs`

Responsibilities:

- resolve the book through Google Books
- normalize title, authors, ISBN, page count and description
- establish the canonical identity used by every later layer

Hard rules:

- title match is mandatory for a strong identity
- author match strongly boosts confidence
- ISBN exact match is the strongest identity signal when available

### Layer 2: Query Planning

File: `server/book-research.mjs`

Responsibilities:

- generate a bounded list of queries
- separate query intents by stage
- keep the request budget low

Default staged plan:

1. identity query
2. chapter-summary query
3. analysis/themes query

The pipeline stops early when enough evidence has already been gathered.

### Layer 3: Candidate Discovery

File: `server/book-research.mjs`

Responsibilities:

- call Brave Search sequentially
- deduplicate URLs before download
- rank result metadata before fetching page content

Controls:

- max 3 search stages
- small count per query
- hard cap on downloaded pages

### Layer 4: Source Validation

File: `server/book-research.mjs`

Each downloaded source is scored across multiple dimensions:

1. identity score
2. domain trust score
3. chapter signal score
4. analysis/summary signal score
5. narrative density score
6. promotional noise penalty
7. catalog/list penalty
8. plausibility of chapter numbering

Typical rejection reasons:

- title does not really match the book
- author does not match
- page is catalog/promotional material
- content is generic book metadata only
- chapter numbers are implausible for the page count
- duplicated content from another URL

### Layer 5: Evidence Consolidation

File: `server/book-research.mjs`

Responsibilities:

- keep only curated sources above threshold
- build a compact evidence bundle
- preserve source references
- stop if coverage is not trustworthy

This is the key anti-garbage layer.

If the evidence bundle is weak, ingestion must fail instead of saving misleading summaries.

### Layer 6: Structured Extraction

Files:

- `server/book-research.mjs`
- `server/book-ai.mjs`

Responsibilities:

- send one compact evidence bundle to Gemini
- ask for strict JSON only
- require explicit book-match confidence
- require chapter extraction only from supported evidence
- reject speculative chapter creation

Gemini must not search the web here.
It only restructures already curated evidence.

### Layer 7: Persistence

Files:

- `server/index.mjs`
- `server/knowledge-packet.mjs`

Responsibilities:

- persist curated sources
- persist chapters, events and analysis rows
- generate packet cache
- mark coverage level

### Layer 8: Ask Flow

Files:

- `server/index.mjs`
- `server/knowledge-packet.mjs`

Responsibilities:

- never perform web search in the normal path
- load compact packet
- select up to 5 relevant chapters
- send only the tiny structured context to Gemini
- fall back to local packet-only answer on quota exhaustion

## File-by-File Implementation Plan

### `server/book-ai.mjs`

Improve provider helpers:

- include Brave result description when available
- keep retries conservative
- keep Gemini structured JSON calls predictable

### `server/book-research.mjs`

New module containing:

- staged query planner
- result pre-ranking
- source scoring and rejection rules
- evidence bundle builder
- Gemini structuring prompt builder
- normalization and validation of structured output
- heuristic fallback only when still trustworthy

### `server/index.mjs`

Changes:

- replace ad-hoc source gathering with the research module
- persist only curated sources
- fail safely when evidence is weak
- keep ask path packet-first
- cap confidence when packet quality is low

### `server/knowledge-packet.mjs`

Changes:

- bump packet version after the research refactor
- preserve compact packet semantics
- keep chapter selection cheap

### `src/pages/Profile.tsx`

No major architectural change required, but forced reindex must continue to rebuild books using the new pipeline.

### `src/pages/Copilot.tsx`

No new request source should be introduced here.
This page must stay thin and rely on the backend pipeline.

## Reliability Rules

1. Never save junk just to avoid an empty state.
2. Prefer `failed` over a misleading `ready`.
3. Prefer fewer accurate chapters over many speculative ones.
4. Never let promotional/catalog pages generate narrative summaries.
5. Never do web search on the normal ask path.
6. Use Gemini once per ingestion, not as a search engine.
7. Cache the final packet and reuse it aggressively.

## Success Criteria

- the wrong book is rejected before persistence
- catalog/promotional pages do not become chapter summaries
- implausible chapter numbering is discarded
- each book ends with a trustworthy packet or a controlled failure
- the chat answers using only indexed knowledge in the normal path
- request volume stays bounded and predictable

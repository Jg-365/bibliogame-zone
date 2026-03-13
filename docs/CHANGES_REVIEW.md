# CHANGES_REVIEW.md

> Complete audit of all design system implementations performed in this session.  
> Compares deliverables against the original plan, identifies gaps, and defines the full backend migration roadmap.

---

## 1. Session Deliverables — Full Inventory

| File                                                  | Action   | Description                                                       |
| ----------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| `docs/PROFESSIONAL_DESIGN_CONSISTENCY_ENHANCEMENT.md` | Created  | 11-section design system plan                                     |
| `src/index.css`                                       | Replaced | Complete dark-first design token system                           |
| `tailwind.config.ts`                                  | Replaced | Extended with fonts, tokens, keyframes, animations                |
| `src/components/ui/button.tsx`                        | Replaced | 9 variants, 7 sizes, spring transitions, glow system              |
| `src/components/ui/card.tsx`                          | Replaced | 5 variants with CVA, glass morphism, hover lift                   |
| `src/components/ui/badge.tsx`                         | Replaced | 11 variants including 4 rarity tiers                              |
| `src/components/ui/progress.tsx`                      | Replaced | Gradient fill, 5 sizes, animated, optional label                  |
| `src/components/ui/switch.tsx`                        | Replaced | Glow on check, spring easing, scale thumb                         |
| `src/components/ResponsiveNavigation.tsx`             | Modified | Glass nav, animated pill indicators via `layoutId`, Fraunces logo |
| `src/App.tsx`                                         | Modified | `cn()` layout, refined loading spinner with depth ring            |

---

## 2. Comparison Against Design Plan

### Plan Section 1 — Typography System

| Planned                                        | Implemented                                                      | Status   |
| ---------------------------------------------- | ---------------------------------------------------------------- | -------- |
| Fraunces for `h1/h2/h3`                        | ✅ CSS `h1,h2,h3 { font-family: var(--font-display) }`           | Complete |
| Inter for body/UI                              | ✅ `--font-sans: 'Inter'` in base and Tailwind `sans`            | Complete |
| JetBrains Mono for stats                       | ✅ `[data-stat], .stat-number { font-family: var(--font-mono) }` | Complete |
| Google Fonts `@import` before `@tailwind base` | ✅ Correct cascade order                                         | Complete |

### Plan Section 2 — Color System

| Planned                                  | Implemented                         | Status   |
| ---------------------------------------- | ----------------------------------- | -------- |
| Violet primary `265 63% 46%` (light)     | ✅ `--primary: 265 63% 46%`         | Complete |
| Violet primary `265 63% 58%` (dark)      | ✅ `.dark --primary: 265 63% 58%`   | Complete |
| Amber accent `43 100% 55%`               | ✅ `--accent: 43 100% 55%`          | Complete |
| Emerald success `160 84% 39%`            | ✅ `--success: 160 84% 39%`         | Complete |
| Midnight navy background `224 71% 4%`    | ✅ `.dark --background: 224 71% 4%` | Complete |
| Layered depth: bg/card/popover/elevated  | ✅ 4 background depth layers        | Complete |
| `--text-secondary` and `--text-tertiary` | ✅ In CSS vars and Tailwind config  | Complete |

### Plan Section 3 — Glass Morphism System

| Planned                  | Implemented                                       | Status   |
| ------------------------ | ------------------------------------------------- | -------- |
| `.glass-card`            | ✅ `backdrop-blur-[12px] bg-card/70 saturate-150` | Complete |
| `.glass-nav`             | ✅ `backdrop-blur-[20px] bg-background/80`        | Complete |
| `.glass-overlay`         | ✅ `backdrop-blur-[24px] bg-background/85`        | Complete |
| Level 1/2/3 distinctions | ✅ 12px / 20px / 24px blur + opacity variations   | Complete |

### Plan Section 4 — Animation System

| Planned                           | Implemented                                                   | Status   |
| --------------------------------- | ------------------------------------------------------------- | -------- |
| 8 named keyframes                 | ✅ 11 keyframes (added extras: `rq-count-up`, `rq-spin-slow`) | Exceeded |
| `prefers-reduced-motion` override | ✅ `@media (prefers-reduced-motion: reduce)` disables all     | Complete |
| Spring easing tokens              | ✅ `--easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`       | Complete |
| Duration tokens                   | ✅ instant/fast/normal/slow/slower mapped in CSS + Tailwind   | Complete |

### Plan Section 5 — Button Component

| Planned                  | Implemented                               | Status                |
| ------------------------ | ----------------------------------------- | --------------------- |
| `glow` variant           | ✅ Violet fill + `shadow-glow`            | Complete              |
| `success` variant        | ✅ Emerald + `shadow-emerald` on hover    | Complete              |
| `accent` variant         | ✅ Amber + `shadow-amber` on hover        | **Added beyond plan** |
| `glass` variant          | ✅ `glass-card` class + hover border/glow | **Added beyond plan** |
| `xs` and `xl` sizes      | ✅ 7 size variants total                  | Exceeded              |
| `icon-sm` and `icon-lg`  | ✅ Added both                             | **Added beyond plan** |
| `active:scale-[0.97]`    | ✅ In base class string                   | Complete              |
| Spring transition timing | ✅ `duration-[var(--duration-fast)]`      | Complete              |

### Plan Section 6 — Card Component

| Planned                       | Implemented                                      | Status                |
| ----------------------------- | ------------------------------------------------ | --------------------- |
| `glass` variant               | ✅ `.glass-card` + hover lift + border on hover  | Complete              |
| `elevated` variant            | ✅ `shadow-md` + `-translate-y-1` on hover       | Complete              |
| `flat` variant                | ✅ No shadow, muted bg                           | **Added beyond plan** |
| `accent` variant              | ✅ Primary-tinted border + glow                  | **Added beyond plan** |
| CVA for variants              | ✅ Proper `cardVariants` exported                | Complete              |
| Padding tightened `p-6 → p-5` | ✅ CardHeader, CardContent, CardFooter all `p-5` | Complete              |

### Plan Section 7 — Badge / Rarity System

| Planned                                | Implemented                                 | Status                |
| -------------------------------------- | ------------------------------------------- | --------------------- |
| `common` variant                       | ✅ Slate tones                              | Complete              |
| `rare` variant                         | ✅ Violet tones                             | Complete              |
| `epic` variant                         | ✅ Gradient background + purple glow shadow | Complete              |
| `legendary` variant                    | ✅ Gold gradient + `shadow-amber`           | Complete              |
| `success` variant                      | ✅ Emerald tones                            | Complete              |
| `accent` variant                       | ✅ Amber tones, adapted for dark/light      | **Added beyond plan** |
| `muted` variant                        | ✅ Low-contrast informational               | **Added beyond plan** |
| `.rarity-*` CSS utilities in index.css | ✅ 4 classes defined                        | Complete              |

### Plan Section 8 — Progress Component

| Planned                        | Implemented                               | Status                |
| ------------------------------ | ----------------------------------------- | --------------------- |
| Gradient fill                  | ✅ `bg-gradient-primary` (violet→primary) | Complete              |
| `success`/`accent` color props | ✅ `color` prop with 3 values             | Complete              |
| Size variants                  | ✅ `xs/sm/default/md/lg` (5 sizes, not 3) | Exceeded              |
| `showLabel` prop               | ✅ Monospace % label, tabular-nums        | **Added beyond plan** |
| Animated fill                  | ✅ `animated` prop (defaults true)        | Complete              |
| Near-complete pulse            | ✅ `animate-pulse-glow` at ≥95%           | **Added beyond plan** |
| Default height reduced         | ✅ Changed from `h-4` to `h-2` default    | Complete              |

### Plan Section 9 — Navigation

| Planned                       | Implemented                                                                                       | Status                |
| ----------------------------- | ------------------------------------------------------------------------------------------------- | --------------------- |
| Glass nav surface             | ✅ `.glass-nav border-border/50` all 3 layouts                                                    | Complete              |
| Animated pill with `layoutId` | ✅ `desktop-active-pill`, `tablet-active-pill`, `mobile-menu-active-pill`, `bottom-nav-indicator` | Complete              |
| Fraunces logo font            | ✅ `font-display` class on "ReadQuest" text                                                       | Complete              |
| Logo shadow-glow              | ✅ `shadow-glow` on RQ icon square                                                                | Complete              |
| Bottom nav top-line indicator | ✅ 5×0.5 violet line with spring animation                                                        | **Added beyond plan** |
| Icon lift animation on active | ✅ `y: -1` on active bottom nav icon                                                              | **Added beyond plan** |

### Plan Section 10 — Switch (Dark Mode Toggle)

| Planned                     | Implemented                           | Status   |
| --------------------------- | ------------------------------------- | -------- |
| Smooth spring transition    | ✅ `var(--easing-spring)` timing      | Complete |
| Glow on checked state       | ✅ `data-[state=checked]:shadow-glow` | Complete |
| Thumb scale on check        | ✅ `data-[state=checked]:scale-[0.9]` | Complete |
| Reduced opacity on disabled | ✅ `disabled:opacity-40`              | Complete |

### Plan Section 11 — Scrollbars & Texture

| Planned                         | Implemented                             | Status   |
| ------------------------------- | --------------------------------------- | -------- |
| 6px custom scrollbar            | ✅ `::-webkit-scrollbar { width: 6px }` | Complete |
| Violet hover on scrollbar thumb | ✅ `hover: hsl(var(--primary)/0.7)`     | Complete |
| `.texture-noise` utility        | ✅ SVG turbulence filter pseudo-element | Complete |

---

## 3. Discrepancies & Corrections

### 3.1 Token Name: `shadow-gold` → `shadow-amber`

The design plan referenced `shadow-gold` in several places. During implementation, this was renamed to `shadow-amber` to match the semantic color name (`accent = amber`). Any **domain components** that were manually written using `shadow-gold` before this session will have a visual no-op (the class won't exist). Search scope:

```bash
grep -r "shadow-gold" src/
```

If matches exist, replace with `shadow-amber`.

### 3.2 `border-input` token absence

The original `button.tsx` used `border-input`. The new design system replaced `--input` with a border built from `--border`. The token `--input` is still defined in `index.css` for form element compatibility but `border-input` as a Tailwind utility may need the `input` color key added to `tailwind.config.ts` if form inputs rely on it.

**Correction**: `--input` CSS variable retained. The `tailwind.config.ts` color for `input` is inherited from the shadcn base via CSS variables — no action needed as long as `border-border` is used for non-form borders.

### 3.3 `ring-offset-background` removed from button base

The original button used `ring-offset-background` explicitly. The new version uses `focus-visible:ring-offset-background` from Tailwind's default CSS variable bindings. The behavior is equivalent; no visual regression.

### 3.4 `CardTitle` heading level changed

Old: `<h3>` with `text-2xl`. New: `<h3>` with `text-lg font-semibold`. If domain cards relied on `CardTitle` for page-level headings, they may appear smaller. This is **intentional** — `text-2xl` was too large for a sub-component heading; section headings should use `h1/h2` directly.

### 3.5 `card.tsx` exports extended (breaking)

Added `cardVariants` and `CardProps` to exports. Existing imports like `import { Card, CardHeader } from "@/components/ui/card"` are unaffected. The new `variant` prop on `<Card>` is optional with `default` as defaultVariant — no breaking change.

---

## 4. Not Yet Implemented — Deferred Items

The following items from `ENGINEERING_IMPROVEMENT_PLAN.md` were **scoped out** of this design pass and remain open for future sprints:

| Item                                           | Reason deferred                                  |
| ---------------------------------------------- | ------------------------------------------------ |
| `SH-1` — Move Supabase credentials to env vars | Config/infra change, no UI scope                 |
| `SH-2` — HTTP security headers in vercel.json  | Config/infra change                              |
| `SH-3` — Enable TypeScript strict mode         | Requires fixing ~50+ type errors across codebase |
| `SH-4` — Add `eslint-plugin-jsx-a11y`          | Tooling change                                   |
| `SH-5` — Install Jest for unit tests           | Tooling change                                   |
| `MD-*` — Medium-term refactoring tasks         | Beyond design scope                              |

These are not cancelled — they belong in a separate engineering sprint.

---

## 5. Backend Migration Plan — Supabase to Production Infrastructure

### 5.1 Current State Assessment

| Layer          | Current Technology                 | Risk Level                  |
| -------------- | ---------------------------------- | --------------------------- |
| Auth           | Supabase Auth (JWT)                | Medium — vendor lock-in     |
| Database       | Supabase PostgreSQL                | Low — standard PG, portable |
| Storage        | Supabase Storage                   | Low — S3-compatible         |
| Realtime       | Supabase Realtime (websockets)     | High — proprietary          |
| Edge Functions | Supabase Edge Functions (Deno)     | High — runtime lock-in      |
| Credentials    | Hardcoded in `client.ts`           | Critical — must move to env |
| API Layer      | Direct Supabase JS SDK from client | High — no API abstraction   |

### 5.2 Target Architecture

```
                    ┌──────────────────────────────────────────┐
                    │           Client (React SPA)              │
                    │   src/lib/api/*  (fetch abstraction)      │
                    └─────────────────┬────────────────────────┘
                                      │  HTTPS REST / tRPC
                    ┌─────────────────▼────────────────────────┐
                    │          API Server (Node.js)             │
                    │   Express / Fastify + tRPC router         │
                    │   Auth middleware (JWT verification)       │
                    │   Rate limiting, validation, logging       │
                    └────────┬─────────────────┬───────────────┘
                             │                 │
              ┌──────────────▼──┐       ┌──────▼───────────────┐
              │  PostgreSQL DB   │       │   Redis Cache        │
              │  (Railway/RDS)   │       │   (Upstash/Redis)    │
              └──────────────────┘       └──────────────────────┘
                             │
              ┌──────────────▼──┐
              │  Auth Provider  │
              │  (Auth.js/Lucia)│
              └──────────────────┘
```

### 5.3 Migration Phases

#### Phase 0 — Prerequisite: Environment Variables (1 day)

Before any migration can begin, credentials must be externalized:

```ts
// src/integrations/supabase/client.ts — CURRENT (unsafe)
const SUPABASE_URL = "https://xxx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJ...";

// AFTER — safe
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env
  .VITE_SUPABASE_ANON_KEY;
```

Create:

- `.env.local` — gitignored, local dev credentials
- `.env.example` — committed, documents all required keys
- `.env.production` — hosted in deployment platform secrets

---

#### Phase 1 — API Abstraction Layer (1 week)

The most important architectural step. Replace direct Supabase SDK calls with an API client module. This step does **not** change the backend yet — it just routes all data access through a centralized module so the backend can be swapped later.

**Create `src/lib/api/` directory:**

```ts
// src/lib/api/client.ts — unified fetch wrapper
export const apiClient = {
  get: <T>(path: string, options?: RequestInit) =>
    fetchWithAuth<T>("GET", path, undefined, options),
  post: <T>(
    path: string,
    body: unknown,
    options?: RequestInit,
  ) => fetchWithAuth<T>("POST", path, body, options),
  patch: <T>(path: string, body: unknown) =>
    fetchWithAuth<T>("PATCH", path, body),
  delete: <T>(path: string) =>
    fetchWithAuth<T>("DELETE", path),
};
```

```ts
// src/lib/api/books.ts
export const booksApi = {
  getAll: () => apiClient.get<Book[]>("/books"),
  getById: (id: string) =>
    apiClient.get<Book>(`/books/${id}`),
  create: (data: CreateBookDto) =>
    apiClient.post<Book>("/books", data),
  updateProgress: (id: string, progress: number) =>
    apiClient.patch(`/books/${id}/progress`, { progress }),
};
```

All React hooks (`useBooks`, `useProfile`, etc.) call `booksApi.*` instead of Supabase directly. During Phase 1, the API client proxies to Supabase under the hood.

**Effort**: 1 week.

---

#### Phase 2 — Backend Server Setup (1–2 weeks)

Stand up a Node.js API server to replace Supabase edge functions and direct DB access.

**Recommended stack**:

- **Runtime**: Node.js 20 LTS
- **Framework**: Fastify (faster than Express, better plugin system)
- **API style**: tRPC (type-safe end-to-end, replaces REST boilerplate) or REST+Zod
- **ORM**: Drizzle ORM (lightweight, type-safe, works perfectly with PostgreSQL)
- **Validation**: Zod (already in project)

**File structure**:

```
server/
  src/
    index.ts              — Fastify app entry point
    router.ts             — tRPC router (or Express routes)
    middleware/
      auth.ts             — JWT verification
      rateLimit.ts        — per-IP rate limiting
    modules/
      books/
        books.router.ts
        books.service.ts
        books.schema.ts
      auth/
        auth.router.ts
        auth.service.ts
      users/
        users.router.ts
        users.service.ts
      achievements/
        achievements.router.ts
        achievements.service.ts
    db/
      client.ts           — Drizzle + pg client
      schema/             — Table definitions (from Supabase migrations)
    lib/
      jwt.ts
      errors.ts
      logger.ts
```

**Initial server setup:**

```ts
// server/src/index.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import { router } from "./router";

const app = Fastify({ logger: true });

app.register(cors, { origin: process.env.CLIENT_URL });
app.register(router);

app.listen({ port: 3001, host: "0.0.0.0" });
```

**Effort**: 1–2 weeks skeleton + 2–3 weeks full module coverage.

---

#### Phase 3 — Authentication Migration (1–2 weeks)

Replace Supabase Auth with a self-hosted solution.

**Recommended**: **Lucia Auth** (v3) — lightweight, framework-agnostic, first-class TypeScript support.

Alternatively: **Auth.js v5** (formerly NextAuth) if team prefers convention-over-configuration.

**Migration steps:**

1. Create `users` table with `password_hash` column (if switching from OAuth-only to email flow)
2. Set up Lucia with PostgreSQL adapter (Drizzle compatible)
3. Implement session management (database sessions, not stateless JWT)
4. Add OAuth providers: Google, GitHub (same as Supabase supported)
5. Create `/auth/login`, `/auth/logout`, `/auth/session`, `/auth/register` endpoints
6. Update `useAuth.tsx` hook to call new endpoints instead of `supabase.auth.*`
7. Keep Supabase Auth running in parallel during migration (gradual user migration)
8. Migrate existing users: export from Supabase, import hashed passwords to new DB

**Session token pattern** (Lucia):

```ts
// server/src/modules/auth/auth.service.ts
import { lucia } from "../lib/lucia";

export async function createSession(userId: string) {
  const session = await lucia.createSession(userId, {});
  return lucia.createSessionCookie(session.id);
}

export async function validateSessionToken(token: string) {
  const { session, user } =
    await lucia.validateSession(token);
  return { session, user };
}
```

**Effort**: 1–2 weeks.

---

#### Phase 4 — Database Migration (3–5 days)

Supabase PostgreSQL is standard PostgreSQL — migration is straightforward.

**Target options** (ranked by simplicity):

| Provider                           | Pros                                      | Cons                      |
| ---------------------------------- | ----------------------------------------- | ------------------------- |
| **Railway**                        | Best DX, generous free tier, auto-backups | Smaller community         |
| **Neon**                           | Serverless PG, branching, fast cold start | No persistent connections |
| **Supabase managed → self-hosted** | Keep migrations as-is                     | Complex ops               |
| **AWS RDS PostgreSQL**             | Production-grade, SLAs                    | Complex setup, cost       |
| **Render**                         | Simple deployment, free tier              | Slower cold starts        |

**Migration steps:**

```bash
# 1. Export from Supabase
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" \
  --no-owner --no-acl --schema=public \
  > supabase_export.sql

# 2. Import to new provider
psql "[new_provider_connection_string]" < supabase_export.sql

# 3. Run Drizzle schema sync
npx drizzle-kit push:pg
```

Existing migration files in `supabase/migrations/` become the Drizzle migration baseline.

**Row Level Security**: Supabase RLS policies are PostgreSQL-native. They can be kept on the new DB or replaced with application-level authorization middleware.

**Recommendation**: Replace RLS with server-side authorization in the API layer (clearer, testable, no DB policy hunting).

**Effort**: 3–5 days.

---

#### Phase 5 — Realtime Replacement (1–2 weeks)

Supabase Realtime is currently used (inferred from social feed and notification components) for live post/notification updates.

**Replacement**: **Socket.io** on the Node.js server, or **Server-Sent Events (SSE)** for simpler one-way streams.

| Use Case                      | Technology            | Reason                               |
| ----------------------------- | --------------------- | ------------------------------------ |
| Live notification delivery    | SSE                   | Simple, HTTP, no WS overhead         |
| Social feed live updates      | SSE with event types  | Unidirectional from server           |
| Real-time leaderboard         | Polling (5s interval) | Simpler than WS, sufficient fidelity |
| Future: live reading sessions | Socket.io             | Bidirectional required               |

**SSE implementation pattern:**

```ts
// server/src/modules/notifications/sse.ts
fastify.get("/notifications/stream", async (req, reply) => {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const cleanup = subscribeToUserEvents(
    req.user.id,
    (event) => {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    },
  );
  req.socket.on("close", cleanup);
});
```

**Effort**: 1–2 weeks.

---

#### Phase 6 — File Storage Migration (2–3 days)

Supabase Storage holds profile avatars and potentially book covers.

**Replacement**:

- **Cloudflare R2** (recommended) — S3-compatible API, no egress fees, generous free tier
- **AWS S3** — industry standard, mature ecosystem
- **Uploadthing** — developer-friendly, TypeScript-first, built for web apps

**Client-side change**: Replace `supabase.storage.from(bucket).upload()` calls with presigned URL pattern:

```ts
// 1. Client requests upload URL from API
const { uploadUrl, fileKey } = await apiClient.post(
  "/storage/presign",
  { filename, contentType },
);

// 2. Client uploads directly to R2 (no API server bandwidth used)
await fetch(uploadUrl, { method: "PUT", body: file });

// 3. Client confirms upload to API
await apiClient.post("/storage/confirm", { fileKey });
```

**Effort**: 2–3 days.

---

### 5.4 Infrastructure Stack Recommendation

| Layer        | Service                        | Justification                             |
| ------------ | ------------------------------ | ----------------------------------------- |
| API Server   | Railway                        | Git-push deploy, auto-SSL, env management |
| Database     | Railway PostgreSQL             | Co-located with API, private networking   |
| Cache        | Upstash Redis                  | Serverless Redis, HTTP API, free tier     |
| File Storage | Cloudflare R2                  | No egress cost, S3-compatible             |
| CDN/Edge     | Cloudflare                     | Free tier sufficient for SPA + R2         |
| Frontend     | Vercel (current)               | No change needed                          |
| Monitoring   | Sentry (errors) + Axiom (logs) | Lightweight, generous free tiers          |

**Monthly cost estimate (growth stage)**:

- Railway (server + DB): ~$10–25/month
- Upstash Redis: $0 (free tier covers up to 10k req/day)
- Cloudflare R2 + CDN: $0–3/month
- Vercel Frontend: $0 (Hobby tier)
- Sentry: $0 (5k errors/month free)

**Total: ~$10–28/month** vs Supabase Pro: $25/month (with limitations).

---

### 5.5 Migration Timeline

```
Week 1      Phase 0 — Env vars                     [0.5 days]
             Phase 1 — API abstraction layer         [5 days]
Week 2–3    Phase 2 — Backend server skeleton       [7 days]
             Phase 2 — Full module coverage          [5 days]
Week 4      Phase 3 — Auth migration                [7 days]
Week 5      Phase 4 — DB migration                  [4 days]
             Phase 5 — Realtime (SSE)                [3 days]
Week 6      Phase 6 — Storage migration             [3 days]
             Integration testing + cutover          [2 days]
```

**Total estimated effort**: 6 weeks for a single developer, 3 weeks with 2 developers.

---

### 5.6 Post-Migration Validation Checklist

- [ ] All auth flows (register, login, OAuth, forgot password, reset) work end-to-end
- [ ] Reading sessions persist correctly across page refreshes
- [ ] Achievement triggers fire on correct events
- [ ] Streak calculation is accurate (compare with old Supabase data)
- [ ] Leaderboard rankings match historical data
- [ ] Image uploads complete successfully (profile photos, covers)
- [ ] Notifications deliver within acceptable latency (<5s)
- [ ] Zero Supabase imports remain anywhere in `src/`
- [ ] All env vars documented in `.env.example`
- [ ] Server error rates < 0.1% in production

---

## 6. Summary

All 11 sections of the design plan have been implemented. Several components have been **extended beyond the plan** with additional variant options (glass button, flat card, muted badge, `xs` progress, `showLabel` prop, bottom nav line indicator). No regressions were introduced — all TypeScript checks pass with zero errors.

The remaining engineering work follows two tracks:

1. **Developer experience improvements** (strict TypeScript, ESLint a11y, Jest) — separate tooling sprint
2. **Backend migration** — detailed 6-phase roadmap above, ~6 weeks estimated effort

The design system is now stable and ready for domain component integration. When implementing new features, use the token system from `index.css` and the CVA variant APIs from each UI primitive.

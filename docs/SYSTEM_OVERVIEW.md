# SYSTEM_OVERVIEW.md

> Architecture review generated on 2026-03-11.  
> All findings are grounded in direct inspection of the repository.

---

## 1. System Description

**BiblioGame Zone** is a gamified reading management single-page application (SPA).  
It allows users to track books and reading sessions, unlock achievement badges, interact socially with other readers, and view analytics dashboards about their reading habits.

The product is aimed at individual readers who want motivation beyond a plain reading log. The gamification loop (streaks, points, levels, achievements) drives retention.

---

## 2. Architecture Style

The codebase combines multiple patterns that are not always fully reconciled:

| Pattern                        | Evidence                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| **Component-driven (primary)** | `src/components/` contains 30+ co-located, largely self-sufficient components       |
| **Feature-based (partial)**    | `src/features/auth/` and `src/features/dashboard/` exist but are sparsely populated |
| **Domain hooks layer**         | All data operations are encapsulated in `src/hooks/use*.tsx`                        |
| **Shared kernel**              | `src/shared/` isolates accessibility, performance, types, and utils                 |

The architecture is best described as a **component-driven modular monolith** with a partially adopted feature-based layout. The `src/features/` structure was started but not completed — most business logic still lives in `src/components/` or `src/hooks/`.

**Maturity level: Advanced MVP / Early Production.**  
The platform has production infrastructure (Vercel deployment, Supabase RLS, migrations, monitoring) but some structural decisions are inconsistently applied.

---

## 3. Main Modules

| Module          | Path                                                                        | Responsibility                                     |
| --------------- | --------------------------------------------------------------------------- | -------------------------------------------------- |
| Auth            | `src/providers/AuthProvider.tsx`, `src/hooks/useAuth.tsx`                   | Session management, sign in/up/out, password reset |
| Books           | `src/hooks/useBooks.tsx`                                                    | Google Books API search, CRUD for user library     |
| Profiles        | `src/hooks/useProfile.tsx`                                                  | User profile reads and updates                     |
| Achievements    | `src/hooks/useAchievements.tsx`                                             | Achievement listing, progress computation          |
| Social          | `src/hooks/useSocial.tsx`, `useEnhancedSocial.tsx`, `usePostsOptimized.tsx` | Follows, posts, comments, likes                    |
| Streaks         | `src/hooks/useStreakUpdate.tsx`                                             | Reading streak calculation                         |
| Notifications   | `src/components/NotificationSystemSimple.tsx`                               | In-app notification delivery                       |
| Performance     | `src/shared/performance/`                                                   | Metrics, bundle analysis, timing                   |
| Accessibility   | `src/shared/accessibility/`                                                 | ARIA helpers, keyboard nav, announcer              |
| Supabase Client | `src/integrations/supabase/client.ts`                                       | Singleton client with conditional auth storage     |

---

## 4. High-Level Diagram (ASCII)

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ App.tsx  (QueryClientProvider + AuthProvider +       │    │
│  │           Router + ErrorBoundary)                    │    │
│  │                                                      │    │
│  │  ┌──────────────────┐  ┌──────────────────────────┐ │    │
│  │  │  ResponsiveNav   │  │    Page Components        │ │    │
│  │  └──────────────────┘  │  SocialFeed / Library /   │ │    │
│  │                        │  Search / Profile         │ │    │
│  │                        └──────────┬───────────────┘ │    │
│  │                                   │ uses             │    │
│  │                        ┌──────────▼───────────────┐ │    │
│  │                        │   Domain Hooks Layer      │ │    │
│  │                        │  useBooks / useAuth /     │ │    │
│  │                        │  useProfile / useSocial   │ │    │
│  │                        └──────────┬───────────────┘ │    │
│  │                                   │ calls             │    │
│  │                        ┌──────────▼───────────────┐ │    │
│  │                        │    TanStack Query         │ │    │
│  │                        │  (cache + mutations)      │ │    │
│  │                        └──────────┬───────────────┘ │    │
│  └───────────────────────────────────┼──────────────────┘   │
└──────────────────────────────────────┼──────────────────────┘
                                       │ HTTP / WebSocket
                          ┌────────────▼────────────────┐
                          │       Supabase Cloud          │
                          │  PostgREST API  │  Auth       │
                          │  RLS Policies   │  Realtime   │
                          │  Edge Functions │  Storage    │
                          └─────────────────────────────┘
                                       │
                          ┌────────────▼────────────────┐
                          │     External APIs            │
                          │  Google Books API            │
                          └─────────────────────────────┘
```

---

## 5. Key Architectural Decisions

| Decision                         | Implementation                                               | Risk                                            |
| -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| No state manager (Redux/Zustand) | TanStack Query + local `useState`                            | Stale cross-hook state is possible              |
| Supabase as full backend         | PostgREST + RLS + Triggers                                   | Tight coupling between UI queries and DB schema |
| shadcn/ui as component base      | Radix UI primitives + Tailwind                               | Low — very maintainable                         |
| Conditional auth storage         | In-memory vs localStorage per `rq_remember` flag             | Edge case: storage desync on tab refresh        |
| Feature dirs not fully adopted   | `features/auth` and `features/dashboard` partially populated | Navigational confusion for contributors         |

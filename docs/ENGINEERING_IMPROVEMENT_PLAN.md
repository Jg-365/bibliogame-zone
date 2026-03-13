# ENGINEERING_IMPROVEMENT_PLAN.md

> Prioritized engineering roadmap based on direct repository inspection.  
> Each item includes: problem, evidence, impact, suggested solution, and estimated effort.

---

## Short Term — Quick Wins (1–2 weeks each)

### SH-1 — Move Supabase credentials to environment variables

**Problem**: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are hardcoded string literals in `src/integrations/supabase/client.ts`.  
**Evidence**: Lines 5–8 of `client.ts` contain literal values committed to repository.  
**Impact**: Security hygiene, enables multi-environment deployment without code changes.  
**Solution**:

```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env
  .VITE_SUPABASE_ANON_KEY;
```

Create `.env.local` (gitignored) and `.env.example` (committed).  
**Effort**: 30 minutes.

---

### SH-2 — Add HTTP security headers to vercel.json

**Problem**: `vercel.json` sets only `Content-Type` and `Cache-Control` headers. No CSP, no `X-Frame-Options`, no `X-Content-Type-Options`.  
**Evidence**: `vercel.json` lines 17–47 contain only content-type and cache headers.  
**Impact**: Reduces XSS risk, clickjacking, MIME sniffing attacks.  
**Solution**: Add to `vercel.json`:

```json
{
  "source": "/(.*)",
  "headers": [
    { "key": "X-Frame-Options", "value": "DENY" },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    {
      "key": "Referrer-Policy",
      "value": "strict-origin-when-cross-origin"
    },
    {
      "key": "Permissions-Policy",
      "value": "camera=(), microphone=(), geolocation=()"
    }
  ]
}
```

**Effort**: 1 hour.

---

### SH-3 — Enable TypeScript strict mode

**Problem**: `tsconfig.app.json` explicitly disables `strict`, `noImplicitAny`, `noUnusedLocals`, and `noUnusedParameters`.  
**Evidence**: All flags set to `false` in `tsconfig.app.json`.  
**Impact**: Prevents implicit `any` propagation, catches dead code, dramatically improves maintainability.  
**Solution**: Enable flags incrementally. Start with `noImplicitAny: true` and fix resulting errors. Use `// @ts-expect-error` as escape hatch only where third-party types are inadequate.  
**Effort**: 2–4 hours (fixing type errors after enabling).

---

### SH-4 — Add eslint-plugin-jsx-a11y

**Problem**: The README claims accessibility linting but `jsx-a11y` is absent from `package.json` and `eslint.config.js`.  
**Evidence**: `package.json` devDependencies do not include `eslint-plugin-jsx-a11y`.  
**Impact**: Catches accessibility regressions at lint time (missing alt text, improper ARIA roles, click handlers on non-interactive elements).  
**Solution**:

```bash
npm install -D eslint-plugin-jsx-a11y
```

Add to `eslint.config.js`:

```js
import jsxA11y from "eslint-plugin-jsx-a11y";
// ... add to plugins and extend recommended rules
```

**Effort**: 1–2 hours (fix new lint errors).

---

### SH-5 — Install Jest and wire existing testUtils

**Problem**: `src/__tests__/utils/testUtils.tsx` imports `@testing-library/react` which is not in `package.json`. No Jest config exists. The `test` script is absent from `package.json`.  
**Evidence**: `package.json` scripts section has no `test` command; `@testing-library/react` absent from devDependencies.  
**Impact**: Enables the unit test infrastructure that already exists conceptually.  
**Solution**:

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom ts-jest
```

Add `jest.config.ts` and `"test": "jest"` to `package.json` scripts.  
**Effort**: 2–3 hours (config + fixing import paths for existing utils).

---

### SH-6 — Consolidate duplicate navigation components

**Problem**: Three navigation components exist: `Navigation.tsx`, `MobileNavbar.tsx`, `ResponsiveNavigation.tsx`.  
**Evidence**: All three files present in `src/components/`.  
**Impact**: Dead code removal, reduced bundle size, clarity.  
**Solution**: Confirm which is used in `App.tsx` (currently `ResponsiveNavigation`). Delete or archive unused components after confirming no other import.  
**Effort**: 1–2 hours.

---

### SH-7 — Move database_indexes.sql into a migration

**Problem**: `database_indexes.sql` at the project root is a manual advisory file outside the migration system.  
**Evidence**: File present at root, not in `supabase/migrations/`.  
**Impact**: Index creation becomes reproducible and tracked.  
**Solution**: Create a new timestamped migration file in `supabase/migrations/` containing the index definitions. Delete the root-level file.  
**Effort**: 30 minutes.

---

## Medium Term — Architecture Improvements (1–4 weeks each)

### MT-1 — Consolidate the social hooks layer

**Problem**: Three hooks (`useSocial`, `useEnhancedSocial`, `usePostsOptimized`) cover the social domain with overlapping responsibilities.  
**Evidence**: All three files present in `src/hooks/`.  
**Impact**: Single cache namespace for social data, predictable invalidation, clear API contract for components.  
**Solution**: Audit all consumers of each hook. Extract a single `useSocial` hook that combines post listing, pagination, likes, comments, and follow state. Deprecate and remove the redundant hooks.  
**Effort**: 1 week.

---

### MT-2 — Replace client-side achievement merge with a database view

**Problem**: `useAchievements` makes 3 separate queries and merges results on the client.  
**Evidence**: `src/hooks/useAchievements.tsx` lines 12–80 show three `useQuery` calls, the third computing a derived join.  
**Impact**: Reduced round trips (3 → 1), eliminated client-side stale-data merge risk.  
**Solution**: Create a Supabase view:

```sql
CREATE VIEW user_achievement_progress AS
  SELECT a.*, ua.unlocked_at, (ua.id IS NOT NULL) as unlocked
  FROM achievements a
  LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = auth.uid();
```

Replace the three queries with a single `useQuery` against this view.  
**Effort**: 1–2 days.

---

### MT-3 — Complete the feature-based architecture migration

**Problem**: `src/features/` exists with only `auth/` and `dashboard/` partially filled. All other domain components are in `src/components/` as a flat namespace.  
**Evidence**: `src/features/` directory listing; `src/components/` containing domain-specific components (`BookLibrary`, `AchievementsPanel`, `EnhancedSocialSection`).  
**Impact**: Scalable contributor model, clear domain boundaries, easier code navigation.  
**Solution**: Move domain components to their feature directories:

```
src/features/library/     ← BookLibrary, BookCard, BookActions, BookActionButtons
src/features/social/      ← SocialFeed, PostCard, CreatePost, ActivityFeed
src/features/achievements/ ← AchievementsPanel, AchievementBadge
src/features/profile/     ← ProfileManager, UserProfileDialog, StatsCard
src/features/streaks/     ← StreakDisplay, StreakRecalculator
```

**Effort**: 2–3 weeks (incremental moves with import updates).

---

### MT-4 — Separate Google Books client from useBooks

**Problem**: `useBooks.tsx` (432 lines) mixes Google Books API integration (including a custom relevance scoring algorithm) with Supabase CRUD operations.  
**Evidence**: `searchGoogleBooks` function + scoring algorithm in lines 17–100 of `useBooks.tsx`.  
**Impact**: Separation of concerns, independent testability of the Google Books client.  
**Solution**: Extract to `src/lib/googleBooksClient.ts` (or `src/integrations/googleBooks/`). `useBooks` imports and calls it, but the network layer is independently testable and replaceable.  
**Effort**: 2–4 hours.

---

### MT-5 — Implement real unit and integration test coverage

**Problem**: No unit or integration tests exist despite the README claiming >80% coverage.  
**Evidence**: `src/__tests__/` contains only `testUtils.tsx`; no test files for hooks, components, or pages.  
**Impact**: Confidence in refactoring, regression detection, compliance with stated quality standards.  
**Solution**: Prioritize by risk surface:

1. `AuthProvider` — session management, sign-in/sign-out flows
2. `useBooks` — mutation logic, Google Books search
3. `useAchievements` — unlock logic
4. `BookCard` / `PostCard` — rendering with mock data
   Add MSW for Supabase API mocking in integration tests.  
   **Target**: Reach stated >80% threshold within 1 month of dedicated effort.  
   **Effort**: 3–4 weeks.

---

### MT-6 — Implement route-based lazy loading

**Problem**: All pages are statically imported in `App.tsx`, negating route-based code splitting.  
**Evidence**: `App.tsx` lines 34–45 show static imports for all pages; the comment "removed to avoid lazy loading issues" confirms intentional revert.  
**Impact**: Reduced initial bundle size, faster first contentful paint.  
**Solution**: Fix root cause of previous lazy loading failure (likely a provider context missing in Suspense boundaries) and re-implement:

```tsx
const SocialFeed = React.lazy(
  () => import("./pages/SocialFeed"),
);
// Wrap Routes in <Suspense fallback={<PageSkeleton />}>
```

**Effort**: 1–2 days.

---

## Long Term — Scalability (1–3 months each)

### LT-1 — Introduce a global state layer for cross-hook data

**Problem**: With TanStack Query as the sole state mechanism, cross-feature data sharing (e.g., user profile data needed in hooks and components simultaneously) relies on cache key consistency. As features grow, this becomes brittle.  
**Evidence**: Multiple hooks independently query `profiles` with slightly different query keys; cache warm-up strategies needed in `cacheStrategies.ts`.  
**Impact**: Single source of truth for user-level data, predictable invalidation patterns.  
**Solution**: Introduce a lightweight Zustand store for user session data (`userId`, `profile`, `preferences`) that is separate from TanStack Query's server cache. TanStack Query remains for server data; Zustand for client-side session state.  
**Effort**: 2–4 weeks.

---

### LT-2 — Implement a Content Security Policy

**Problem**: No CSP is configured. The app loads content from Supabase CDN, Google Books, and potentially user-uploaded URLs.  
**Evidence**: `vercel.json` has no CSP header.  
**Impact**: Prevents XSS escalation even if a rendering bug occurs; required for most security compliance frameworks.  
**Solution**: Define a strict CSP allowing:

- `self` for scripts and styles
- Supabase project URL for API calls
- `books.google.com` for cover images
- Gradual tightening via CSP Report-Only mode first
  **Effort**: 1–2 weeks (requires auditing all external resource origins).

---

### LT-3 — Add Supabase Realtime for social feed

**Problem**: The social feed is polled via TanStack Query with a 2-minute stale time. Users do not see live updates from other users.  
**Evidence**: `usePostsOptimized` uses standard `useQuery` with no Supabase Realtime subscription.  
**Impact**: Real-time social experience; competitive feature for a social reading platform.  
**Solution**: Add a Supabase Realtime subscription in the social hook that invalidates `social-posts` query on insert events. This integrates cleanly with TanStack Query's `invalidateQueries`.  
**Effort**: 1 week.

---

### LT-4 — Build a component catalog (Storybook)

**Problem**: 30+ components with no isolated development or visual documentation environment. Duplication (Enhanced* vs original*) suggests components are developed in-app without a sandbox.  
**Evidence**: No Storybook config or story files in repository.  
**Impact**: Prevent component duplication, document the design system, speed up UI development, enable visual regression testing.  
**Solution**: Install Storybook with the Tailwind + Radix addon. Write stories for all `src/components/ui/` primitives and key domain components.  
**Effort**: 2–4 weeks (initial setup + stories for existing components).

---

### LT-5 — Fix duplicate migration timestamps

**Problem**: Two migrations share the timestamp `20250924170000` (`achievement_system.sql` and `add_custom_books_support.sql`). A third pair exists at `20251007000000`.  
**Evidence**: `supabase/migrations/` directory listing.  
**Impact**: Non-deterministic migration ordering in fresh deployments; production vs staging schema drift.  
**Solution**: Rename one migration in each conflicting pair to a timestamp 1 second later. Coordinate with any existing production deployment to avoid re-running already-applied migrations.  
**Effort**: 2–4 hours + coordination.

---

## Summary Table

| ID   | Title                           | Priority    | Effort  |
| ---- | ------------------------------- | ----------- | ------- |
| SH-1 | Credentials to env vars         | 🔴 Critical | 30 min  |
| SH-2 | HTTP security headers           | 🟠 High     | 1 hr    |
| SH-3 | Enable TypeScript strict        | 🟠 High     | 4 hrs   |
| SH-4 | Add jsx-a11y linting            | 🟡 Medium   | 2 hrs   |
| SH-5 | Install Jest + wire tests       | 🟡 Medium   | 3 hrs   |
| SH-6 | Remove duplicate nav components | 🟢 Low      | 2 hrs   |
| SH-7 | Move indexes to migration       | 🟢 Low      | 30 min  |
| MT-1 | Consolidate social hooks        | 🟠 High     | 1 week  |
| MT-2 | DB view for achievements        | 🟡 Medium   | 2 days  |
| MT-3 | Complete feature architecture   | 🟡 Medium   | 3 weeks |
| MT-4 | Separate Google Books client    | 🟡 Medium   | 4 hrs   |
| MT-5 | Real unit test coverage         | 🟠 High     | 4 weeks |
| MT-6 | Route-based lazy loading        | 🟡 Medium   | 2 days  |
| LT-1 | Zustand for session state       | 🟡 Medium   | 3 weeks |
| LT-2 | Content Security Policy         | 🟠 High     | 2 weeks |
| LT-3 | Realtime social feed            | 🟡 Medium   | 1 week  |
| LT-4 | Storybook component catalog     | 🟢 Low      | 4 weeks |
| LT-5 | Fix migration timestamps        | 🟠 High     | 4 hrs   |

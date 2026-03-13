# PERFORMANCE_ANALYSIS.md

> All findings are grounded in direct inspection of the repository.

---

## 1. Current Optimization Techniques

### Bundle Splitting (vite.config.ts)

Manual chunks are configured:

```
vendor  → react, react-dom
ui      → @radix-ui/react-dialog, @radix-ui/react-dropdown-menu
supabase → @supabase/supabase-js
```

Only two of the 20+ Radix UI packages are assigned to the `ui` chunk. The rest will end up in the default bundle or their own micro-chunks depending on Rollup's tree-shaking. The split is well-intentioned but incomplete.

### Asset Organization

Assets are organized into `/assets/images/`, `/assets/css/`, `/assets/js/` via `assetFileNames`/`chunkFileNames` in Rollup output — good for cache-busting and CDN configuration.

### TanStack Query Cache

Global cache strategy (from `App.tsx`):

- `staleTime` = 2 minutes (data considered fresh)
- `gcTime` = 15 minutes (cache retention)
- `refetchOnWindowFocus` = false (prevents user-triggered re-fetches on tab switch)
- Exponential backoff retry (max 3, capped at 10s)

Per-entity cache constants in `src/lib/fetchUtils.ts` define tighter windows for high-volatility data (likes: 30s stale).

### Prefetching

`src/lib/cacheStrategies.ts` implements `usePrefetchStrategies`:

- After 2 seconds of authentication, prefetches `profile` and `recent-books`
- `prefetchOnHover` utility for hover-based speculative loading

### Virtualization Dependencies

`react-window` and `react-window-infinite-loader` are present as production dependencies. No evidence was found in the inspected component files of their active use in rendered lists — they may be in components not inspected, or may be imported but not yet wired to real data lists.

### Monitoring Infrastructure

`src/shared/performance/AppPerformanceProvider.tsx` provides a React context that:

- Tracks `loadTime`, `renderTime`, `memoryUsage` via `performance.now()` and `performance.memory`
- Logs timings to console in development

`src/lib/monitoring.ts` implements an in-memory logger (max 1000 entries) that console-logs in development and is designed to send critical logs to a server endpoint in production. No evidence of a real server endpoint being configured.

---

## 2. Potential Bottlenecks

### No Route-Based Lazy Loading

All page components are statically imported in `App.tsx`:

```tsx
import SocialFeed from "./pages/SocialFeed";
import { SearchPage } from "./pages/Search";
import { LibraryPage } from "./pages/Library";
import ProfilePage from "./pages/Profile";
```

Despite manual chunk configuration in Vite, these static imports ensure all pages are bundled into the initial load. Route-based `React.lazy()` + `Suspense` is absent. The README comment "removed to avoid lazy loading issues" (visible in `App.tsx` comment block) suggests lazy loading was attempted and reverted due to bugs.

### framer-motion Bundle Cost

`framer-motion` is a production dependency (~100KB+ gzipped). It is used for page transitions. No evidence of using the lighter `LazyMotion + domAnimation` subset for reduced bundle size.

### Achievement Merge on Client

`useAchievements` runs three sequential `useQuery` calls and merges results on the client. For users with many achievements, this is three round trips plus a client-side map/find loop on each render.

### Google Books API — No Debouncing Confirmed

`useBooks.tsx` includes a custom relevance scoring algorithm that post-processes the Google Books API response on the client. Depending on how the `BookSearch` component calls `searchGoogleBooks`, there is a risk of excessive API calls if input changes are not debounced. Not confirmed from component inspection.

### Social Hooks Redundancy

Three hooks (`useSocial`, `useEnhancedSocial`, `usePostsOptimized`) likely result in duplicate React Query subscriptions if multiple components mount simultaneously. This means redundant cache entries and potentially redundant network requests.

---

## 3. Bundle Size Risk

| Dependency                  | Size Impact    | Notes                                         |
| --------------------------- | -------------- | --------------------------------------------- |
| `framer-motion`             | High (~100KB)  | Used for transitions; no lazy subset          |
| `recharts`                  | Medium (~70KB) | Dashboard charts                              |
| `@supabase/supabase-js`     | Medium (~50KB) | Correctly isolated in its own chunk           |
| All Radix UI packages (20+) | Medium–High    | Only 2 in `ui` chunk; others may land in main |
| `react-window`              | Low            | Imported but activation not confirmed         |
| `embla-carousel-react`      | Low            | Present; use context not confirmed            |

---

## 4. Rendering Patterns

- No evidence of `React.memo` wrapping on heavy list-item components (e.g., `BookCard`, `PostCard`)
- No `useMemo` usage confirmed in the hook layer for derived data
- `AppPerformanceProvider` state updates (`setTimings`, `setMetrics`) on every `startTiming`/`endTiming` call could trigger re-renders in consuming components due to context propagation
- `AnnouncerComponent` is recreated on each render of `useAnnouncer` via `useCallback` — the `announcement` state triggers re-renders of anything consuming the hook

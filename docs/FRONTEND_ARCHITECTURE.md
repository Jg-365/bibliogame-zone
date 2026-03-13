# FRONTEND_ARCHITECTURE.md

> All findings are grounded in direct inspection of the repository.

---

## 1. Folder Architecture

```
src/
├── App.tsx                    # Root: provider tree, router, global QueryClient
├── main.tsx                   # Entry point
├── components/                # 30+ components — mixed domain + UI concerns
│   ├── ui/                    # shadcn/ui primitive wrappers
│   ├── auth/                  # AuthPage, login/register forms
│   └── [domain components]    # BookCard, AchievementsPanel, SocialSection…
├── features/                  # ⚠ Partially adopted: only auth/ and dashboard/
├── hooks/                     # All data + state logic (12 hooks)
├── pages/                     # Route-level wrappers (thin — delegate to hooks+components)
├── providers/                 # AuthProvider (sole provider)
├── shared/
│   ├── accessibility/         # ARIA utilities, keyboard nav hooks
│   ├── components/            # ResponsiveComponents
│   ├── performance/           # AppPerformanceProvider, PerformanceDebugger
│   ├── schemas/               # (present, contents not inspected)
│   ├── types/                 # Central domain type definitions
│   └── utils/                 # responsive.ts, error utils
├── integrations/supabase/     # Supabase client + generated types
└── lib/                       # apiError, cacheStrategies, fetchUtils, monitoring
```

### Structural Assessment

**Strength**: The `shared/` kernel is well-conceived. Its sub-directories (accessibility, performance, types, utils) are correctly isolated.

**Weakness**: `src/components/` blurs the boundary between reusable primitives and domain/page-level components. `BookLibrary.tsx`, `AchievementsPanel.tsx`, `EnhancedSocialSection.tsx`, and `ReadingCalendar.tsx` are domain features, not generic components. They should live under `src/features/` or alongside their pages.

**Weakness**: `src/features/` exists but is incomplete. `features/auth/` and `features/dashboard/` are started, while the social, library, and profile features remain only in `components/` and `pages/`. This creates an inconsistent contribution model.

---

## 2. Component Hierarchy

```
App
├── QueryClientProvider           (TanStack Query)
├── BrowserRouter
│   └── AuthProvider
│       └── AppContent
│           ├── ErrorBoundary
│           ├── AppPerformanceProvider
│           ├── NotificationSystemSimple
│           ├── AnnouncerComponent     (sr-only ARIA live region)
│           ├── ResponsiveNavigation
│           └── <Routes>
│               ├── /social-feed      → SocialFeed
│               ├── /search           → SearchPage
│               ├── /library          → LibraryPage
│               ├── /profile          → ProfilePage
│               ├── /user/:id         → UserProfilePage
│               ├── /forgot-password  → ForgotPasswordPage
│               └── /reset-password   → ResetPasswordPage
```

**Note**: Page imports are **not lazy-loaded**. All page components are statically imported in `App.tsx`. This negates potential route-based code splitting benefits despite the `vite.config.ts` `manualChunks` configuration.

---

## 3. Hooks Layer

All server interaction and domain state is encapsulated in `src/hooks/`. This is the most disciplined design decision in the codebase.

| Hook                                                    | Pattern                                                      | Notes                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `useAuth`                                               | Re-export from `providers/AuthProvider`                      | Correct indirection, single source of truth                                            |
| `useBooks`                                              | TanStack Query `useQuery` + `useMutation`                    | Also includes Google Books API fetcher                                                 |
| `useProfile`                                            | TanStack Query (DB-typed via `Database["public"]["Tables"]`) | Type-safe against generated schema                                                     |
| `useAchievements`                                       | Three chained `useQuery` calls                               | Derived query (`achievementsWithProgress`) runs client-side merge — could be a DB join |
| `useSocial` / `useEnhancedSocial` / `usePostsOptimized` | Three overlapping hooks                                      | **Duplication risk** — unclear which is the canonical social hook                      |
| `useStreakUpdate`                                       | Mutation + profile invalidation                              | Dependent on server-side trigger for accuracy                                          |
| `useAccountGuard`                                       | Effect + sign-out side effect                                | Background polling guard for deleted accounts                                          |

**useAchievements pattern issue**: The hook fires three separate queries and merges on the client. This is a N+1 data pattern where a single SQL join would be more efficient.

**Social hooks proliferation**: Three hooks (`useSocial`, `useEnhancedSocial`, `usePostsOptimized`) cover overlapping social functionality. This suggests incremental development without consolidation. Consumers likely use different hooks for the same conceptual domain.

---

## 4. Design System

Built on **shadcn/ui** (Radix UI primitives + Tailwind CSS). All primitive wrappers live in `src/components/ui/`.

### Tailwind Configuration

- Custom CSS variables for color tokens defined in `src/index.css` (HSL-based design tokens)
- `tailwindcss-animate` for transition utilities
- `@tailwindcss/typography` for prose content
- Dark mode: via `next-themes` and CSS variable switching

### Token System (from README)

```
--primary: 262.1 83.3% 57.8%   (Purple)
--secondary: 220 14.3% 95.9%   (Light Gray)
--accent: 142.1 76.2% 36.3%    (Green)
--destructive: 0 84.2% 60.2%   (Red)
```

### Motion

`framer-motion` is used for page/element transitions. Declared as a production dependency. No evidence of conditional rendering behind `prefers-reduced-motion` checks beyond what the shared accessibility module provides.

---

## 5. UI Composition Patterns

**Strengths**:

- shadcn/ui provides accessible, composable primitives (Radix-backed)
- `react-window` and `react-window-infinite-loader` are imported for list virtualization
- `react-intersection-observer` imported for lazy visibility triggers
- `ResponsiveContainer` in `shared/components/` provides breakpoint-aware wrappers

**Risks**:

- `EnhancedStreakDisplay.tsx` and `StreakRecalculator.tsx` alongside `AutoStreakRecalculator.tsx` suggest UI components are duplicated during feature iteration without cleanup
- `SocialSection.tsx` and `EnhancedSocialSection.tsx` is another duplication pair
- `Navigation.tsx`, `MobileNavbar.tsx`, and `ResponsiveNavigation.tsx` — three navigation components; one may be unused
- No evidence of Storybook or component catalog; reuse is informal

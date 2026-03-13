# TECHNICAL_DEBT.md

> All findings are grounded in direct inspection of the repository.

---

## 1. Architectural Smells

### 1.1 Abandoned Feature Structure

**Location**: `src/features/`  
**Description**: The project started adopting a feature-based architecture (`features/auth`, `features/dashboard`) but did not complete the migration. The majority of domain logic (social, library, profile, achievements) remains in the flat `src/components/` directory alongside generic UI components. New contributors have no clear signal about where to add functionality.  
**Impact**: Navigation confusion, inconsistent contribution model, risk of growing `src/components/` into an unmanageable monolith.

### 1.2 Social Hooks Proliferation

**Location**: `src/hooks/useSocial.tsx`, `useEnhancedSocial.tsx`, `usePostsOptimized.tsx`  
**Description**: Three separate hooks covering the social domain. This suggests iterative development where hooks were added rather than refactored. Each may have overlapping query keys, causing multiple cache entries for the same logical data.  
**Impact**: Cache inconsistency, unclear canonical API for social data, hard to onboard new developers.

### 1.3 Achievement Data Merged Client-Side

**Location**: `src/hooks/useAchievements.tsx`  
**Description**: Three separate `useQuery` calls fetch all achievements, user achievements, and then a third query computes the join client-side. This is a misuse of TanStack Query for derived state — the join should happen server-side (SQL JOIN or DB view).  
**Impact**: Three network round trips for one logical resource, extra memory consumption, stale sub-queries feeding derived query.

---

## 2. Component Duplication

| Pair                                                     | Location          | Risk                                                |
| -------------------------------------------------------- | ----------------- | --------------------------------------------------- |
| `SocialSection` vs `EnhancedSocialSection`               | `src/components/` | Unclear which is used in production; dead code risk |
| `StreakRecalculator` vs `AutoStreakRecalculator`         | `src/components/` | Likely one superseded the other; dead code          |
| `Navigation` vs `MobileNavbar` vs `ResponsiveNavigation` | `src/components/` | Three navigation components; two may be orphaned    |
| `EnhancedStreakDisplay` vs implicit streak in Profile    | Unclear           | Potential double rendering of streak data           |

No evidence of a cleanup pass after iterative enhancements.

---

## 3. TypeScript Configuration Issues

**Location**: `tsconfig.app.json`

```json
"strict": false,
"noUnusedLocals": false,
"noUnusedParameters": false,
"noImplicitAny": false,
"noFallthroughCasesInSwitch": false
```

All strict TypeScript guards are **explicitly disabled**. This means:

- Implicit `any` is allowed throughout the codebase
- Unused variables and parameters produce no warnings
- The `as any` cast observed in `useAchievements.tsx` is a symptom of this setting

The README claims "Comprehensive TypeScript implementation with strict configuration" — this is contradicted by the `tsconfig.app.json`.

---

## 4. ESLint Under-configured

**Location**: `eslint.config.js`

```js
"@typescript-eslint/no-unused-vars": "off",
```

The only TypeScript ESLint rule explicitly configured is **turned off**. The config applies `tseslint.configs.recommended` which covers basic rules, but:

- No accessibility linting rules (`eslint-plugin-jsx-a11y` is absent from `package.json`)
- No import ordering or cycle detection rules
- No rule for disallowing `any` casts
- `react-refresh/only-export-components` is set to `warn` only

The README mentions "ESLint with accessibility, React, and TypeScript rules" — accessibility linting (`jsx-a11y`) is absent from `package.json`.

---

## 5. Hardcoded Configuration

| Item                                      | Location                              | Debt                                   |
| ----------------------------------------- | ------------------------------------- | -------------------------------------- |
| Supabase URL                              | `src/integrations/supabase/client.ts` | Must change code to change environment |
| Supabase anon key                         | Same file                             | Security risk + change requires deploy |
| In-memory logger (no server endpoint)     | `src/lib/monitoring.ts`               | Production monitoring is theoretical   |
| `database_indexes.sql` outside migrations | Root dir                              | Index application is not automated     |

---

## 6. Missing Infrastructure

| Gap                          | Described In README | Actual State                          |
| ---------------------------- | ------------------- | ------------------------------------- |
| Jest + unit test suite       | ✅                  | ❌ Not present                        |
| MSW API mocking              | ✅                  | ❌ Not present                        |
| axe-core accessibility tests | ✅                  | ❌ Not present                        |
| Prettier configuration       | ✅                  | ❌ No `.prettierrc` found             |
| Husky git hooks              | ✅                  | ❌ Not in package.json                |
| `npm run type-check` script  | ✅                  | ❌ Absent from package.json scripts   |
| `npm run format` script      | ✅                  | ❌ Absent from package.json scripts   |
| `docs/` directory            | ✅                  | ❌ Did not exist before this analysis |

---

## 7. Complexity Hotspots

| File                             | Complexity         | Reason                                                                                |
| -------------------------------- | ------------------ | ------------------------------------------------------------------------------------- |
| `src/providers/AuthProvider.tsx` | High (404 lines)   | Handles all auth flows, session restoration, toast notifications, account guard       |
| `src/hooks/useBooks.tsx`         | High (432 lines)   | Contains Google Books API client, search scoring algorithm, and all book mutations    |
| `src/lib/monitoring.ts`          | Medium (503 lines) | Large in-memory logger with multiple categories — could be a separate utility package |
| `src/App.tsx`                    | Medium (301 lines) | Provider tree + routing + navigation state + account guard all in one file            |

`useBooks.tsx` conflates two distinct responsibilities: external API integration (Google Books search + scoring algorithm) with internal data persistence (Supabase CRUD). These should be separated.

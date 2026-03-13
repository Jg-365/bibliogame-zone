# TESTING_ARCHITECTURE.md

> All findings are grounded in direct inspection of the repository.

---

## 1. Declared Testing Stack (from README)

| Tool | Purpose |
|---|---|
| Jest | Test runner and assertions |
| Testing Library | Component / hook testing |
| MSW | API mocking for integration tests |
| axe-core | Automated accessibility testing |
| Playwright | End-to-end tests |

---

## 2. Actual Test Infrastructure Found

### `src/__tests__/utils/testUtils.tsx`
The only file present inside `src/__tests__/`. It contains:
- A custom `render()` wrapper that mounts `QueryClientProvider + AuthProvider + TooltipProvider`
- Mock data factories for `user`, `book`, `readingSession`, `achievement`
- Re-exports everything from `@testing-library/react`

This is a solid test utility foundation. However, it is the **only file in the entire `src/__tests__/` directory tree**. The companion subdirectories described in the README (`components/`, `hooks/`, `pages/`, `e2e/`) do not exist.

### `tests/readquest.spec.ts` (Playwright)
A 377-line Playwright spec file located at the project root `tests/` directory. It covers:
- Authentication page rendering for logged-out users
- Login validation error display
- Dashboard basic rendering

The tests attempt to mock auth state by injecting `localStorage` values directly and then reloading the page — a fragile pattern since Supabase auth state requires a valid JWT, not just a localStorage key.

### `tests/example.spec.ts`
Not inspected in detail; likely the Playwright scaffold example from `@playwright/test` boilerplate.

---

## 3. Testing Coverage Assessment

### Claim vs Reality

| README Claim | Repository Evidence | Status |
|---|---|---|
| ">80% test coverage" | No Jest config, no coverage thresholds defined | **Not confirmed** |
| "Jest + Testing Library" | No Jest config file (`jest.config.*`) found in repo | **Not confirmed** |
| "MSW for API mocking" | MSW not listed in `package.json` dependencies | **Not confirmed** |
| "axe-core integration" | axe-core not in `package.json` | **Not confirmed** |
| "Husky for git hooks" | Husky not in `package.json` devDependencies | **Not confirmed** |
| "npm run test" script | `test` script absent from `package.json` | **Not confirmed** |
| "src/__tests__/components" | Directory does not exist | **Not confirmed** |
| "src/__tests__/hooks" | Directory does not exist | **Not confirmed** |
| "src/__tests__/pages" | Directory does not exist | **Not confirmed** |

### Actual Test Tooling

| Tool | In `package.json`? | Notes |
|---|---|---|
| `@playwright/test` | ✅ devDependencies | Version ^1.55.1 |
| Jest | ❌ | Absent |
| `@testing-library/react` | ❌ | Absent from package.json (testUtils.tsx imports it — either missing or workspace-injected) |
| MSW | ❌ | Absent |
| axe-core / jest-axe | ❌ | Absent |

---

## 4. Testing Philosophy — Actual State

The project's testing story is aspirational. The README describes a comprehensive TDD culture that is not yet reflected in the repository:

- Only one utility file (`testUtils.tsx`) exists in the unit test tree
- Only one Playwright spec file covers a small authentication scenario
- No Jest configuration is present, which means `npm run test` (listed in README) would fail
- `@testing-library/react` is imported in `testUtils.tsx` but is not in `package.json` — suggesting the file was scaffolded but the dependency was never installed

---

## 5. Gaps in Coverage

| Domain | Coverage | Risk |
|---|---|---|
| Authentication flows | Minimal (E2E only, fragile) | High |
| Book CRUD + Google Books search | None | High |
| Achievement unlock logic | None | High |
| Social posts / likes / comments | None | High |
| Streak calculation | None | High |
| Accessibility (axe) | None (tooling absent) | High |
| Performance regressions | None | Medium |
| Error boundary rendering | None | Medium |

---

## 6. Playwright Test Quality

The existing Playwright spec (`readquest.spec.ts`) has structural issues:
- Auth state is mocked by writing to `localStorage`, which may not match Supabase's expected session format
- Tests check for text matches using multilingual regex (`/Entrar|Login|Sign In|Bem-vindo/`) indicating the UI has mixed Portuguese/English strings with no i18n system
- The `beforeEach` drift-detection pattern (checking if authentication is already active before mocking) creates non-deterministic test behavior

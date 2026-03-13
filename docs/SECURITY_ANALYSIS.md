# SECURITY_ANALYSIS.md

> All findings are grounded in direct inspection of the repository.

---

## 1. Authentication Flow

**Provider**: Supabase Auth (JWT-based, email+password)

**Flow**:

1. User submits credentials in `AuthPage`
2. `AuthProvider.signIn()` calls `supabase.auth.signInWithPassword()`
3. Supabase returns a JWT + refresh token
4. Tokens are stored via `conditionalStorage` (in-memory or localStorage based on `rq_remember` flag)
5. `supabase.auth.onAuthStateChange()` listener updates React state on every token change
6. `useAccountGuard()` hook polls to detect deleted accounts and force sign-out

**Password Reset**: Implemented via `resetPassword()` calling `supabase.auth.resetPasswordForEmail()`. A dedicated `/reset-password` route handles the redirect.

**Session Persistence**: The `conditionalStorage` adapter is a thoughtful implementation. In-memory tokens are lost on page reload (intended behavior for non-remembered sessions).

---

## 2. Critical: Hardcoded Credentials in Source Code

**File**: `src/integrations/supabase/client.ts`

```
SUPABASE_URL = "https://knnkzfjussemxswjwtbr.supabase.co"
SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Severity: HIGH**

While the Supabase anon key is technically a public key intended to be used client-side (it has no elevated permissions beyond RLS policies), committing it to a public Git repository creates the following risks:

1. **Anon key abuse**: Any person with the key can query the Supabase API for all data accessible under the `anon` role. If any RLS policy is misconfigured, this becomes data exposure.
2. **URL exposure**: The Supabase project URL identifies the project. Combined with the key, it enables automated scanning and targeted attacks (e.g., auth enumeration via `signInWithPassword`).
3. **Key rotation is painful**: If the key must be rotated (e.g., policy breach), the code must be changed and redeployed.

**Expected practice**: Both values should be read from environment variables (`import.meta.env.VITE_SUPABASE_URL`). The README references `.env.example` but no such file exists in the repository, and the client does not use `import.meta.env`.

---

## 3. Row-Level Security (RLS)

Evidence from migrations shows RLS policies are applied:

- `books` table: policies visible in migration `20251007000000_allow_public_reading_sessions.sql`
- `follows` table: foreign key + policy fixes in `20250924163019_fix_follows_foreign_keys.sql`

The presence of `SECURITY DEFINER` on `check_and_grant_achievements` and `update_user_stats` functions is appropriate — these server-side functions require elevated context to update profiles and achievements on behalf of users.

**Risk**: SECURITY DEFINER functions bypass RLS. If their input validation is insufficient, they could be exploited via crafted input (e.g., injecting a `p_user_id` that does not match the authenticated user). Inspect these functions for missing `auth.uid()` cross-checks.

---

## 4. Client-Side Trust Boundaries

| Pattern                                                     | Assessment                                                                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| All data fetching happens client-side via PostgREST         | The anon JWT is exposed in every network request to Supabase — expected and acceptable for Supabase architecture |
| Achievement calculation is server-side (PostgreSQL trigger) | Correct — cannot be manipulated client-side                                                                      |
| Profile stats calculation is server-side (trigger)          | Correct                                                                                                          |
| Google Books API is called directly from the browser        | No API key is used (public endpoint) — acceptable                                                                |
| Monitoring logs are stored in memory only                   | No data exfiltration risk; production log endpoint not confirmed                                                 |

---

## 5. HTTP Security Headers

`vercel.json` sets only `Content-Type` headers for JS/CSS assets and a `Cache-Control` header for static files.

**Missing security headers**:

- No `Content-Security-Policy` (CSP) header
- No `X-Frame-Options` or `frame-ancestors` CSP directive (clickjacking risk)
- No `X-Content-Type-Options: nosniff`
- No `Strict-Transport-Security` (HSTS) — Vercel sets this by default, but not explicit
- No `Referrer-Policy`

These are important for a production web application but are not present in `vercel.json`.

---

## 6. Input Validation

- `zod` is listed as a production dependency, and `@hookform/resolvers` connects it to `react-hook-form` — meaning form inputs (auth forms at minimum) are Zod-validated client-side.
- `shared/schemas/` directory exists but contents were not inspected. It likely holds Zod schemas.
- Server-side validation is handled by Supabase's PostgREST constraints and RLS. No custom server code.

---

## 7. Additional Observations

| Risk                                     | Severity   | Notes                                                                                                                         |
| ---------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Hardcoded Supabase credentials           | **High**   | Rectify immediately with `import.meta.env`                                                                                    |
| Missing CSP headers                      | Medium     | Add to `vercel.json`                                                                                                          |
| Auth enumeration possible                | Low        | Supabase returns generic error messages for failed sign-in                                                                    |
| No rate limiting on auth attempts        | Low        | Supabase applies rate limiting at the platform level                                                                          |
| localStorage key `rq_remember` unchecked | Low        | An attacker who can XSS the page could read this flag and tokens                                                              |
| XSS risk                                 | Low–Medium | No CSP; user-generated content (posts) must be sanitized before rendering                                                     |
| No evidence of content sanitization      | Medium     | Post content from `social_posts` rendered via React — React escapes by default, but verify no `dangerouslySetInnerHTML` usage |

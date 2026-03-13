# DATA_ARCHITECTURE.md

> All findings are grounded in direct inspection of the repository.

---

## 1. Supabase Integration

### Client Initialization

File: `src/integrations/supabase/client.ts`

The Supabase client is a **module-level singleton** instantiated once at import time. Key design decisions:

- **Hardcoded credentials**: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are committed as string literals in `client.ts`. The comment labels this file "automatically generated". The anon key is a JWT and its presence in source code is a **high-severity finding** — see [SECURITY_ANALYSIS.md](SECURITY_ANALYSIS.md).

- **Conditional auth storage**: A custom storage adapter (`conditionalStorage`) switches between `localStorage` and an in-memory `Map` based on the `rq_remember` localStorage flag. When the user did not check "Remember me", tokens live only in memory and are lost on page reload — a deliberate UX choice to avoid stuck loading states.

- **Type-gen strategy**: `src/integrations/supabase/types.ts` contains the generated database schema types. Hooks consume `Database["public"]["Tables"][TableName]["Row"]` directly — ensuring type safety at compile time when queries return full rows.

---

## 2. Data Flow

```
User Action
     │
     ▼
Domain Hook (useBooks / useProfile / …)
     │ calls
     ▼
TanStack Query (useQuery / useMutation)
     │ executes
     ▼
Supabase JS SDK (.from().select()…)
     │ HTTP
     ▼
Supabase PostgREST API
     │
     ▼
PostgreSQL (RLS enforced per user_id)
     │
     ▼ (triggers on write)
PostgreSQL Functions (update_user_stats, check_and_grant_achievements)
     │
     ▼
Profiles & Achievements tables updated server-side
```

### Cache Layer

TanStack Query sits between hooks and the network. Global defaults (from `App.tsx`):

- `staleTime`: 2 minutes
- `gcTime`: 15 minutes
- `refetchOnWindowFocus`: false
- Exponential backoff retry (3 attempts, capped at 10s), skipping 4xx errors

Per-entity overrides live in `src/lib/cacheStrategies.ts` and `src/lib/fetchUtils.ts`:

- Likes: 30s stale / 2min cache
- Posts: 2min stale / 10min cache
- Profile: 5min stale (prefetch)

---

## 3. Schema Patterns

### Core Tables (inferred from hooks + migrations)

| Table               | Key Columns                                                                                                            | Notes                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `profiles`          | `user_id` (FK → auth.users), `points`, `level`, `books_completed`, `total_pages_read`, `reading_streak`, `best_streak` | Denormalized stats — updated by triggers  |
| `books`             | `user_id`, `title`, `author`, `status`, `pages_read`, `total_pages`, `google_books_id`                                 | Per-user book rows; supports custom books |
| `reading_sessions`  | `user_id`, `book_id`, `pages_read`, `session_duration`                                                                 | Fine-grained session log                  |
| `achievements`      | `requirement_type`, `requirement_value`, `rarity`                                                                      | System-defined, not per-user              |
| `user_achievements` | `user_id`, `achievement_id`, `unlocked_at`                                                                             | Junction table with unique constraint     |
| `social_posts`      | `user_id`, `content`, `created_at`                                                                                     | User feed posts                           |
| `post_likes`        | `user_id`, `post_id`                                                                                                   | Unique per user+post                      |
| `post_comments`     | `user_id`, `post_id`                                                                                                   | Threaded comments                         |
| `follows`           | `follower_id`, `following_id`                                                                                          | Social graph                              |

### Migrations Timeline

23 migration files from `20241003` to `20251007`. Migrations show rapid iterative schema evolution:

- Multiple `fix_*` migrations indicate schema corrections after initial deployment
- Duplicate timestamps (`20251007000000_*`) for two separate migrations suggest manual timestamping without collision checks
- `20250924170000_achievement_system.sql` and `20250924170000_add_custom_books_support.sql` share the **exact same timestamp**, which will cause migration ordering ambiguity

---

## 4. Server-Side Logic

Achievement granting is handled by a PostgreSQL function `check_and_grant_achievements(p_user_id UUID)` (SECURITY DEFINER). It:

1. Reads aggregated stats from `profiles`
2. Iterates all unearned achievements
3. Inserts into `user_achievements` when conditions are met

A trigger `update_user_stats` fires on `books` table writes to keep `profiles.books_completed` and `profiles.total_pages_read` in sync.

**Risk**: Denormalized stats in `profiles` are derived from `books`. If the trigger fails silently or the profile row does not exist, stats drift. A `profiles NOT FOUND` path in the migration function sets zeroes, a defensive fallback.

---

## 5. Database Indexes

`database_indexes.sql` (a manual advisory file, not a migration) defines:

```sql
idx_social_posts_created_at  (created_at DESC)
idx_post_likes_post_id
idx_post_likes_user_post     (user_id, post_id)
idx_post_comments_post_id
idx_profiles_id
idx_books_id
```

**Issue**: This file is not a migration file — it must be applied manually. There is no guarantee it has been applied to production. Index correctness is not enforced via the migration system.

---

## 6. Data Consistency Risks

| Risk                           | Severity | Description                                                                                                                      |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate migration timestamps | Medium   | Two migrations at `20250924170000` will have non-deterministic ordering                                                          |
| Manual index file              | Medium   | `database_indexes.sql` outside migrations is not guaranteed to be applied                                                        |
| Client-side achievement merge  | Low      | `achievementsWithProgress` in `useAchievements` merges two query results on the client; a DB view or join would be more reliable |
| Hardcoded Supabase URL         | High     | Changing the project requires a code change, not a config change                                                                 |
| No `.env` file committed       | Neutral  | `.env.example` referenced in README but not present in repo; credentials are hardcoded instead                                   |

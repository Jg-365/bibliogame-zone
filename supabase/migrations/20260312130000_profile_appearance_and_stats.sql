-- Persist profile appearance and provide a single source of truth for reading stats.

alter table public.profiles
  add column if not exists banner_url text,
  add column if not exists banner_preset_id text;

-- Aggregated reading stats per user from canonical reading entities.
create or replace view public.profile_reading_stats as
select
  p.user_id,
  coalesce(b.books_completed, 0)::int as books_completed,
  coalesce(b.total_pages_read, 0)::int as total_pages_read,
  (coalesce(b.total_pages_read, 0) + coalesce(b.books_completed, 0) * 50)::int as points
from public.profiles p
left join lateral (
  select
    count(*) filter (where bk.status = 'completed') as books_completed,
    coalesce(sum(greatest(coalesce(bk.pages_read, 0), 0)), 0) as total_pages_read
  from public.books bk
  where bk.user_id = p.user_id
) b on true;

grant select on public.profile_reading_stats to authenticated;

-- Low-cost telemetry table for funnel/retention instrumentation.
create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  event_name text not null,
  event_category text null,
  payload jsonb null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_events_user_id_created_at
  on public.product_events (user_id, created_at desc);

create index if not exists idx_product_events_name_created_at
  on public.product_events (event_name, created_at desc);

alter table public.product_events enable row level security;

drop policy if exists "Users can insert own product events" on public.product_events;
create policy "Users can insert own product events"
  on public.product_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own product events" on public.product_events;
create policy "Users can read own product events"
  on public.product_events
  for select
  to authenticated
  using (auth.uid() = user_id);

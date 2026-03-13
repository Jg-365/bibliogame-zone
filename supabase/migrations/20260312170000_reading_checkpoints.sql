create table if not exists public.reading_checkpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  chapter_label text,
  user_summary text not null,
  excerpt text,
  spoiler_level text not null default 'none' check (spoiler_level in ('none', 'mild', 'full')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reading_checkpoints_user_book_page
  on public.reading_checkpoints(user_id, book_id, page_number desc, created_at desc);

alter table public.reading_checkpoints enable row level security;

drop policy if exists "Users can view their own checkpoints" on public.reading_checkpoints;
create policy "Users can view their own checkpoints"
  on public.reading_checkpoints
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own checkpoints" on public.reading_checkpoints;
create policy "Users can insert their own checkpoints"
  on public.reading_checkpoints
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own checkpoints" on public.reading_checkpoints;
create policy "Users can update their own checkpoints"
  on public.reading_checkpoints
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own checkpoints" on public.reading_checkpoints;
create policy "Users can delete their own checkpoints"
  on public.reading_checkpoints
  for delete
  using (auth.uid() = user_id);

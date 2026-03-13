-- Book knowledge pipeline schema (ingestion + Q&A cache)

-- Extend books with AI knowledge metadata (non-breaking)
alter table public.books
  add column if not exists authors text[] default '{}',
  add column if not exists knowledge_status text default 'pending',
  add column if not exists knowledge_last_ingested_at timestamptz,
  add column if not exists knowledge_error text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'books_knowledge_status_check'
  ) then
    alter table public.books
      add constraint books_knowledge_status_check
      check (knowledge_status in ('pending', 'processing', 'ready', 'failed'));
  end if;
end$$;

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  url text not null,
  title text,
  site_name text,
  content_text text not null,
  content_hash text,
  is_valid boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(book_id, url)
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  chapter_number integer,
  title text not null,
  summary text not null,
  themes jsonb not null default '[]'::jsonb,
  keywords jsonb not null default '[]'::jsonb,
  characters jsonb not null default '[]'::jsonb,
  coverage_level text not null default 'medio',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'chapters_coverage_level_check'
  ) then
    alter table public.chapters
      add constraint chapters_coverage_level_check
      check (coverage_level in ('alto', 'medio', 'baixo'));
  end if;
end$$;

create table if not exists public.chapter_events (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  event_description text not null,
  importance_score numeric(4,3) not null default 0.5,
  created_at timestamptz not null default now()
);

create table if not exists public.chapter_analysis (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  analysis_text text not null,
  source_url text,
  source_name text,
  confidence_score numeric(4,3) not null default 0.5,
  created_at timestamptz not null default now()
);

create table if not exists public.questions_log (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_question text not null,
  ai_answer text not null,
  chapters_used jsonb not null default '[]'::jsonb,
  confidence_score numeric(4,3),
  used_fallback boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.question_cache (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  question_hash text not null,
  normalized_question text not null,
  ai_answer text not null,
  chapters_used jsonb not null default '[]'::jsonb,
  confidence_score numeric(4,3),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(book_id, question_hash)
);

create index if not exists idx_sources_book_id on public.sources(book_id);
create index if not exists idx_sources_content_hash on public.sources(content_hash);
create index if not exists idx_chapters_book_id on public.chapters(book_id);
create index if not exists idx_chapters_number on public.chapters(book_id, chapter_number);
create index if not exists idx_chapter_events_chapter_id on public.chapter_events(chapter_id);
create index if not exists idx_chapter_analysis_chapter_id on public.chapter_analysis(chapter_id);
create index if not exists idx_questions_log_book_id on public.questions_log(book_id, created_at desc);
create index if not exists idx_question_cache_lookup on public.question_cache(book_id, question_hash, expires_at);

create index if not exists idx_chapters_summary_tsv on public.chapters
  using gin (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(themes::text, '') || ' ' ||
      coalesce(keywords::text, '') || ' ' ||
      coalesce(characters::text, '')
    )
  );

-- Reuse global timestamp trigger if available
drop trigger if exists update_sources_updated_at on public.sources;
create trigger update_sources_updated_at
  before update on public.sources
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_chapters_updated_at on public.chapters;
create trigger update_chapters_updated_at
  before update on public.chapters
  for each row execute function public.update_updated_at_column();

-- Relevant chapter retrieval function (keyword + full-text rank)
create or replace function public.search_book_chapters(
  p_book_id uuid,
  p_query text,
  p_limit int default 5
)
returns table (
  chapter_id uuid,
  chapter_number integer,
  chapter_title text,
  chapter_summary text,
  relevance_score real
)
language sql
stable
set search_path = public
as $$
  with ranked as (
    select
      c.id as chapter_id,
      c.chapter_number,
      c.title as chapter_title,
      c.summary as chapter_summary,
      ts_rank(
        to_tsvector(
          'simple',
          coalesce(c.title, '') || ' ' ||
          coalesce(c.summary, '') || ' ' ||
          coalesce(c.themes::text, '') || ' ' ||
          coalesce(c.keywords::text, '') || ' ' ||
          coalesce(c.characters::text, '')
        ),
        plainto_tsquery('simple', coalesce(p_query, ''))
      ) +
      case
        when c.summary ilike '%' || coalesce(p_query, '') || '%' then 0.25
        else 0
      end as relevance_score
    from public.chapters c
    where c.book_id = p_book_id
  )
  select
    chapter_id,
    chapter_number,
    chapter_title,
    chapter_summary,
    relevance_score
  from ranked
  order by relevance_score desc nulls last, chapter_number asc nulls last
  limit greatest(coalesce(p_limit, 5), 1);
$$;

-- RLS
alter table public.sources enable row level security;
alter table public.chapters enable row level security;
alter table public.chapter_events enable row level security;
alter table public.chapter_analysis enable row level security;
alter table public.questions_log enable row level security;
alter table public.question_cache enable row level security;

drop policy if exists "Users can view own sources" on public.sources;
create policy "Users can view own sources"
  on public.sources for select
  using (
    exists (
      select 1
      from public.books b
      where b.id = sources.book_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own sources" on public.sources;
create policy "Users can insert own sources"
  on public.sources for insert
  with check (
    exists (
      select 1
      from public.books b
      where b.id = sources.book_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own sources" on public.sources;
create policy "Users can update own sources"
  on public.sources for update
  using (
    exists (
      select 1 from public.books b
      where b.id = sources.book_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.books b
      where b.id = sources.book_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own sources" on public.sources;
create policy "Users can delete own sources"
  on public.sources for delete
  using (
    exists (
      select 1 from public.books b
      where b.id = sources.book_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can view own chapters" on public.chapters;
create policy "Users can view own chapters"
  on public.chapters for select
  using (
    exists (
      select 1 from public.books b
      where b.id = chapters.book_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own chapters" on public.chapters;
create policy "Users can insert own chapters"
  on public.chapters for insert
  with check (
    exists (
      select 1 from public.books b
      where b.id = chapters.book_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own chapters" on public.chapters;
create policy "Users can update own chapters"
  on public.chapters for update
  using (
    exists (
      select 1 from public.books b
      where b.id = chapters.book_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.books b
      where b.id = chapters.book_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own chapters" on public.chapters;
create policy "Users can delete own chapters"
  on public.chapters for delete
  using (
    exists (
      select 1 from public.books b
      where b.id = chapters.book_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can view own chapter events" on public.chapter_events;
create policy "Users can view own chapter events"
  on public.chapter_events for select
  using (
    exists (
      select 1
      from public.chapters c
      join public.books b on b.id = c.book_id
      where c.id = chapter_events.chapter_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own chapter events" on public.chapter_events;
create policy "Users can insert own chapter events"
  on public.chapter_events for insert
  with check (
    exists (
      select 1
      from public.chapters c
      join public.books b on b.id = c.book_id
      where c.id = chapter_events.chapter_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own chapter events" on public.chapter_events;
create policy "Users can delete own chapter events"
  on public.chapter_events for delete
  using (
    exists (
      select 1
      from public.chapters c
      join public.books b on b.id = c.book_id
      where c.id = chapter_events.chapter_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can view own chapter analysis" on public.chapter_analysis;
create policy "Users can view own chapter analysis"
  on public.chapter_analysis for select
  using (
    exists (
      select 1
      from public.chapters c
      join public.books b on b.id = c.book_id
      where c.id = chapter_analysis.chapter_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own chapter analysis" on public.chapter_analysis;
create policy "Users can insert own chapter analysis"
  on public.chapter_analysis for insert
  with check (
    exists (
      select 1
      from public.chapters c
      join public.books b on b.id = c.book_id
      where c.id = chapter_analysis.chapter_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own chapter analysis" on public.chapter_analysis;
create policy "Users can delete own chapter analysis"
  on public.chapter_analysis for delete
  using (
    exists (
      select 1
      from public.chapters c
      join public.books b on b.id = c.book_id
      where c.id = chapter_analysis.chapter_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can view own questions log" on public.questions_log;
create policy "Users can view own questions log"
  on public.questions_log for select
  using (
    exists (
      select 1
      from public.books b
      where b.id = questions_log.book_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own questions log" on public.questions_log;
create policy "Users can insert own questions log"
  on public.questions_log for insert
  with check (
    exists (
      select 1
      from public.books b
      where b.id = questions_log.book_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can view own question cache" on public.question_cache;
create policy "Users can view own question cache"
  on public.question_cache for select
  using (
    exists (
      select 1
      from public.books b
      where b.id = question_cache.book_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own question cache" on public.question_cache;
create policy "Users can insert own question cache"
  on public.question_cache for insert
  with check (
    exists (
      select 1
      from public.books b
      where b.id = question_cache.book_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own question cache" on public.question_cache;
create policy "Users can update own question cache"
  on public.question_cache for update
  using (
    exists (
      select 1
      from public.books b
      where b.id = question_cache.book_id
        and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.books b
      where b.id = question_cache.book_id
        and b.user_id = auth.uid()
    )
  );


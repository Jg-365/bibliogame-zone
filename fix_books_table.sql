-- Add missing columns to books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS isbn TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS published_date TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS genres TEXT[];
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS review TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS reading_started_at TIMESTAMP WITH TIME ZONE;

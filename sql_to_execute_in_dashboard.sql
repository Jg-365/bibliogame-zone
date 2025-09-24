-- Execute este SQL no Supabase Dashboard SQL Editor para adicionar os campos extras à tabela books

-- 1. Adicionar colunas extras à tabela books
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS isbn TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS published_date TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS genres TEXT[];
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS review TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS reading_started_at TIMESTAMP WITH TIME ZONE;

-- 2. Criar tabela reading_sessions
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  pages_read INTEGER NOT NULL CHECK (pages_read > 0),
  session_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for reading_sessions
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for reading_sessions
CREATE POLICY "Users can view their own reading sessions" 
ON public.reading_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading sessions" 
ON public.reading_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Adicionar campos de gamificação ao profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_books_read INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_pages_read INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reading_level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_genres TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reading_speed DECIMAL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- 4. Criar função para atualizar estatísticas de leitura
CREATE OR REPLACE FUNCTION update_reading_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total books read when a book is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.profiles 
    SET total_books_read = total_books_read + 1,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  -- Update pages read
  IF NEW.pages_read > OLD.pages_read THEN
    UPDATE public.profiles 
    SET total_pages_read = total_pages_read + (NEW.pages_read - OLD.pages_read),
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para atualizar estatísticas
DROP TRIGGER IF EXISTS trigger_update_reading_stats ON public.books;
CREATE TRIGGER trigger_update_reading_stats
  AFTER UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_stats();

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_id ON public.reading_sessions(book_id);

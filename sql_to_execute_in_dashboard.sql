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

-- Create policies for reading_sessions (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "Users can create their own reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "Users can update their own reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "Users can delete their own reading sessions" ON public.reading_sessions;

CREATE POLICY "Users can view their own reading sessions" 
ON public.reading_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading sessions" 
ON public.reading_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading sessions" 
ON public.reading_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading sessions" 
ON public.reading_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

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

-- 5. Criar trigger para atualizar estatísticas (remover triggers existentes primeiro)
DROP TRIGGER IF EXISTS trigger_update_reading_stats ON public.books;
DROP TRIGGER IF EXISTS update_reading_stats_trigger ON public.books;
DROP TRIGGER IF EXISTS books_update_stats ON public.books;

CREATE TRIGGER trigger_update_reading_stats
  AFTER UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_stats();

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_id ON public.reading_sessions(book_id);

-- 7. CORREÇÃO CRÍTICA: Garantir que não há ambiguidade nas colunas de streak
-- Remove qualquer coluna antiga conflitante e garante que as corretas existem

-- Primeiro, remover triggers e funções que podem estar usando colunas antigas
DROP TRIGGER IF EXISTS update_streak_on_reading_session ON public.reading_sessions;
DROP FUNCTION IF EXISTS update_reading_streak_on_session();
DROP FUNCTION IF EXISTS check_broken_streaks();

-- Segundo, vamos garantir que as colunas corretas existem
DO $$
BEGIN
  -- Adicionar colunas corretas se não existirem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_streak') THEN
    ALTER TABLE public.profiles ADD COLUMN current_streak INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'longest_streak') THEN
    ALTER TABLE public.profiles ADD COLUMN longest_streak INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_activity_date') THEN
    ALTER TABLE public.profiles ADD COLUMN last_activity_date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Migrar dados de colunas antigas para novas (se existirem)
DO $$
BEGIN
  -- Migrar reading_streak para current_streak
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'reading_streak') THEN
    UPDATE public.profiles SET current_streak = COALESCE(reading_streak, 0) WHERE current_streak = 0;
    ALTER TABLE public.profiles DROP COLUMN reading_streak;
  END IF;
  
  -- Migrar best_streak para longest_streak
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'best_streak') THEN
    UPDATE public.profiles SET longest_streak = COALESCE(best_streak, 0) WHERE longest_streak = 0;
    ALTER TABLE public.profiles DROP COLUMN best_streak;
  END IF;
  
  -- Migrar last_activity para last_activity_date  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_activity') THEN
    UPDATE public.profiles SET last_activity_date = COALESCE(last_activity, CURRENT_DATE) WHERE last_activity_date IS NULL;
    ALTER TABLE public.profiles DROP COLUMN last_activity;
  END IF;
END $$;

-- Garantir valores padrão para registros existentes
UPDATE public.profiles 
SET 
  current_streak = COALESCE(current_streak, 0),
  longest_streak = COALESCE(longest_streak, 0),
  last_activity_date = COALESCE(last_activity_date, CURRENT_DATE)
WHERE 
  current_streak IS NULL OR 
  longest_streak IS NULL OR 
  last_activity_date IS NULL;

-- 8. Recriar funções e triggers com nomes de colunas corretos
CREATE OR REPLACE FUNCTION update_reading_streak_on_session()
RETURNS TRIGGER AS $$
DECLARE
  last_activity_date DATE;
  current_streak_val INTEGER;
  longest_streak_val INTEGER;
BEGIN
  -- Get current profile data using correct field names
  SELECT p.last_activity_date, p.current_streak, p.longest_streak 
  INTO last_activity_date, current_streak_val, longest_streak_val
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;
  
  -- Only update if this is a new day
  IF last_activity_date IS DISTINCT FROM CURRENT_DATE THEN
    IF last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Consecutive day - continue streak
      current_streak_val := current_streak_val + 1;
    ELSE
      -- Streak broken or new streak
      current_streak_val := 1;
    END IF;
    
    -- Update longest streak if current streak is higher
    IF current_streak_val > longest_streak_val THEN
      longest_streak_val := current_streak_val;
    END IF;
    
    -- Update profile with correct field names
    UPDATE public.profiles 
    SET 
      current_streak = current_streak_val,
      longest_streak = longest_streak_val,
      last_activity_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
CREATE TRIGGER update_streak_on_reading_session
  AFTER INSERT ON public.reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_streak_on_session();

-- Função para resetar streaks quebrados
CREATE OR REPLACE FUNCTION check_broken_streaks()
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    current_streak = 0,
    updated_at = NOW()
  WHERE 
    last_activity_date < CURRENT_DATE - INTERVAL '1 day' 
    AND current_streak > 0;
END;
$$ LANGUAGE plpgsql;

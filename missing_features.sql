-- SQL para adicionar funcionalidades faltantes

-- 1. Criar tabela user_achievements para conquistas reais dos usuários
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS for user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for user_achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create achievements" ON public.user_achievements;
CREATE POLICY "System can create achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (true);

-- 2. Criar tabela follows para sistema de seguir usuários
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create policies for follows
DROP POLICY IF EXISTS "Users can view follows" ON public.follows;
CREATE POLICY "Users can view follows" 
ON public.follows 
FOR SELECT 
USING (auth.uid() = follower_id OR auth.uid() = following_id);

DROP POLICY IF EXISTS "Users can create follows" ON public.follows;
CREATE POLICY "Users can create follows" 
ON public.follows 
FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete their follows" ON public.follows;
CREATE POLICY "Users can delete their follows" 
ON public.follows 
FOR DELETE 
USING (auth.uid() = follower_id);

-- 3. Adicionar campo current_book_id ao profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_book_id UUID REFERENCES public.books(id) ON DELETE SET NULL;

-- 4. Atualizar constraint do requirement_type para incluir novos tipos
ALTER TABLE public.achievements DROP CONSTRAINT IF EXISTS achievements_requirement_type_check;
ALTER TABLE public.achievements ADD CONSTRAINT achievements_requirement_type_check 
  CHECK (requirement_type IN ('books_read', 'pages_read', 'streak_days', 'genre_master', 'books_added', 'books_completed', 'pages_per_day'));

-- 5. Inserir conquistas padrão do sistema se não existirem
INSERT INTO public.achievements (id, title, description, icon, rarity, requirement_type, requirement_value) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Primeiro Livro', 'Adicione seu primeiro livro à biblioteca', '📚', 'common', 'books_added', 1),
  ('00000000-0000-0000-0000-000000000002', 'Leitor Iniciante', 'Complete seu primeiro livro', '🎯', 'common', 'books_read', 1),
  ('00000000-0000-0000-0000-000000000003', 'Maratonista', 'Complete 5 livros', '🏃', 'rare', 'books_read', 5),
  ('00000000-0000-0000-0000-000000000004', 'Devorador de Livros', 'Complete 10 livros', '🔥', 'epic', 'books_read', 10),
  ('00000000-0000-0000-0000-000000000005', 'Bibliófilo', 'Complete 25 livros', '👑', 'legendary', 'books_read', 25),
  ('00000000-0000-0000-0000-000000000006', 'Páginas Mil', 'Leia 1000 páginas', '📖', 'rare', 'pages_read', 1000),
  ('00000000-0000-0000-0000-000000000007', 'Constância', 'Mantenha uma sequência de 7 dias lendo', '⭐', 'rare', 'streak_days', 7),
  ('00000000-0000-0000-0000-000000000008', 'Velocista', 'Leia 100 páginas em um dia', '⚡', 'epic', 'pages_per_day', 100)
ON CONFLICT (id) DO NOTHING;

-- 6. Criar função para verificar e conceder conquistas
CREATE OR REPLACE FUNCTION check_and_grant_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  achievement_record RECORD;
  user_stats RECORD;
BEGIN
  -- Buscar estatísticas do usuário
  SELECT 
    COALESCE(total_books_read, 0) as books_completed,
    COALESCE(total_pages_read, 0) as pages_read,
    COALESCE(current_streak, 0) as streak_days,
    (SELECT COUNT(*) FROM public.books WHERE user_id = p_user_id) as books_added
  INTO user_stats
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  -- Verificar cada conquista
  FOR achievement_record IN 
    SELECT * FROM public.achievements
  LOOP
    -- Verificar se o usuário já tem essa conquista
    IF NOT EXISTS (
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id
    ) THEN
      -- Verificar se atende aos requisitos
      CASE achievement_record.requirement_type
        WHEN 'books_added' THEN
          IF user_stats.books_added >= achievement_record.requirement_value THEN
            INSERT INTO public.user_achievements (user_id, achievement_id) 
            VALUES (p_user_id, achievement_record.id);
          END IF;
        WHEN 'books_read' THEN
          IF user_stats.books_completed >= achievement_record.requirement_value THEN
            INSERT INTO public.user_achievements (user_id, achievement_id) 
            VALUES (p_user_id, achievement_record.id);
          END IF;
        WHEN 'pages_read' THEN
          IF user_stats.pages_read >= achievement_record.requirement_value THEN
            INSERT INTO public.user_achievements (user_id, achievement_id) 
            VALUES (p_user_id, achievement_record.id);
          END IF;
        WHEN 'streak_days' THEN
          IF user_stats.streak_days >= achievement_record.requirement_value THEN
            INSERT INTO public.user_achievements (user_id, achievement_id) 
            VALUES (p_user_id, achievement_record.id);
          END IF;
        WHEN 'pages_per_day' THEN
          -- Para conquistar "páginas por dia", verificar se houve uma sessão com páginas suficientes
          IF EXISTS (
            SELECT 1 FROM public.reading_sessions 
            WHERE user_id = p_user_id 
            AND pages_read >= achievement_record.requirement_value
          ) THEN
            INSERT INTO public.user_achievements (user_id, achievement_id) 
            VALUES (p_user_id, achievement_record.id);
          END IF;
      END CASE;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. Atualizar função de estatísticas para verificar conquistas
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
  
  -- Check and grant achievements after stats update
  PERFORM check_and_grant_achievements(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para verificar conquistas quando livros são adicionados
CREATE OR REPLACE FUNCTION check_achievements_on_book_add()
RETURNS TRIGGER AS $$
BEGIN
  -- Check achievements when a new book is added
  PERFORM check_and_grant_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_achievements_on_book_add ON public.books;
CREATE TRIGGER trigger_check_achievements_on_book_add
  AFTER INSERT ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION check_achievements_on_book_add();

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_profiles_current_book_id ON public.profiles(current_book_id);

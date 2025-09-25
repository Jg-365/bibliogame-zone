-- Atualizar sistema de níveis e limpar dados inconsistentes
-- Execute no Supabase SQL Editor

-- 1. Primeiro, vamos criar uma função para recalcular o nível baseado nas estatísticas
CREATE OR REPLACE FUNCTION calculate_user_level(
  p_books_completed INTEGER,
  p_best_streak INTEGER,
  p_points INTEGER,
  p_total_pages_read INTEGER
) 
RETURNS TEXT AS $$
BEGIN
  -- Sistema de níveis baseado em múltiplos critérios
  IF p_books_completed >= 50 AND p_best_streak >= 100 AND p_points >= 5000 AND p_total_pages_read >= 12000 THEN
    RETURN 'Imortal';
  ELSIF p_books_completed >= 25 AND p_best_streak >= 50 AND p_points >= 3000 AND p_total_pages_read >= 6000 THEN
    RETURN 'Grande Mestre';
  ELSIF p_books_completed >= 15 AND p_best_streak >= 30 AND p_points >= 1500 AND p_total_pages_read >= 3000 THEN
    RETURN 'Lenda';
  ELSIF p_books_completed >= 7 AND p_best_streak >= 15 AND p_points >= 750 AND p_total_pages_read >= 1500 THEN
    RETURN 'Mestre';
  ELSIF p_books_completed >= 3 AND p_best_streak >= 7 AND p_points >= 300 AND p_total_pages_read >= 500 THEN
    RETURN 'Aventureiro';
  ELSIF p_books_completed >= 1 AND p_best_streak >= 3 AND p_points >= 100 AND p_total_pages_read >= 100 THEN
    RETURN 'Explorador';
  ELSE
    RETURN 'Iniciante';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Atualizar todos os níveis dos usuários baseado nas estatísticas reais
UPDATE profiles 
SET level = calculate_user_level(
  COALESCE(books_completed, 0),
  COALESCE(best_streak, 0),
  COALESCE(points, 0),
  COALESCE(total_pages_read, 0)
);

-- 3. Remover conquistas duplicadas ou inconsistentes
-- Isso vai limpar conquistas que não deveriam estar desbloqueadas
DELETE FROM user_achievements 
WHERE user_id IN (
  SELECT user_id FROM profiles 
  WHERE books_completed = 0 AND total_pages_read = 0
);

-- 4. Garantir que usuários sem dados tenham o nível Iniciante
UPDATE profiles 
SET 
  level = 'Iniciante',
  points = 0,
  books_completed = 0,
  total_pages_read = 0,
  current_streak = 0,
  best_streak = 0,
  reading_streak = 0
WHERE (books_completed IS NULL OR books_completed = 0)
  AND (total_pages_read IS NULL OR total_pages_read = 0);

-- 5. Limpar dados de cache que podem estar causando problemas
-- Isso força a regeneração dos dados
UPDATE profiles 
SET updated_at = NOW();

-- Para encontrar usuários com dados inconsistentes:
-- SELECT user_id, username, full_name, level, books_completed, total_pages_read, points, best_streak
-- FROM profiles 
-- WHERE (books_completed = 0 AND level != 'Iniciante') 
--    OR (total_pages_read = 0 AND level != 'Iniciante');

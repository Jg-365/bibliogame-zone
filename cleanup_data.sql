-- Script para limpar completamente os dados de usuário específico
-- Execute este script no Supabase SQL Editor

-- Substitua 'SEU_USER_ID_AQUI' pelo ID do usuário João Guilherme

-- 1. Deletar todas as conquistas do usuário
DELETE FROM user_achievements 
WHERE user_id = 'SEU_USER_ID_AQUI';

-- 2. Deletar todos os livros do usuário
DELETE FROM books 
WHERE user_id = 'SEU_USER_ID_AQUI';

-- 3. Deletar todas as sessões de leitura do usuário
DELETE FROM reading_sessions 
WHERE user_id = 'SEU_USER_ID_AQUI';

-- 4. Deletar todas as conexões sociais (seguindo e seguidores)
DELETE FROM follows 
WHERE follower_id = 'SEU_USER_ID_AQUI' OR following_id = 'SEU_USER_ID_AQUI';

-- 5. Resetar completamente o perfil do usuário
UPDATE profiles 
SET 
  current_streak = 0,
  best_streak = 0,
  books_completed = 0,
  experience_points = 0,
  total_pages_read = 0,
  reading_streak = 0,
  level = 'Iniciante',
  points = 0,
  current_book_id = NULL,
  updated_at = NOW()
WHERE user_id = 'SEU_USER_ID_AQUI';

-- 6. Para encontrar o user_id do João Guilherme, use esta query primeiro:
-- SELECT user_id, username, full_name FROM profiles WHERE full_name ILIKE '%joão%guilherme%' OR username ILIKE '%joão%';

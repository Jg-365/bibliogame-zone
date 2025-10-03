-- Scripts para testar manualmente os triggers e funções

-- 1. Testar função de atualização de estatísticas do usuário
-- Substitua USER_ID_HERE pelo ID real do usuário
SELECT update_user_stats() FROM profiles WHERE user_id = 'USER_ID_HERE';

-- 2. Executar função de verificação de streaks quebrados
SELECT check_broken_streaks();

-- 3. Verificar estatísticas atuais de um usuário específico
-- Substitua USER_ID_HERE pelo ID real do usuário
SELECT 
  user_id,
  username,
  books_completed,
  total_pages_read,
  reading_streak,
  best_streak,
  last_activity,
  updated_at
FROM profiles 
WHERE user_id = 'USER_ID_HERE';

-- 4. Verificar sessões de leitura recentes
-- Substitua USER_ID_HERE pelo ID real do usuário
SELECT 
  rs.id,
  rs.user_id,
  rs.pages_read,
  rs.session_date,
  rs.created_at,
  b.title as book_title,
  b.status as book_status
FROM reading_sessions rs
LEFT JOIN books b ON rs.book_id = b.id
WHERE rs.user_id = 'USER_ID_HERE'
ORDER BY rs.created_at DESC
LIMIT 5;

-- 5. Forçar recálculo das estatísticas de um usuário
-- Substitua USER_ID_HERE pelo ID real do usuário
UPDATE profiles 
SET 
  books_completed = (
    SELECT COUNT(*) 
    FROM books 
    WHERE user_id = 'USER_ID_HERE' AND status = 'completed'
  ),
  total_pages_read = (
    SELECT COALESCE(SUM(pages_read), 0) 
    FROM books 
    WHERE user_id = 'USER_ID_HERE'
  ),
  updated_at = NOW()
WHERE user_id = 'USER_ID_HERE';

-- 6. Forçar recálculo do streak de um usuário
-- Substitua USER_ID_HERE pelo ID real do usuário
WITH user_sessions AS (
  SELECT DISTINCT DATE(session_date) as session_day
  FROM reading_sessions 
  WHERE user_id = 'USER_ID_HERE' 
    AND pages_read > 0
  ORDER BY session_day DESC
),
streak_calc AS (
  SELECT 
    session_day,
    ROW_NUMBER() OVER (ORDER BY session_day DESC) as rn,
    session_day - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY session_day DESC) - 1) as expected_day
  FROM user_sessions
),
current_streak AS (
  SELECT COUNT(*) as streak_count
  FROM streak_calc
  WHERE expected_day = session_day
    AND session_day >= CURRENT_DATE - INTERVAL '365 days'
)
UPDATE profiles 
SET 
  reading_streak = (SELECT streak_count FROM current_streak),
  last_activity = CURRENT_DATE,
  updated_at = NOW()
WHERE user_id = 'USER_ID_HERE';
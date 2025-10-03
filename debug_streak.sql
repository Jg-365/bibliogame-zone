-- Debug script to test streak and stats functionality

-- 1. Check current profile stats for a user
SELECT 
  user_id,
  username,
  reading_streak,
  best_streak,
  last_activity,
  total_books_read,
  books_completed,
  total_pages_read
FROM profiles 
LIMIT 5;

-- 2. Check existing triggers on reading_sessions table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'reading_sessions';

-- 3. Check existing triggers on books table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'books';

-- 4. Check if the streak update function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%streak%' OR routine_name LIKE '%reading%';

-- 5. Test streak update manually (replace with actual user_id)
-- SELECT update_reading_streak_on_session();

-- 6. Check recent reading sessions
SELECT 
  rs.id,
  rs.user_id,
  rs.pages_read,
  rs.session_date,
  rs.created_at,
  b.title as book_title
FROM reading_sessions rs
LEFT JOIN books b ON rs.book_id = b.id
ORDER BY rs.created_at DESC
LIMIT 10;
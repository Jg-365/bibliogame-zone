-- Clean up invalid achievements and ensure data integrity

-- First, let's check for any duplicate or invalid achievements
-- Remove any achievements that don't have valid achievement_id references
DELETE FROM public.user_achievements 
WHERE achievement_id NOT IN (
  SELECT id FROM public.achievements
);

-- Remove any achievements where user_id doesn't exist in auth.users
DELETE FROM public.user_achievements 
WHERE user_id NOT IN (
  SELECT id FROM auth.users
);

-- Ensure no duplicate achievements per user
DELETE FROM public.user_achievements ua1 
WHERE EXISTS (
  SELECT 1 FROM public.user_achievements ua2 
  WHERE ua2.user_id = ua1.user_id 
  AND ua2.achievement_id = ua1.achievement_id 
  AND ua2.id > ua1.id
);

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  new_books_completed INTEGER;
  new_total_pages INTEGER;
  achievement_record RECORD;
BEGIN
  -- Calculate current stats for the user
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed'),
    COALESCE(SUM(pages_read), 0)
  INTO new_books_completed, new_total_pages
  FROM public.books
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  -- Update profile with new stats
  UPDATE public.profiles 
  SET 
    books_completed = new_books_completed,
    total_pages_read = new_total_pages,
    updated_at = NOW()
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  -- Only check achievements if we have valid data and user exists
  IF NEW IS NOT NULL AND NEW.user_id IS NOT NULL THEN
    -- Check for achievements to unlock
    FOR achievement_record IN
      SELECT a.id, a.title, a.requirement_type, a.requirement_value
      FROM public.achievements a
      WHERE NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua 
        WHERE ua.user_id = NEW.user_id AND ua.achievement_id = a.id
      )
    LOOP
      -- Check if user qualifies for this achievement
      IF (achievement_record.requirement_type = 'books_read' AND new_books_completed >= achievement_record.requirement_value) OR
         (achievement_record.requirement_type = 'pages_read' AND new_total_pages >= achievement_record.requirement_value) THEN
        
        -- Grant the achievement (with conflict handling)
        INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at)
        VALUES (NEW.user_id, achievement_record.id, NOW())
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix function conflict by dropping and recreating
DROP FUNCTION IF EXISTS public.check_and_grant_achievements(UUID);

-- Create function to check and grant achievements automatically
CREATE OR REPLACE FUNCTION public.check_and_grant_achievements(p_user_id UUID)
RETURNS TABLE(achievement_id UUID, title TEXT, description TEXT) AS $$
DECLARE
  user_stats RECORD;
  achievement RECORD;
  new_achievement RECORD;
BEGIN
  -- Get current user stats
  SELECT
    COALESCE(p.books_completed, 0) as books_completed,
    COALESCE(p.total_pages_read, 0) as total_pages_read,
    COALESCE(p.current_streak, 0) as reading_streak
  INTO user_stats
  FROM public.profiles p
  WHERE p.user_id = p_user_id;

  -- If no profile found, create one with zero stats
  IF NOT FOUND THEN
    user_stats.books_completed := 0;
    user_stats.total_pages_read := 0;
    user_stats.reading_streak := 0;
  END IF;

  -- Check each achievement that the user hasn't unlocked yet
  FOR achievement IN
    SELECT a.id, a.title, a.description, a.requirement_type, a.requirement_value
    FROM public.achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
    )
  LOOP
    -- Check if user qualifies for this achievement
    IF (achievement.requirement_type = 'books_read' AND user_stats.books_completed >= achievement.requirement_value) OR
       (achievement.requirement_type = 'pages_read' AND user_stats.total_pages_read >= achievement.requirement_value) OR
       (achievement.requirement_type = 'streak_days' AND user_stats.reading_streak >= achievement.requirement_value) THEN

      -- Grant the achievement
      INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at)
      VALUES (p_user_id, achievement.id, NOW())
      ON CONFLICT (user_id, achievement_id) DO NOTHING;

      -- Return the granted achievement
      SELECT achievement.id, achievement.title, achievement.description
      INTO new_achievement;

      achievement_id := new_achievement.id;
      title := new_achievement.title;
      description := new_achievement.description;

      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

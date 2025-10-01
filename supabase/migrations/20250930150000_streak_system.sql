-- Ensure streak columns exist in profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reading_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_activity DATE DEFAULT CURRENT_DATE;

-- Update existing profiles to have default values for streak columns
UPDATE public.profiles 
SET 
  reading_streak = COALESCE(reading_streak, 0),
  best_streak = COALESCE(best_streak, 0),
  last_activity = COALESCE(last_activity, CURRENT_DATE)
WHERE 
  reading_streak IS NULL OR 
  best_streak IS NULL OR 
  last_activity IS NULL;

-- Create or replace function to update reading streak when pages are read
CREATE OR REPLACE FUNCTION update_reading_streak_on_session()
RETURNS TRIGGER AS $$
DECLARE
  last_activity_date DATE;
  current_streak INTEGER;
  best_streak_val INTEGER;
BEGIN
  -- Get current profile data
  SELECT last_activity, reading_streak, best_streak 
  INTO last_activity_date, current_streak, best_streak_val
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  -- Only update if this is a new day
  IF last_activity_date != CURRENT_DATE THEN
    IF last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Consecutive day - continue streak
      current_streak := current_streak + 1;
    ELSE
      -- Streak broken or new streak
      current_streak := 1;
    END IF;
    
    -- Update best streak if current streak is higher
    IF current_streak > best_streak_val THEN
      best_streak_val := current_streak;
    END IF;
    
    -- Update profile
    UPDATE public.profiles 
    SET 
      reading_streak = current_streak,
      best_streak = best_streak_val,
      last_activity = CURRENT_DATE,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic streak update when reading sessions are added
DROP TRIGGER IF EXISTS update_streak_on_reading_session ON public.reading_sessions;
CREATE TRIGGER update_streak_on_reading_session
  AFTER INSERT ON public.reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_streak_on_session();

-- Create function to check and reset broken streaks
CREATE OR REPLACE FUNCTION check_broken_streaks()
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    reading_streak = 0,
    updated_at = NOW()
  WHERE 
    last_activity < CURRENT_DATE - INTERVAL '1 day' 
    AND reading_streak > 0;
END;
$$ LANGUAGE plpgsql;

-- Add index for better performance on streak queries
CREATE INDEX IF NOT EXISTS idx_profiles_reading_streak ON public.profiles(reading_streak DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON public.profiles(last_activity);
-- Migration to add correct streak columns to profiles table
-- This fixes the ambiguous column name issue

-- Add the correct column names to profiles table if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT CURRENT_DATE;

-- Migrate data from old columns to new columns if they exist
DO $$
BEGIN
  -- Check if old columns exist and migrate data
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'reading_streak') THEN
    UPDATE public.profiles SET current_streak = COALESCE(reading_streak, 0);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'best_streak') THEN
    UPDATE public.profiles SET longest_streak = COALESCE(best_streak, 0);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_activity') THEN
    UPDATE public.profiles SET last_activity_date = COALESCE(last_activity, CURRENT_DATE);
  END IF;
END $$;

-- Set default values for existing profiles
UPDATE public.profiles 
SET 
  current_streak = COALESCE(current_streak, 0),
  longest_streak = COALESCE(longest_streak, 0),
  last_activity_date = COALESCE(last_activity_date, CURRENT_DATE)
WHERE 
  current_streak IS NULL OR 
  longest_streak IS NULL OR 
  last_activity_date IS NULL;

-- Drop old columns if they exist to avoid ambiguity
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'reading_streak') THEN
    ALTER TABLE public.profiles DROP COLUMN reading_streak;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'best_streak') THEN
    ALTER TABLE public.profiles DROP COLUMN best_streak;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_activity') THEN
    ALTER TABLE public.profiles DROP COLUMN last_activity;
  END IF;
END $$;

-- Update the trigger function to use correct column names (this ensures no ambiguity)
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
  IF last_activity_date != CURRENT_DATE THEN
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_streak_on_reading_session ON public.reading_sessions;
CREATE TRIGGER update_streak_on_reading_session
  AFTER INSERT ON public.reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_streak_on_session();

-- Update check_broken_streaks function
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_current_streak ON public.profiles(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity_date ON public.profiles(last_activity_date);
CREATE INDEX IF NOT EXISTS idx_profiles_longest_streak ON public.profiles(longest_streak DESC);
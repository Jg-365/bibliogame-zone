-- Migration: Enhanced Streak System
-- Add new fields for streak freeze and milestones

-- Add streak freeze system
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS streak_freezes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_freeze_earned DATE,
ADD COLUMN IF NOT EXISTS freeze_used_dates TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add daily page goal
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_page_goal INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS streak_goal INTEGER DEFAULT 30;

-- Add streak milestones tracking
CREATE TABLE IF NOT EXISTS public.streak_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL, -- '3days', '7days', '14days', '30days', '90days', '365days'
  streak_value INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shared_to_feed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, milestone_type, streak_value)
);

-- Add RLS policies for streak_milestones
ALTER TABLE public.streak_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestones"
  ON public.streak_milestones
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
  ON public.streak_milestones
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones"
  ON public.streak_milestones
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to award streak freeze
CREATE OR REPLACE FUNCTION award_streak_freeze()
RETURNS TRIGGER AS $$
DECLARE
  current_streak_val INTEGER;
  last_freeze_earned_date DATE;
  current_freezes INTEGER;
BEGIN
  -- Get current streak and freeze info
  SELECT current_streak, last_freeze_earned, streak_freezes
  INTO current_streak_val, last_freeze_earned_date, current_freezes
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- Award freeze every 7 days of streak (max 3)
  IF current_streak_val > 0 AND current_streak_val % 7 = 0 AND current_freezes < 3 THEN
    -- Check if we haven't already awarded freeze for this milestone
    IF last_freeze_earned_date IS NULL OR 
       last_freeze_earned_date < CURRENT_DATE - INTERVAL '7 days' THEN
      
      UPDATE public.profiles
      SET 
        streak_freezes = LEAST(streak_freezes + 1, 3),
        last_freeze_earned = CURRENT_DATE
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award freeze after streak update
DROP TRIGGER IF EXISTS award_freeze_on_streak_update ON public.reading_sessions;
CREATE TRIGGER award_freeze_on_streak_update
  AFTER INSERT ON public.reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION award_streak_freeze();

-- Function to check and record milestones
CREATE OR REPLACE FUNCTION check_streak_milestones()
RETURNS TRIGGER AS $$
DECLARE
  current_streak_val INTEGER;
  milestone_types TEXT[] := ARRAY['3days', '7days', '14days', '30days', '90days', '365days'];
  milestone_values INTEGER[] := ARRAY[3, 7, 14, 30, 90, 365];
  i INTEGER;
BEGIN
  -- Get current streak
  SELECT current_streak
  INTO current_streak_val
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- Check each milestone
  FOR i IN 1..array_length(milestone_types, 1) LOOP
    IF current_streak_val >= milestone_values[i] THEN
      -- Insert milestone if not exists
      INSERT INTO public.streak_milestones (user_id, milestone_type, streak_value)
      VALUES (NEW.user_id, milestone_types[i], milestone_values[i])
      ON CONFLICT (user_id, milestone_type, streak_value) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check milestones after streak update
DROP TRIGGER IF EXISTS check_milestones_on_streak_update ON public.reading_sessions;
CREATE TRIGGER check_milestones_on_streak_update
  AFTER INSERT ON public.reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION check_streak_milestones();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_streak_milestones_user_id ON public.streak_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_milestones_achieved_at ON public.streak_milestones(achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_current_streak ON public.profiles(current_streak DESC);

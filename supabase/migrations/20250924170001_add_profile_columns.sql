-- Add missing columns to profiles table for achievement system
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reading_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing profiles to have default values
UPDATE public.profiles 
SET 
  reading_streak = 0,
  best_streak = 0,
  last_activity = NOW()
WHERE 
  reading_streak IS NULL OR 
  best_streak IS NULL OR 
  last_activity IS NULL;

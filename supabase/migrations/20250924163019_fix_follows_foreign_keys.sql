-- Fix foreign key constraints for follows table

-- First, remove any invalid follows (where user doesn't exist)
DELETE FROM public.follows 
WHERE follower_id NOT IN (SELECT id FROM public.profiles)
   OR following_id NOT IN (SELECT id FROM public.profiles);

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Add foreign key for follower_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'follows' 
        AND constraint_name = 'follows_follower_id_fkey'
    ) THEN
        ALTER TABLE public.follows 
        ADD CONSTRAINT follows_follower_id_fkey 
        FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for following_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'follows' 
        AND constraint_name = 'follows_following_id_fkey'
    ) THEN
        ALTER TABLE public.follows 
        ADD CONSTRAINT follows_following_id_fkey 
        FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;
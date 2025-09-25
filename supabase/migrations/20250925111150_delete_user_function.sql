-- Function to completely delete a user and all their data
-- This should be run by an admin or via a secure server-side function

CREATE OR REPLACE FUNCTION delete_user_completely(target_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
SET search_path = public
AS $$
BEGIN
    -- Delete all reading sessions
    DELETE FROM reading_sessions WHERE user_id = target_user_id;
    
    -- Delete all user achievements
    DELETE FROM user_achievements WHERE user_id = target_user_id;
    
    -- Delete all user books
    DELETE FROM books WHERE user_id = target_user_id;
    
    -- Delete all follows (both directions)
    DELETE FROM follows WHERE follower_id = target_user_id OR following_id = target_user_id;
    
    -- Delete user profile
    DELETE FROM profiles WHERE user_id = target_user_id;
    
    -- Attempt to delete from auth.users (this might require superuser privileges)
    -- This may fail in some setups, but data is already cleaned
    BEGIN
        DELETE FROM auth.users WHERE id = target_user_id;
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the entire operation
        RAISE NOTICE 'Could not delete from auth.users: %', SQLERRM;
    END;
    
    RETURN true;
END;
$$;

-- Grant execute permission to authenticated users for their own account only
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current user ID
    current_user_id := auth.uid();
    
    -- Ensure user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Call the main deletion function
    RETURN delete_user_completely(current_user_id);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION delete_user_completely(UUID) FROM public;

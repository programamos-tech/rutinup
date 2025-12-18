-- Final fix for user SELECT policy to completely avoid recursion
-- The issue is that any query to users table in an RLS policy causes recursion
-- Solution: Use a function that reads from users with SECURITY DEFINER and proper settings

-- First, ensure get_user_gym_id() is properly configured
CREATE OR REPLACE FUNCTION get_user_gym_id()
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- This function bypasses RLS because it's SECURITY DEFINER
  SELECT gym_id FROM users WHERE id = auth.uid();
$$;

-- Now fix the policy to use the function correctly
-- The key is that the policy for own profile must be evaluated first
DROP POLICY IF EXISTS "Users can view users from their gym" ON users;

-- Recreate the policy using get_user_gym_id() 
-- This should work because get_user_gym_id() is SECURITY DEFINER and bypasses RLS
-- The condition id != auth.uid() ensures we don't try to read own profile through this policy
CREATE POLICY "Users can view users from their gym"
  ON users FOR SELECT
  USING (
    -- Only apply to other users (own profile is handled by separate policy)
    id != auth.uid() AND
    -- Use the SECURITY DEFINER function which should bypass RLS
    gym_id = get_user_gym_id()
  );



-- Complete solution: Allow users to see their own profile AND other users from their gym
-- The key is to use a function that reads directly without triggering RLS recursion

-- First, improve get_user_gym_id() to be more robust
CREATE OR REPLACE FUNCTION get_user_gym_id()
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- This function bypasses RLS because it's SECURITY DEFINER
  -- The STABLE keyword helps PostgreSQL optimize and may help avoid recursion detection
  SELECT gym_id FROM users WHERE id = auth.uid();
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view users from their gym" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Policy 1: Users can always view their own profile
-- This is evaluated first and returns immediately for own profile reads
-- This avoids recursion because it doesn't call any function that reads from users
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Policy 2: Users can view other users from their gym
-- The trick: We use get_user_gym_id() which is SECURITY DEFINER and should bypass RLS
-- However, PostgreSQL may still detect recursion. The solution is to ensure
-- that when reading your own profile, Policy 1 matches first and returns,
-- so Policy 2 is never evaluated for own profile reads.
--
-- For other users, get_user_gym_id() is called, which reads from users.
-- Since it's SECURITY DEFINER, it should bypass RLS, but PostgreSQL's recursion
-- detection may still trigger.
--
-- If this still causes recursion, we'll need to use a different approach,
-- such as storing gym_id in the JWT claims or using a materialized view.
CREATE POLICY "Users can view users from their gym"
  ON users FOR SELECT
  USING (
    -- Only apply to other users (own profile is handled by Policy 1)
    id != auth.uid() AND
    -- Use the SECURITY DEFINER function
    gym_id = get_user_gym_id()
  );

-- Note: If this still causes recursion, we may need to:
-- 1. Store gym_id in JWT claims during registration
-- 2. Use a materialized view or cache table
-- 3. Use application-level filtering instead of RLS for user-to-user access
-- 4. Use a different RLS pattern that doesn't cause recursion



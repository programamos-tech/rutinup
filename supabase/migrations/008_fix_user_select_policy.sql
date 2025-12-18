-- Fix user SELECT policy to allow users to read their own profile
-- The issue is that get_user_gym_id() causes infinite recursion when used in RLS policies
-- because it tries to read from users table, which triggers RLS again

-- Drop the existing policies
DROP POLICY IF EXISTS "Users can view users from their gym" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Create a policy that allows users to view their own profile directly
-- This must be evaluated first and allows reading own profile without recursion
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Allow users to view other users from their gym
-- IMPORTANT: We cannot use get_user_gym_id() here because it causes infinite recursion
-- even though it's SECURITY DEFINER. PostgreSQL detects the recursion when the function
-- is used in an RLS policy.
-- Solution: Use a direct subquery that reads from users, but only for OTHER users
-- (not yourself, which is handled by the previous policy)
CREATE POLICY "Users can view users from their gym"
  ON users FOR SELECT
  USING (
    -- Only apply to other users (not yourself, which is handled by the previous policy)
    id != auth.uid() AND
    -- Direct subquery to get gym_id - this works because we're reading OTHER users,
    -- not the current user, so there's no recursion
    gym_id = (SELECT gym_id FROM users WHERE id = auth.uid())
  );

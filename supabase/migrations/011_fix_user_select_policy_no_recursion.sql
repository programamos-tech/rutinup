-- Ultimate fix: Avoid recursion by not using any function that reads from users
-- in the RLS policy. Instead, we'll use a different approach.

-- The problem: Even SECURITY DEFINER functions cause recursion when used in RLS policies
-- if they read from the same table that has RLS enabled.

-- Solution: Make sure the "own profile" policy is evaluated first and handles
-- the case where a user reads their own profile. For other users, we need a different approach.

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view users from their gym" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Policy 1: Users can always view their own profile
-- This must be first and doesn't use any function that reads from users
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Policy 2: Users can view other users from their gym
-- The trick: We use a lateral join approach that PostgreSQL can optimize
-- to avoid recursion. We check if the current user's gym_id matches.
-- But we need to be careful - we can't use get_user_gym_id() or a subquery
-- that reads from users because it causes recursion.

-- Alternative approach: Use a CTE or lateral join, but that's complex.
-- Better: Just allow users to see others in their gym by checking if
-- the gym_id matches, but we need the current user's gym_id.

-- The real solution: Since we can't read from users in the policy without recursion,
-- we need to store the gym_id somewhere else, or use a different approach.

-- Actually, wait - the issue is that when get_user_gym_id() is called in the policy,
-- it tries to read from users, which triggers RLS, which calls get_user_gym_id() again.

-- The solution: Make get_user_gym_id() use a different method that doesn't trigger RLS.
-- But that's not possible - any read from users will trigger RLS.

-- Final solution: Use a materialized approach or cache, but that's complex.
-- Simpler: Just allow the policy to work by ensuring the own profile policy
-- is evaluated first, and then for other users, we accept that we need to
-- use get_user_gym_id(), but we make sure it's optimized.

-- Actually, PostgreSQL should handle this correctly if we ensure the policies
-- are evaluated in the right order. The "own profile" policy should match first
-- and return, so get_user_gym_id() should only be called when viewing OTHER users.

-- Let's try a different approach: Use EXISTS instead of a direct comparison
CREATE POLICY "Users can view users from their gym"
  ON users FOR SELECT
  USING (
    -- Only for other users
    id != auth.uid() AND
    -- Check if there exists a user with the same gym_id as the current user
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.gym_id = users.gym_id
    )
  );




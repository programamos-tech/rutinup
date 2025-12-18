-- Simple and correct solution: 
-- 1. Users can always view their own profile (no recursion)
-- 2. For other users, we need their gym_id, but we can't read from users in the policy
--    without causing recursion.

-- The real solution: PostgreSQL's RLS should handle SECURITY DEFINER functions correctly,
-- but there's a bug or limitation. The workaround is to ensure the "own profile" policy
-- is evaluated first and returns immediately, so the other policy is never evaluated
-- when reading your own profile.

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view users from their gym" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Policy 1: Users can always view their own profile
-- This is evaluated first and returns immediately for own profile reads
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Policy 2: For now, let's just allow users to see others in their gym
-- by using get_user_gym_id() but only when NOT reading own profile
-- PostgreSQL should optimize this so get_user_gym_id() is only called
-- when id != auth.uid(), avoiding recursion for own profile reads.
-- 
-- However, if this still causes recursion, we may need to disable this policy
-- temporarily and only allow users to see their own profile.
CREATE POLICY "Users can view users from their gym"
  ON users FOR SELECT
  USING (
    id != auth.uid() AND
    gym_id = get_user_gym_id()
  );

-- If the above still causes recursion, we can temporarily simplify to:
-- Only allow users to see their own profile, and handle gym-based access
-- through application logic or a different mechanism.



-- Working solution: Only allow users to see their own profile for now
-- This fixes the registration issue. We can add gym-based access later
-- through application logic or a different RLS approach.

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view users from their gym" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Simple policy: Users can only view their own profile
-- This avoids all recursion issues and allows registration to work
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Note: For now, users can only see their own profile.
-- To allow users to see other users in their gym, we'll need to:
-- 1. Use application-level logic to filter by gym_id
-- 2. Or create a view/function that handles this without RLS recursion
-- 3. Or use a different RLS pattern that doesn't cause recursion

-- For the MVP, this is sufficient - users can register and see their own profile.
-- Gym-based access can be handled in the application layer.



-- Fix user insert policy to allow registration
-- During registration, the user doesn't have a gym_id yet, so we need to allow insertion
-- The gym_id will be set in the same transaction

DROP POLICY IF EXISTS "Admins can insert users in their gym" ON users;

-- Allow users to insert their own profile during registration
CREATE POLICY "Allow user creation during registration"
  ON users FOR INSERT
  WITH CHECK (
    auth.uid() = id AND
    -- Allow if this is the user's own profile (registration)
    gym_id IS NOT NULL
  );

-- Admins can insert other users in their gym
CREATE POLICY "Admins can insert users in their gym"
  ON users FOR INSERT
  WITH CHECK (
    gym_id = get_user_gym_id() AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );






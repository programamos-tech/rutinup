-- Fix gym insert policy to allow registration
DROP POLICY IF EXISTS "Allow gym creation during registration" ON gyms;

CREATE POLICY "Allow gym creation during registration"
  ON gyms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);




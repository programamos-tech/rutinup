-- Fix get_user_gym_id function to avoid infinite recursion in RLS policies
-- The function needs to read from users table without triggering RLS

-- Recreate the function with proper settings to avoid RLS recursion
CREATE OR REPLACE FUNCTION get_user_gym_id()
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT gym_id FROM users WHERE id = auth.uid();
$$;

-- Note: SECURITY DEFINER functions should bypass RLS, but when used in RLS policies,
-- PostgreSQL may still detect recursion. The STABLE keyword helps PostgreSQL
-- optimize the function and may help avoid recursion detection.



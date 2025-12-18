-- Ultimate solution: Use a cache table without RLS to store user gym_id
-- This completely avoids recursion because we're not reading from users table
-- in the RLS policy

-- Create a simple cache table without RLS
CREATE TABLE IF NOT EXISTS user_gym_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on this table - it's a cache table
ALTER TABLE user_gym_cache DISABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_gym_cache_user_id ON user_gym_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gym_cache_gym_id ON user_gym_cache(gym_id);

-- Function to get gym_id from cache (no RLS, no recursion)
CREATE OR REPLACE FUNCTION get_user_gym_id_from_cache()
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT gym_id FROM user_gym_cache WHERE user_id = auth.uid();
$$;

-- Trigger to keep cache in sync with users table
CREATE OR REPLACE FUNCTION sync_user_gym_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update cache when user is created/updated
  INSERT INTO user_gym_cache (user_id, gym_id, updated_at)
  VALUES (NEW.id, NEW.gym_id, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    gym_id = EXCLUDED.gym_id,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS sync_user_gym_cache_trigger ON users;
CREATE TRIGGER sync_user_gym_cache_trigger
  AFTER INSERT OR UPDATE OF gym_id ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_gym_cache();

-- Populate cache for existing users
INSERT INTO user_gym_cache (user_id, gym_id)
SELECT id, gym_id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Now update the policies to use the cache
DROP POLICY IF EXISTS "Users can view users from their gym" ON users;

CREATE POLICY "Users can view users from their gym"
  ON users FOR SELECT
  USING (
    -- Only for other users
    id != auth.uid() AND
    -- Use cache function which reads from a table without RLS
    gym_id = get_user_gym_id_from_cache() AND
    get_user_gym_id_from_cache() IS NOT NULL
  );

-- This should work because:
-- 1. We're reading from user_gym_cache which has no RLS
-- 2. No recursion possible because we're not reading from users table
-- 3. The cache is kept in sync automatically via trigger



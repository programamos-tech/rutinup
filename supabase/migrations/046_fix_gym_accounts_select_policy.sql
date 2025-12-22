-- =====================================================
-- MIGRACIÓN 046: ARREGLAR POLÍTICA SELECT DE GYM_ACCOUNTS
-- =====================================================
-- Permitir que los usuarios vean otros usuarios del mismo gym
-- Especialmente necesario para que los admins puedan listar usuarios

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "gym_accounts_select_own" ON public.gym_accounts;
DROP POLICY IF EXISTS "gym_accounts_update_own" ON public.gym_accounts;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.gym_accounts;
DROP POLICY IF EXISTS "Users can view users from their gym" ON public.gym_accounts;

-- Política 1: Los usuarios pueden ver su propio perfil
CREATE POLICY "gym_accounts_select_own"
  ON public.gym_accounts
  FOR SELECT
  USING (id = auth.uid());

-- Política 2: Los usuarios pueden ver otros usuarios del mismo gym
-- Usamos la función get_user_gym_id() que es SECURITY DEFINER
CREATE POLICY "gym_accounts_select_same_gym"
  ON public.gym_accounts
  FOR SELECT
  USING (
    -- Solo para otros usuarios (el propio se maneja con la política anterior)
    id != auth.uid() AND
    -- Verificar que pertenecen al mismo gym usando la función helper
    gym_id = get_user_gym_id()
  );

-- Política UPDATE: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "gym_accounts_update_own"
  ON public.gym_accounts
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Política UPDATE: Los admins pueden actualizar usuarios de su gym
CREATE POLICY "gym_accounts_update_same_gym_admin"
  ON public.gym_accounts
  FOR UPDATE
  USING (
    -- Solo para otros usuarios
    id != auth.uid() AND
    -- Verificar que el usuario actual es admin del mismo gym
    gym_id = get_user_gym_id() AND
    EXISTS (
      SELECT 1 
      FROM public.gym_accounts 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND gym_id = get_user_gym_id()
    )
  )
  WITH CHECK (
    gym_id = get_user_gym_id()
  );

-- Comentarios
COMMENT ON POLICY "gym_accounts_select_own" ON public.gym_accounts IS 'Permite a los usuarios ver su propio perfil';
COMMENT ON POLICY "gym_accounts_select_same_gym" ON public.gym_accounts IS 'Permite a los usuarios ver otros usuarios del mismo gym';
COMMENT ON POLICY "gym_accounts_update_own" ON public.gym_accounts IS 'Permite a los usuarios actualizar su propio perfil';
COMMENT ON POLICY "gym_accounts_update_same_gym_admin" ON public.gym_accounts IS 'Permite a los admins actualizar usuarios de su gym';



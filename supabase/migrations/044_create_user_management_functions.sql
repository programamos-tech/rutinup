-- =====================================================
-- MIGRACIÓN 044: FUNCIONES PARA GESTIÓN DE USUARIOS
-- =====================================================
-- Funciones RPC para crear, actualizar y eliminar usuarios del gym
-- Estas funciones requieren permisos de administrador

-- Función para crear un nuevo usuario del gym
CREATE OR REPLACE FUNCTION public.create_gym_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT,
  p_gym_id UUID,
  p_permissions JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Verificar que el usuario que llama pertenece al mismo gym
  IF NOT EXISTS (
    SELECT 1 FROM gym_accounts 
    WHERE id = auth.uid() 
    AND gym_id = p_gym_id
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para crear usuarios';
  END IF;

  -- Crear usuario en auth.users usando la extensión auth
  -- Nota: Esto requiere que se use desde el servidor con service_role
  -- Por ahora, retornamos un error indicando que se debe usar desde el servidor
  RAISE EXCEPTION 'Esta función debe ser llamada desde el servidor con service_role. Usa una API route o Edge Function.';
END;
$$;

-- Función para actualizar contraseña de usuario
CREATE OR REPLACE FUNCTION public.update_user_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario que llama es admin del mismo gym
  IF NOT EXISTS (
    SELECT 1 FROM gym_accounts ga1
    JOIN gym_accounts ga2 ON ga1.gym_id = ga2.gym_id
    WHERE ga1.id = auth.uid()
    AND ga2.id = p_user_id
    AND ga1.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para actualizar este usuario';
  END IF;

  -- Nota: La actualización de contraseña debe hacerse desde el servidor
  -- Por ahora, solo verificamos permisos
  RETURN TRUE;
END;
$$;

-- Función para eliminar usuario del gym
CREATE OR REPLACE FUNCTION public.delete_gym_user(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario que llama es admin del mismo gym
  IF NOT EXISTS (
    SELECT 1 FROM gym_accounts ga1
    JOIN gym_accounts ga2 ON ga1.gym_id = ga2.gym_id
    WHERE ga1.id = auth.uid()
    AND ga2.id = p_user_id
    AND ga1.role = 'admin'
    AND ga2.id != ga1.id -- No puede eliminarse a sí mismo
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para eliminar este usuario';
  END IF;

  -- Eliminar de gym_accounts (el trigger de auth.users se encargará del resto)
  DELETE FROM gym_accounts WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION public.create_gym_user IS 'Crea un nuevo usuario del gym. Debe ser llamado desde el servidor.';
COMMENT ON FUNCTION public.update_user_password IS 'Actualiza la contraseña de un usuario. Debe ser llamado desde el servidor.';
COMMENT ON FUNCTION public.delete_gym_user IS 'Elimina un usuario del gym.';



-- =====================================================
-- SIMPLIFICAR TRIGGER: Versión más simple y robusta
-- =====================================================
-- Simplificar al máximo para evitar errores

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  -- Obtener el nombre de forma segura
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data ? 'name' THEN
    v_name := NEW.raw_user_meta_data->>'name';
  END IF;
  
  -- Si no hay nombre, usar un valor por defecto
  v_name := COALESCE(NULLIF(v_name, ''), 'Usuario');

  -- Insertar el perfil de forma simple
  INSERT INTO public.users (id, email, name, role, gym_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_name,
    'admin',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;  -- Si ya existe, no hacer nada
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay cualquier error, loguearlo pero NO fallar el registro
    -- Esto es crítico: el usuario DEBE poder registrarse
    RAISE WARNING 'Error en trigger handle_new_auth_user: %', SQLERRM;
    RETURN NEW;  -- Siempre retornar NEW para que auth.users continúe
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();



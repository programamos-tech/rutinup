-- =====================================================
-- FIX COMPLETO: Trigger con validaciones y manejo de errores robusto
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Validar y obtener valores
  v_user_email := COALESCE(NULLIF(NEW.email, ''), 'user@example.com');
  
  -- Obtener el nombre de los metadatos o usar un valor por defecto
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_user_name := COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', '')
    );
  END IF;
  
  -- Si aún no tenemos nombre, usar un valor por defecto
  v_user_name := COALESCE(v_user_name, 'Usuario');

  -- Intentar insertar el perfil
  -- Usar un bloque de excepción para capturar cualquier error
  BEGIN
    INSERT INTO public.users (id, email, name, role, gym_id)
    VALUES (
      NEW.id,
      v_user_email,
      v_user_name,
      COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
      NULL  -- gym_id será NULL hasta que se complete el onboarding
    )
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, users.email),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
      role = COALESCE(EXCLUDED.role, users.role);
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Si hay un error, loguearlo pero NO fallar el registro en auth.users
      -- Esto es crítico: el usuario debe poder registrarse aunque el trigger falle
      RAISE WARNING 'Error en trigger handle_new_auth_user para usuario %: %', NEW.id, SQLERRM;
      -- Retornar NEW para que el registro en auth.users continúe
  END;
  
  RETURN NEW;
END;
$$;

-- Asegurar que el trigger esté activo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();


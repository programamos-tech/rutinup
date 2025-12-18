-- =====================================================
-- TRIGGER QUE NUNCA FALLA: Versión ultra-robusta
-- =====================================================
-- Este trigger está diseñado para NUNCA fallar
-- Si hay cualquier error, simplemente no crea el perfil
-- pero permite que el registro en auth.users continúe

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT := 'Usuario';
  v_email TEXT;
BEGIN
  -- Obtener email de forma segura
  v_email := COALESCE(NEW.email, '');
  IF v_email = '' THEN
    v_email := 'user@example.com';
  END IF;

  -- Obtener nombre de los metadatos de forma segura
  BEGIN
    IF NEW.raw_user_meta_data IS NOT NULL THEN
      IF NEW.raw_user_meta_data ? 'name' THEN
        v_name := NEW.raw_user_meta_data->>'name';
      ELSIF NEW.raw_user_meta_data ? 'full_name' THEN
        v_name := NEW.raw_user_meta_data->>'full_name';
      END IF;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Si hay error obteniendo el nombre, usar el por defecto
      v_name := 'Usuario';
  END;

  -- Validar que el nombre no esté vacío
  v_name := COALESCE(NULLIF(TRIM(v_name), ''), 'Usuario');

  -- Intentar insertar el perfil
  -- Si falla por CUALQUIER razón, simplemente continuar
  BEGIN
    INSERT INTO public.users (id, email, name, role, gym_id)
    VALUES (
      NEW.id,
      v_email,
      v_name,
      'admin',
      NULL
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Cualquier error es ignorado
      -- El registro en auth.users DEBE continuar
      NULL;
  END;
  
  -- Siempre retornar NEW para que el registro continúe
  RETURN NEW;
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();



-- =====================================================
-- MIGRACIÓN 031: VERIFICAR Y CREAR TRIGGER EN AUTH.USERS
-- =====================================================
-- Este trigger debe estar en auth.users, no en public.users
-- Por eso no aparece en la lista de triggers de public

-- Primero, eliminar el trigger si existe (por si acaso)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Asegurarnos de que la función existe y está actualizada
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gym_id UUID;
  v_gym_name TEXT;
  v_city TEXT;
  v_whatsapp TEXT;
  v_admin_name TEXT;
  v_email TEXT;
BEGIN
  -- Obtener email
  v_email := COALESCE(NEW.email, '');
  IF v_email = '' THEN
    v_email := 'user@example.com';
  END IF;

  -- Obtener datos de los metadatos
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_gym_name := NEW.raw_user_meta_data->>'gym_name';
    v_city := NEW.raw_user_meta_data->>'city';
    v_whatsapp := NEW.raw_user_meta_data->>'whatsapp';
    v_admin_name := COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', '')
    );
  END IF;

  -- Validar que tenemos los datos necesarios
  IF v_gym_name IS NULL OR TRIM(v_gym_name) = '' THEN
    RAISE EXCEPTION 'gym_name es requerido en los metadatos del usuario';
  END IF;

  IF LENGTH(v_gym_name) > 100 THEN
    RAISE EXCEPTION 'El nombre del gimnasio no puede exceder 100 caracteres';
  END IF;

  IF v_city IS NULL OR TRIM(v_city) = '' THEN
    RAISE EXCEPTION 'city es requerido en los metadatos del usuario';
  END IF;

  v_city := TRIM(v_city);
  
  IF LENGTH(v_city) > 50 THEN
    RAISE EXCEPTION 'La ciudad no puede exceder 50 caracteres';
  END IF;
  
  IF v_city NOT IN ('Sincelejo', 'Montería') THEN
    RAISE EXCEPTION 'La ciudad debe ser Sincelejo o Montería. Valor recibido: %', v_city;
  END IF;

  IF v_whatsapp IS NULL OR TRIM(v_whatsapp) = '' THEN
    RAISE EXCEPTION 'whatsapp es requerido en los metadatos del usuario';
  END IF;

  IF LENGTH(v_whatsapp) > 20 THEN
    RAISE EXCEPTION 'El WhatsApp no puede exceder 20 caracteres';
  END IF;

  v_admin_name := COALESCE(NULLIF(TRIM(v_admin_name), ''), 'Administrador');

  IF LENGTH(v_admin_name) > 100 THEN
    RAISE EXCEPTION 'El nombre del administrador no puede exceder 100 caracteres';
  END IF;

  IF LENGTH(v_email) > 254 THEN
    RAISE EXCEPTION 'El email no puede exceder 254 caracteres';
  END IF;

  -- 1. CREAR EL GIMNASIO
  BEGIN
    INSERT INTO public.gyms (name, email, city, phone, status)
    VALUES (v_gym_name, v_email, v_city, v_whatsapp, 'active')
    RETURNING id INTO v_gym_id;

    IF v_gym_id IS NULL THEN
      RAISE EXCEPTION 'No se pudo crear el gimnasio';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Error al crear el gimnasio: %', SQLERRM;
  END;

  -- 2. CREAR EL PERFIL EN GYM_ACCOUNTS (antes users)
  BEGIN
    INSERT INTO public.gym_accounts (id, gym_id, email, name, role)
    VALUES (
      NEW.id,
      v_gym_id,
      v_email,
      v_admin_name,
      'admin'
    )
    ON CONFLICT (id) DO UPDATE SET
      gym_id = EXCLUDED.gym_id,
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, gym_accounts.name);
  EXCEPTION
    WHEN OTHERS THEN
      BEGIN
        DELETE FROM public.gyms WHERE id = v_gym_id;
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
      RAISE EXCEPTION 'Error al crear el perfil: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Crear el trigger en auth.users (no en public.users)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Verificar que el trigger se creó
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    RAISE NOTICE 'Trigger on_auth_user_created creado exitosamente en auth.users';
  ELSE
    RAISE WARNING 'El trigger on_auth_user_created NO se pudo crear';
  END IF;
END $$;






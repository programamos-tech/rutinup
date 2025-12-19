-- =====================================================
-- MIGRACIÓN 030: FIX REGISTRO CON CREACIÓN DE GIMNASIO
-- =====================================================
-- Esta migración funciona con la tabla users actual
-- Crea el gimnasio y el perfil automáticamente al registrarse

-- =====================================================
-- 1. AGREGAR CAMPO CITY A GYMS (si no existe)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gyms' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.gyms ADD COLUMN city TEXT;
  END IF;
END $$;

-- =====================================================
-- 2. ACTUALIZAR TRIGGER PARA CREAR GIMNASIO + PERFIL
-- =====================================================

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

  -- Validar longitud máxima del nombre del gimnasio (100 caracteres)
  IF LENGTH(v_gym_name) > 100 THEN
    RAISE EXCEPTION 'El nombre del gimnasio no puede exceder 100 caracteres';
  END IF;

  IF v_city IS NULL OR TRIM(v_city) = '' THEN
    RAISE EXCEPTION 'city es requerido en los metadatos del usuario';
  END IF;

  -- Normalizar la ciudad (trim y verificar)
  v_city := TRIM(v_city);
  
  -- Validar longitud máxima de la ciudad (50 caracteres)
  IF LENGTH(v_city) > 50 THEN
    RAISE EXCEPTION 'La ciudad no puede exceder 50 caracteres';
  END IF;
  
  -- Validar que la ciudad sea válida (Sincelejo o Montería)
  IF v_city NOT IN ('Sincelejo', 'Montería') THEN
    RAISE EXCEPTION 'La ciudad debe ser Sincelejo o Montería. Valor recibido: %', v_city;
  END IF;

  -- Validar WhatsApp
  IF v_whatsapp IS NULL OR TRIM(v_whatsapp) = '' THEN
    RAISE EXCEPTION 'whatsapp es requerido en los metadatos del usuario';
  END IF;

  -- Validar longitud máxima del WhatsApp (20 caracteres)
  IF LENGTH(v_whatsapp) > 20 THEN
    RAISE EXCEPTION 'El WhatsApp no puede exceder 20 caracteres';
  END IF;

  -- Validar nombre del administrador
  v_admin_name := COALESCE(NULLIF(TRIM(v_admin_name), ''), 'Administrador');

  -- Validar longitud máxima del nombre del administrador (100 caracteres)
  IF LENGTH(v_admin_name) > 100 THEN
    RAISE EXCEPTION 'El nombre del administrador no puede exceder 100 caracteres';
  END IF;

  -- Validar longitud máxima del email (254 caracteres)
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

  -- 2. CREAR EL PERFIL EN USERS (tabla actual)
  BEGIN
    INSERT INTO public.users (id, gym_id, email, name, role)
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
      name = COALESCE(EXCLUDED.name, users.name);
  EXCEPTION
    WHEN OTHERS THEN
      -- Si falla la creación del perfil, eliminar el gimnasio creado
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

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- =====================================================
-- RESULTADO FINAL
-- =====================================================
-- ✔ Trigger actualizado para crear gimnasio + perfil
-- ✔ Funciona con la tabla users actual (sin renombrar)
-- ✔ Crea el gimnasio con status='active'
-- ✔ Asigna gym_id al perfil del usuario
-- ✔ Validaciones de longitud máxima implementadas




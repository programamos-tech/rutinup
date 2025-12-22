-- =====================================================
-- MIGRACIÓN 045: ARREGLAR TRIGGER PARA USUARIOS CREADOS POR ADMIN
-- =====================================================
-- El trigger actual solo maneja el registro inicial (crea gimnasio + usuario)
-- Necesitamos que también maneje usuarios creados por admin (solo crear en gym_accounts)

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
  v_role TEXT;
  v_permissions JSONB;
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
    v_role := NEW.raw_user_meta_data->>'role';
    -- Intentar obtener gym_id si existe (para usuarios creados por admin)
    IF NEW.raw_user_meta_data ? 'gym_id' THEN
      v_gym_id := (NEW.raw_user_meta_data->>'gym_id')::UUID;
    END IF;
    -- Intentar obtener permissions si existe
    IF NEW.raw_user_meta_data ? 'permissions' THEN
      v_permissions := NEW.raw_user_meta_data->'permissions';
    END IF;
  END IF;

  -- CASO 1: Usuario creado por admin (tiene gym_id en metadatos)
  -- Solo crear el registro en gym_accounts, NO crear gimnasio
  IF v_gym_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.gym_accounts (id, gym_id, email, name, role, permissions)
      VALUES (
        NEW.id,
        v_gym_id,
        v_email,
        COALESCE(NULLIF(TRIM(v_admin_name), ''), 'Usuario'),
        COALESCE(NULLIF(v_role, ''), 'receptionist'),
        COALESCE(v_permissions, '{}'::jsonb)
      )
      ON CONFLICT (id) DO UPDATE SET
        gym_id = EXCLUDED.gym_id,
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, gym_accounts.name),
        role = COALESCE(EXCLUDED.role, gym_accounts.role),
        permissions = COALESCE(EXCLUDED.permissions, gym_accounts.permissions);
      
      RETURN NEW;
    EXCEPTION
      WHEN OTHERS THEN
        -- Si falla, loguear pero no fallar el registro en auth.users
        RAISE WARNING 'Error al crear perfil de usuario creado por admin: %', SQLERRM;
        RETURN NEW;
    END;
  END IF;

  -- CASO 2: Registro inicial (tiene gym_name en metadatos)
  -- Crear gimnasio + usuario (lógica original)
  
  -- Validar que tenemos los datos necesarios para registro inicial
  IF v_gym_name IS NULL OR TRIM(v_gym_name) = '' THEN
    -- Si no hay gym_name ni gym_id, es un error
    RAISE WARNING 'Usuario creado sin gym_name ni gym_id. No se creará perfil en gym_accounts.';
    RETURN NEW;
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

  -- 2. CREAR EL PERFIL EN GYM_ACCOUNTS
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

-- Comentario
COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Maneja la creación de usuarios: si tiene gym_id en metadatos, solo crea en gym_accounts. Si tiene gym_name, crea gimnasio + usuario (registro inicial).';



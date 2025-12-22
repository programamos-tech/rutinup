-- =====================================================
-- MIGRACIÓN 029: RENOMBRAR USERS → GYM_ACCOUNTS Y FIX REGISTRO
-- =====================================================
-- Esta migración:
-- 1. Agrega campo city a gyms
-- 2. Renombra users → gym_accounts
-- 3. Hace gym_id NOT NULL
-- 4. Actualiza trigger para crear gimnasio + perfil automáticamente
-- 5. Actualiza políticas RLS básicas

-- =====================================================
-- 1. AGREGAR CAMPO CITY A GYMS
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
-- 2. RENOMBRAR TABLA USERS → GYM_ACCOUNTS
-- =====================================================

-- Primero, eliminar el trigger que referencia users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar políticas RLS que referencian users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view users from their gym" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Eliminar índices relacionados con gym_id NULL (ya no serán necesarios)
DROP INDEX IF EXISTS users_email_gym_id_unique;
DROP INDEX IF EXISTS users_email_unique_when_no_gym;

-- Renombrar la tabla
ALTER TABLE IF EXISTS public.users RENAME TO gym_accounts;

-- Renombrar la constraint de foreign key si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_gym_id_fkey' 
    AND table_name = 'gym_accounts'
  ) THEN
    ALTER TABLE public.gym_accounts 
    RENAME CONSTRAINT users_gym_id_fkey TO gym_accounts_gym_id_fkey;
  END IF;
END $$;

-- Renombrar índices
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_gym_id') THEN
    ALTER INDEX idx_users_gym_id RENAME TO idx_gym_accounts_gym_id;
  END IF;
END $$;

-- =====================================================
-- 3. HACER GYM_ID NOT NULL
-- =====================================================

-- Primero, eliminar cualquier fila que tenga gym_id NULL (no debería haber, pero por seguridad)
DELETE FROM public.gym_accounts WHERE gym_id IS NULL;

-- Hacer gym_id NOT NULL
ALTER TABLE public.gym_accounts 
  ALTER COLUMN gym_id SET NOT NULL;

-- Recrear constraint UNIQUE para email+gym_id (ahora que gym_id siempre existe)
ALTER TABLE public.gym_accounts 
  DROP CONSTRAINT IF EXISTS gym_accounts_email_gym_id_key;

ALTER TABLE public.gym_accounts 
  ADD CONSTRAINT gym_accounts_email_gym_id_key 
  UNIQUE (email, gym_id);

-- =====================================================
-- 4. ACTUALIZAR TRIGGER PARA CREAR GIMNASIO + PERFIL
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- =====================================================
-- 5. ACTUALIZAR POLÍTICAS RLS BÁSICAS
-- =====================================================

ALTER TABLE public.gym_accounts ENABLE ROW LEVEL SECURITY;

-- SELECT: solo puede ver su propio perfil
CREATE POLICY "gym_accounts_select_own"
  ON public.gym_accounts
  FOR SELECT
  USING (id = auth.uid());

-- UPDATE: solo puede actualizar su propio perfil
CREATE POLICY "gym_accounts_update_own"
  ON public.gym_accounts
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ❌ NO SE CREA POLICY DE INSERT
-- El INSERT lo hace el trigger con SECURITY DEFINER

-- =====================================================
-- RESULTADO FINAL
-- =====================================================
-- ✔ Tabla users renombrada a gym_accounts
-- ✔ Campo city agregado a gyms
-- ✔ gym_id es NOT NULL en gym_accounts
-- ✔ Trigger crea gimnasio (status='active') + perfil automáticamente
-- ✔ Políticas RLS básicas actualizadas
-- ✔ Registro completo en un solo paso






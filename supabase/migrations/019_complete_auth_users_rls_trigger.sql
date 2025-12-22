-- =====================================================
-- SOLUCIÓN COMPLETA: AUTH + USERS + RLS + TRIGGER
-- =====================================================

-- 1️⃣ TABLA USERS (PERFIL DE NEGOCIO)
-- =====================================================

-- Nota: La tabla users ya existe, pero asegurémonos de que tenga las columnas necesarias
-- Si la tabla ya existe con otras columnas, esto no la sobrescribirá
-- Solo agregaremos las columnas que falten si es necesario

-- Verificar y ajustar la tabla users si es necesario
DO $$
BEGIN
  -- Agregar columnas si no existen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'users' 
                 AND column_name = 'email') THEN
    ALTER TABLE public.users ADD COLUMN email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'users' 
                 AND column_name = 'name') THEN
    ALTER TABLE public.users ADD COLUMN name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'users' 
                 AND column_name = 'role') THEN
    ALTER TABLE public.users ADD COLUMN role text DEFAULT 'admin';
  END IF;
END $$;

-- 2️⃣ FUNCIÓN QUE CREA EL PERFIL AUTOMÁTICAMENTE
-- =====================================================

-- Se ejecuta con privilegios elevados
-- NO depende de RLS
-- NO depende del frontend
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name);
  
  RETURN NEW;
END;
$$;

-- 3️⃣ TRIGGER AL CREAR USUARIO EN AUTH
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 4️⃣ RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Limpiar policies existentes
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view users from their gym" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- SELECT: solo puede ver su propio perfil
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- UPDATE: solo puede actualizar su propio perfil
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ❌ NO SE CREA POLICY DE INSERT
-- =====================================================
-- El INSERT lo hace el trigger con SECURITY DEFINER
-- Esto evita bloqueos, loaders infinitos y errores de RLS

-- =====================================================
-- RESULTADO FINAL
-- =====================================================
-- ✔ Signup crea usuario en auth.users
-- ✔ Trigger crea fila en public.users
-- ✔ auth.uid() disponible
-- ✔ SELECT funciona
-- ✔ El frontend deja de quedarse cargando
-- ✔ Arquitectura SaaS correcta






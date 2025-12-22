-- =====================================================
-- MIGRACIÓN 043: AGREGAR PERMISOS A GYM_ACCOUNTS
-- =====================================================
-- Esta migración agrega un campo JSONB 'permissions' a gym_accounts
-- para almacenar permisos por módulo para cada usuario

-- Agregar columna permissions si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gym_accounts' 
    AND column_name = 'permissions'
  ) THEN
    ALTER TABLE public.gym_accounts 
    ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Comentario en la columna
COMMENT ON COLUMN public.gym_accounts.permissions IS 'Permisos por módulo del usuario. Formato: {"dashboard": true, "payments": true, "memberships": false, ...}';



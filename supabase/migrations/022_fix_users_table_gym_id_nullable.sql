-- =====================================================
-- FIX: Hacer gym_id nullable en users
-- =====================================================
-- El gym_id se asigna durante el onboarding, no durante el registro
-- Por lo tanto, debe ser nullable para permitir que el trigger cree el perfil

-- Hacer gym_id nullable
ALTER TABLE public.users 
  ALTER COLUMN gym_id DROP NOT NULL;

-- Eliminar la restricción UNIQUE existente (es una constraint, no solo un índice)
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_email_gym_id_key;

-- Crear un índice único parcial que solo aplique cuando gym_id no es NULL
-- Esto permite múltiples usuarios con gym_id NULL (durante registro)
-- pero mantiene la unicidad de email+gym_id cuando el gym_id está asignado
CREATE UNIQUE INDEX IF NOT EXISTS users_email_gym_id_unique 
  ON public.users (email, gym_id) 
  WHERE gym_id IS NOT NULL;

-- También crear un índice único solo para email cuando gym_id es NULL
-- Esto previene duplicados durante el registro
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_when_no_gym 
  ON public.users (email) 
  WHERE gym_id IS NULL;


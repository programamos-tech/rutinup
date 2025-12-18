-- =====================================================
-- FIX: Ajustar foreign key de gym_id para permitir NULL
-- =====================================================
-- La foreign key puede estar causando problemas incluso con NULL
-- Necesitamos asegurarnos de que la FK permita NULL correctamente

-- Eliminar la foreign key existente si existe
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_gym_id_fkey;

-- Recrear la foreign key que permite NULL y es DEFERRABLE
-- DEFERRABLE permite que la FK se valide al final de la transacción
ALTER TABLE public.users 
  ADD CONSTRAINT users_gym_id_fkey 
  FOREIGN KEY (gym_id) 
  REFERENCES public.gyms(id) 
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- Esto permite que:
-- 1. gym_id puede ser NULL (ya lo hicimos en la migración anterior)
-- 2. La FK se valida al final de la transacción, no inmediatamente
-- 3. Si gym_id es NULL, la FK no se valida (NULL bypassa foreign keys)



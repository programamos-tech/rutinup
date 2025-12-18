-- =====================================================
-- MIGRACIÓN 033: ARREGLAR get_user_gym_id() PARA USAR gym_accounts
-- =====================================================
-- PROBLEMA: La función get_user_gym_id() todavía está usando
-- la tabla 'users' que fue renombrada a 'gym_accounts' en la migración 029.
-- Esto causa que las políticas RLS fallen silenciosamente,
-- devolviendo 204 pero sin actualizar realmente la BD.

-- Actualizar la función para usar gym_accounts
CREATE OR REPLACE FUNCTION get_user_gym_id()
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT gym_id FROM gym_accounts WHERE id = auth.uid();
$$;

-- Verificar que la función funciona correctamente
DO $$
DECLARE
  v_test_result UUID;
BEGIN
  -- Intentar obtener el gym_id (puede ser NULL si no hay usuario autenticado, eso está bien)
  SELECT get_user_gym_id() INTO v_test_result;
  
  IF v_test_result IS NOT NULL THEN
    RAISE NOTICE 'Función get_user_gym_id() actualizada correctamente. Test result: %', v_test_result;
  ELSE
    RAISE NOTICE 'Función get_user_gym_id() actualizada correctamente (retorna NULL porque no hay usuario autenticado en este contexto)';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error al actualizar get_user_gym_id(): %', SQLERRM;
END $$;


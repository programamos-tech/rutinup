-- Asegurar que las políticas RLS permitan la inserción durante el registro
-- Esta migración garantiza que la función create_gym_and_user pueda insertar correctamente

-- Asegurar que la política de inserción de gyms permita la creación durante el registro
-- La función SECURITY DEFINER debería bypassar RLS, pero por si acaso, verificamos las políticas

-- Verificar y recrear la política de inserción de users si es necesario
DROP POLICY IF EXISTS "Allow user creation during registration" ON users;

-- Política que permite a los usuarios crear su propio perfil durante el registro
-- Esta política permite la inserción cuando:
-- 1. El id del usuario coincide con auth.uid() (es su propio perfil)
-- 2. El gym_id no es NULL (se crea junto con el gym)
CREATE POLICY "Allow user creation during registration"
  ON users FOR INSERT
  WITH CHECK (
    auth.uid() = id AND
    gym_id IS NOT NULL
  );

-- Asegurar que la política de inserción de gyms esté correcta
DROP POLICY IF EXISTS "Allow gym creation during registration" ON gyms;

CREATE POLICY "Allow gym creation during registration"
  ON gyms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Nota: Las funciones con SECURITY DEFINER deberían poder insertar sin problemas de RLS,
-- pero estas políticas aseguran que si hay algún problema con SECURITY DEFINER,
-- al menos las políticas RLS permitirán la inserción durante el registro.



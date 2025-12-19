-- =====================================================
-- MIGRACIÓN 035: ACTUALIZAR POLÍTICAS DE STORAGE PARA USAR gym_id
-- =====================================================
-- Actualiza las políticas RLS del bucket 'logos' para usar gym_id
-- en lugar de user_id, simplificando la estructura a una carpeta por gym

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own logos" ON storage.objects;

-- Política para INSERT: Los usuarios autenticados pueden subir logos en su carpeta de gym
CREATE POLICY "Users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = get_user_gym_id()::text
);

-- Política para UPDATE: Los usuarios solo pueden actualizar logos de su gym
CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = get_user_gym_id()::text
);

-- Política para DELETE: Los usuarios solo pueden eliminar logos de su gym
CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = get_user_gym_id()::text
);



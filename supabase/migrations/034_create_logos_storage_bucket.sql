-- =====================================================
-- MIGRACIÓN 034: CREAR BUCKET DE STORAGE PARA LOGOS
-- =====================================================
-- Esta migración crea un bucket de Storage para almacenar
-- los logos de los gimnasios en lugar de guardarlos como base64

-- Crear el bucket 'logos' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true, -- Público para que las imágenes sean accesibles
  5242880, -- 5MB límite
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS RLS PARA EL BUCKET 'logos'
-- =====================================================

-- Política para INSERT: Los usuarios autenticados pueden subir logos en su carpeta de gym
CREATE POLICY "Users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = get_user_gym_id()::text
);

-- Política para SELECT: Cualquiera puede ver los logos (bucket público)
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

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


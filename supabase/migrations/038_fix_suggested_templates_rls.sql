-- =====================================================
-- MIGRACIÓN 038: CORREGIR RLS DE PLANTILLAS SUGERIDAS
-- =====================================================
-- Asegura que las plantillas sugeridas sean accesibles
-- para todos los usuarios autenticados

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Anyone can read active suggested templates" ON suggested_plan_templates;

-- Crear política más permisiva: cualquier usuario autenticado puede leer todas las plantillas
-- (no solo las activas, para tener más control desde el frontend)
CREATE POLICY "Authenticated users can read suggested templates"
  ON suggested_plan_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- También permitir lectura anónima si es necesario (para desarrollo)
-- Comentar si no se necesita
-- CREATE POLICY "Anonymous can read suggested templates"
--   ON suggested_plan_templates
--   FOR SELECT
--   TO anon
--   USING (is_active = true);

-- Verificar que todos los registros tengan is_active = true
UPDATE suggested_plan_templates 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

COMMENT ON POLICY "Authenticated users can read suggested templates" ON suggested_plan_templates IS 
  'Permite que cualquier usuario autenticado pueda leer las plantillas sugeridas';




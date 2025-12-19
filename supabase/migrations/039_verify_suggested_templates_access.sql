-- =====================================================
-- MIGRACIÓN 039: VERIFICAR Y CORREGIR ACCESO A PLANTILLAS
-- =====================================================
-- Asegura que las plantillas sean accesibles

-- Verificar que la tabla existe y tiene datos
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM suggested_plan_templates;
  RAISE NOTICE 'Total de registros en suggested_plan_templates: %', row_count;
  
  SELECT COUNT(*) INTO row_count FROM suggested_plan_templates WHERE is_active = true;
  RAISE NOTICE 'Registros con is_active = true: %', row_count;
END $$;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Anyone can read active suggested templates" ON suggested_plan_templates;
DROP POLICY IF EXISTS "Authenticated users can read suggested templates" ON suggested_plan_templates;

-- Crear política simple y directa
CREATE POLICY "Allow read for authenticated users"
  ON suggested_plan_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- También permitir para anon si es necesario (solo en desarrollo)
-- Descomentar si necesitas acceso sin autenticación
-- CREATE POLICY "Allow read for anonymous"
--   ON suggested_plan_templates
--   FOR SELECT
--   TO anon
--   USING (is_active = true);

-- Verificar que RLS está habilitado
ALTER TABLE suggested_plan_templates ENABLE ROW LEVEL SECURITY;

-- Asegurar que todos los registros tengan is_active = true
UPDATE suggested_plan_templates 
SET is_active = true 
WHERE is_active IS NULL;

-- Mostrar resumen
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as activos,
  COUNT(*) FILTER (WHERE is_active = false) as inactivos,
  COUNT(*) FILTER (WHERE is_active IS NULL) as nulls
FROM suggested_plan_templates;




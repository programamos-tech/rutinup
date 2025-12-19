-- Verificar si la tabla existe
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'suggested_plan_templates';

-- Verificar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'suggested_plan_templates'
ORDER BY ordinal_position;

-- Verificar datos
SELECT COUNT(*) as total FROM suggested_plan_templates;




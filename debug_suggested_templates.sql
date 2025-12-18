-- Verificar políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'suggested_plan_templates';

-- Verificar datos
SELECT id, name, price, is_active, is_featured, sort_order
FROM suggested_plan_templates
ORDER BY sort_order;

-- Probar query como usuario autenticado (simular)
-- Esto debería funcionar si la política está bien
SELECT COUNT(*) 
FROM suggested_plan_templates 
WHERE is_active = true;



-- =====================================================
-- MIGRACIÓN 037: PLANTILLAS SUGERIDAS DE PLANES
-- =====================================================
-- Crea una tabla para plantillas sugeridas del sistema
-- que son compartidas entre todos los gyms.
-- Cuando un gym edita una plantilla sugerida, se crea
-- una copia personalizada en membership_types.

-- 1. Crear tabla de plantillas sugeridas del sistema
CREATE TABLE IF NOT EXISTS suggested_plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  description TEXT,
  
  -- Servicios incluidos (JSONB para flexibilidad)
  includes JSONB DEFAULT '{}',
  
  -- Restricciones
  restrictions JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agregar campo is_suggested a membership_types
-- (para identificar si un plan fue creado desde una plantilla sugerida)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'membership_types' 
    AND column_name = 'is_suggested'
  ) THEN
    ALTER TABLE public.membership_types 
    ADD COLUMN is_suggested BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN public.membership_types.is_suggested IS 
      'Indica si el plan fue creado desde una plantilla sugerida del sistema';
  END IF;
END $$;

-- 3. Agregar campo suggested_template_id a membership_types
-- (para rastrear de qué plantilla se originó, si aplica)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'membership_types' 
    AND column_name = 'suggested_template_id'
  ) THEN
    ALTER TABLE public.membership_types 
    ADD COLUMN suggested_template_id UUID REFERENCES suggested_plan_templates(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN public.membership_types.suggested_template_id IS 
      'ID de la plantilla sugerida de la cual se originó este plan (si aplica)';
  END IF;
END $$;

-- 4. Insertar plantillas sugeridas iniciales con precios típicos de Colombia
INSERT INTO suggested_plan_templates (name, price, duration_days, description, includes, restrictions, is_active, is_featured, sort_order)
VALUES
  (
    'Solo Pesas',
    60000,
    30,
    'Acceso completo a área de pesas y máquinas',
    '{"freeWeights": true, "machines": true, "groupClasses": false, "personalTrainer": false, "cardio": true, "functional": false, "locker": true, "supplements": false}'::jsonb,
    '{}'::jsonb,
    true,
    false,
    1
  ),
  (
    'Solo Clases',
    70000,
    30,
    'Acceso a todas las clases grupales',
    '{"freeWeights": false, "machines": false, "groupClasses": true, "groupClassesCount": 12, "personalTrainer": false, "cardio": false, "functional": true, "locker": true, "supplements": false}'::jsonb,
    '{}'::jsonb,
    true,
    false,
    2
  ),
  (
    'Plan Completo',
    100000,
    30,
    'Acceso completo a todas las instalaciones y clases',
    '{"freeWeights": true, "machines": true, "groupClasses": true, "groupClassesCount": 12, "personalTrainer": false, "cardio": true, "functional": true, "locker": true, "supplements": false}'::jsonb,
    '{}'::jsonb,
    true,
    true,
    3
  ),
  (
    'Plan Premium',
    150000,
    30,
    'Todo incluido + entrenador personal',
    '{"freeWeights": true, "machines": true, "groupClasses": true, "groupClassesCount": 16, "personalTrainer": true, "personalTrainerSessions": 4, "cardio": true, "functional": true, "locker": true, "supplements": true}'::jsonb,
    '{}'::jsonb,
    true,
    true,
    4
  )
ON CONFLICT DO NOTHING;

-- 5. Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_suggested_plan_templates_active 
  ON suggested_plan_templates(is_active, sort_order);

-- 6. Política RLS: Todos pueden leer las plantillas sugeridas (son públicas)
ALTER TABLE suggested_plan_templates ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera autenticado puede leer plantillas sugeridas activas
CREATE POLICY "Anyone can read active suggested templates"
  ON suggested_plan_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Política: Solo super admins pueden modificar (por ahora, no permitimos edición)
-- En el futuro, si queremos que los admins del sistema puedan editar, agregar aquí

COMMENT ON TABLE suggested_plan_templates IS 
  'Plantillas sugeridas de planes que todos los gyms pueden ver y usar como base para crear sus propios planes';






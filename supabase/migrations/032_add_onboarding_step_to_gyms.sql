-- =====================================================
-- MIGRACIÓN 032: AGREGAR CAMPO ONBOARDING_STEP A GYMS
-- =====================================================
-- Esta migración agrega el campo onboarding_step para persistir
-- el paso actual del proceso de onboarding en la base de datos.
-- Esto permite que el frontend se rehidrate correctamente desde
-- el backend como fuente de verdad.

-- =====================================================
-- AGREGAR CAMPO ONBOARDING_STEP
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gyms' 
    AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE public.gyms 
    ADD COLUMN onboarding_step INTEGER DEFAULT 1 
    CHECK (onboarding_step >= 1 AND onboarding_step <= 4);
    
    -- Comentario para documentación
    COMMENT ON COLUMN public.gyms.onboarding_step IS 
      'Paso actual del proceso de onboarding (1-4). 1=Información Básica, 2=Logo, 3=Métodos de Pago, 4=Primer Usuario';
  END IF;
END $$;

-- =====================================================
-- ACTUALIZAR GYMS EXISTENTES
-- =====================================================
-- Si un gym ya tiene datos completos, establecer el paso apropiado
UPDATE public.gyms
SET onboarding_step = CASE
  -- Si tiene address, opening_time, closing_time y logo -> paso 3 o más
  WHEN address IS NOT NULL 
    AND opening_time IS NOT NULL 
    AND closing_time IS NOT NULL 
    AND logo_url IS NOT NULL 
    THEN 3  -- Tiene logo, probablemente está en paso 3 o 4
  WHEN address IS NOT NULL 
    AND opening_time IS NOT NULL 
    AND closing_time IS NOT NULL 
    THEN 2  -- Tiene datos básicos pero no logo
  ELSE 1  -- Por defecto, paso 1
END
WHERE onboarding_step IS NULL OR onboarding_step = 1;


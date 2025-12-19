-- =====================================================
-- MIGRACIÓN 036: AGREGAR CAMPO PAYMENT_METHODS A GYMS
-- =====================================================
-- Agrega un campo JSONB para almacenar los métodos de pago
-- seleccionados durante el onboarding

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gyms' 
    AND column_name = 'payment_methods'
  ) THEN
    ALTER TABLE public.gyms 
    ADD COLUMN payment_methods JSONB DEFAULT '[]'::jsonb;
    
    COMMENT ON COLUMN public.gyms.payment_methods IS 
      'Array JSON de métodos de pago aceptados: ["cash", "transfer", "mixed"]';
  END IF;
END $$;



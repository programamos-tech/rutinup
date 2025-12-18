-- =====================================================
-- MIGRACIÓN 041: AGREGAR FUNCIONALIDADES DE PAGO
-- =====================================================
-- Esta migración agrega soporte para:
-- - Pagos parciales (abonos)
-- - Pagos mixtos (efectivo + transferencia)
-- - Mes de pago que cubre cada transacción

-- =====================================================
-- AGREGAR COLUMNAS A PAYMENTS
-- =====================================================
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_month TEXT,
  ADD COLUMN IF NOT EXISTS split_payment JSONB DEFAULT NULL;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON COLUMN public.payments.is_partial IS 
  'Indica si el pago es un abono parcial (true) o un pago completo (false)';
COMMENT ON COLUMN public.payments.payment_month IS 
  'Mes que cubre el pago en formato YYYY-MM (ej: 2024-01)';
COMMENT ON COLUMN public.payments.split_payment IS 
  'Para pagos mixtos: {"cash": 50000, "transfer": 50000}. Si es NULL, el pago usa el método único en "method"';

-- =====================================================
-- VALIDACIONES
-- =====================================================
-- Validar que payment_month tenga formato YYYY-MM
ALTER TABLE public.payments
  ADD CONSTRAINT check_payment_month_format 
  CHECK (payment_month IS NULL OR payment_month ~ '^\d{4}-\d{2}$');

-- Validar que split_payment tenga la estructura correcta
ALTER TABLE public.payments
  ADD CONSTRAINT check_split_payment_structure
  CHECK (
    split_payment IS NULL OR (
      split_payment ? 'cash' AND 
      split_payment ? 'transfer' AND
      (split_payment->>'cash')::numeric >= 0 AND
      (split_payment->>'transfer')::numeric >= 0 AND
      ((split_payment->>'cash')::numeric + (split_payment->>'transfer')::numeric) > 0
    )
  );

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payments_payment_month 
  ON public.payments(payment_month);

CREATE INDEX IF NOT EXISTS idx_payments_is_partial 
  ON public.payments(is_partial);


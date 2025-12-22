-- =====================================================
-- MIGRACIÓN 047: SISTEMA DE CIERRES DE CAJA
-- =====================================================
-- Esta migración crea el sistema de cierres de caja que permite:
-- - Apertura de caja al iniciar turno
-- - Cierre de caja al finalizar turno
-- - Historial de cierres para administradores
-- - Asociación de pagos a cierres de caja

-- =====================================================
-- TABLA: cash_closings (cierres de caja)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cash_closings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.gym_accounts(id) ON DELETE RESTRICT,
  opening_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closing_time TIMESTAMPTZ,
  opening_cash DECIMAL(10,2) NOT NULL DEFAULT 0, -- Dinero inicial en caja
  closing_cash DECIMAL(10,2), -- Dinero final en caja (contado físicamente)
  total_cash_received DECIMAL(10,2) DEFAULT 0, -- Total en efectivo recibido
  total_transfer_received DECIMAL(10,2) DEFAULT 0, -- Total en transferencias recibido
  total_received DECIMAL(10,2) DEFAULT 0, -- Total recibido (cash + transfer)
  notes TEXT, -- Notas del cierre
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MODIFICAR TABLA payments
-- =====================================================
-- Agregar columna cash_closing_id para asociar pagos a cierres de caja
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS cash_closing_id UUID REFERENCES public.cash_closings(id) ON DELETE SET NULL;

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_cash_closings_gym_id ON public.cash_closings(gym_id);
CREATE INDEX IF NOT EXISTS idx_cash_closings_user_id ON public.cash_closings(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_closings_status ON public.cash_closings(status);
CREATE INDEX IF NOT EXISTS idx_cash_closings_opening_time ON public.cash_closings(opening_time);
CREATE INDEX IF NOT EXISTS idx_cash_closings_closing_time ON public.cash_closings(closing_time);

CREATE INDEX IF NOT EXISTS idx_payments_cash_closing_id ON public.payments(cash_closing_id);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE TRIGGER trigger_update_cash_closings_updated_at
  BEFORE UPDATE ON public.cash_closings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIÓN: Obtener cierre de caja abierto
-- =====================================================
CREATE OR REPLACE FUNCTION get_open_cash_closing(gym_uuid UUID, user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  closing_id UUID;
BEGIN
  -- Buscar cierre abierto para este gym y usuario
  SELECT id INTO closing_id
  FROM public.cash_closings
  WHERE gym_id = gym_uuid
    AND user_id = user_uuid
    AND status = 'open'
  ORDER BY opening_time DESC
  LIMIT 1;
  
  RETURN closing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: Calcular totales de un cierre de caja
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_cash_closing_totals(closing_uuid UUID)
RETURNS TABLE (
  total_cash DECIMAL(10,2),
  total_transfer DECIMAL(10,2),
  total_received DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE 
      WHEN p.method = 'cash' OR (p.split_payment IS NOT NULL AND (p.split_payment->>'cash')::numeric > 0)
      THEN COALESCE((p.split_payment->>'cash')::numeric, p.amount)
      ELSE 0
    END), 0)::DECIMAL(10,2) as total_cash,
    COALESCE(SUM(CASE 
      WHEN p.method = 'transfer' OR (p.split_payment IS NOT NULL AND (p.split_payment->>'transfer')::numeric > 0)
      THEN COALESCE((p.split_payment->>'transfer')::numeric, p.amount)
      ELSE 0
    END), 0)::DECIMAL(10,2) as total_transfer,
    COALESCE(SUM(p.amount), 0)::DECIMAL(10,2) as total_received
  FROM public.payments p
  WHERE p.cash_closing_id = closing_uuid
    AND p.status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;

-- Políticas para cash_closings
CREATE POLICY "cash_closings_select_own_gym"
  ON public.cash_closings FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "cash_closings_insert_own_gym"
  ON public.cash_closings FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "cash_closings_update_own_gym"
  ON public.cash_closings FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "cash_closings_delete_own_gym"
  ON public.cash_closings FOR DELETE
  USING (gym_id = get_user_gym_id());

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE public.cash_closings IS 
  'Registro de aperturas y cierres de caja por turno';
COMMENT ON COLUMN public.cash_closings.opening_cash IS 
  'Dinero inicial en caja al abrir el turno';
COMMENT ON COLUMN public.cash_closings.closing_cash IS 
  'Dinero final en caja al cerrar el turno (contado físicamente)';
COMMENT ON COLUMN public.cash_closings.total_cash_received IS 
  'Total en efectivo recibido durante el turno';
COMMENT ON COLUMN public.cash_closings.total_transfer_received IS 
  'Total en transferencias recibido durante el turno';
COMMENT ON COLUMN public.cash_closings.total_received IS 
  'Total recibido (efectivo + transferencias)';
COMMENT ON COLUMN public.cash_closings.status IS 
  'Estado del cierre: open (turno activo) o closed (turno cerrado)';


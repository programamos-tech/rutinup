-- =====================================================
-- MIGRACIÓN 042: SISTEMA DE FACTURAS/TICKETS
-- =====================================================
-- Esta migración crea el sistema de facturas que permite:
-- - Facturar membresías, productos, clases, etc.
-- - Ventas con o sin cliente registrado
-- - Items múltiples en una factura
-- - Integración con pagos

-- =====================================================
-- TABLA: products (catálogo de productos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT, -- 'supplement', 'equipment', 'apparel', 'beverage', 'other'
  sku TEXT, -- Código del producto
  stock INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(gym_id, sku)
);

-- =====================================================
-- TABLA: invoices (facturas/tickets)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL, -- Número de factura (autogenerado)
  invoice_date TIMESTAMPTZ DEFAULT NOW(),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partially_paid', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(gym_id, invoice_number)
);

-- =====================================================
-- TABLA: invoice_items (items de la factura)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('membership', 'product', 'class', 'service', 'other')),
  item_id UUID, -- ID del producto, membresía, clase, etc. (puede ser NULL para items personalizados)
  description TEXT NOT NULL, -- Descripción del item
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL, -- quantity * unit_price
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL, -- subtotal - discount
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MODIFICAR TABLA payments
-- =====================================================
-- Agregar columna invoice_id para asociar pagos a facturas
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

-- =====================================================
-- FUNCIÓN: Generar número de factura
-- =====================================================
CREATE OR REPLACE FUNCTION generate_invoice_number(gym_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  -- Contar facturas existentes para este gym
  SELECT COUNT(*) + 1 INTO next_number
  FROM public.invoices
  WHERE gym_id = gym_uuid;
  
  -- Generar número con formato: INV-YYYY-NNNNNN
  invoice_num := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-generar invoice_number
-- =====================================================
CREATE OR REPLACE FUNCTION auto_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number(NEW.gym_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invoice_number();

-- =====================================================
-- TRIGGER: Calcular totales de invoice
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  invoice_subtotal DECIMAL(10,2);
  invoice_total DECIMAL(10,2);
BEGIN
  -- Calcular subtotal sumando todos los items
  SELECT COALESCE(SUM(total), 0) INTO invoice_subtotal
  FROM public.invoice_items
  WHERE invoice_id = NEW.invoice_id;
  
  -- Actualizar factura
  UPDATE public.invoices
  SET 
    subtotal = invoice_subtotal,
    total = invoice_subtotal - COALESCE(discount, 0) + COALESCE(tax, 0),
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_invoice_totals_insert
  AFTER INSERT ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_totals();

CREATE TRIGGER trigger_calculate_invoice_totals_update
  AFTER UPDATE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_totals();

CREATE TRIGGER trigger_calculate_invoice_totals_delete
  AFTER DELETE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_totals();

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_gym_id ON public.products(gym_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

CREATE INDEX IF NOT EXISTS idx_invoices_gym_id ON public.invoices(gym_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_item_type ON public.invoice_items(item_type);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Políticas para products
CREATE POLICY "products_select_own_gym"
  ON public.products FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "products_insert_own_gym"
  ON public.products FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "products_update_own_gym"
  ON public.products FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "products_delete_own_gym"
  ON public.products FOR DELETE
  USING (gym_id = get_user_gym_id());

-- Políticas para invoices
CREATE POLICY "invoices_select_own_gym"
  ON public.invoices FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "invoices_insert_own_gym"
  ON public.invoices FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "invoices_update_own_gym"
  ON public.invoices FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "invoices_delete_own_gym"
  ON public.invoices FOR DELETE
  USING (gym_id = get_user_gym_id());

-- Políticas para invoice_items (solo a través de la factura)
CREATE POLICY "invoice_items_select_own_gym"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.gym_id = get_user_gym_id()
  ));

CREATE POLICY "invoice_items_insert_own_gym"
  ON public.invoice_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.gym_id = get_user_gym_id()
  ));

CREATE POLICY "invoice_items_update_own_gym"
  ON public.invoice_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.gym_id = get_user_gym_id()
  ));

CREATE POLICY "invoice_items_delete_own_gym"
  ON public.invoice_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.gym_id = get_user_gym_id()
  ));

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE public.products IS 
  'Catálogo de productos del gimnasio (suplementos, equipamiento, bebidas, etc.)';
COMMENT ON TABLE public.invoices IS 
  'Facturas/tickets que agrupan items vendidos y se asocian a pagos';
COMMENT ON TABLE public.invoice_items IS 
  'Items individuales de una factura (membresías, productos, clases, etc.)';
COMMENT ON COLUMN public.invoices.client_id IS 
  'Cliente asociado a la factura (opcional - puede ser venta sin cliente registrado)';
COMMENT ON COLUMN public.invoice_items.item_type IS 
  'Tipo de item: membership, product, class, service, other';
COMMENT ON COLUMN public.invoice_items.item_id IS 
  'ID del item (product_id, membership_type_id, etc.). NULL para items personalizados';


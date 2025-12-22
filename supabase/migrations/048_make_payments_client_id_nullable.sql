-- =====================================================
-- MIGRACIÓN 048: HACER client_id NULLABLE EN payments
-- =====================================================
-- Esta migración permite que los pagos puedan ser creados
-- sin un cliente asociado (útil para ventas de productos
-- a clientes no registrados en el sistema)

-- =====================================================
-- MODIFICAR COLUMNA client_id EN payments
-- =====================================================
-- Hacer client_id nullable para permitir pagos sin cliente
ALTER TABLE public.payments
  ALTER COLUMN client_id DROP NOT NULL;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON COLUMN public.payments.client_id IS 
  'ID del cliente asociado al pago. Puede ser NULL para ventas a clientes no registrados (ej: ventas de productos en tienda)';


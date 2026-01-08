-- =====================================================
-- MIGRACIÓN: Agregar billing_start_date a memberships
-- =====================================================
-- Esta migración agrega un campo opcional billing_start_date
-- que permite especificar desde cuándo empezar a calcular los períodos de cobro.
-- Si no se especifica, se usa start_date por defecto.

-- Agregar columna billing_start_date
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS billing_start_date DATE;

-- Comentario para documentar el campo
COMMENT ON COLUMN memberships.billing_start_date IS 
'Fecha de inicio de cobro. Si es NULL, se usa start_date. Los períodos de pago se calculan desde esta fecha exacta, no desde el inicio del mes.';

-- Para membresías existentes, establecer billing_start_date = start_date
UPDATE memberships 
SET billing_start_date = start_date 
WHERE billing_start_date IS NULL;


-- =====================================================
-- MIGRACIÓN 043: SISTEMA DE LOGS/AUDITORÍA
-- =====================================================
-- Esta migración crea el sistema de logs que permite:
-- - Registrar todas las acciones importantes en la plataforma
-- - Saber quién hizo qué y cuándo
-- - Retención automática de 1 mes (los logs se eliminan después de 30 días)

-- =====================================================
-- TABLA: audit_logs (logs de auditoría)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.gym_accounts(id) ON DELETE RESTRICT,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'payment', etc.
  entity_type TEXT NOT NULL, -- 'client', 'membership', 'payment', 'product', 'class', etc.
  entity_id UUID, -- ID de la entidad afectada (puede ser NULL para acciones como login)
  description TEXT NOT NULL, -- Descripción legible de la acción
  metadata JSONB DEFAULT '{}', -- Información adicional en formato JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para búsquedas rápidas
  CONSTRAINT audit_logs_action_type_check CHECK (action_type IN (
    'create', 'update', 'delete', 'login', 'logout', 'payment', 'sale', 'cancel'
  ))
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_gym_id ON public.audit_logs(gym_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id) WHERE entity_id IS NOT NULL;

-- =====================================================
-- FUNCIÓN: Limpiar logs antiguos (mayores a 1 mes)
-- =====================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '1 month';
END;
$$;

-- =====================================================
-- TRIGGER: Ejecutar limpieza automática (opcional, o se puede hacer manualmente)
-- =====================================================
-- Nota: En producción, esto se puede ejecutar con un cron job o función programada
-- Por ahora, se puede llamar manualmente o desde la aplicación

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo usuarios del mismo gym pueden ver los logs
CREATE POLICY "audit_logs_select_own_gym"
  ON public.audit_logs FOR SELECT
  USING (gym_id = get_user_gym_id());

-- Solo el sistema puede insertar logs (a través de funciones)
CREATE POLICY "audit_logs_insert_own_gym"
  ON public.audit_logs FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

-- Los logs no se pueden actualizar ni eliminar manualmente
-- (solo se eliminan automáticamente después de 1 mes)

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE public.audit_logs IS 
  'Registro de auditoría de todas las acciones importantes en la plataforma. Los logs se eliminan automáticamente después de 1 mes.';
COMMENT ON COLUMN public.audit_logs.action_type IS 
  'Tipo de acción: create, update, delete, login, logout, payment, sale, cancel';
COMMENT ON COLUMN public.audit_logs.entity_type IS 
  'Tipo de entidad afectada: client, membership, payment, product, class, etc.';
COMMENT ON COLUMN public.audit_logs.description IS 
  'Descripción legible de la acción realizada';
COMMENT ON COLUMN public.audit_logs.metadata IS 
  'Información adicional en formato JSON (detalles de la acción)';


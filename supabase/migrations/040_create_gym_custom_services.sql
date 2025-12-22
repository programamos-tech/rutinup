-- =====================================================
-- MIGRACIÓN 040: CREAR TABLA GYM_CUSTOM_SERVICES
-- =====================================================
-- Esta migración crea una tabla para almacenar servicios
-- personalizados que cada gym puede crear y reutilizar
-- en sus planes de membresía.

-- =====================================================
-- CREAR TABLA GYM_CUSTOM_SERVICES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gym_custom_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un gym no puede tener dos servicios con el mismo nombre
  UNIQUE(gym_id, name)
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_gym_custom_services_gym_id 
  ON public.gym_custom_services(gym_id);

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_gym_custom_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gym_custom_services_updated_at
  BEFORE UPDATE ON public.gym_custom_services
  FOR EACH ROW
  EXECUTE FUNCTION update_gym_custom_services_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.gym_custom_services ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver servicios de su gym
CREATE POLICY "gym_custom_services_select_own_gym"
  ON public.gym_custom_services
  FOR SELECT
  USING (gym_id = get_user_gym_id());

-- Política: Los usuarios solo pueden insertar servicios para su gym
CREATE POLICY "gym_custom_services_insert_own_gym"
  ON public.gym_custom_services
  FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

-- Política: Los usuarios solo pueden actualizar servicios de su gym
CREATE POLICY "gym_custom_services_update_own_gym"
  ON public.gym_custom_services
  FOR UPDATE
  USING (gym_id = get_user_gym_id())
  WITH CHECK (gym_id = get_user_gym_id());

-- Política: Los usuarios solo pueden eliminar servicios de su gym
CREATE POLICY "gym_custom_services_delete_own_gym"
  ON public.gym_custom_services
  FOR DELETE
  USING (gym_id = get_user_gym_id());

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE public.gym_custom_services IS 
  'Servicios personalizados que cada gym puede crear y reutilizar en sus planes de membresía';
COMMENT ON COLUMN public.gym_custom_services.gym_id IS 
  'ID del gym al que pertenece este servicio personalizado';
COMMENT ON COLUMN public.gym_custom_services.name IS 
  'Nombre del servicio personalizado (único por gym)';






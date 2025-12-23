-- =====================================================
-- MIGRACIÓN 049: AGREGAR SOPORTE PARA MEMBRESÍAS GRUPALES
-- =====================================================
-- Permite crear planes grupales (duo, trio, etc.) donde múltiples clientes
-- pueden compartir una membresía con un precio fijo

-- 1. Agregar campo max_capacity a membership_types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'membership_types' 
    AND column_name = 'max_capacity'
  ) THEN
    ALTER TABLE public.membership_types 
    ADD COLUMN max_capacity INTEGER DEFAULT NULL;
    
    COMMENT ON COLUMN public.membership_types.max_capacity IS 
      'Capacidad máxima de clientes para este plan. NULL = membresía individual (1 cliente). 2 = duo, 3 = trio, etc.';
  END IF;
END $$;

-- 2. Hacer client_id nullable en memberships (para membresías grupales)
-- La membresía puede no tener un client_id directo si es grupal
DO $$
BEGIN
  ALTER TABLE public.memberships 
  ALTER COLUMN client_id DROP NOT NULL;
  
  COMMENT ON COLUMN public.memberships.client_id IS 
    'ID del cliente principal (opcional). Para membresías grupales, los clientes se relacionan a través de membership_clients';
END $$;

-- 3. Crear tabla membership_clients para relación muchos-a-muchos
CREATE TABLE IF NOT EXISTS membership_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(membership_id, client_id)
);

COMMENT ON TABLE membership_clients IS 
  'Relación muchos-a-muchos entre membresías y clientes. Permite que múltiples clientes compartan una membresía grupal.';

CREATE INDEX IF NOT EXISTS idx_membership_clients_membership_id ON membership_clients(membership_id);
CREATE INDEX IF NOT EXISTS idx_membership_clients_client_id ON membership_clients(client_id);

-- 4. Agregar constraint para validar capacidad máxima
-- Una membresía no puede tener más clientes asociados que el max_capacity del plan
CREATE OR REPLACE FUNCTION check_membership_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_max_capacity INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Obtener max_capacity del plan
  SELECT mt.max_capacity INTO v_max_capacity
  FROM memberships m
  JOIN membership_types mt ON m.membership_type_id = mt.id
  WHERE m.id = NEW.membership_id;
  
  -- Si max_capacity es NULL, es membresía individual (solo 1 cliente permitido)
  IF v_max_capacity IS NULL THEN
    v_max_capacity := 1;
  END IF;
  
  -- Contar clientes actuales en esta membresía
  SELECT COUNT(*) INTO v_current_count
  FROM membership_clients
  WHERE membership_id = NEW.membership_id;
  
  -- Validar que no se exceda la capacidad
  IF v_current_count >= v_max_capacity THEN
    RAISE EXCEPTION 'La membresía ya alcanzó su capacidad máxima de % cliente(s)', v_max_capacity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_membership_capacity
  BEFORE INSERT ON membership_clients
  FOR EACH ROW
  EXECUTE FUNCTION check_membership_capacity();

-- 5. Agregar trigger para actualizar updated_at (solo si la función existe)
-- Nota: La función update_updated_at_column puede no existir, así que la omitimos por ahora
-- CREATE TRIGGER trigger_update_membership_clients_updated_at 
--   BEFORE UPDATE ON membership_clients 
--   FOR EACH ROW 
--   EXECUTE FUNCTION update_updated_at_column();

-- 6. Habilitar RLS en membership_clients
ALTER TABLE membership_clients ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS para membership_clients
CREATE POLICY "membership_clients_select_own_gym" 
  ON membership_clients 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.id = membership_clients.membership_id
      AND m.gym_id = get_user_gym_id()
    )
  );

CREATE POLICY "membership_clients_insert_own_gym" 
  ON membership_clients 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.id = membership_clients.membership_id
      AND m.gym_id = get_user_gym_id()
    )
  );

CREATE POLICY "membership_clients_update_own_gym" 
  ON membership_clients 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.id = membership_clients.membership_id
      AND m.gym_id = get_user_gym_id()
    )
  );

CREATE POLICY "membership_clients_delete_own_gym" 
  ON membership_clients 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.id = membership_clients.membership_id
      AND m.gym_id = get_user_gym_id()
    )
  );


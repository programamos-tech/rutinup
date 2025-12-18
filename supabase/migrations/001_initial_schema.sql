-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: gyms
-- ============================================
CREATE TABLE IF NOT EXISTS gyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  opening_time TIME,
  closing_time TIME,
  timezone TEXT DEFAULT 'America/Bogota',
  logo_url TEXT,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: users (extiende auth.users de Supabase)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'receptionist', 'trainer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, gym_id)
);

-- ============================================
-- TABLA: clients (miembros)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document_id TEXT,
  birth_date DATE,
  address TEXT,
  photo_url TEXT,
  notes TEXT,
  initial_weight DECIMAL(5,2),
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: membership_types (planes)
-- ============================================
CREATE TABLE IF NOT EXISTS membership_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  description TEXT,
  
  -- Servicios incluidos (JSONB para flexibilidad)
  includes JSONB DEFAULT '{}',
  
  -- Restricciones
  restrictions JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: memberships
-- ============================================
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  membership_type_id UUID NOT NULL REFERENCES membership_types(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: payments
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'transfer', 'other')),
  payment_date DATE NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: trainers
-- ============================================
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specialization TEXT,
  bio TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: classes
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  days_of_week INTEGER[] NOT NULL, -- [1,2,3,4,5] para Lunes-Viernes
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL, -- en minutos
  capacity INTEGER NOT NULL,
  requires_membership BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#ef4444',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: class_enrollments
-- ============================================
CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, client_id)
);

-- ============================================
-- TABLA: attendances
-- ============================================
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  present BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, client_id, attendance_date)
);

-- ============================================
-- TABLA: medical_records
-- ============================================
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  condition TEXT NOT NULL,
  description TEXT,
  restrictions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: communications
-- ============================================
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'sms', 'call')),
  subject TEXT,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

-- ============================================
-- TABLA: weight_records
-- ============================================
CREATE TABLE IF NOT EXISTS weight_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  recorded_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: goals
-- ============================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_weight DECIMAL(5,2),
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_gym_id ON users(gym_id);
CREATE INDEX IF NOT EXISTS idx_clients_gym_id ON clients(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_types_gym_id ON membership_types(gym_id);
CREATE INDEX IF NOT EXISTS idx_memberships_gym_id ON memberships(gym_id);
CREATE INDEX IF NOT EXISTS idx_memberships_client_id ON memberships(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_gym_id ON payments(gym_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON trainers(gym_id);
CREATE INDEX IF NOT EXISTS idx_classes_gym_id ON classes(gym_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_gym_id ON class_enrollments(gym_id);
CREATE INDEX IF NOT EXISTS idx_attendances_gym_id ON attendances(gym_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_gym_id ON medical_records(gym_id);
CREATE INDEX IF NOT EXISTS idx_communications_gym_id ON communications(gym_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_gym_id ON weight_records(gym_id);
CREATE INDEX IF NOT EXISTS idx_goals_gym_id ON goals(gym_id);

-- ============================================
-- FUNCIONES para updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON gyms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_membership_types_updated_at BEFORE UPDATE ON membership_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON trainers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


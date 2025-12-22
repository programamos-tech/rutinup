-- =====================================================
-- ESQUEMA CONSOLIDADO PARA SUPABASE CLOUD
-- =====================================================
-- Este script contiene el estado FINAL de la base de datos
-- sin los fixes intermedios. Úsalo para crear una base de datos nueva.
--
-- ⚠️ IMPORTANTE: Este script reemplaza todas las migraciones individuales.
-- Si ya tienes una base de datos con migraciones aplicadas, NO uses este script.
-- Este script es SOLO para bases de datos nuevas.
--
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- FUNCIÓN: update_updated_at_column (para triggers)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLA: gyms
-- =====================================================
CREATE TABLE IF NOT EXISTS gyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
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
  onboarding_step INTEGER DEFAULT 1 CHECK (onboarding_step >= 1 AND onboarding_step <= 4),
  payment_methods JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN gyms.onboarding_step IS 'Paso actual del proceso de onboarding (1-4). 1=Información Básica, 2=Logo, 3=Métodos de Pago, 4=Primer Usuario';
COMMENT ON COLUMN gyms.payment_methods IS 'Array JSON de métodos de pago aceptados: ["cash", "transfer", "mixed"]';

-- =====================================================
-- TABLA: gym_accounts (usuarios del gym)
-- =====================================================
CREATE TABLE IF NOT EXISTS gym_accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'receptionist', 'trainer')),
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, gym_id)
);

COMMENT ON COLUMN gym_accounts.permissions IS 'Permisos por módulo del usuario. Formato: {"dashboard": true, "payments": true, "memberships": false, ...}';

-- =====================================================
-- TABLA: clients (miembros)
-- =====================================================
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

-- =====================================================
-- TABLA: membership_types (planes)
-- =====================================================
CREATE TABLE IF NOT EXISTS membership_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  description TEXT,
  includes JSONB DEFAULT '{}',
  restrictions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_suggested BOOLEAN DEFAULT false,
  suggested_template_id UUID,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN membership_types.is_suggested IS 'Indica si el plan fue creado desde una plantilla sugerida del sistema';
COMMENT ON COLUMN membership_types.suggested_template_id IS 'ID de la plantilla sugerida de la cual se originó este plan (si aplica)';

-- =====================================================
-- TABLA: memberships
-- =====================================================
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

-- =====================================================
-- TABLA: payments
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  invoice_id UUID,
  cash_closing_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'transfer', 'other', 'mixed')),
  payment_date DATE NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  is_partial BOOLEAN DEFAULT false,
  payment_month TEXT,
  split_payment JSONB DEFAULT NULL,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_payment_month_format CHECK (payment_month IS NULL OR payment_month ~ '^\d{4}-\d{2}$'),
  CONSTRAINT check_split_payment_structure CHECK (
    split_payment IS NULL OR (
      split_payment ? 'cash' AND 
      split_payment ? 'transfer' AND
      (split_payment->>'cash')::numeric >= 0 AND
      (split_payment->>'transfer')::numeric >= 0 AND
      ((split_payment->>'cash')::numeric + (split_payment->>'transfer')::numeric) > 0
    )
  )
);

COMMENT ON COLUMN payments.client_id IS 'ID del cliente asociado al pago. Puede ser NULL para ventas a clientes no registrados (ej: ventas de productos en tienda)';
COMMENT ON COLUMN payments.is_partial IS 'Indica si el pago es un abono parcial (true) o un pago completo (false)';
COMMENT ON COLUMN payments.payment_month IS 'Mes que cubre el pago en formato YYYY-MM (ej: 2024-01)';
COMMENT ON COLUMN payments.split_payment IS 'Para pagos mixtos: {"cash": 50000, "transfer": 50000}. Si es NULL, el pago usa el método único en "method"';

-- =====================================================
-- TABLA: trainers
-- =====================================================
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

-- =====================================================
-- TABLA: classes
-- =====================================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  days_of_week INTEGER[] NOT NULL,
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  requires_membership BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#ef4444',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: class_enrollments
-- =====================================================
CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, client_id)
);

-- =====================================================
-- TABLA: attendances
-- =====================================================
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

-- =====================================================
-- TABLA: medical_records
-- =====================================================
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

-- =====================================================
-- TABLA: communications
-- =====================================================
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

-- =====================================================
-- TABLA: weight_records
-- =====================================================
CREATE TABLE IF NOT EXISTS weight_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  recorded_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: goals
-- =====================================================
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

-- =====================================================
-- TABLA: products
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  sku TEXT,
  stock INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_id, sku)
);

-- =====================================================
-- TABLA: invoices
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
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
-- TABLA: invoice_items
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('membership', 'product', 'class', 'service', 'other')),
  item_id UUID,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: audit_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES gym_accounts(id) ON DELETE RESTRICT,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT audit_logs_action_type_check CHECK (action_type IN (
    'create', 'update', 'delete', 'login', 'logout', 'payment', 'sale', 'cancel', 'Asignación'
  ))
);

-- =====================================================
-- TABLA: cash_closings
-- =====================================================
CREATE TABLE IF NOT EXISTS cash_closings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES gym_accounts(id) ON DELETE RESTRICT,
  opening_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closing_time TIMESTAMPTZ,
  opening_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
  closing_cash DECIMAL(10,2),
  total_cash_received DECIMAL(10,2) DEFAULT 0,
  total_transfer_received DECIMAL(10,2) DEFAULT 0,
  total_received DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: suggested_plan_templates
-- =====================================================
CREATE TABLE IF NOT EXISTS suggested_plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  description TEXT,
  includes JSONB DEFAULT '{}',
  restrictions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: gym_custom_services
-- =====================================================
CREATE TABLE IF NOT EXISTS gym_custom_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_id, name)
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_gym_accounts_gym_id ON gym_accounts(gym_id);
CREATE INDEX IF NOT EXISTS idx_clients_gym_id ON clients(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_types_gym_id ON membership_types(gym_id);
CREATE INDEX IF NOT EXISTS idx_memberships_gym_id ON memberships(gym_id);
CREATE INDEX IF NOT EXISTS idx_memberships_client_id ON memberships(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_gym_id ON payments(gym_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_month ON payments(payment_month);
CREATE INDEX IF NOT EXISTS idx_payments_is_partial ON payments(is_partial);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_cash_closing_id ON payments(cash_closing_id);
CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON trainers(gym_id);
CREATE INDEX IF NOT EXISTS idx_classes_gym_id ON classes(gym_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_gym_id ON class_enrollments(gym_id);
CREATE INDEX IF NOT EXISTS idx_attendances_gym_id ON attendances(gym_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_gym_id ON medical_records(gym_id);
CREATE INDEX IF NOT EXISTS idx_communications_gym_id ON communications(gym_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_gym_id ON weight_records(gym_id);
CREATE INDEX IF NOT EXISTS idx_goals_gym_id ON goals(gym_id);
CREATE INDEX IF NOT EXISTS idx_products_gym_id ON products(gym_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_invoices_gym_id ON invoices(gym_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_item_type ON invoice_items(item_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_gym_id ON audit_logs(gym_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cash_closings_gym_id ON cash_closings(gym_id);
CREATE INDEX IF NOT EXISTS idx_cash_closings_user_id ON cash_closings(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_closings_status ON cash_closings(status);
CREATE INDEX IF NOT EXISTS idx_cash_closings_opening_time ON cash_closings(opening_time);
CREATE INDEX IF NOT EXISTS idx_cash_closings_closing_time ON cash_closings(closing_time);
CREATE INDEX IF NOT EXISTS idx_suggested_plan_templates_active ON suggested_plan_templates(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_gym_custom_services_gym_id ON gym_custom_services(gym_id);

-- =====================================================
-- TRIGGERS PARA updated_at
-- =====================================================
CREATE TRIGGER trigger_update_gyms_updated_at BEFORE UPDATE ON gyms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_gym_accounts_updated_at BEFORE UPDATE ON gym_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_membership_types_updated_at BEFORE UPDATE ON membership_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_trainers_updated_at BEFORE UPDATE ON trainers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_cash_closings_updated_at BEFORE UPDATE ON cash_closings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_suggested_plan_templates_updated_at BEFORE UPDATE ON suggested_plan_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_gym_custom_services_updated_at BEFORE UPDATE ON gym_custom_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función: get_user_gym_id
CREATE OR REPLACE FUNCTION get_user_gym_id()
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT gym_id FROM gym_accounts WHERE id = auth.uid();
$$;

-- Función: handle_new_auth_user (trigger para registro)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gym_id UUID;
  v_gym_name TEXT;
  v_city TEXT;
  v_whatsapp TEXT;
  v_admin_name TEXT;
  v_email TEXT;
  v_role TEXT;
  v_permissions JSONB;
BEGIN
  v_email := COALESCE(NEW.email, '');
  IF v_email = '' THEN
    v_email := 'user@example.com';
  END IF;

  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_gym_name := NEW.raw_user_meta_data->>'gym_name';
    v_city := NEW.raw_user_meta_data->>'city';
    v_whatsapp := NEW.raw_user_meta_data->>'whatsapp';
    v_admin_name := COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', '')
    );
    v_role := NEW.raw_user_meta_data->>'role';
    IF NEW.raw_user_meta_data ? 'gym_id' THEN
      v_gym_id := (NEW.raw_user_meta_data->>'gym_id')::UUID;
    END IF;
    IF NEW.raw_user_meta_data ? 'permissions' THEN
      v_permissions := NEW.raw_user_meta_data->'permissions';
    END IF;
  END IF;

  -- CASO 1: Usuario creado por admin (tiene gym_id en metadatos)
  IF v_gym_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.gym_accounts (id, gym_id, email, name, role, permissions)
      VALUES (
        NEW.id,
        v_gym_id,
        v_email,
        COALESCE(NULLIF(TRIM(v_admin_name), ''), 'Usuario'),
        COALESCE(NULLIF(v_role, ''), 'receptionist'),
        COALESCE(v_permissions, '{}'::jsonb)
      )
      ON CONFLICT (id) DO UPDATE SET
        gym_id = EXCLUDED.gym_id,
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, gym_accounts.name),
        role = COALESCE(EXCLUDED.role, gym_accounts.role),
        permissions = COALESCE(EXCLUDED.permissions, gym_accounts.permissions);
      
      RETURN NEW;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error al crear perfil de usuario creado por admin: %', SQLERRM;
        RETURN NEW;
    END;
  END IF;

  -- CASO 2: Registro inicial (tiene gym_name en metadatos)
  IF v_gym_name IS NULL OR TRIM(v_gym_name) = '' THEN
    RAISE WARNING 'Usuario creado sin gym_name ni gym_id. No se creará perfil en gym_accounts.';
    RETURN NEW;
  END IF;

  IF LENGTH(v_gym_name) > 100 THEN
    RAISE EXCEPTION 'El nombre del gimnasio no puede exceder 100 caracteres';
  END IF;

  IF v_city IS NULL OR TRIM(v_city) = '' THEN
    RAISE EXCEPTION 'city es requerido en los metadatos del usuario';
  END IF;

  v_city := TRIM(v_city);
  
  IF LENGTH(v_city) > 50 THEN
    RAISE EXCEPTION 'La ciudad no puede exceder 50 caracteres';
  END IF;
  
  IF v_city NOT IN ('Sincelejo', 'Montería') THEN
    RAISE EXCEPTION 'La ciudad debe ser Sincelejo o Montería. Valor recibido: %', v_city;
  END IF;

  IF v_whatsapp IS NULL OR TRIM(v_whatsapp) = '' THEN
    RAISE EXCEPTION 'whatsapp es requerido en los metadatos del usuario';
  END IF;

  IF LENGTH(v_whatsapp) > 20 THEN
    RAISE EXCEPTION 'El WhatsApp no puede exceder 20 caracteres';
  END IF;

  v_admin_name := COALESCE(NULLIF(TRIM(v_admin_name), ''), 'Administrador');

  IF LENGTH(v_admin_name) > 100 THEN
    RAISE EXCEPTION 'El nombre del administrador no puede exceder 100 caracteres';
  END IF;

  IF LENGTH(v_email) > 254 THEN
    RAISE EXCEPTION 'El email no puede exceder 254 caracteres';
  END IF;

  -- 1. CREAR EL GIMNASIO
  BEGIN
    INSERT INTO public.gyms (name, email, city, phone, status)
    VALUES (v_gym_name, v_email, v_city, v_whatsapp, 'active')
    RETURNING id INTO v_gym_id;

    IF v_gym_id IS NULL THEN
      RAISE EXCEPTION 'No se pudo crear el gimnasio';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Error al crear el gimnasio: %', SQLERRM;
  END;

  -- 2. CREAR EL PERFIL EN GYM_ACCOUNTS
  BEGIN
    INSERT INTO public.gym_accounts (id, gym_id, email, name, role)
    VALUES (
      NEW.id,
      v_gym_id,
      v_email,
      v_admin_name,
      'admin'
    )
    ON CONFLICT (id) DO UPDATE SET
      gym_id = EXCLUDED.gym_id,
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, gym_accounts.name);
  EXCEPTION
    WHEN OTHERS THEN
      BEGIN
        DELETE FROM public.gyms WHERE id = v_gym_id;
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
      RAISE EXCEPTION 'Error al crear el perfil: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Trigger para handle_new_auth_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Función: generate_invoice_number
CREATE OR REPLACE FUNCTION generate_invoice_number(gym_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_number
  FROM public.invoices
  WHERE gym_id = gym_uuid;
  
  invoice_num := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Función: auto_generate_invoice_number
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

-- Función: calculate_invoice_totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  invoice_subtotal DECIMAL(10,2);
  invoice_total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(total), 0) INTO invoice_subtotal
  FROM public.invoice_items
  WHERE invoice_id = NEW.invoice_id;
  
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

-- Función: get_open_cash_closing
CREATE OR REPLACE FUNCTION get_open_cash_closing(gym_uuid UUID, user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  closing_id UUID;
BEGIN
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

-- Función: calculate_cash_closing_totals
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

-- Función: cleanup_old_audit_logs
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
-- DATOS INICIALES: Plantillas sugeridas
-- =====================================================
INSERT INTO suggested_plan_templates (name, price, duration_days, description, includes, restrictions, is_active, is_featured, sort_order)
VALUES
  (
    'Solo Pesas',
    60000,
    30,
    'Acceso completo a área de pesas y máquinas',
    '{"freeWeights": true, "machines": true, "groupClasses": false, "personalTrainer": false, "cardio": true, "functional": false, "locker": true, "supplements": false}'::jsonb,
    '{}'::jsonb,
    true,
    false,
    1
  ),
  (
    'Solo Clases',
    70000,
    30,
    'Acceso a todas las clases grupales',
    '{"freeWeights": false, "machines": false, "groupClasses": true, "groupClassesCount": 12, "personalTrainer": false, "cardio": false, "functional": true, "locker": true, "supplements": false}'::jsonb,
    '{}'::jsonb,
    true,
    false,
    2
  ),
  (
    'Plan Completo',
    100000,
    30,
    'Acceso completo a todas las instalaciones y clases',
    '{"freeWeights": true, "machines": true, "groupClasses": true, "groupClassesCount": 12, "personalTrainer": false, "cardio": true, "functional": true, "locker": true, "supplements": false}'::jsonb,
    '{}'::jsonb,
    true,
    true,
    3
  ),
  (
    'Plan Premium',
    150000,
    30,
    'Todo incluido + entrenador personal',
    '{"freeWeights": true, "machines": true, "groupClasses": true, "groupClassesCount": 16, "personalTrainer": true, "personalTrainerSessions": 4, "cardio": true, "functional": true, "locker": true, "supplements": true}'::jsonb,
    '{}'::jsonb,
    true,
    true,
    4
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggested_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_custom_services ENABLE ROW LEVEL SECURITY;

-- Políticas para gyms
CREATE POLICY "gyms_select_own" ON gyms FOR SELECT USING (id = get_user_gym_id());
CREATE POLICY "gyms_update_own" ON gyms FOR UPDATE USING (id = get_user_gym_id());
CREATE POLICY "gyms_insert_during_registration" ON gyms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas para gym_accounts
CREATE POLICY "gym_accounts_select_own" ON gym_accounts FOR SELECT USING (id = auth.uid());
CREATE POLICY "gym_accounts_select_same_gym" ON gym_accounts FOR SELECT USING (
  id != auth.uid() AND gym_id = get_user_gym_id()
);
CREATE POLICY "gym_accounts_update_own" ON gym_accounts FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "gym_accounts_update_same_gym_admin" ON gym_accounts FOR UPDATE USING (
  id != auth.uid() AND
  gym_id = get_user_gym_id() AND
  EXISTS (SELECT 1 FROM public.gym_accounts WHERE id = auth.uid() AND role = 'admin' AND gym_id = get_user_gym_id())
) WITH CHECK (gym_id = get_user_gym_id());

-- Políticas para clients
CREATE POLICY "clients_select_own_gym" ON clients FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "clients_insert_own_gym" ON clients FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "clients_update_own_gym" ON clients FOR UPDATE USING (gym_id = get_user_gym_id());
CREATE POLICY "clients_delete_own_gym" ON clients FOR DELETE USING (gym_id = get_user_gym_id());

-- Políticas para membership_types
CREATE POLICY "membership_types_select_own_gym" ON membership_types FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "membership_types_insert_own_gym" ON membership_types FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "membership_types_update_own_gym" ON membership_types FOR UPDATE USING (gym_id = get_user_gym_id());
CREATE POLICY "membership_types_delete_own_gym" ON membership_types FOR DELETE USING (gym_id = get_user_gym_id());

-- Políticas para memberships
CREATE POLICY "memberships_select_own_gym" ON memberships FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "memberships_insert_own_gym" ON memberships FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "memberships_update_own_gym" ON memberships FOR UPDATE USING (gym_id = get_user_gym_id());
CREATE POLICY "memberships_delete_own_gym" ON memberships FOR DELETE USING (gym_id = get_user_gym_id());

-- Políticas para payments
CREATE POLICY "payments_select_own_gym" ON payments FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "payments_insert_own_gym" ON payments FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "payments_update_own_gym" ON payments FOR UPDATE USING (gym_id = get_user_gym_id());

-- Políticas para trainers
CREATE POLICY "trainers_select_own_gym" ON trainers FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "trainers_insert_own_gym" ON trainers FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "trainers_update_own_gym" ON trainers FOR UPDATE USING (gym_id = get_user_gym_id());
CREATE POLICY "trainers_delete_own_gym" ON trainers FOR DELETE USING (gym_id = get_user_gym_id());

-- Políticas para classes
CREATE POLICY "classes_select_own_gym" ON classes FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "classes_insert_own_gym" ON classes FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "classes_update_own_gym" ON classes FOR UPDATE USING (gym_id = get_user_gym_id());
CREATE POLICY "classes_delete_own_gym" ON classes FOR DELETE USING (gym_id = get_user_gym_id());

-- Políticas para class_enrollments
CREATE POLICY "class_enrollments_select_own_gym" ON class_enrollments FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "class_enrollments_insert_own_gym" ON class_enrollments FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "class_enrollments_delete_own_gym" ON class_enrollments FOR DELETE USING (gym_id = get_user_gym_id());

-- Políticas para attendances
CREATE POLICY "attendances_select_own_gym" ON attendances FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "attendances_insert_own_gym" ON attendances FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "attendances_update_own_gym" ON attendances FOR UPDATE USING (gym_id = get_user_gym_id());

-- Políticas para medical_records
CREATE POLICY "medical_records_select_own_gym" ON medical_records FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "medical_records_insert_own_gym" ON medical_records FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "medical_records_update_own_gym" ON medical_records FOR UPDATE USING (gym_id = get_user_gym_id());
CREATE POLICY "medical_records_delete_own_gym" ON medical_records FOR DELETE USING (gym_id = get_user_gym_id());

-- Políticas para communications
CREATE POLICY "communications_select_own_gym" ON communications FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "communications_insert_own_gym" ON communications FOR INSERT WITH CHECK (gym_id = get_user_gym_id());

-- Políticas para weight_records
CREATE POLICY "weight_records_select_own_gym" ON weight_records FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "weight_records_insert_own_gym" ON weight_records FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "weight_records_update_own_gym" ON weight_records FOR UPDATE USING (gym_id = get_user_gym_id());
CREATE POLICY "weight_records_delete_own_gym" ON weight_records FOR DELETE USING (gym_id = get_user_gym_id());

-- Políticas para goals
CREATE POLICY "goals_select_own_gym" ON goals FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "goals_insert_own_gym" ON goals FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "goals_update_own_gym" ON goals FOR UPDATE USING (gym_id = get_user_gym_id());
CREATE POLICY "goals_delete_own_gym" ON goals FOR DELETE USING (gym_id = get_user_gym_id());

-- Políticas para products
CREATE POLICY "products_select_own_gym" ON products FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "products_insert_own_gym" ON products FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "products_update_own_gym" ON products FOR UPDATE USING (gym_id = get_user_gym_id());
CREATE POLICY "products_delete_own_gym" ON products FOR DELETE USING (gym_id = get_user_gym_id());

-- Políticas para invoices
CREATE POLICY "invoices_select_own_gym" ON invoices FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "invoices_insert_own_gym" ON invoices FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "invoices_update_own_gym" ON invoices FOR UPDATE USING (gym_id = get_user_gym_id());
CREATE POLICY "invoices_delete_own_gym" ON invoices FOR DELETE USING (gym_id = get_user_gym_id());

-- Políticas para invoice_items
CREATE POLICY "invoice_items_select_own_gym" ON invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.gym_id = get_user_gym_id())
);
CREATE POLICY "invoice_items_insert_own_gym" ON invoice_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.gym_id = get_user_gym_id())
);
CREATE POLICY "invoice_items_update_own_gym" ON invoice_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.gym_id = get_user_gym_id())
);
CREATE POLICY "invoice_items_delete_own_gym" ON invoice_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.gym_id = get_user_gym_id())
);

-- Políticas para audit_logs
CREATE POLICY "audit_logs_select_own_gym" ON audit_logs FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "audit_logs_insert_own_gym" ON audit_logs FOR INSERT WITH CHECK (gym_id = get_user_gym_id());

-- Políticas para cash_closings
CREATE POLICY "cash_closings_select_own_gym" ON cash_closings FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "cash_closings_insert_own_gym" ON cash_closings FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "cash_closings_update_own_gym" ON cash_closings FOR UPDATE USING (gym_id = get_user_gym_id());
CREATE POLICY "cash_closings_delete_own_gym" ON cash_closings FOR DELETE USING (gym_id = get_user_gym_id());

-- Políticas para suggested_plan_templates
CREATE POLICY "suggested_templates_select_active" ON suggested_plan_templates FOR SELECT TO authenticated USING (is_active = true);

-- Políticas para gym_custom_services
CREATE POLICY "gym_custom_services_select_own_gym" ON gym_custom_services FOR SELECT USING (gym_id = get_user_gym_id());
CREATE POLICY "gym_custom_services_insert_own_gym" ON gym_custom_services FOR INSERT WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "gym_custom_services_update_own_gym" ON gym_custom_services FOR UPDATE USING (gym_id = get_user_gym_id()) WITH CHECK (gym_id = get_user_gym_id());
CREATE POLICY "gym_custom_services_delete_own_gym" ON gym_custom_services FOR DELETE USING (gym_id = get_user_gym_id());

-- =====================================================
-- FIN DEL ESQUEMA CONSOLIDADO
-- =====================================================

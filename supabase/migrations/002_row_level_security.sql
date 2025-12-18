-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
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

-- ============================================
-- FUNCIÓN HELPER: obtener gym_id del usuario actual
-- ============================================
CREATE OR REPLACE FUNCTION get_user_gym_id()
RETURNS UUID AS $$
  SELECT gym_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- POLÍTICAS: gyms
-- ============================================
-- Los usuarios solo pueden ver su propio gimnasio
CREATE POLICY "Users can view their own gym"
  ON gyms FOR SELECT
  USING (id = get_user_gym_id());

-- Los usuarios pueden actualizar su propio gimnasio
CREATE POLICY "Users can update their own gym"
  ON gyms FOR UPDATE
  USING (id = get_user_gym_id());

-- Permitir inserción durante el registro: usuarios autenticados pueden crear un gym
-- Esto es necesario porque durante el registro aún no tienen gym_id
CREATE POLICY "Allow gym creation during registration"
  ON gyms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- POLÍTICAS: users
-- ============================================
-- Los usuarios pueden ver otros usuarios de su gimnasio
CREATE POLICY "Users can view users from their gym"
  ON users FOR SELECT
  USING (gym_id = get_user_gym_id());

-- Los admins pueden insertar usuarios en su gimnasio
CREATE POLICY "Admins can insert users in their gym"
  ON users FOR INSERT
  WITH CHECK (
    gym_id = get_user_gym_id() AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Los admins pueden actualizar usuarios de su gimnasio
CREATE POLICY "Admins can update users in their gym"
  ON users FOR UPDATE
  USING (
    gym_id = get_user_gym_id() AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================
-- POLÍTICAS: clients
-- ============================================
CREATE POLICY "Users can view clients from their gym"
  ON clients FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert clients in their gym"
  ON clients FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update clients in their gym"
  ON clients FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete clients in their gym"
  ON clients FOR DELETE
  USING (gym_id = get_user_gym_id());

-- ============================================
-- POLÍTICAS: membership_types
-- ============================================
CREATE POLICY "Users can view membership types from their gym"
  ON membership_types FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert membership types in their gym"
  ON membership_types FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update membership types in their gym"
  ON membership_types FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete membership types in their gym"
  ON membership_types FOR DELETE
  USING (gym_id = get_user_gym_id());

-- ============================================
-- POLÍTICAS: memberships
-- ============================================
CREATE POLICY "Users can view memberships from their gym"
  ON memberships FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert memberships in their gym"
  ON memberships FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update memberships in their gym"
  ON memberships FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete memberships in their gym"
  ON memberships FOR DELETE
  USING (gym_id = get_user_gym_id());

-- ============================================
-- POLÍTICAS: payments
-- ============================================
CREATE POLICY "Users can view payments from their gym"
  ON payments FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert payments in their gym"
  ON payments FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update payments in their gym"
  ON payments FOR UPDATE
  USING (gym_id = get_user_gym_id());

-- ============================================
-- POLÍTICAS: trainers
-- ============================================
CREATE POLICY "Users can view trainers from their gym"
  ON trainers FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert trainers in their gym"
  ON trainers FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update trainers in their gym"
  ON trainers FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete trainers in their gym"
  ON trainers FOR DELETE
  USING (gym_id = get_user_gym_id());

-- ============================================
-- POLÍTICAS: classes
-- ============================================
CREATE POLICY "Users can view classes from their gym"
  ON classes FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert classes in their gym"
  ON classes FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update classes in their gym"
  ON classes FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete classes in their gym"
  ON classes FOR DELETE
  USING (gym_id = get_user_gym_id());

-- ============================================
-- POLÍTICAS: class_enrollments
-- ============================================
CREATE POLICY "Users can view enrollments from their gym"
  ON class_enrollments FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert enrollments in their gym"
  ON class_enrollments FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete enrollments in their gym"
  ON class_enrollments FOR DELETE
  USING (gym_id = get_user_gym_id());

-- ============================================
-- POLÍTICAS: attendances
-- ============================================
CREATE POLICY "Users can view attendances from their gym"
  ON attendances FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert attendances in their gym"
  ON attendances FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update attendances in their gym"
  ON attendances FOR UPDATE
  USING (gym_id = get_user_gym_id());

-- ============================================
-- POLÍTICAS: medical_records
-- ============================================
CREATE POLICY "Users can view medical records from their gym"
  ON medical_records FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert medical records in their gym"
  ON medical_records FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update medical records in their gym"
  ON medical_records FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete medical records in their gym"
  ON medical_records FOR DELETE
  USING (gym_id = get_user_gym_id());

-- ============================================
-- POLÍTICAS: communications
-- ============================================
CREATE POLICY "Users can view communications from their gym"
  ON communications FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert communications in their gym"
  ON communications FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

-- ============================================
-- POLÍTICAS: weight_records
-- ============================================
CREATE POLICY "Users can view weight records from their gym"
  ON weight_records FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert weight records in their gym"
  ON weight_records FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update weight records in their gym"
  ON weight_records FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete weight records in their gym"
  ON weight_records FOR DELETE
  USING (gym_id = get_user_gym_id());

-- ============================================
-- POLÍTICAS: goals
-- ============================================
CREATE POLICY "Users can view goals from their gym"
  ON goals FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert goals in their gym"
  ON goals FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update goals in their gym"
  ON goals FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete goals in their gym"
  ON goals FOR DELETE
  USING (gym_id = get_user_gym_id());


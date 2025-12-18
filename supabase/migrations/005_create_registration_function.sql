-- Función para crear gym y user profile durante el registro
-- Esta función se ejecuta con SECURITY DEFINER, por lo que puede crear el gym
-- sin depender de RLS, ya que se ejecuta con permisos de superusuario

CREATE OR REPLACE FUNCTION create_gym_and_user(
  p_user_id UUID,
  p_gym_name TEXT,
  p_user_email TEXT,
  p_user_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_gym_id UUID;
  v_result JSONB;
  v_error_detail TEXT;
BEGIN
  -- Validar que el usuario existe en auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El usuario no existe en auth.users'
    );
  END IF;

  -- 1. Crear el gym
  -- Con SECURITY DEFINER, podemos insertar directamente sin problemas de RLS
  BEGIN
    INSERT INTO gyms (name, email, status)
    VALUES (p_gym_name, p_user_email, 'pending')
    RETURNING id INTO v_gym_id;
    
    -- Verificar que el gym se creó correctamente
    IF v_gym_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'No se pudo crear el gimnasio'
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_error_detail := 'Error al crear gimnasio: ' || SQLERRM;
      RETURN jsonb_build_object(
        'success', false,
        'error', v_error_detail
      );
  END;

  -- 2. Crear el user profile
  -- Con SECURITY DEFINER, esto debería funcionar sin problemas de RLS
  BEGIN
    INSERT INTO users (id, gym_id, email, name, role)
    VALUES (p_user_id, v_gym_id, p_user_email, p_user_name, 'admin');
  EXCEPTION
    WHEN OTHERS THEN
      -- Si falla la inserción del usuario, intentar eliminar el gym creado
      DELETE FROM gyms WHERE id = v_gym_id;
      v_error_detail := 'Error al crear usuario: ' || SQLERRM;
      RETURN jsonb_build_object(
        'success', false,
        'error', v_error_detail
      );
  END;

  -- 3. Crear las 3 plantillas por defecto
  -- Plantilla 1: Solo Pesas
  INSERT INTO membership_types (gym_id, name, price, duration_days, description, includes, restrictions, is_active, is_featured, sort_order)
  VALUES (
    v_gym_id,
    'Solo Pesas',
    0, -- Precio opcional, el usuario lo configurará
    30,
    'Acceso completo a área de pesas y máquinas',
    '{"freeWeights": true, "machines": true, "groupClasses": false, "personalTrainer": false, "cardio": true, "functional": false, "locker": true, "supplements": false}'::jsonb,
    '{}'::jsonb,
    true,
    false,
    1
  );

  -- Plantilla 2: Solo Clases
  INSERT INTO membership_types (gym_id, name, price, duration_days, description, includes, restrictions, is_active, is_featured, sort_order)
  VALUES (
    v_gym_id,
    'Solo Clases',
    0, -- Precio opcional, el usuario lo configurará
    30,
    'Acceso a todas las clases grupales',
    '{"freeWeights": false, "machines": false, "groupClasses": true, "groupClassesCount": 12, "personalTrainer": false, "cardio": false, "functional": true, "locker": true, "supplements": false}'::jsonb,
    '{}'::jsonb,
    true,
    false,
    2
  );

  -- Plantilla 3: Plan Completo
  INSERT INTO membership_types (gym_id, name, price, duration_days, description, includes, restrictions, is_active, is_featured, sort_order)
  VALUES (
    v_gym_id,
    'Plan Completo',
    0, -- Precio opcional, el usuario lo configurará
    30,
    'Acceso completo a todas las instalaciones y clases',
    '{"freeWeights": true, "machines": true, "groupClasses": true, "groupClassesCount": 12, "personalTrainer": false, "cardio": true, "functional": true, "locker": true, "supplements": false}'::jsonb,
    '{}'::jsonb,
    true,
    true,
    3
  );

  -- 4. Retornar el resultado
  v_result := jsonb_build_object(
    'gym_id', v_gym_id,
    'user_id', p_user_id,
    'success', true
  );

  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    v_error_detail := 'El email ya está registrado';
    RETURN jsonb_build_object(
      'success', false,
      'error', v_error_detail
    );
  WHEN foreign_key_violation THEN
    v_error_detail := 'Error de referencia: ' || SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', v_error_detail
    );
  WHEN OTHERS THEN
    -- En caso de error, hacer rollback y retornar error
    v_error_detail := SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')';
    RETURN jsonb_build_object(
      'success', false,
      'error', v_error_detail
    );
END;
$$;

-- Dar permisos para que los usuarios autenticados puedan llamar esta función
GRANT EXECUTE ON FUNCTION create_gym_and_user(UUID, TEXT, TEXT, TEXT) TO authenticated;


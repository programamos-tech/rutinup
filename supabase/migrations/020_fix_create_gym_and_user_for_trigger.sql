-- =====================================================
-- ACTUALIZAR create_gym_and_user PARA TRABAJAR CON EL TRIGGER
-- =====================================================
-- El trigger ya crea el perfil básico, así que esta función debe:
-- 1. Crear el gym
-- 2. Actualizar el perfil existente con gym_id (no insertar)
-- 3. Crear las plantillas por defecto

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
  BEGIN
    INSERT INTO gyms (name, email, status)
    VALUES (p_gym_name, p_user_email, 'pending')
    RETURNING id INTO v_gym_id;
    
    IF v_gym_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'No se pudo crear el gimnasio'
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_error_detail := 'Error al crear gimnasio: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')';
      RETURN jsonb_build_object(
        'success', false,
        'error', v_error_detail
      );
  END;

  -- 2. Actualizar el perfil existente (creado por el trigger) con gym_id
  -- El trigger ya creó el perfil básico, solo necesitamos actualizarlo
  BEGIN
    UPDATE users 
    SET 
      gym_id = v_gym_id,
      name = COALESCE(NULLIF(p_user_name, ''), name),
      email = COALESCE(NULLIF(p_user_email, ''), email),
      role = COALESCE(role, 'admin')
    WHERE id = p_user_id;
    
    -- Verificar que el perfil existe (debería existir por el trigger)
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
      -- Si por alguna razón el trigger no funcionó, crear el perfil
      INSERT INTO users (id, gym_id, email, name, role)
      VALUES (p_user_id, v_gym_id, p_user_email, p_user_name, 'admin');
    END IF;
    
    -- Actualizar la caché
    INSERT INTO user_gym_cache (user_id, gym_id, updated_at)
    VALUES (p_user_id, v_gym_id, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      gym_id = EXCLUDED.gym_id,
      updated_at = NOW();
      
  EXCEPTION
    WHEN OTHERS THEN
      -- Si falla, intentar eliminar el gym creado
      BEGIN
        DELETE FROM gyms WHERE id = v_gym_id;
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
      v_error_detail := 'Error al actualizar usuario: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')';
      RETURN jsonb_build_object(
        'success', false,
        'error', v_error_detail
      );
  END;

  -- 3. Crear las 3 plantillas por defecto
  BEGIN
    -- Plantilla 1: Solo Pesas
    INSERT INTO membership_types (gym_id, name, price, duration_days, description, includes, restrictions, is_active, is_featured, sort_order)
    VALUES (
      v_gym_id,
      'Solo Pesas',
      0,
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
      0,
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
      0,
      30,
      'Acceso completo a todas las instalaciones y clases',
      '{"freeWeights": true, "machines": true, "groupClasses": true, "groupClassesCount": 12, "personalTrainer": false, "cardio": true, "functional": true, "locker": true, "supplements": false}'::jsonb,
      '{}'::jsonb,
      true,
      true,
      3
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Si falla la creación de plantillas, no es crítico, continuar
      NULL;
  END;

  -- 4. Retornar el resultado
  v_result := jsonb_build_object(
    'success', true,
    'gym_id', v_gym_id,
    'user_id', p_user_id
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
    v_error_detail := SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')';
    RETURN jsonb_build_object(
      'success', false,
      'error', v_error_detail
    );
END;
$$;



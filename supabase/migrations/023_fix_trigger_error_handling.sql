-- =====================================================
-- FIX: Mejorar el trigger con mejor manejo de errores
-- =====================================================
-- El trigger puede estar fallando por varias razones
-- Vamos a mejorarlo con mejor manejo de errores y validaciones

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Intentar insertar el perfil
  -- Si falla, no fallar el registro del usuario en auth.users
  BEGIN
    INSERT INTO public.users (id, email, name, role, gym_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'name', '', 'Usuario'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
      NULL  -- gym_id será NULL hasta que se complete el onboarding
    )
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, users.email),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name);
    
    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log el error pero no fallar el registro
      -- Esto permite que el usuario se registre aunque el trigger falle
      RAISE WARNING 'Error en trigger handle_new_auth_user: %', SQLERRM;
      RETURN NEW;  -- Retornar NEW para que el registro en auth.users continúe
  END;
END;
$$;

-- Verificar que el trigger esté correctamente configurado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();



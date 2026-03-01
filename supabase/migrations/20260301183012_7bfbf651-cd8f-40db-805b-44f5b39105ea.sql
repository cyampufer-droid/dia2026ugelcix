
-- Update handle_new_user to validate DNI and nombre_completo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _dni text;
  _nombre text;
BEGIN
  _dni := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'dni'), ''), NULL);
  _nombre := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'nombre_completo'), ''), NULL);

  -- Require both DNI and nombre_completo
  IF _dni IS NULL OR _nombre IS NULL THEN
    RAISE EXCEPTION 'DNI and nombre_completo are required in user metadata';
  END IF;

  -- Validate DNI is exactly 8 digits
  IF _dni !~ '^\d{8}$' THEN
    RAISE EXCEPTION 'DNI must be exactly 8 digits';
  END IF;

  INSERT INTO public.profiles (user_id, dni, nombre_completo)
  VALUES (NEW.id, _dni, _nombre);

  RETURN NEW;
END;
$$;

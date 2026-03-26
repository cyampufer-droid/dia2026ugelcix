
CREATE OR REPLACE FUNCTION public.get_resultados_explorer(
  _scope text,
  _institucion_id uuid DEFAULT NULL,
  _grado_seccion_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH student_profiles AS (
    SELECT p.id, p.nombre_completo, p.dni, p.institucion_id, p.grado_seccion_id
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.user_id
    WHERE ur.role = 'estudiante'
      AND p.user_id IS NOT NULL
      AND (
        (_scope = 'global')
        OR (_scope = 'institucion' AND p.institucion_id = _institucion_id)
        OR (_scope = 'seccion' AND p.grado_seccion_id = _grado_seccion_id)
      )
  ),
  student_results AS (
    SELECT r.estudiante_id, r.evaluacion_id, r.puntaje_total, r.nivel_logro
    FROM resultados r
    WHERE r.estudiante_id IN (SELECT id FROM student_profiles)
  )
  SELECT jsonb_build_object(
    'profiles', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', sp.id,
        'nombre_completo', sp.nombre_completo,
        'dni', sp.dni,
        'institucion_id', sp.institucion_id,
        'grado_seccion_id', sp.grado_seccion_id
      ) ORDER BY sp.nombre_completo)
      FROM student_profiles sp
    ), '[]'::jsonb),
    'resultados', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'estudiante_id', sr.estudiante_id,
        'evaluacion_id', sr.evaluacion_id,
        'puntaje_total', sr.puntaje_total,
        'nivel_logro', sr.nivel_logro
      ))
      FROM student_results sr
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

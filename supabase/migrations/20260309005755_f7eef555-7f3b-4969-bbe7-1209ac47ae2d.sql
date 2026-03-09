-- Optimized function for specialist dashboard stats per district
CREATE OR REPLACE FUNCTION public.get_especialista_stats()
RETURNS TABLE (
  area TEXT,
  distrito TEXT,
  nivel_logro TEXT,
  total BIGINT
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.area,
    i.distrito,
    r.nivel_logro,
    COUNT(*) as total
  FROM public.resultados r
  JOIN public.evaluaciones e ON e.id = r.evaluacion_id
  JOIN public.profiles p ON p.id = r.estudiante_id
  JOIN public.instituciones i ON i.id = p.institucion_id
  WHERE r.nivel_logro IS NOT NULL
    AND p.institucion_id IS NOT NULL
    AND i.distrito IS NOT NULL
  GROUP BY e.area, i.distrito, r.nivel_logro
  ORDER BY e.area, i.distrito;
$$;

-- Create index for especialista dashboard aggregation
CREATE INDEX IF NOT EXISTS idx_resultados_nivel_logro_hash ON public.resultados USING HASH (nivel_logro);
CREATE INDEX IF NOT EXISTS idx_instituciones_distrito ON public.instituciones(distrito);
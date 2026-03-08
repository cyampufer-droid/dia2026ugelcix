-- Performance indexes for 200,000+ users scale
-- Optimize profile lookups by institution and grade
CREATE INDEX IF NOT EXISTS idx_profiles_institucion_id ON public.profiles(institucion_id);
CREATE INDEX IF NOT EXISTS idx_profiles_grado_seccion_id ON public.profiles(grado_seccion_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Optimize results queries
CREATE INDEX IF NOT EXISTS idx_resultados_estudiante_id ON public.resultados(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_resultados_evaluacion_id ON public.resultados(evaluacion_id);

-- Composite index for common query pattern (results by student and evaluation)
CREATE INDEX IF NOT EXISTS idx_resultados_estudiante_evaluacion ON public.resultados(estudiante_id, evaluacion_id);
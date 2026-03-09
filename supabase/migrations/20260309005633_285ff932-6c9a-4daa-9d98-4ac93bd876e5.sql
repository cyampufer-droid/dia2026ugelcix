-- Create optimized function for admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  instituciones_count BIGINT,
  docentes_count BIGINT,
  estudiantes_count BIGINT,
  evaluaciones_count BIGINT,
  especialistas_count BIGINT,
  directores_count BIGINT,
  subdirectores_count BIGINT,
  pip_count BIGINT
) 
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.instituciones) as instituciones_count,
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'docente') as docentes_count,
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'estudiante') as estudiantes_count,
    (SELECT COUNT(*) FROM public.evaluaciones) as evaluaciones_count,
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'especialista') as especialistas_count,
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'director') as directores_count,
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'subdirector') as subdirectores_count,
    (SELECT COUNT(*) FROM public.profiles WHERE is_pip = true) as pip_count;
$$;

-- Create function for director dashboard optimization
CREATE OR REPLACE FUNCTION public.get_director_stats(_institucion_id UUID)
RETURNS TABLE (
  aulas_count BIGINT,
  directores_count BIGINT,
  subdirectores_count BIGINT,
  docentes_count BIGINT,
  pip_count BIGINT,
  estudiantes_count BIGINT,
  evaluaciones_count BIGINT
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.niveles_grados WHERE institucion_id = _institucion_id) as aulas_count,
    (SELECT COUNT(*) 
     FROM public.user_roles ur 
     JOIN public.profiles p ON p.user_id = ur.user_id 
     WHERE ur.role = 'director' AND p.institucion_id = _institucion_id) as directores_count,
    (SELECT COUNT(*) 
     FROM public.user_roles ur 
     JOIN public.profiles p ON p.user_id = ur.user_id 
     WHERE ur.role = 'subdirector' AND p.institucion_id = _institucion_id) as subdirectores_count,
    (SELECT COUNT(*) 
     FROM public.user_roles ur 
     JOIN public.profiles p ON p.user_id = ur.user_id 
     WHERE ur.role = 'docente' AND p.institucion_id = _institucion_id) as docentes_count,
    (SELECT COUNT(*) FROM public.profiles WHERE institucion_id = _institucion_id AND is_pip = true) as pip_count,
    (SELECT COUNT(*) FROM public.profiles WHERE institucion_id = _institucion_id AND grado_seccion_id IS NOT NULL) as estudiantes_count,
    (SELECT COUNT(*) FROM public.evaluaciones) as evaluaciones_count;
$$;

-- Create essential performance indexes (without CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_institucion_id ON public.profiles(institucion_id) WHERE institucion_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_grado_seccion_id ON public.profiles(grado_seccion_id) WHERE grado_seccion_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_pip ON public.profiles(is_pip) WHERE is_pip = true;
CREATE INDEX IF NOT EXISTS idx_resultados_estudiante_id ON public.resultados(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_resultados_evaluacion_id ON public.resultados(evaluacion_id);
CREATE INDEX IF NOT EXISTS idx_niveles_grados_institucion_id ON public.niveles_grados(institucion_id);

-- Create composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_profiles_inst_grado_composite ON public.profiles(institucion_id, grado_seccion_id) WHERE institucion_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resultados_student_eval_composite ON public.resultados(estudiante_id, evaluacion_id);
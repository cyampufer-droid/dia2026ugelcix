
-- 1. Tighten evaluaciones read policy: restrict to staff roles + docentes (not students)
DROP POLICY IF EXISTS "Read evaluaciones" ON public.evaluaciones;
CREATE POLICY "Read evaluaciones" ON public.evaluaciones
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'administrador'::app_role) OR
    has_role(auth.uid(), 'especialista'::app_role) OR
    has_role(auth.uid(), 'director'::app_role) OR
    has_role(auth.uid(), 'subdirector'::app_role) OR
    has_role(auth.uid(), 'docente'::app_role)
  );

-- 2. Add unique constraint on resultados(estudiante_id, evaluacion_id)
ALTER TABLE public.resultados
  ADD CONSTRAINT resultados_estudiante_evaluacion_unique
  UNIQUE (estudiante_id, evaluacion_id);

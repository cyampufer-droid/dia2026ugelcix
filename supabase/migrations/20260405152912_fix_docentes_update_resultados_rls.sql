-- Fix: Agregar WITH CHECK al policy "Docentes update resultados" en tabla resultados
-- Problema: El UPDATE policy solo tenía USING, pero le faltaba WITH CHECK.
-- Esto bloqueaba los upserts de docentes al registrar respuestas de estudiantes.

DROP POLICY IF EXISTS "Docentes update resultados" ON public.resultados;

CREATE POLICY "Docentes update resultados" ON public.resultados
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'docente')
    AND estudiante_id IN (
      SELECT id FROM public.profiles WHERE grado_seccion_id = public.get_user_grado_seccion(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'docente')
    AND estudiante_id IN (
      SELECT id FROM public.profiles WHERE grado_seccion_id = public.get_user_grado_seccion(auth.uid())
    )
  );

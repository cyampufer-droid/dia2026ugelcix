CREATE POLICY "Estudiantes read evaluaciones"
ON public.evaluaciones
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'estudiante'::app_role));
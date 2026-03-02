
-- Allow docentes to update their own profile (specifically grado_seccion_id)
CREATE POLICY "Docentes update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND has_role(auth.uid(), 'docente'))
  WITH CHECK (user_id = auth.uid() AND has_role(auth.uid(), 'docente'));

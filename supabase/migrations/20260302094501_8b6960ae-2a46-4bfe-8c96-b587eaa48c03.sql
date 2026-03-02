-- Allow estudiantes to update their own profile (grado_seccion_id, institucion_id)
CREATE POLICY "Estudiantes update own profile"
ON public.profiles
FOR UPDATE
USING (user_id = auth.uid() AND has_role(auth.uid(), 'estudiante'::app_role))
WITH CHECK (user_id = auth.uid() AND has_role(auth.uid(), 'estudiante'::app_role));

-- Allow especialistas to update their own profile
CREATE POLICY "Especialistas update own profile"
ON public.profiles
FOR UPDATE
USING (user_id = auth.uid() AND has_role(auth.uid(), 'especialista'::app_role))
WITH CHECK (user_id = auth.uid() AND has_role(auth.uid(), 'especialista'::app_role));

-- Allow docentes to read profiles from their institution (needed to see institution info)
CREATE POLICY "Docentes read own institution profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'docente'::app_role) AND institucion_id = get_user_institucion(auth.uid()));

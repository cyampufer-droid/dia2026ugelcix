
CREATE POLICY "Docentes read grado user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'docente'::app_role)
  AND user_id IN (
    SELECT p.user_id FROM public.profiles p
    WHERE p.grado_seccion_id = get_user_grado_seccion(auth.uid())
    AND p.user_id IS NOT NULL
  )
);

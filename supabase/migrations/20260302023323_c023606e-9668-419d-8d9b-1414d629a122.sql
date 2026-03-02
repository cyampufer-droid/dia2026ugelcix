-- Allow directors/subdirectors to read roles of users in their institution
CREATE POLICY "Directors read institution user roles"
  ON public.user_roles
  FOR SELECT
  USING (
    (has_role(auth.uid(), 'director'::app_role) OR has_role(auth.uid(), 'subdirector'::app_role))
    AND user_id IN (
      SELECT p.user_id FROM public.profiles p
      WHERE p.institucion_id = get_user_institucion(auth.uid())
        AND p.user_id IS NOT NULL
    )
  );

-- Fix profiles SELECT policies: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Directors read institution profiles" ON public.profiles;
CREATE POLICY "Directors read institution profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'subdirector'))
    AND institucion_id = get_user_institucion(auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
CREATE POLICY "Admins manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'administrador'));

DROP POLICY IF EXISTS "Especialistas read all profiles" ON public.profiles;
CREATE POLICY "Especialistas read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'especialista'));

DROP POLICY IF EXISTS "Docentes read grado profiles" ON public.profiles;
CREATE POLICY "Docentes read grado profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'docente') AND grado_seccion_id = get_user_grado_seccion(auth.uid()));

DROP POLICY IF EXISTS "Directors update own profile" ON public.profiles;
CREATE POLICY "Directors update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'subdirector')))
  WITH CHECK (user_id = auth.uid() AND (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'subdirector')));

-- Fix user_roles SELECT policies
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Directors read institution user roles" ON public.user_roles;
CREATE POLICY "Directors read institution user roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'subdirector'))
    AND user_id IN (
      SELECT p.user_id FROM profiles p
      WHERE p.institucion_id = get_user_institucion(auth.uid()) AND p.user_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'administrador'));

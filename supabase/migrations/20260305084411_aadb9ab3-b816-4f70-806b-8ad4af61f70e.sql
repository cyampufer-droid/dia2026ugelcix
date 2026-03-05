
-- Function to check if a user is a PIP docente (teacher assigned to a PIP section)
CREATE OR REPLACE FUNCTION public.is_pip_docente(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.niveles_grados ng ON ng.id = p.grado_seccion_id
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = _user_id
      AND ur.role = 'docente'
      AND ng.seccion = 'PIP'
  )
$$;

-- Update instituciones: allow PIP docentes to read their own institution
CREATE POLICY "PIP docentes read own institucion"
ON public.instituciones
FOR SELECT
TO authenticated
USING (
  is_pip_docente(auth.uid()) AND id = get_user_institucion(auth.uid())
);

-- Update niveles_grados: allow PIP docentes to manage niveles of their institution
CREATE POLICY "PIP docentes manage niveles"
ON public.niveles_grados
FOR ALL
TO authenticated
USING (
  is_pip_docente(auth.uid()) AND institucion_id = get_user_institucion(auth.uid())
)
WITH CHECK (
  is_pip_docente(auth.uid()) AND institucion_id = get_user_institucion(auth.uid())
);

-- Update profiles: allow PIP docentes to read all institution profiles
CREATE POLICY "PIP docentes read institution profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_pip_docente(auth.uid()) AND institucion_id = get_user_institucion(auth.uid())
);

-- Update user_roles: allow PIP docentes to read institution user roles
CREATE POLICY "PIP docentes read institution user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  is_pip_docente(auth.uid()) AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.institucion_id = get_user_institucion(auth.uid())
      AND p.user_id IS NOT NULL
  )
);

-- Update resultados: allow PIP docentes to read all institution resultados
CREATE POLICY "PIP docentes read institution resultados"
ON public.resultados
FOR SELECT
TO authenticated
USING (
  is_pip_docente(auth.uid()) AND estudiante_id IN (
    SELECT p.id FROM profiles p
    WHERE p.institucion_id = get_user_institucion(auth.uid())
  )
);

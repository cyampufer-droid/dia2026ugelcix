
-- Junction table for secondary teachers with multiple grado/sección assignments
CREATE TABLE public.docente_grados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  grado_seccion_id uuid NOT NULL REFERENCES public.niveles_grados(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, grado_seccion_id)
);

ALTER TABLE public.docente_grados ENABLE ROW LEVEL SECURITY;

-- Docentes read their own assignments
CREATE POLICY "Docentes read own grados"
ON public.docente_grados FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Directors manage grados for their institution's users
CREATE POLICY "Directors manage docente_grados"
ON public.docente_grados FOR ALL
TO authenticated
USING (
  (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'subdirector'))
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.institucion_id = get_user_institucion(auth.uid()) AND p.user_id IS NOT NULL
  )
)
WITH CHECK (
  (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'subdirector'))
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.institucion_id = get_user_institucion(auth.uid()) AND p.user_id IS NOT NULL
  )
);

-- PIP docentes manage docente_grados for their institution
CREATE POLICY "PIP docentes manage docente_grados"
ON public.docente_grados FOR ALL
TO authenticated
USING (
  is_pip_docente(auth.uid())
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.institucion_id = get_user_institucion(auth.uid()) AND p.user_id IS NOT NULL
  )
)
WITH CHECK (
  is_pip_docente(auth.uid())
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.institucion_id = get_user_institucion(auth.uid()) AND p.user_id IS NOT NULL
  )
);

-- Admins manage all
CREATE POLICY "Admins manage docente_grados"
ON public.docente_grados FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrador'))
WITH CHECK (has_role(auth.uid(), 'administrador'));

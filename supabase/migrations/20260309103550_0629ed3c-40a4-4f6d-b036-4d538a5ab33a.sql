
-- Table to store descriptive conclusions for Inicial level (per student, per competency)
CREATE TABLE public.conclusiones_inicial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  area text NOT NULL,
  competencia text NOT NULL,
  logros text NOT NULL DEFAULT '',
  dificultades text NOT NULL DEFAULT '',
  mejora text NOT NULL DEFAULT '',
  nivel_logro text NOT NULL DEFAULT 'En Inicio',
  docente_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (estudiante_id, area, competencia)
);

-- Enable RLS
ALTER TABLE public.conclusiones_inicial ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_conclusiones_inicial_updated_at
  BEFORE UPDATE ON public.conclusiones_inicial
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS: Docentes can manage conclusions for students in their grado
CREATE POLICY "Docentes manage conclusiones inicial"
  ON public.conclusiones_inicial FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'docente'::app_role) AND
    estudiante_id IN (
      SELECT p.id FROM profiles p
      WHERE p.grado_seccion_id = get_user_grado_seccion(auth.uid())
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'docente'::app_role) AND
    estudiante_id IN (
      SELECT p.id FROM profiles p
      WHERE p.grado_seccion_id = get_user_grado_seccion(auth.uid())
    )
  );

-- RLS: Directors read their institution's conclusions
CREATE POLICY "Directors read conclusiones inicial"
  ON public.conclusiones_inicial FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'director'::app_role) OR has_role(auth.uid(), 'subdirector'::app_role)) AND
    estudiante_id IN (
      SELECT p.id FROM profiles p WHERE p.institucion_id = get_user_institucion(auth.uid())
    )
  );

-- RLS: Students read own conclusions
CREATE POLICY "Estudiantes read own conclusiones"
  ON public.conclusiones_inicial FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'estudiante'::app_role) AND
    estudiante_id = (SELECT p.id FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1)
  );

-- RLS: Admins manage all
CREATE POLICY "Admins manage conclusiones inicial"
  ON public.conclusiones_inicial FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'administrador'::app_role))
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

-- RLS: PIP docentes read institution
CREATE POLICY "PIP read conclusiones inicial"
  ON public.conclusiones_inicial FOR SELECT TO authenticated
  USING (
    is_pip_docente(auth.uid()) AND
    estudiante_id IN (
      SELECT p.id FROM profiles p WHERE p.institucion_id = get_user_institucion(auth.uid())
    )
  );

-- RLS: Especialistas read all
CREATE POLICY "Especialistas read conclusiones inicial"
  ON public.conclusiones_inicial FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'especialista'::app_role));

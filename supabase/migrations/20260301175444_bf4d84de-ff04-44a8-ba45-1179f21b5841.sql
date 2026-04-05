
-- Enum for application roles
CREATE TYPE public.app_role AS ENUM ('estudiante', 'docente', 'director', 'subdirector', 'especialista', 'padre', 'administrador');

-- Instituciones Educativas
CREATE TABLE public.instituciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo_modular TEXT,
  codigo_local TEXT,
  provincia TEXT NOT NULL DEFAULT 'Chiclayo',
  distrito TEXT NOT NULL,
  centro_poblado TEXT,
  direccion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instituciones ENABLE ROW LEVEL SECURITY;

-- Niveles y Grados/Secciones por institución
CREATE TABLE public.niveles_grados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
  nivel TEXT NOT NULL CHECK (nivel IN ('Inicial', 'Primaria', 'Secundaria')),
  grado TEXT NOT NULL,
  seccion TEXT NOT NULL DEFAULT 'A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institucion_id, nivel, grado, seccion)
);

ALTER TABLE public.niveles_grados ENABLE ROW LEVEL SECURITY;

-- Profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dni TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  institucion_id UUID REFERENCES public.instituciones(id) ON DELETE SET NULL,
  grado_seccion_id UUID REFERENCES public.niveles_grados(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Evaluaciones
CREATE TABLE public.evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL CHECK (area IN ('Matemática', 'Lectura', 'Socioemocional')),
  grado TEXT NOT NULL,
  nivel TEXT NOT NULL,
  anio INT NOT NULL DEFAULT 2026,
  numero_preguntas INT NOT NULL DEFAULT 20,
  config_preguntas JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;

-- Resultados
CREATE TABLE public.resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  respuestas_dadas TEXT[] DEFAULT '{}',
  puntaje_total INT DEFAULT 0,
  nivel_logro TEXT DEFAULT 'En Inicio' CHECK (nivel_logro IN ('En Inicio', 'En Proceso', 'Logro Esperado', 'Logro Destacado')),
  fecha_sincronizacion TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's institucion_id
CREATE OR REPLACE FUNCTION public.get_user_institucion(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institucion_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to get user's grado_seccion_id
CREATE OR REPLACE FUNCTION public.get_user_grado_seccion(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT grado_seccion_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Auto-calculate nivel_logro
CREATE OR REPLACE FUNCTION public.calcular_nivel_logro()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.puntaje_total >= 19 THEN
    NEW.nivel_logro := 'Logro Destacado';
  ELSIF NEW.puntaje_total >= 15 THEN
    NEW.nivel_logro := 'Logro Esperado';
  ELSIF NEW.puntaje_total >= 11 THEN
    NEW.nivel_logro := 'En Proceso';
  ELSE
    NEW.nivel_logro := 'En Inicio';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calcular_nivel_logro
BEFORE INSERT OR UPDATE OF puntaje_total ON public.resultados
FOR EACH ROW EXECUTE FUNCTION public.calcular_nivel_logro();

-- Auto update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, dni, nombre_completo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'dni', ''),
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Instituciones: admin/especialista can manage, directors read their own, others read
CREATE POLICY "Admins manage instituciones" ON public.instituciones
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'especialista'));

CREATE POLICY "Directors read own institucion" ON public.instituciones
  FOR SELECT TO authenticated
  USING (id = public.get_user_institucion(auth.uid()));

-- Niveles_grados: directors of the institution can manage
CREATE POLICY "Directors manage niveles" ON public.niveles_grados
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'especialista') OR
    institucion_id = public.get_user_institucion(auth.uid())
  );

CREATE POLICY "Authenticated read niveles" ON public.niveles_grados
  FOR SELECT TO authenticated
  USING (true);

-- Profiles: users read own, admins/directors manage their institution
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Directors read institution profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'subdirector'))
    AND institucion_id = public.get_user_institucion(auth.uid())
  );

CREATE POLICY "Docentes read grado profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'docente')
    AND grado_seccion_id = public.get_user_grado_seccion(auth.uid())
  );

CREATE POLICY "Especialistas read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'especialista'));

-- User roles: only admins manage
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Evaluaciones: especialistas/admins manage, all authenticated read
CREATE POLICY "Manage evaluaciones" ON public.evaluaciones
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'especialista'));

CREATE POLICY "Read evaluaciones" ON public.evaluaciones
  FOR SELECT TO authenticated
  USING (true);

-- Resultados policies
CREATE POLICY "Estudiantes manage own resultados" ON public.resultados
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'estudiante')
    AND estudiante_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Docentes read grado resultados" ON public.resultados
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'docente')
    AND estudiante_id IN (
      SELECT id FROM public.profiles WHERE grado_seccion_id = public.get_user_grado_seccion(auth.uid())
    )
  );

CREATE POLICY "Docentes insert resultados" ON public.resultados
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'docente')
    AND estudiante_id IN (
      SELECT id FROM public.profiles WHERE grado_seccion_id = public.get_user_grado_seccion(auth.uid())
    )
  );

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
      SELECT id FROM public.profiles 
      WHERE grado_seccion_id = public.get_user_grado_seccion(auth.uid())
    )
  );

CREATE POLICY "Directors read institution resultados" ON public.resultados
  FOR SELECT TO authenticated
  USING (
    (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'subdirector'))
    AND estudiante_id IN (
      SELECT id FROM public.profiles WHERE institucion_id = public.get_user_institucion(auth.uid())
    )
  );

CREATE POLICY "Especialistas read all resultados" ON public.resultados
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'especialista'));

CREATE POLICY "Admins manage all resultados" ON public.resultados
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

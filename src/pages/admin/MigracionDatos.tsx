import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Database, FileText, CheckCircle, Loader2, Copy, ArrowRight } from "lucide-react";
import * as XLSX from "xlsx";

const TABLES_ORDER = [
  { name: "instituciones", label: "Instituciones", fk: [] },
  { name: "niveles_grados", label: "Niveles y Grados", fk: ["instituciones"] },
  { name: "evaluaciones", label: "Evaluaciones", fk: [] },
  { name: "profiles", label: "Perfiles", fk: ["instituciones", "niveles_grados"] },
  { name: "user_roles", label: "Roles de Usuario", fk: [] },
  { name: "docente_grados", label: "Docente-Grados", fk: ["niveles_grados"] },
  { name: "resultados", label: "Resultados", fk: ["profiles", "evaluaciones"] },
  { name: "conclusiones_inicial", label: "Conclusiones Inicial", fk: ["profiles"] },
];

async function fetchAllRows(table: string) {
  const all: any[] = [];
  let from = 0;
  const size = 1000;
  while (true) {
    const { data, error } = await (supabase.from(table as any) as any).select("*").range(from, from + size - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < size) break;
    from += size;
  }
  return all;
}

function downloadCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const SCHEMA_SQL = `-- =============================================
-- ESQUEMA COMPLETO - DIA 2026 GRED LAMBAYEQUE
-- Ejecutar en el SQL Editor de Supabase destino
-- =============================================

-- 1. ENUM
CREATE TYPE public.app_role AS ENUM (
  'estudiante','docente','director','subdirector','especialista','padre','administrador'
);

-- 2. TABLAS
CREATE TABLE public.instituciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  distrito TEXT NOT NULL,
  provincia TEXT NOT NULL DEFAULT 'Chiclayo',
  centro_poblado TEXT,
  direccion TEXT,
  codigo_modular TEXT,
  codigo_local TEXT,
  tipo_gestion TEXT NOT NULL DEFAULT 'Pública',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.niveles_grados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
  nivel TEXT NOT NULL,
  grado TEXT NOT NULL,
  seccion TEXT NOT NULL DEFAULT 'A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  nivel TEXT NOT NULL,
  grado TEXT NOT NULL,
  numero_preguntas INT NOT NULL DEFAULT 20,
  config_preguntas JSONB NOT NULL DEFAULT '[]',
  anio INT NOT NULL DEFAULT 2026,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  dni TEXT NOT NULL UNIQUE,
  nombre_completo TEXT NOT NULL,
  institucion_id UUID REFERENCES public.instituciones(id),
  grado_seccion_id UUID REFERENCES public.niveles_grados(id),
  especialidad TEXT,
  is_pip BOOLEAN NOT NULL DEFAULT false,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

CREATE TABLE public.docente_grados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  grado_seccion_id UUID NOT NULL REFERENCES public.niveles_grados(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  respuestas_dadas TEXT[],
  puntaje_total INT,
  nivel_logro TEXT,
  fecha_sincronizacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conclusiones_inicial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  docente_user_id UUID,
  area TEXT NOT NULL,
  competencia TEXT NOT NULL,
  nivel_logro TEXT NOT NULL DEFAULT '',
  logros TEXT NOT NULL DEFAULT '',
  dificultades TEXT NOT NULL DEFAULT '',
  mejora TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. RLS
ALTER TABLE public.instituciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niveles_grados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docente_grados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conclusiones_inicial ENABLE ROW LEVEL SECURITY;

-- 4. FUNCIONES
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_institucion(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT institucion_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_grado_seccion(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT grado_seccion_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_pip_docente(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = _user_id AND ur.role = 'docente' AND p.is_pip = true
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.calcular_nivel_logro()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.puntaje_total >= 19 THEN NEW.nivel_logro := 'Logro Destacado';
  ELSIF NEW.puntaje_total >= 15 THEN NEW.nivel_logro := 'Logro Esperado';
  ELSIF NEW.puntaje_total >= 11 THEN NEW.nivel_logro := 'En Proceso';
  ELSE NEW.nivel_logro := 'En Inicio'; END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _dni text; _nombre text;
BEGIN
  _dni := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'dni'), ''), NULL);
  _nombre := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'nombre_completo'), ''), NULL);
  IF _dni IS NULL OR _nombre IS NULL THEN RAISE EXCEPTION 'DNI and nombre_completo required'; END IF;
  IF _dni !~ '^\\d{8}$' THEN RAISE EXCEPTION 'DNI must be 8 digits'; END IF;
  INSERT INTO public.profiles (user_id, dni, nombre_completo) VALUES (NEW.id, _dni, _nombre);
  RETURN NEW;
END; $$;

-- Funciones de estadísticas
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE(instituciones_count BIGINT, docentes_count BIGINT, estudiantes_count BIGINT, evaluaciones_count BIGINT, especialistas_count BIGINT, directores_count BIGINT, subdirectores_count BIGINT, pip_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT COUNT(*) FROM public.instituciones),
    (SELECT COUNT(*) FROM public.user_roles WHERE role='docente'),
    (SELECT COUNT(*) FROM public.user_roles WHERE role='estudiante'),
    (SELECT COUNT(*) FROM public.evaluaciones),
    (SELECT COUNT(*) FROM public.user_roles WHERE role='especialista'),
    (SELECT COUNT(*) FROM public.user_roles WHERE role='director'),
    (SELECT COUNT(*) FROM public.user_roles WHERE role='subdirector'),
    (SELECT COUNT(*) FROM public.profiles WHERE is_pip=true);
$$;

CREATE OR REPLACE FUNCTION public.get_director_stats(_institucion_id UUID)
RETURNS TABLE(aulas_count BIGINT, directores_count BIGINT, subdirectores_count BIGINT, docentes_count BIGINT, pip_count BIGINT, estudiantes_count BIGINT, evaluaciones_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT COUNT(*) FROM public.niveles_grados WHERE institucion_id=_institucion_id),
    (SELECT COUNT(*) FROM public.user_roles ur JOIN public.profiles p ON p.user_id=ur.user_id WHERE ur.role='director' AND p.institucion_id=_institucion_id),
    (SELECT COUNT(*) FROM public.user_roles ur JOIN public.profiles p ON p.user_id=ur.user_id WHERE ur.role='subdirector' AND p.institucion_id=_institucion_id),
    (SELECT COUNT(*) FROM public.user_roles ur JOIN public.profiles p ON p.user_id=ur.user_id WHERE ur.role='docente' AND p.institucion_id=_institucion_id),
    (SELECT COUNT(*) FROM public.profiles WHERE institucion_id=_institucion_id AND is_pip=true),
    (SELECT COUNT(*) FROM public.profiles WHERE institucion_id=_institucion_id AND grado_seccion_id IS NOT NULL),
    (SELECT COUNT(*) FROM public.evaluaciones);
$$;

CREATE OR REPLACE FUNCTION public.get_especialista_stats()
RETURNS TABLE(area TEXT, distrito TEXT, nivel_logro TEXT, total BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.area, i.distrito, r.nivel_logro, COUNT(*)
  FROM public.resultados r
  JOIN public.evaluaciones e ON e.id=r.evaluacion_id
  JOIN public.profiles p ON p.id=r.estudiante_id
  JOIN public.instituciones i ON i.id=p.institucion_id
  WHERE r.nivel_logro IS NOT NULL AND p.institucion_id IS NOT NULL AND i.distrito IS NOT NULL
  GROUP BY e.area, i.distrito, r.nivel_logro ORDER BY e.area, i.distrito;
$$;

CREATE OR REPLACE FUNCTION public.get_resultados_explorer(_scope TEXT, _institucion_id UUID DEFAULT NULL, _grado_seccion_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  WITH student_profiles AS (
    SELECT p.id, p.nombre_completo, p.dni, p.institucion_id, p.grado_seccion_id
    FROM profiles p JOIN user_roles ur ON ur.user_id = p.user_id
    WHERE ur.role = 'estudiante' AND p.user_id IS NOT NULL AND (
      (_scope='global') OR (_scope='institucion' AND p.institucion_id=_institucion_id) OR (_scope='seccion' AND p.grado_seccion_id=_grado_seccion_id)
    )
  ), student_results AS (
    SELECT r.estudiante_id, r.evaluacion_id, r.puntaje_total, r.nivel_logro
    FROM resultados r WHERE r.estudiante_id IN (SELECT id FROM student_profiles)
  )
  SELECT jsonb_build_object(
    'profiles', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',sp.id,'nombre_completo',sp.nombre_completo,'dni',sp.dni,'institucion_id',sp.institucion_id,'grado_seccion_id',sp.grado_seccion_id) ORDER BY sp.nombre_completo) FROM student_profiles sp), '[]'::jsonb),
    'resultados', COALESCE((SELECT jsonb_agg(jsonb_build_object('estudiante_id',sr.estudiante_id,'evaluacion_id',sr.evaluacion_id,'puntaje_total',sr.puntaje_total,'nivel_logro',sr.nivel_logro)) FROM student_results sr), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END; $$;

-- 5. TRIGGERS
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_conclusiones_updated_at BEFORE UPDATE ON public.conclusiones_inicial FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER calcular_nivel_logro_trigger BEFORE INSERT OR UPDATE ON public.resultados FOR EACH ROW EXECUTE FUNCTION public.calcular_nivel_logro();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. POLICIES (ejemplos básicos - ajustar según necesidad)
CREATE POLICY "Auth users read instituciones" ON public.instituciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users read evaluaciones" ON public.evaluaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users read niveles_grados" ON public.niveles_grados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'administrador'));
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 7. STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('evaluaciones', 'evaluaciones', true) ON CONFLICT DO NOTHING;

-- 8. REALTIME (si es necesario)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
`;

export default function MigracionDatos() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(false);

  const loadCounts = async () => {
    setLoadingCounts(true);
    try {
      const results: Record<string, number> = {};
      for (const t of TABLES_ORDER) {
        const data = await fetchAllRows(t.name);
        results[t.name] = data.length;
      }
      setCounts(results);
    } catch (e) {
      toast.error("Error cargando conteos");
    }
    setLoadingCounts(false);
  };

  const handleDownloadCSV = async (tableName: string) => {
    setDownloading(tableName);
    try {
      const data = await fetchAllRows(tableName);
      downloadCSV(data, `${tableName}.csv`);
      setDownloaded(prev => new Set(prev).add(tableName));
      toast.success(`${tableName}.csv descargado (${data.length} registros)`);
    } catch (e) {
      toast.error(`Error descargando ${tableName}`);
    }
    setDownloading(null);
  };

  const handleDownloadAllCSV = async () => {
    setDownloading("all");
    try {
      for (const t of TABLES_ORDER) {
        const data = await fetchAllRows(t.name);
        downloadCSV(data, `${t.name}.csv`);
        setDownloaded(prev => new Set(prev).add(t.name));
      }
      toast.success("Todas las tablas descargadas");
    } catch (e) {
      toast.error("Error en descarga masiva");
    }
    setDownloading(null);
  };

  const handleDownloadSchema = () => {
    const blob = new Blob([SCHEMA_SQL], { type: "text/sql;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "esquema_completo.sql";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Esquema SQL descargado");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Migración de Base de Datos</h1>
        <p className="text-muted-foreground mt-1">
          Transfiere toda la estructura y datos a tu proyecto Supabase externo
        </p>
      </div>

      {/* PASO 1 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">1</Badge>
            <CardTitle className="text-lg">Descargar Esquema SQL</CardTitle>
          </div>
          <CardDescription>
            Este archivo contiene todas las tablas, funciones, triggers, RLS y configuración.
            Ejecútalo en el <strong>SQL Editor</strong> de tu proyecto Supabase destino.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownloadSchema} className="gap-2">
            <Database className="h-4 w-4" />
            Descargar esquema_completo.sql
          </Button>
        </CardContent>
      </Card>

      {/* PASO 2 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">2</Badge>
            <CardTitle className="text-lg">Descargar Datos (CSV)</CardTitle>
          </div>
          <CardDescription>
            Descarga cada tabla como CSV. El orden de importación es importante por las dependencias entre tablas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 mb-4">
            <Button variant="outline" onClick={loadCounts} disabled={loadingCounts} className="gap-2">
              {loadingCounts ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Ver conteo de registros
            </Button>
            <Button onClick={handleDownloadAllCSV} disabled={downloading === "all"} className="gap-2">
              {downloading === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar todas las tablas
            </Button>
          </div>

          <div className="border rounded-lg divide-y">
            {TABLES_ORDER.map((t, i) => (
              <div key={t.name} className="flex items-center justify-between p-3 hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground w-5">{i + 1}.</span>
                  <div>
                    <span className="font-medium">{t.label}</span>
                    <span className="text-muted-foreground text-sm ml-2">({t.name})</span>
                    {counts[t.name] !== undefined && (
                      <Badge variant="secondary" className="ml-2">{counts[t.name].toLocaleString()} registros</Badge>
                    )}
                  </div>
                  {t.fk.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      depende de: {t.fk.join(", ")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {downloaded.has(t.name) && <CheckCircle className="h-4 w-4 text-green-500" />}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadCSV(t.name)}
                    disabled={downloading === t.name}
                  >
                    {downloading === t.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PASO 3 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">3</Badge>
            <CardTitle className="text-lg">Importar en Supabase Destino</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex gap-3 items-start">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div>
                <strong>3a.</strong> Ve al <strong>SQL Editor</strong> de tu proyecto Supabase y ejecuta <code>esquema_completo.sql</code>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div>
                <strong>3b.</strong> Ve a <strong>Table Editor</strong> → selecciona cada tabla → botón <strong>Import Data</strong> → sube el CSV correspondiente <strong>en este orden</strong>:
                <ol className="list-decimal ml-5 mt-1 space-y-0.5">
                  {TABLES_ORDER.map(t => (
                    <li key={t.name}><code>{t.name}.csv</code></li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div>
                <strong>3c.</strong> <strong>Usuarios Auth:</strong> Las contraseñas no se pueden exportar. Deberás recrear los usuarios usando la Edge Function <code>bulk-create-users</code> o pedir a cada usuario que haga reset de contraseña.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PASO 4 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">4</Badge>
            <CardTitle className="text-lg">Desplegar Edge Functions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Copia la carpeta <code>supabase/functions/</code> del repositorio GitHub a tu proyecto local y ejecuta:
          </p>
          <div className="bg-muted rounded-lg p-3 font-mono text-sm relative">
            <button
              onClick={() => copyToClipboard("supabase functions deploy --project-ref TU_PROJECT_REF")}
              className="absolute top-2 right-2"
            >
              <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
            supabase functions deploy --project-ref TU_PROJECT_REF
          </div>
          <p className="text-sm text-muted-foreground">
            Configura el secreto necesario:
          </p>
          <div className="bg-muted rounded-lg p-3 font-mono text-sm relative">
            <button
              onClick={() => copyToClipboard('supabase secrets set LOVABLE_API_KEY="tu-key" --project-ref TU_PROJECT_REF')}
              className="absolute top-2 right-2"
            >
              <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
            supabase secrets set LOVABLE_API_KEY="tu-key" --project-ref TU_PROJECT_REF
          </div>
        </CardContent>
      </Card>

      {/* PASO 5 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">5</Badge>
            <CardTitle className="text-lg">Actualizar Variables de Entorno</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            En tu hosting (Vercel/Netlify), actualiza las variables:
          </p>
          <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-1">
            <div>VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co</div>
            <div>VITE_SUPABASE_PUBLISHABLE_KEY=tu_anon_key</div>
          </div>
          <p className="text-sm text-muted-foreground">
            En Supabase → Authentication → URL Configuration, agrega tus dominios de producción.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

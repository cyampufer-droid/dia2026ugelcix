import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Calculator, BookOpen, Heart, Search, Filter, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import BoletaResultados from '@/components/shared/BoletaResultados';

const AREAS = [
  { key: 'Matemática', label: 'Matemática', icon: Calculator },
  { key: 'Comprensión Lectora', label: 'Comprensión Lectora', icon: BookOpen },
  { key: 'Habilidades Socioemocionales', label: 'Socioemocional', icon: Heart },
] as const;

type ViewMode = 'estudiante' | 'seccion' | 'grado' | 'nivel' | 'institucion' | 'distrito' | 'provincia';

interface ViewOption { value: ViewMode; label: string }

const VIEWS_GLOBAL: ViewOption[] = [
  { value: 'provincia', label: 'Por Provincia' },
  { value: 'distrito', label: 'Por Distrito' },
  { value: 'institucion', label: 'Por Institución' },
  { value: 'nivel', label: 'Por Nivel' },
  { value: 'grado', label: 'Por Grado' },
  { value: 'seccion', label: 'Por Sección' },
  { value: 'estudiante', label: 'Por Estudiante' },
];

const VIEWS_INSTITUCION: ViewOption[] = [
  { value: 'nivel', label: 'Por Nivel' },
  { value: 'grado', label: 'Por Grado' },
  { value: 'seccion', label: 'Por Sección' },
  { value: 'estudiante', label: 'Por Estudiante' },
];

const VIEWS_SECCION: ViewOption[] = [
  { value: 'estudiante', label: 'Por Estudiante' },
];

const nivelColor: Record<string, string> = {
  'En Inicio': 'bg-nivel-inicio text-destructive-foreground',
  'En Proceso': 'bg-nivel-proceso text-secondary-foreground',
  'Logro Esperado': 'bg-nivel-logro text-success-foreground',
  'Logro Destacado': 'bg-nivel-destacado text-primary-foreground',
};

interface RawResult {
  estudiante_id: string;
  evaluacion_id: string;
  puntaje_total: number | null;
  nivel_logro: string | null;
}

interface ProfileData {
  id: string;
  nombre_completo: string;
  dni: string;
  institucion_id: string | null;
  grado_seccion_id: string | null;
}

interface NivelGrado {
  id: string;
  nivel: string;
  grado: string;
  seccion: string;
  institucion_id: string;
}

interface Institucion {
  id: string;
  nombre: string;
  distrito: string;
  provincia: string;
}

interface AggRow {
  label: string;
  inicio: number;
  proceso: number;
  logro: number;
  destacado: number;
}

interface StudentRow {
  profileId: string;
  nombre: string;
  dni: string;
  puntaje: number | null;
  nivel_logro: string | null;
}

interface Props {
  scope: 'global' | 'institucion' | 'seccion';
  institucionId?: string | null;
  gradoSeccionId?: string | null;
  especialidad?: string | null;
  title?: string;
}

const ESPECIALIDAD_AREA_MAP: Record<string, string> = {
  'Matemática': 'Matemática',
  'Comunicación': 'Comprensión Lectora',
  'DPCC': 'Habilidades Socioemocionales',
};

const ResultadosExplorer = ({ scope, institucionId, gradoSeccionId, especialidad, title }: Props) => {
  const [loading, setLoading] = useState(true);
  const [resultados, setResultados] = useState<RawResult[]>([]);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [nivelesGrados, setNivelesGrados] = useState<NivelGrado[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<{ id: string; area: string }[]>([]);

  const viewOptions = scope === 'global' ? VIEWS_GLOBAL : scope === 'institucion' ? VIEWS_INSTITUCION : VIEWS_SECCION;
  const [viewMode, setViewMode] = useState<ViewMode>(viewOptions[0].value);
  const [search, setSearch] = useState('');

  // Cascading filters
  const [filterDistrito, setFilterDistrito] = useState<string>('__all__');
  const [filterInstitucion, setFilterInstitucion] = useState<string>('__all__');
  const [filterNivel, setFilterNivel] = useState<string>('__all__');
  const [filterGrado, setFilterGrado] = useState<string>('__all__');
  const [filterSeccion, setFilterSeccion] = useState<string>('__all__');

  // Determine which areas to show
  const areas = useMemo(() => {
    if (scope === 'seccion' && especialidad) {
      const allowedArea = ESPECIALIDAD_AREA_MAP[especialidad];
      if (allowedArea) return AREAS.filter(a => a.key === allowedArea);
    }
    return [...AREAS];
  }, [scope, especialidad]);

  // Reset lower filters when higher filter changes
  useEffect(() => { setFilterInstitucion('__all__'); }, [filterDistrito]);
  useEffect(() => { setFilterNivel('__all__'); }, [filterInstitucion]);
  useEffect(() => { setFilterGrado('__all__'); }, [filterNivel]);
  useEffect(() => { setFilterSeccion('__all__'); }, [filterGrado]);

  // Fetch data
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Fetch evaluaciones
      const { data: evals } = await supabase.from('evaluaciones').select('id, area');
      setEvaluaciones(evals || []);

      // Fetch instituciones
      if (scope === 'global') {
        const { data } = await supabase.from('instituciones').select('id, nombre, distrito, provincia');
        setInstituciones(data || []);
      } else if (scope === 'institucion' && institucionId) {
        const { data } = await supabase.from('instituciones').select('id, nombre, distrito, provincia').eq('id', institucionId);
        setInstituciones(data || []);
      }

      // Fetch niveles_grados
      let ngQuery = supabase.from('niveles_grados').select('id, nivel, grado, seccion, institucion_id');
      if (scope === 'institucion' && institucionId) {
        ngQuery = ngQuery.eq('institucion_id', institucionId);
      } else if (scope === 'seccion' && gradoSeccionId) {
        ngQuery = ngQuery.eq('id', gradoSeccionId);
      }
      const { data: ngData } = await ngQuery.order('nivel').order('grado');
      setNivelesGrados(ngData || []);

      // Fetch profiles scoped
      let profilesQuery = supabase.from('profiles').select('id, user_id, nombre_completo, dni, institucion_id, grado_seccion_id');
      if (scope === 'institucion' && institucionId) {
        profilesQuery = profilesQuery.eq('institucion_id', institucionId);
      } else if (scope === 'seccion' && gradoSeccionId) {
        profilesQuery = profilesQuery.eq('grado_seccion_id', gradoSeccionId);
      }
      profilesQuery = profilesQuery.order('nombre_completo');

      // Fetch in chunks for large datasets
      const allProfilesRaw: (ProfileData & { user_id: string | null })[] = [];
      let from = 0;
      const chunkSize = 1000;
      while (true) {
        const { data } = await profilesQuery.range(from, from + chunkSize - 1);
        if (!data || data.length === 0) break;
        allProfilesRaw.push(...(data as any));
        if (data.length < chunkSize) break;
        from += chunkSize;
      }

      // Filter to only estudiantes (exclude docentes, directors, etc.)
      const userIds = allProfilesRaw.filter(p => p.user_id).map(p => p.user_id!);
      let studentUserIds = new Set<string>();
      if (userIds.length > 0) {
        for (let i = 0; i < userIds.length; i += 500) {
          const chunk = userIds.slice(i, i + 500);
          const { data: roles } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', chunk);
          (roles || [])
            .filter(r => r.role === 'estudiante')
            .forEach(r => studentUserIds.add(r.user_id));
        }
      }
      const allProfiles = allProfilesRaw
        .filter(p => p.user_id && studentUserIds.has(p.user_id))
        .map(({ id, nombre_completo, dni, institucion_id, grado_seccion_id }) => 
          ({ id, nombre_completo, dni, institucion_id, grado_seccion_id }));
      setProfiles(allProfiles);

      // Fetch resultados
      if (allProfiles.length > 0) {
        const studentIds = allProfiles.map(p => p.id);
        const allResultados: RawResult[] = [];
        for (let i = 0; i < studentIds.length; i += 500) {
          const chunk = studentIds.slice(i, i + 500);
          const { data } = await supabase
            .from('resultados')
            .select('estudiante_id, evaluacion_id, puntaje_total, nivel_logro')
            .in('estudiante_id', chunk);
          if (data) allResultados.push(...data);
        }
        setResultados(allResultados);
      } else {
        setResultados([]);
      }

      setLoading(false);
    };
    load();
  }, [scope, institucionId, gradoSeccionId]);

  // Build lookup maps
  const evalAreaMap = useMemo(() => Object.fromEntries(evaluaciones.map(e => [e.id, e.area])), [evaluaciones]);
  const profileMap = useMemo(() => Object.fromEntries(profiles.map(p => [p.id, p])), [profiles]);
  const ngMap = useMemo(() => Object.fromEntries(nivelesGrados.map(ng => [ng.id, ng])), [nivelesGrados]);
  const instMap = useMemo(() => Object.fromEntries(instituciones.map(i => [i.id, i])), [instituciones]);

  // Available filter values
  const distritos = useMemo(() => [...new Set(instituciones.map(i => i.distrito))].sort(), [instituciones]);
  const filteredInstituciones = useMemo(() => {
    if (filterDistrito === '__all__') return instituciones;
    return instituciones.filter(i => i.distrito === filterDistrito);
  }, [instituciones, filterDistrito]);
  const niveles = useMemo(() => {
    let ngs = nivelesGrados;
    if (filterInstitucion !== '__all__') ngs = ngs.filter(ng => ng.institucion_id === filterInstitucion);
    return [...new Set(ngs.map(ng => ng.nivel))].sort();
  }, [nivelesGrados, filterInstitucion]);
  const grados = useMemo(() => {
    let ngs = nivelesGrados;
    if (filterInstitucion !== '__all__') ngs = ngs.filter(ng => ng.institucion_id === filterInstitucion);
    if (filterNivel !== '__all__') ngs = ngs.filter(ng => ng.nivel === filterNivel);
    return [...new Set(ngs.map(ng => ng.grado))].sort();
  }, [nivelesGrados, filterInstitucion, filterNivel]);
  const secciones = useMemo(() => {
    let ngs = nivelesGrados;
    if (filterInstitucion !== '__all__') ngs = ngs.filter(ng => ng.institucion_id === filterInstitucion);
    if (filterNivel !== '__all__') ngs = ngs.filter(ng => ng.nivel === filterNivel);
    if (filterGrado !== '__all__') ngs = ngs.filter(ng => ng.grado === filterGrado);
    return ngs.map(ng => ({ id: ng.id, label: `${ng.grado} "${ng.seccion}"` }));
  }, [nivelesGrados, filterInstitucion, filterNivel, filterGrado]);

  // Filter profiles based on cascading filters
  const filteredProfiles = useMemo(() => {
    let result = profiles;
    if (filterDistrito !== '__all__') {
      const instIds = new Set(instituciones.filter(i => i.distrito === filterDistrito).map(i => i.id));
      result = result.filter(p => p.institucion_id && instIds.has(p.institucion_id));
    }
    if (filterInstitucion !== '__all__') {
      result = result.filter(p => p.institucion_id === filterInstitucion);
    }
    if (filterNivel !== '__all__') {
      const ngIds = new Set(nivelesGrados.filter(ng => ng.nivel === filterNivel).map(ng => ng.id));
      result = result.filter(p => p.grado_seccion_id && ngIds.has(p.grado_seccion_id));
    }
    if (filterGrado !== '__all__') {
      const ngIds = new Set(nivelesGrados.filter(ng => ng.grado === filterGrado).map(ng => ng.id));
      result = result.filter(p => p.grado_seccion_id && ngIds.has(p.grado_seccion_id));
    }
    if (filterSeccion !== '__all__') {
      result = result.filter(p => p.grado_seccion_id === filterSeccion);
    }
    return result;
  }, [profiles, filterDistrito, filterInstitucion, filterNivel, filterGrado, filterSeccion, instituciones, nivelesGrados]);

  const filteredStudentIds = useMemo(() => new Set(filteredProfiles.map(p => p.id)), [filteredProfiles]);
  const filteredResultados = useMemo(() => resultados.filter(r => filteredStudentIds.has(r.estudiante_id)), [resultados, filteredStudentIds]);

  // Aggregate data by area and view mode
  const aggregatedData = useMemo(() => {
    const result: Record<string, AggRow[] | StudentRow[]> = {};

    for (const area of areas) {
      const areaEvalIds = new Set(evaluaciones.filter(e => e.area === area.key).map(e => e.id));
      const areaResults = filteredResultados.filter(r => areaEvalIds.has(r.evaluacion_id));

      if (viewMode === 'estudiante') {
        // Student table
        const rows: StudentRow[] = filteredProfiles.map(p => {
          const res = areaResults.find(r => r.estudiante_id === p.id);
          return {
            profileId: p.id,
            nombre: p.nombre_completo,
            dni: p.dni,
            puntaje: res?.puntaje_total ?? null,
            nivel_logro: res?.nivel_logro ?? null,
          };
        });
        // Apply search
        const searchLower = search.toLowerCase();
        result[area.key] = searchLower
          ? rows.filter(r => r.nombre.toLowerCase().includes(searchLower) || r.dni.includes(searchLower))
          : rows;
      } else {
        // Aggregated bar chart
        const groups: Record<string, { inicio: number; proceso: number; logro: number; destacado: number }> = {};

        const getGroupKey = (r: RawResult): string | null => {
          const p = profileMap[r.estudiante_id];
          if (!p) return null;
          const ng = p.grado_seccion_id ? ngMap[p.grado_seccion_id] : null;
          const inst = p.institucion_id ? instMap[p.institucion_id] : null;

          switch (viewMode) {
            case 'provincia': return inst?.provincia || 'Sin provincia';
            case 'distrito': return inst?.distrito || 'Sin distrito';
            case 'institucion': return inst?.nombre || 'Sin institución';
            case 'nivel': return ng?.nivel || 'Sin nivel';
            case 'grado': return ng ? `${ng.nivel} - ${ng.grado}` : 'Sin grado';
            case 'seccion': return ng ? `${ng.grado} "${ng.seccion}"` : 'Sin sección';
            default: return null;
          }
        };

        for (const r of areaResults) {
          const key = getGroupKey(r);
          if (!key) continue;
          if (!groups[key]) groups[key] = { inicio: 0, proceso: 0, logro: 0, destacado: 0 };
          if (r.nivel_logro === 'En Inicio') groups[key].inicio++;
          else if (r.nivel_logro === 'En Proceso') groups[key].proceso++;
          else if (r.nivel_logro === 'Logro Esperado') groups[key].logro++;
          else if (r.nivel_logro === 'Logro Destacado') groups[key].destacado++;
        }

        let rows: AggRow[] = Object.entries(groups).map(([label, counts]) => ({ label, ...counts }));
        rows.sort((a, b) => a.label.localeCompare(b.label));

        // Apply search
        const searchLower = search.toLowerCase();
        if (searchLower) {
          rows = rows.filter(r => r.label.toLowerCase().includes(searchLower));
        }

        // Filter out empty rows
        rows = rows.filter(r => r.inicio + r.proceso + r.logro + r.destacado > 0);
        result[area.key] = rows;
      }
    }
    return result;
  }, [areas, evaluaciones, filteredResultados, filteredProfiles, viewMode, search, profileMap, ngMap, instMap]);

  // Determine which filters to show
  const showDistritoFilter = scope === 'global' && ['institucion', 'nivel', 'grado', 'seccion', 'estudiante'].includes(viewMode);
  const showInstitucionFilter = scope === 'global' && ['nivel', 'grado', 'seccion', 'estudiante'].includes(viewMode);
  const showNivelFilter = ['grado', 'seccion', 'estudiante'].includes(viewMode);
  const showGradoFilter = ['seccion', 'estudiante'].includes(viewMode);
  const showSeccionFilter = viewMode === 'estudiante' && scope !== 'seccion';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title || 'Resultados'}</h1>
        <p className="text-muted-foreground">Distribución de niveles de logro por área de evaluación</p>
      </div>

      {/* Controls */}
      <Card className="shadow-card">
        <CardContent className="pt-4 pb-4 space-y-3">
          {/* First row: View mode + Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={viewMode} onValueChange={(v) => { setViewMode(v as ViewMode); setSearch(''); }}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Visualizar por..." />
                </SelectTrigger>
                <SelectContent>
                  {viewOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Cascading filters */}
          {(showDistritoFilter || showInstitucionFilter || showNivelFilter || showGradoFilter || showSeccionFilter) && (
            <div className="flex flex-wrap gap-2">
              {showDistritoFilter && (
                <Select value={filterDistrito} onValueChange={setFilterDistrito}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Distrito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los distritos</SelectItem>
                    {distritos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {showInstitucionFilter && (
                <Select value={filterInstitucion} onValueChange={setFilterInstitucion}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Institución" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las instituciones</SelectItem>
                    {filteredInstituciones.map(i => <SelectItem key={i.id} value={i.id}>{i.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {showNivelFilter && (
                <Select value={filterNivel} onValueChange={setFilterNivel}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los niveles</SelectItem>
                    {niveles.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {showGradoFilter && (
                <Select value={filterGrado} onValueChange={setFilterGrado}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Grado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los grados</SelectItem>
                    {grados.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {showSeccionFilter && (
                <Select value={filterSeccion} onValueChange={setFilterSeccion}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sección" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las secciones</SelectItem>
                    {secciones.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Area Tabs + Results */}
      <Tabs defaultValue={areas[0]?.key || 'Matemática'} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${areas.length}, 1fr)` }}>
          {areas.map(a => (
            <TabsTrigger key={a.key} value={a.key} className="flex items-center gap-1 text-xs sm:text-sm">
              <a.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{a.label}</span>
              <span className="sm:hidden">{a.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {areas.map(area => {
          const data = aggregatedData[area.key];
          const isStudent = viewMode === 'estudiante';

          return (
            <TabsContent key={area.key} value={area.key}>
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">
                    {area.label} – {viewOptions.find(v => v.value === viewMode)?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-muted-foreground text-sm text-center py-8">Cargando resultados...</p>
                  ) : !data || data.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">No hay resultados para los filtros seleccionados.</p>
                  ) : isStudent ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">N°</th>
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Estudiante</th>
                            <th className="text-center py-2 px-3 font-medium text-muted-foreground">DNI</th>
                            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Puntaje</th>
                            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Nivel de Logro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data as StudentRow[]).map((r, i) => (
                            <tr key={i} className="border-b border-border hover:bg-muted/50">
                              <td className="py-2 px-3">{i + 1}</td>
                              <td className="py-2 px-3 font-medium">{r.nombre}</td>
                              <td className="py-2 px-3 text-center text-muted-foreground">{r.dni}</td>
                              <td className="py-2 px-3 text-center font-bold">
                                {r.puntaje !== null ? `${r.puntaje}/20` : '—'}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {r.nivel_logro ? (
                                  <span className={cn('px-2 py-1 rounded-full text-xs font-semibold', nivelColor[r.nivel_logro] || 'bg-muted')}>
                                    {r.nivel_logro}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">Sin evaluar</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(300, (data as AggRow[]).length * 40)}>
                      <BarChart data={data as AggRow[]} layout={(data as AggRow[]).length > 5 ? 'vertical' : 'horizontal'}>
                        {(data as AggRow[]).length > 5 ? (
                          <>
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11 }} />
                          </>
                        ) : (
                          <>
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis />
                          </>
                        )}
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="inicio" name="En Inicio" stackId="a" fill="hsl(0, 72%, 51%)" />
                        <Bar dataKey="proceso" name="En Proceso" stackId="a" fill="hsl(38, 92%, 55%)" />
                        <Bar dataKey="logro" name="Logro Esperado" stackId="a" fill="hsl(160, 50%, 40%)" />
                        <Bar dataKey="destacado" name="Logro Destacado" stackId="a" fill="hsl(220, 65%, 28%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default ResultadosExplorer;

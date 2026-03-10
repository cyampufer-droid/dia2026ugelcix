import { useEffect, useState } from 'react';
import { School, ChevronDown, ChevronRight, FileText, Loader2, Users, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import PlanRefuerzoButton from '@/components/PlanRefuerzoButton';

interface Institucion {
  id: string;
  nombre: string;
  distrito: string;
}

interface Aula {
  id: string;
  nivel: string;
  grado: string;
  seccion: string;
  institucion_id: string;
}

const PlanesRefuerzoListing = () => {
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [aulasByInst, setAulasByInst] = useState<Record<string, Aula[]>>({});
  const [studentCountByInst, setStudentCountByInst] = useState<Record<string, number>>({});
  const [resultCountByInst, setResultCountByInst] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [openInst, setOpenInst] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [instRes, aulasRes, profilesRes, resultadosRes] = await Promise.all([
        supabase.from('instituciones').select('id, nombre, distrito').order('nombre'),
        supabase.from('niveles_grados').select('id, nivel, grado, seccion, institucion_id').order('nivel').order('grado').order('seccion'),
        supabase.from('profiles').select('id, institucion_id, grado_seccion_id').not('grado_seccion_id', 'is', null),
        supabase.from('resultados').select('id, estudiante_id'),
      ]);

      setInstituciones(instRes.data || []);

      const grouped: Record<string, Aula[]> = {};
      for (const a of aulasRes.data || []) {
        if (!grouped[a.institucion_id]) grouped[a.institucion_id] = [];
        grouped[a.institucion_id].push(a);
      }
      setAulasByInst(grouped);

      // Count students per institution
      const stCounts: Record<string, number> = {};
      const studentIdToInst: Record<string, string> = {};
      for (const p of profilesRes.data || []) {
        if (p.institucion_id) {
          stCounts[p.institucion_id] = (stCounts[p.institucion_id] || 0) + 1;
          studentIdToInst[p.id] = p.institucion_id;
        }
      }
      setStudentCountByInst(stCounts);

      // Count results per institution
      const resCounts: Record<string, number> = {};
      for (const r of resultadosRes.data || []) {
        const instId = studentIdToInst[r.estudiante_id];
        if (instId) {
          resCounts[instId] = (resCounts[instId] || 0) + 1;
        }
      }
      setResultCountByInst(resCounts);

      setLoading(false);
    };
    load();
  }, []);

  const toggleInst = (id: string) => {
    setOpenInst(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Filter: only show institutions with aulas
  const instWithAulas = instituciones.filter(inst => (aulasByInst[inst.id] || []).length > 0);
  const instWithoutAulas = instituciones.length - instWithAulas.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Planes de Refuerzo Escolar</h1>
        <p className="text-muted-foreground">Genere planes de refuerzo institucionales y por aula basados en los resultados diagnósticos</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : instWithAulas.length === 0 ? (
        <p className="text-muted-foreground">No hay instituciones con aulas registradas.</p>
      ) : (
        <>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{instWithAulas.length} instituciones con aulas</span>
            {instWithoutAulas > 0 && <span>({instWithoutAulas} sin aulas, ocultas)</span>}
          </div>
          <div className="space-y-3">
            {instWithAulas.map(inst => {
              const aulas = aulasByInst[inst.id] || [];
              const studentCount = studentCountByInst[inst.id] || 0;
              const resultCount = resultCountByInst[inst.id] || 0;
              const hasResults = resultCount > 0;
              const isOpen = openInst.has(inst.id);
              return (
                <div key={inst.id} className="bg-card rounded-xl border shadow-card overflow-hidden">
                  <Collapsible open={isOpen} onOpenChange={() => toggleInst(inst.id)}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <School className="h-5 w-5 text-primary flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">{inst.nombre}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">{inst.distrito}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {aulas.length} aulas
                              </Badge>
                              <Badge variant={studentCount > 0 ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
                                <Users className="h-3 w-3 mr-0.5" />{studentCount} est.
                              </Badge>
                              {hasResults ? (
                                <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-green-600">
                                  {resultCount} resultados
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                  Sin resultados
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t px-4 py-4 space-y-4">
                        {!hasResults && (
                          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>No hay resultados de evaluaciones digitados en esta institución. Los docentes deben digitar las respuestas primero.</span>
                          </div>
                        )}

                        {/* Institutional plan */}
                        <div className="flex items-center gap-3 pb-3 border-b">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground flex-1">Plan Institucional</span>
                          <PlanRefuerzoButton
                            tipo="institucional"
                            label="Generar Plan Institucional"
                            institucionIdOverride={inst.id}
                            disabled={!hasResults}
                          />
                        </div>

                        {/* Per-aula plans */}
                        {aulas.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Planes por Aula</p>
                            {aulas.map(a => (
                              <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                                <span className="text-sm text-foreground">
                                  {a.nivel} — {a.grado} «{a.seccion}»
                                </span>
                                <PlanRefuerzoButton
                                  tipo="aula"
                                  label="Generar"
                                  gradoSeccionIdOverride={a.id}
                                  compact
                                  disabled={!hasResults}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default PlanesRefuerzoListing;

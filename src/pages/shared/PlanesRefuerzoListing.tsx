import { useEffect, useState } from 'react';
import { School, ChevronDown, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  const [loading, setLoading] = useState(true);
  const [openInst, setOpenInst] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [instRes, aulasRes] = await Promise.all([
        supabase.from('instituciones').select('id, nombre, distrito').order('nombre'),
        supabase.from('niveles_grados').select('id, nivel, grado, seccion, institucion_id').order('nivel').order('grado').order('seccion'),
      ]);

      setInstituciones(instRes.data || []);

      const grouped: Record<string, Aula[]> = {};
      for (const a of aulasRes.data || []) {
        if (!grouped[a.institucion_id]) grouped[a.institucion_id] = [];
        grouped[a.institucion_id].push(a);
      }
      setAulasByInst(grouped);
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
      ) : instituciones.length === 0 ? (
        <p className="text-muted-foreground">No hay instituciones registradas.</p>
      ) : (
        <div className="space-y-3">
          {instituciones.map(inst => {
            const aulas = aulasByInst[inst.id] || [];
            const isOpen = openInst.has(inst.id);
            return (
              <div key={inst.id} className="bg-card rounded-xl border shadow-card overflow-hidden">
                <Collapsible open={isOpen} onOpenChange={() => toggleInst(inst.id)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <School className="h-5 w-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">{inst.nombre}</p>
                          <p className="text-xs text-muted-foreground">{inst.distrito} · {aulas.length} aulas</p>
                        </div>
                      </div>
                      {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t px-4 py-4 space-y-4">
                      {/* Institutional plan */}
                      <div className="flex items-center gap-3 pb-3 border-b">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground flex-1">Plan Institucional</span>
                        <PlanRefuerzoButton
                          tipo="institucional"
                          label="Generar Plan Institucional"
                          institucionIdOverride={inst.id}
                        />
                      </div>

                      {/* Per-aula plans */}
                      {aulas.length > 0 ? (
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
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay aulas registradas.</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlanesRefuerzoListing;

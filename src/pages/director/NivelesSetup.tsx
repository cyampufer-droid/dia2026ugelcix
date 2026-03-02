import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, GraduationCap, X } from 'lucide-react';

const nivelesConfig = {
  Inicial: {
    grados: ['3 años', '4 años', '5 años'],
    secciones: ['Aula Única', 'Aula A', 'Aula B', 'Aula C'],
  },
  Primaria: {
    grados: ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto'],
    secciones: 'A-J',
  },
  Secundaria: {
    grados: ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto'],
    secciones: 'A-T',
  },
};

const generateSections = (range: string): string[] => {
  const [start, end] = range.split('-');
  const sections: string[] = [];
  for (let i = start.charCodeAt(0); i <= end.charCodeAt(0); i++) {
    sections.push(String.fromCharCode(i));
  }
  return sections;
};

interface GradoSeccion {
  nivel: string;
  grado: string;
  seccion: string;
}

const NivelesSetup = () => {
  const [nivel, setNivel] = useState('');
  const [grado, setGrado] = useState('');
  const [seccion, setSeccion] = useState('');
  const [added, setAdded] = useState<GradoSeccion[]>([]);
  const { toast } = useToast();

  const gradosDisponibles = nivel ? nivelesConfig[nivel as keyof typeof nivelesConfig]?.grados || [] : [];
  const seccionesRaw = nivel ? nivelesConfig[nivel as keyof typeof nivelesConfig]?.secciones : [];
  const seccionesDisponibles = typeof seccionesRaw === 'string' ? generateSections(seccionesRaw) : (seccionesRaw || []);

  const handleAdd = () => {
    if (!nivel || !grado || !seccion) return;
    const exists = added.some(a => a.nivel === nivel && a.grado === grado && a.seccion === seccion);
    if (exists) {
      toast({ title: 'Ya existe', description: 'Esta combinación ya fue agregada', variant: 'destructive' });
      return;
    }
    setAdded([...added, { nivel, grado, seccion }]);
    setSeccion('');
  };

  const handleRemove = (index: number) => {
    setAdded(added.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    toast({ title: 'Niveles guardados', description: `${added.length} grados/secciones configurados` });
  };

  const selectClass = "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Niveles, Grados y Secciones</h1>
        <p className="text-muted-foreground">Configure la estructura académica de su institución</p>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Agregar Grado/Sección</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Nivel</Label>
              <select
                className={selectClass}
                value={nivel}
                onChange={e => { setNivel(e.target.value); setGrado(''); setSeccion(''); }}
              >
                <option value="">Seleccione nivel</option>
                <option value="Inicial">Inicial</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
              </select>
            </div>
            <div>
              <Label>Grado</Label>
              <select
                className={selectClass}
                value={grado}
                onChange={e => setGrado(e.target.value)}
                disabled={!nivel}
              >
                <option value="">Seleccione grado</option>
                {gradosDisponibles.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <Label>Sección / Aula</Label>
              {nivel === 'Inicial' ? (
                <input
                  className={selectClass}
                  type="text"
                  placeholder="Ej: Ositos, Estrellitas..."
                  value={seccion}
                  onChange={e => setSeccion(e.target.value)}
                  disabled={!grado}
                />
              ) : (
                <select
                  className={selectClass}
                  value={seccion}
                  onChange={e => setSeccion(e.target.value)}
                  disabled={!grado}
                >
                  <option value="">Seleccione sección</option>
                  {seccionesDisponibles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!nivel || !grado || !seccion}>
            <Plus className="h-4 w-4 mr-2" />Agregar
          </Button>
        </CardContent>
      </Card>

      {added.length > 0 && (
        <Card className="shadow-card">
          <CardHeader><CardTitle>Estructura Configurada ({added.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Inicial', 'Primaria', 'Secundaria'].map(n => {
                const items = added.filter(a => a.nivel === n);
                if (items.length === 0) return null;
                return (
                  <div key={n}>
                    <h3 className="text-sm font-semibold text-foreground mb-2">{n}</h3>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item, i) => {
                        const globalIndex = added.findIndex(a => a === item);
                        return (
                          <Badge key={i} variant="secondary" className="gap-1 pr-1">
                            {item.grado} – {item.seccion}
                            <button
                              onClick={() => handleRemove(globalIndex)}
                              className="ml-1 rounded-full hover:bg-muted p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button onClick={handleSave} className="mt-4">Guardar Estructura</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NivelesSetup;

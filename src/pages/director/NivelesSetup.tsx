import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, GraduationCap } from 'lucide-react';

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

  const handleSave = () => {
    toast({ title: 'Niveles guardados', description: `${added.length} grados/secciones configurados` });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Niveles, Grados y Secciones</h1>
        <p className="text-muted-foreground">Configure la estructura académica de su institución</p>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Agregar Grado/Sección</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Nivel</Label>
              <Select value={nivel} onValueChange={v => { setNivel(v); setGrado(''); setSeccion(''); }}>
                <SelectTrigger><SelectValue placeholder="Nivel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inicial">Inicial</SelectItem>
                  <SelectItem value="Primaria">Primaria</SelectItem>
                  <SelectItem value="Secundaria">Secundaria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grado</Label>
              <Select value={grado} onValueChange={setGrado} disabled={!nivel}>
                <SelectTrigger><SelectValue placeholder="Grado" /></SelectTrigger>
                <SelectContent>
                  {gradosDisponibles.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sección / Aula</Label>
              <Select value={seccion} onValueChange={setSeccion} disabled={!grado}>
                <SelectTrigger><SelectValue placeholder="Sección" /></SelectTrigger>
                <SelectContent>
                  {seccionesDisponibles.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
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
                      {items.map((item, i) => (
                        <Badge key={i} variant="secondary">
                          {item.grado} – {item.seccion}
                        </Badge>
                      ))}
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

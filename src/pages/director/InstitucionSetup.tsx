import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Save } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorMapper';

const nivelesOptions = ['Inicial', 'Primaria', 'Secundaria'];

const distritos = [
  'Chiclayo', 'José Leonardo Ortiz', 'La Victoria', 'Cayaltí', 'Chongoyape',
  'Eten', 'Puerto Eten', 'Lagunas', 'Monsefú', 'Nueva Arica', 'Oyotún',
  'Pátapo', 'Picsi', 'Pimentel', 'Pomalca', 'Pucalá', 'Reque',
  'Santa Rosa', 'Tumán', 'Zaña',
];

const InstitucionSetup = () => {
  const [nombre, setNombre] = useState('');
  const [codigoLocal, setCodigoLocal] = useState('');
  const [niveles, setNiveles] = useState<string[]>([]);
  const [distrito, setDistrito] = useState('');
  const [centroPoblado, setCentroPoblado] = useState('');
  const [direccion, setDireccion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const toggleNivel = (nivel: string) => {
    setNiveles(prev =>
      prev.includes(nivel) ? prev.filter(n => n !== nivel) : [...prev, nivel]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (niveles.length === 0) {
      toast({ title: 'Error', description: 'Seleccione al menos un nivel', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from('instituciones').insert({
        nombre,
        codigo_local: codigoLocal,
        provincia: 'Chiclayo',
        distrito,
        centro_poblado: centroPoblado,
        direccion,
      });
      if (error) throw error;
      toast({ title: 'Institución registrada', description: nombre });
    } catch (err: any) {
      toast({ title: 'Error', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Datos de la Institución Educativa</h1>
        <p className="text-muted-foreground">Complete la información de su institución</p>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Nombre de la Institución Educativa</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="I.E. N° 10001" />
            </div>
            <div>
              <Label>Código de Local</Label>
              <Input value={codigoLocal} onChange={e => setCodigoLocal(e.target.value)} placeholder="123456" />
            </div>
            <div>
              <Label>Niveles que atiende</Label>
              <div className="flex gap-4 mt-2">
                {nivelesOptions.map(n => (
                  <div key={n} className="flex items-center gap-2">
                    <Checkbox
                      id={`nivel-${n}`}
                      checked={niveles.includes(n)}
                      onCheckedChange={() => toggleNivel(n)}
                    />
                    <Label htmlFor={`nivel-${n}`} className="cursor-pointer font-normal">{n}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Provincia</Label>
              <Input value="Chiclayo" disabled />
            </div>
            <div>
              <Label>Distrito</Label>
              <Select value={distrito} onValueChange={setDistrito}>
                <SelectTrigger><SelectValue placeholder="Seleccione distrito" /></SelectTrigger>
                <SelectContent>
                  {distritos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Centro Poblado</Label>
              <Input value={centroPoblado} onChange={e => setCentroPoblado(e.target.value)} placeholder="(Opcional)" />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Av. Principal 123" />
            </div>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />{isLoading ? 'Guardando…' : 'Guardar Institución'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitucionSetup;

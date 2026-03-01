import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Upload } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorMapper';

const EstudiantesRegistro = () => {
  const [open, setOpen] = useState(false);
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<{ dni: string; nombre: string }[]>([]);
  const { toast } = useToast();

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{8}$/.test(dni)) {
      toast({ title: 'Error', description: 'DNI debe ser exactamente 8 dígitos', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password, dni, nombre_completo: nombre, role: 'estudiante' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStudents([...students, { dni, nombre }]);
      toast({ title: 'Estudiante registrado', description: nombre });
      setOpen(false);
      setDni(''); setNombre(''); setEmail(''); setPassword('');
    } catch (err: any) {
      toast({ title: 'Error', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: 'Archivo recibido', description: `${file.name} – La importación masiva estará disponible próximamente.` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Estudiantes</h1>
          <p className="text-muted-foreground">Registre estudiantes de su aula de forma manual o por importación</p>
        </div>
        <div className="flex gap-2">
          <label htmlFor="file-upload">
            <Button variant="outline" asChild>
              <span><Upload className="h-4 w-4 mr-2" />Importar Excel/CSV</span>
            </Button>
          </label>
          <input id="file-upload" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" />Agregar Estudiante</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Estudiante</DialogTitle></DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4 mt-4">
                <div>
                  <Label>DNI del Estudiante</Label>
                  <Input value={dni} onChange={e => setDni(e.target.value)} required maxLength={8} pattern="\d{8}" placeholder="12345678" />
                </div>
                <div>
                  <Label>Apellidos y Nombres</Label>
                  <Input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="García Pérez, María" />
                </div>
                <div>
                  <Label>Correo Electrónico</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <Label>Contraseña</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registrando…' : 'Registrar Estudiante'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle>Lista de Estudiantes</CardTitle></CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay estudiantes registrados. Agregue estudiantes manualmente o importe un archivo Excel/CSV.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">N°</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">DNI</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Apellidos y Nombres</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={i} className="border-b border-border hover:bg-muted/50">
                      <td className="py-2 px-3">{i + 1}</td>
                      <td className="py-2 px-3 font-mono">{s.dni}</td>
                      <td className="py-2 px-3">{s.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EstudiantesRegistro;

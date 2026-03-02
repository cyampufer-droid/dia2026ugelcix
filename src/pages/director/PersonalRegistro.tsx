import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorMapper';
import BulkPersonalUpload from '@/components/director/BulkPersonalUpload';

const personalRoles = [
  { value: 'subdirector', label: 'Subdirector(a)' },
  { value: 'docente', label: 'Docente' },
  { value: 'estudiante', label: 'Estudiante' },
];

const PersonalRegistro = () => {
  const [open, setOpen] = useState(false);
  const [rol, setRol] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rol) {
      toast({ title: 'Error', description: 'Seleccione un tipo de personal', variant: 'destructive' });
      return;
    }
    if (!/^\d{8}$/.test(dni)) {
      toast({ title: 'Error', description: 'DNI debe ser exactamente 8 dígitos', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password, dni, nombre_completo: nombre, role: rol },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Personal registrado', description: `${nombre} como ${rol}` });
      setOpen(false);
      setRol(''); setEmail(''); setPassword(''); setDni(''); setNombre('');
    } catch (err: any) {
      toast({ title: 'Error', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registro de Personal</h1>
          <p className="text-muted-foreground">Registre subdirectores, docentes y estudiantes de su institución</p>
        </div>
        <div className="flex gap-2">
          <BulkPersonalUpload onComplete={() => {}} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" />Registrar Individual</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Personal</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <Label>Tipo de Personal</Label>
                <Select value={rol} onValueChange={setRol}>
                  <SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
                  <SelectContent>
                    {personalRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>DNI</Label>
                <Input value={dni} onChange={e => setDni(e.target.value)} required maxLength={8} pattern="\d{8}" placeholder="12345678" />
              </div>
              <div>
                <Label>Apellidos y Nombres</Label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="García Pérez, Juan Carlos" />
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
                {isLoading ? 'Registrando…' : 'Registrar'}
              </Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card className="shadow-card">
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">
            El personal registrado aparecerá aquí. Use "Registrar Personal" para agregar subdirectores, docentes y estudiantes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalRegistro;

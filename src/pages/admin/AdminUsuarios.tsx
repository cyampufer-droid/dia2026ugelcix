import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Search } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorMapper';

const roles = [
  { value: 'director', label: 'Director' },
  { value: 'subdirector', label: 'Subdirector' },
  { value: 'docente', label: 'Docente' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'especialista', label: 'Especialista' },
  { value: 'padre', label: 'Padre de Familia' },
];

const AdminUsuarios = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password, dni, nombre_completo: nombre, role: rol },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Usuario creado', description: `${nombre} registrado como ${rol}` });
      setOpen(false);
      setEmail(''); setPassword(''); setDni(''); setNombre(''); setRol('');
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
          <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Registre directores, docentes, estudiantes y demás personal</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Nuevo Usuario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <Label>DNI</Label>
                <Input value={dni} onChange={e => setDni(e.target.value)} required maxLength={8} placeholder="12345678" />
              </div>
              <div>
                <Label>Nombre Completo</Label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Apellidos y Nombres" />
              </div>
              <div>
                <Label>Correo Electrónico</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="correo@ejemplo.com" />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={rol} onValueChange={setRol}>
                  <SelectTrigger><SelectValue placeholder="Seleccione rol" /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creando…' : 'Crear Usuario'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por DNI o nombre…" className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Los usuarios registrados aparecerán aquí. Use el botón "Nuevo Usuario" para comenzar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsuarios;

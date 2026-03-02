import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, RefreshCw, Pencil, Trash2, KeyRound } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorMapper';
import BulkPersonalUpload from '@/components/director/BulkPersonalUpload';

const personalRoles = [
  { value: 'subdirector', label: 'Subdirector(a)' },
  { value: 'docente', label: 'Docente' },
  { value: 'estudiante', label: 'Estudiante' },
];

interface PersonalItem {
  id: string;
  dni: string;
  nombre_completo: string;
  user_id: string | null;
  roles: string[];
}

const roleLabelMap: Record<string, string> = {
  subdirector: 'Subdirector(a)',
  docente: 'Docente',
  estudiante: 'Estudiante',
  director: 'Director(a)',
};

const PersonalRegistro = () => {
  const [open, setOpen] = useState(false);
  const [rol, setRol] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personal, setPersonal] = useState<PersonalItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const { toast } = useToast();
  const { profile, user } = useAuth();

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<PersonalItem | null>(null);
  const [editDni, setEditDni] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editRol, setEditRol] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [deleteItem, setDeleteItem] = useState<PersonalItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Reset password state
  const [resetItem, setResetItem] = useState<PersonalItem | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const fetchPersonal = useCallback(async () => {
    if (!profile?.institucion_id) {
      setPersonal([]);
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, dni, nombre_completo, user_id')
        .eq('institucion_id', profile.institucion_id)
        .neq('user_id', user?.id ?? '');

      if (error) throw error;

      const userIds = (profiles || []).map(p => p.user_id).filter(Boolean) as string[];
      let rolesMap = new Map<string, string[]>();
      if (userIds.length > 0) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);
        for (const r of rolesData || []) {
          const existing = rolesMap.get(r.user_id) || [];
          existing.push(r.role);
          rolesMap.set(r.user_id, existing);
        }
      }

      setPersonal((profiles || []).map(p => ({
        ...p,
        roles: p.user_id ? (rolesMap.get(p.user_id) || []) : [],
      })));
    } catch (err) {
      console.error('Error fetching personal:', err);
    } finally {
      setLoadingList(false);
    }
  }, [profile?.institucion_id, user?.id]);

  useEffect(() => {
    fetchPersonal();
  }, [fetchPersonal]);

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
      fetchPersonal();
    } catch (err: any) {
      toast({ title: 'Error', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (item: PersonalItem) => {
    setEditItem(item);
    setEditDni(item.dni);
    setEditNombre(item.nombre_completo);
    setEditRol(item.roles[0] || '');
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem?.user_id) return;
    if (!/^\d{8}$/.test(editDni)) {
      toast({ title: 'Error', description: 'DNI debe ser exactamente 8 dígitos', variant: 'destructive' });
      return;
    }
    setEditLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'update',
          user_id: editItem.user_id,
          dni: editDni,
          nombre_completo: editNombre,
          role: editRol || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Actualizado', description: `${editNombre} actualizado correctamente` });
      setEditOpen(false);
      fetchPersonal();
    } catch (err: any) {
      toast({ title: 'Error', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?.user_id) return;
    setDeleteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'delete', user_id: deleteItem.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Eliminado', description: `${deleteItem.nombre_completo} ha sido eliminado` });
      setDeleteItem(null);
      fetchPersonal();
    } catch (err: any) {
      toast({ title: 'Error', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetItem?.user_id) return;
    setResetLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'reset-password', user_id: resetItem.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Contraseña reseteada', description: `La contraseña de ${resetItem.nombre_completo} fue reseteada a su DNI` });
      setResetItem(null);
    } catch (err: any) {
      toast({ title: 'Error', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setResetLoading(false);
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
          <BulkPersonalUpload onComplete={fetchPersonal} />
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
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Personal Registrado</h2>
            <Button variant="outline" size="sm" onClick={fetchPersonal} disabled={loadingList}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loadingList ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
          {loadingList ? (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando personal…</p>
          ) : personal.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay personal registrado aún. Use los botones superiores para agregar.
            </p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DNI</TableHead>
                    <TableHead>Apellidos y Nombres</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personal.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{p.dni}</TableCell>
                      <TableCell>{p.nombre_completo}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {p.roles.map(r => (
                            <Badge key={r} variant="secondary">{roleLabelMap[r] || r}</Badge>
                          ))}
                          {p.roles.length === 0 && <span className="text-muted-foreground text-xs">Sin rol</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Resetear contraseña" onClick={() => setResetItem(p)}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Eliminar" className="text-destructive hover:text-destructive" onClick={() => setDeleteItem(p)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Personal</DialogTitle>
            <DialogDescription>Modifique los datos del personal seleccionado</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div>
              <Label>Tipo de Personal</Label>
              <Select value={editRol} onValueChange={setEditRol}>
                <SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
                <SelectContent>
                  {personalRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>DNI</Label>
              <Input value={editDni} onChange={e => setEditDni(e.target.value)} required maxLength={8} pattern="\d{8}" />
            </div>
            <div>
              <Label>Apellidos y Nombres</Label>
              <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading ? 'Guardando…' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {deleteItem?.nombre_completo}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario, su perfil y todos sus datos asociados. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteLoading ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation */}
      <AlertDialog open={!!resetItem} onOpenChange={(open) => !open && setResetItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Resetear contraseña de {resetItem?.nombre_completo}?</AlertDialogTitle>
            <AlertDialogDescription>
              La contraseña se restablecerá al DNI del usuario ({resetItem?.dni}). El usuario podrá cambiarla después de iniciar sesión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} disabled={resetLoading}>
              {resetLoading ? 'Reseteando…' : 'Resetear Contraseña'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PersonalRegistro;

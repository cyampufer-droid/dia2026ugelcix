import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, RefreshCw, Pencil, Trash2, KeyRound, Search } from 'lucide-react';
import { invokeEdgeFunction } from '@/lib/invokeEdgeFunction';
import BulkPersonalUpload from '@/components/director/BulkPersonalUpload';
import SortableTableHead, { useSort, sortData } from '@/components/SortableTableHead';

const personalRoles = [
  { value: 'subdirector', label: 'Subdirector(a)' },
  { value: 'docente', label: 'Docente' },
  { value: 'docente_pip', label: 'Docente PIP (Innovación Pedagógica)' },
  { value: 'estudiante', label: 'Estudiante' },
];

interface NivelGrado {
  id: string;
  nivel: string;
  grado: string;
  seccion: string;
}

interface PersonalItem {
  id: string;
  dni: string;
  nombre_completo: string;
  user_id: string | null;
  grado_seccion_id: string | null;
  roles: string[];
}

const roleLabelMap: Record<string, string> = {
  subdirector: 'Subdirector(a)',
  docente: 'Docente',
  docente_pip: 'Docente PIP',
  estudiante: 'Estudiante',
  director: 'Director(a)',
};

const ESPECIALIDADES = [
  { value: 'Matemática', label: 'Matemática' },
  { value: 'Comunicación', label: 'Comunicación' },
  { value: 'DPCC', label: 'Desarrollo Personal, Ciudadanía y Cívica' },
];

const PersonalRegistro = () => {
  const [open, setOpen] = useState(false);
  const [rol, setRol] = useState('');
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [selectedGradoSeccion, setSelectedGradoSeccion] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personal, setPersonal] = useState<PersonalItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [nivelesGrados, setNivelesGrados] = useState<NivelGrado[]>([]);
  const { toast } = useToast();
  const { profile, user } = useAuth();

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<PersonalItem | null>(null);
  const [editDni, setEditDni] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editRol, setEditRol] = useState('');
  const [editGradoSeccion, setEditGradoSeccion] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [deleteItem, setDeleteItem] = useState<PersonalItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Reset password state
  const [resetItem, setResetItem] = useState<PersonalItem | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch niveles/grados for the director's institution
  useEffect(() => {
    const fetchNiveles = async () => {
      if (!profile?.institucion_id) return;
      const { data } = await supabase
        .from('niveles_grados')
        .select('id, nivel, grado, seccion')
        .eq('institucion_id', profile.institucion_id)
        .order('nivel')
        .order('grado')
        .order('seccion');
      setNivelesGrados(data ?? []);
    };
    fetchNiveles();
  }, [profile?.institucion_id]);

  // Build a map for quick lookup
  const nivelesMap = useMemo(() => {
    const map = new Map<string, NivelGrado>();
    nivelesGrados.forEach(ng => map.set(ng.id, ng));
    return map;
  }, [nivelesGrados]);

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
        .select('id, dni, nombre_completo, user_id, grado_seccion_id')
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
    const trimmedDni = dni.trim();
    if (!/^\d{8}$/.test(trimmedDni)) {
      toast({ title: 'Error', description: 'DNI debe ser exactamente 8 dígitos', variant: 'destructive' });
      return;
    }

    // Pre-check: detect if DNI already exists in loaded personnel list
    const existing = personal.find(p => p.dni === trimmedDni);
    if (existing) {
      toast({
        title: 'DNI ya registrado',
        description: `${existing.nombre_completo} ya está registrado con este DNI. Use el botón de editar para modificar sus datos.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const email = `${trimmedDni}@dia.ugel.local`;
      const password = trimmedDni;
      const selectedNg = nivelesGrados.find(ng => ng.id === selectedGradoSeccion);
      const isSecundaria = selectedNg?.nivel === 'Secundaria';
      await invokeEdgeFunction('create-user', {
        email, password, dni: trimmedDni, nombre_completo: nombre, role: rol,
        institucion_id: profile?.institucion_id || undefined,
        grado_seccion_id: selectedGradoSeccion || undefined,
        especialidad: (rol === 'docente' && isSecundaria && especialidad) ? especialidad : undefined,
      });

      toast({ title: 'Personal registrado', description: `${nombre} como ${rol}. Credenciales: DNI como usuario y contraseña.` });
      setOpen(false);
      setRol(''); setDni(''); setNombre(''); setSelectedGradoSeccion(''); setEspecialidad('');
      fetchPersonal();
    } catch (err: any) {
      const msg = err.message || 'Error al registrar personal';
      // Translate common backend errors to actionable messages
      const friendlyMsg = msg.includes('ya está registrado')
        ? `${msg} Use el botón de editar si necesita modificar sus datos.`
        : msg;
      toast({ title: 'Error al registrar', description: friendlyMsg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (item: PersonalItem) => {
    setEditItem(item);
    setEditDni(item.dni);
    setEditNombre(item.nombre_completo);
    setEditRol(item.roles[0] || '');
    setEditGradoSeccion(item.grado_seccion_id || '');
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
      await invokeEdgeFunction('manage-user', {
        action: 'update',
        user_id: editItem.user_id,
        dni: editDni,
        nombre_completo: editNombre,
        role: editRol || undefined,
      });

      // Update grado_seccion_id directly on profile (using service role via manage-user would be better, but for now update directly)
      if (editItem.user_id) {
        await supabase
          .from('profiles')
          .update({ grado_seccion_id: editGradoSeccion || null })
          .eq('user_id', editItem.user_id);
      }

      toast({ title: 'Actualizado', description: `${editNombre} actualizado correctamente` });
      setEditOpen(false);
      fetchPersonal();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al actualizar', variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?.user_id) return;
    setDeleteLoading(true);
    try {
      await invokeEdgeFunction('manage-user', {
        action: 'delete', user_id: deleteItem.user_id,
      });
      toast({ title: 'Eliminado', description: `${deleteItem.nombre_completo} ha sido eliminado` });
      setDeleteItem(null);
      fetchPersonal();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al eliminar', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetItem?.user_id) return;
    setResetLoading(true);
    try {
      await invokeEdgeFunction('manage-user', {
        action: 'reset-password', user_id: resetItem.user_id,
      });
      toast({ title: 'Contraseña reseteada', description: `La contraseña de ${resetItem.nombre_completo} fue reseteada a su DNI` });
      setResetItem(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al resetear contraseña', variant: 'destructive' });
    } finally {
      setResetLoading(false);
    }
  };

  const formatAula = (gradoSeccionId: string | null) => {
    if (!gradoSeccionId) return null;
    const ng = nivelesMap.get(gradoSeccionId);
    if (!ng) return null;
    return `${ng.nivel} - ${ng.grado} "${ng.seccion}"`;
  };

  const { sort, handleSort } = useSort();

  const filteredPersonal = useMemo(() => {
    if (!searchQuery.trim()) return personal;
    const q = searchQuery.toLowerCase();
    return personal.filter(p =>
      p.dni.toLowerCase().includes(q) ||
      p.nombre_completo.toLowerCase().includes(q) ||
      p.roles.some(r => (roleLabelMap[r] || r).toLowerCase().includes(q))
    );
  }, [personal, searchQuery]);

  const sortedPersonal = sortData(filteredPersonal, sort, (p, key) => {
    if (key === 'dni') return p.dni;
    if (key === 'nombre_completo') return p.nombre_completo;
    if (key === 'rol') return p.roles.map(r => roleLabelMap[r] || r).join(', ');
    if (key === 'aula') return formatAula(p.grado_seccion_id) || 'zzz';
    return '';
  });

  const AulaSelector = ({ value, onChange, label = 'Nivel / Grado / Sección' }: { value: string; onChange: (v: string) => void; label?: string }) => (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Seleccione aula (opcional)</option>
        {nivelesGrados.map(ng => (
          <option key={ng.id} value={ng.id}>
            {ng.nivel} - {ng.grado} "{ng.seccion}"
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registro de Personal</h1>
          <p className="text-muted-foreground">Registre subdirectores, docentes y estudiantes de su institución</p>
        </div>
        <div className="flex gap-2">
          <BulkPersonalUpload onComplete={fetchPersonal} nivelesGrados={nivelesGrados} institucionId={profile?.institucion_id ?? null} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" />Registrar Individual</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Personal</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div>
                  <Label>Tipo de Personal</Label>
                  <select
                    value={rol}
                    onChange={e => setRol(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="" disabled>Seleccione tipo</option>
                    {personalRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label>DNI</Label>
                  <Input value={dni} onChange={e => setDni(e.target.value)} required maxLength={8} pattern="\d{8}" placeholder="12345678" />
                </div>
                <div>
                  <Label>Apellidos y Nombres</Label>
                  <Input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="García Pérez, Juan Carlos" />
                </div>
                <p className="text-xs text-muted-foreground bg-muted rounded p-2">
                  📧 Correo: <strong>{dni ? `${dni}@dia.ugel.local` : '{DNI}@dia.ugel.local'}</strong><br/>
                  🔑 Contraseña inicial: <strong>DNI</strong>. El usuario deberá cambiarla al ingresar por primera vez.
                </p>
                <AulaSelector value={selectedGradoSeccion} onChange={setSelectedGradoSeccion} />
                {rol === 'docente' && (() => {
                  const selectedNg = nivelesGrados.find(ng => ng.id === selectedGradoSeccion);
                  return selectedNg?.nivel === 'Secundaria';
                })() && (
                  <div>
                    <Label>Especialidad (Secundaria)</Label>
                    <select
                      value={especialidad}
                      onChange={e => setEspecialidad(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="" disabled>Seleccione especialidad</option>
                      {ESPECIALIDADES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </div>
                )}
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Personal Registrado</h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por DNI o nombre…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchPersonal} disabled={loadingList}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loadingList ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
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
                    <SortableTableHead label="DNI" sortKey="dni" currentSort={sort} onSort={handleSort} />
                    <SortableTableHead label="Apellidos y Nombres" sortKey="nombre_completo" currentSort={sort} onSort={handleSort} />
                    <SortableTableHead label="Rol" sortKey="rol" currentSort={sort} onSort={handleSort} />
                    <SortableTableHead label="Nivel / Grado / Sección" sortKey="aula" currentSort={sort} onSort={handleSort} />
                    <SortableTableHead label="Acciones" sortKey="" currentSort={{ key: '', direction: null }} onSort={() => {}} className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPersonal.map(p => (
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
                      <TableCell>
                        {formatAula(p.grado_seccion_id) ? (
                          <Badge variant="outline">{formatAula(p.grado_seccion_id)}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sin asignar</span>
                        )}
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
              <select
                value={editRol}
                onChange={e => setEditRol(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>Seleccione tipo</option>
                {personalRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <Label>DNI</Label>
              <Input value={editDni} onChange={e => setEditDni(e.target.value)} required maxLength={8} pattern="\d{8}" />
            </div>
            <div>
              <Label>Apellidos y Nombres</Label>
              <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} required />
            </div>
            <AulaSelector value={editGradoSeccion} onChange={setEditGradoSeccion} />
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

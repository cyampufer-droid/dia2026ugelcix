import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Search, Pencil, Trash2, Loader2, RefreshCw, Download, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { invokeEdgeFunction } from '@/lib/invokeEdgeFunction';
import BulkUserUpload from '@/components/admin/BulkUserUpload';
import * as XLSX from 'xlsx';
import SortableTableHead, { useSort, sortData } from '@/components/SortableTableHead';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const roles = [
  { value: 'director', label: 'Director' },
  { value: 'subdirector', label: 'Subdirector' },
  { value: 'docente', label: 'Docente' },
  { value: 'docente_pip', label: 'Docente PIP' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'especialista', label: 'Especialista' },
  { value: 'padre', label: 'Padre de Familia' },
  { value: 'administrador', label: 'Administrador' },
];

const roleLabelMap: Record<string, string> = {
  director: 'Director',
  subdirector: 'Subdirector',
  docente: 'Docente',
  docente_pip: 'Docente PIP',
  estudiante: 'Estudiante',
  especialista: 'Especialista',
  padre: 'Padre de Familia',
  administrador: 'Administrador',
};

interface UserRow {
  id: string;
  email: string;
  dni: string;
  nombre_completo: string;
  roles: string[];
  created_at: string;
  institucion_nombre?: string;
  distrito?: string;
  centro_poblado?: string;
  direccion?: string;
  tipo_gestion?: string;
  nivel?: string;
  grado?: string;
  seccion?: string;
}

const AdminUsuarios = () => {
  const [open, setOpen] = useState(false);
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // List state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editDni, setEditDni] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editRol, setEditRol] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Collapsible role sections
  const [openRoles, setOpenRoles] = useState<Set<string>>(new Set());

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Usar la versión optimizada de la Edge Function
      const data = await invokeEdgeFunction('list-users-optimized', { 
        limit: 1000, 
        offset: 0 
      });
      setUsers(data.users || []);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('No autorizado') || msg.includes('401') || msg.includes('Unauthorized')) {
        toast({ title: 'Sesión expirada', description: 'Por favor, cierre sesión y vuelva a ingresar.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: msg || 'Error al cargar usuarios', variant: 'destructive' });
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const email = `${dni.trim()}@dia.ugel.local`;
      const password = dni.trim();
      const isPip = rol === 'docente_pip';
      await invokeEdgeFunction('create-user', {
        email, password, dni, nombre_completo: nombre, role: isPip ? 'docente' : rol, is_pip: isPip || undefined,
      });
      toast({ title: 'Usuario creado', description: `${nombre} registrado como ${roleLabelMap[rol] || rol}. Credenciales: DNI como usuario y contraseña.` });
      setOpen(false);
      setDni(''); setNombre(''); setRol('');
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al crear usuario', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (user: UserRow) => {
    setEditUser(user);
    setEditEmail(user.email);
    setEditDni(user.dni);
    setEditNombre(user.nombre_completo);
    setEditRol(user.roles[0] || '');
    setEditPassword('');
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    try {
      const body: any = { action: 'update', user_id: editUser.id };
      if (editEmail !== editUser.email) body.email = editEmail;
      if (editDni !== editUser.dni) body.dni = editDni;
      if (editNombre !== editUser.nombre_completo) body.nombre_completo = editNombre;
      if (editRol !== editUser.roles[0]) body.role = editRol;
      if (editPassword) body.password = editPassword;

      await invokeEdgeFunction('manage-user', body);
      toast({ title: 'Usuario actualizado' });
      setEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al actualizar', variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    try {
      await invokeEdgeFunction('manage-user', {
        action: 'delete', user_id: deleteUser.id,
      });
      toast({ title: 'Usuario eliminado', description: `${deleteUser.nombre_completo} ha sido eliminado` });
      setDeleteOpen(false);
      setDeleteUser(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al eliminar', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.dni.toLowerCase().includes(term) ||
      u.nombre_completo.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.roles.some((r) => (roleLabelMap[r] || r).toLowerCase().includes(term))
    );
  });

  const { sort, handleSort } = useSort();

  const sortedUsers = sortData(filteredUsers, sort, (u, key) => {
    if (key === 'dni') return u.dni;
    if (key === 'nombre_completo') return u.nombre_completo;
    if (key === 'email') return u.email;
    if (key === 'rol') return u.roles.map(r => roleLabelMap[r] || r).join(', ');
    return '';
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedUsers.map(u => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map(id => invokeEdgeFunction('manage-user', { action: 'delete', user_id: id })));
      toast({ title: 'Usuarios eliminados', description: `${ids.length} usuario(s) eliminado(s) correctamente` });
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al eliminar usuarios', variant: 'destructive' });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const downloadExcel = () => {
    const data = filteredUsers.map((u) => ({
      'Distrito': u.distrito || '',
      'Centro Poblado': u.centro_poblado || '',
      'Dirección': u.direccion || '',
      'Gestión': u.tipo_gestion || '',
      'Institución Educativa': u.institucion_nombre || '',
      'Nivel': u.nivel || '',
      'Grado': u.grado || '',
      'Sección': u.seccion || '',
      'DNI': u.dni,
      'Nombre Completo': u.nombre_completo,
      'Correo Electrónico': u.email,
      'Rol': u.roles.map((r) => roleLabelMap[r] || r).join(', '),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'usuarios_dia2026.xlsx');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Registre directores, docentes, estudiantes y demás personal</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadExcel} disabled={filteredUsers.length === 0}>
            <Download className="h-4 w-4 mr-2" />Descargar Excel
          </Button>
          <BulkUserUpload onComplete={fetchUsers} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" />Nuevo Usuario</Button>
            </DialogTrigger>
          <DialogContent>
             <DialogHeader>
               <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
               <DialogDescription>Complete los datos del nuevo usuario del sistema</DialogDescription>
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
              <p className="text-xs text-muted-foreground bg-muted rounded p-2">
                📧 El correo se generará automáticamente como <strong>{dni ? `${dni}@dia.ugel.local` : '{DNI}@dia.ugel.local'}</strong><br/>
                🔑 La contraseña inicial será el <strong>DNI</strong>. El usuario deberá cambiarla en su primer inicio de sesión.
              </p>
               <div>
                 <Label>Rol</Label>
                 <select
                   value={rol}
                   onChange={e => setRol(e.target.value)}
                   required
                   className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                 >
                   <option value="" disabled>Seleccione rol</option>
                   {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                 </select>
               </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creando…' : 'Crear Usuario'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por DNI, nombre, correo o rol…"
                className="max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar ({selectedIds.size})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loadingUsers}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loadingUsers ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
           ) : sortedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {users.length === 0
                ? 'No hay usuarios registrados. Use el botón "Nuevo Usuario" para comenzar.'
                : 'No se encontraron usuarios con ese criterio de búsqueda.'}
            </p>
          ) : (
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="w-10 p-2">
                      <Checkbox
                        checked={sortedUsers.length > 0 && selectedIds.size === sortedUsers.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Seleccionar todos"
                      />
                    </TableCell>
                    <SortableTableHead label="DNI" sortKey="dni" currentSort={sort} onSort={handleSort} />
                    <SortableTableHead label="Nombre Completo" sortKey="nombre_completo" currentSort={sort} onSort={handleSort} />
                    <SortableTableHead label="Correo Electrónico" sortKey="email" currentSort={sort} onSort={handleSort} />
                    <SortableTableHead label="Rol" sortKey="rol" currentSort={sort} onSort={handleSort} />
                    <SortableTableHead label="Acciones" sortKey="" currentSort={{ key: '', direction: null }} onSort={() => {}} className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow key={user.id} data-state={selectedIds.has(user.id) ? 'selected' : undefined}>
                      <TableCell className="w-10 p-2">
                        <Checkbox
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={() => toggleSelect(user.id)}
                          aria-label={`Seleccionar ${user.nombre_completo}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{user.dni}</TableCell>
                      <TableCell>{user.nombre_completo}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.roles.map((r) => (
                          <Badge key={r} variant="secondary" className="mr-1">
                            {roleLabelMap[r] || r}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(user)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setDeleteUser(user); setDeleteOpen(true); }}
                            title="Eliminar"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2">
                {sortedUsers.length} de {users.length} usuarios
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div>
              <Label>DNI</Label>
              <Input value={editDni} onChange={e => setEditDni(e.target.value)} required maxLength={8} />
            </div>
            <div>
              <Label>Nombre Completo</Label>
              <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} required />
            </div>
            <div>
              <Label>Correo Electrónico</Label>
              <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Nueva Contraseña (dejar vacío para no cambiar)</Label>
              <Input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} minLength={6} placeholder="••••••" />
            </div>
             <div>
               <Label>Rol</Label>
               <select
                 value={editRol}
                 onChange={e => setEditRol(e.target.value)}
                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
               >
                 <option value="" disabled>Seleccione rol</option>
                 {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
               </select>
             </div>
            <Button type="submit" className="w-full" disabled={editLoading}>
              {editLoading ? 'Guardando…' : 'Guardar Cambios'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            ¿Está seguro de que desea eliminar al usuario <strong>{deleteUser?.nombre_completo}</strong> ({deleteUser?.dni})?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación Masiva</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            ¿Está seguro de que desea eliminar <strong>{selectedIds.size} usuario(s)</strong>?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleteLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteLoading}>
              {bulkDeleteLoading ? 'Eliminando…' : `Eliminar ${selectedIds.size} usuario(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsuarios;

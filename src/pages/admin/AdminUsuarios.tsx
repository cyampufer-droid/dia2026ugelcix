import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Search, Pencil, Trash2, Loader2, RefreshCw, Download, ChevronDown, ChevronRight, Users, ChevronLeft } from 'lucide-react';
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

interface NivelGrado {
  id: string;
  nivel: string;
  grado: string;
  seccion: string;
  institucion_id: string;
}

interface Institucion {
  id: string;
  nombre: string;
}

const ESPECIALIDADES = [
  { value: 'Matemática', label: 'Matemática' },
  { value: 'Comunicación', label: 'Comunicación' },
  { value: 'DPCC', label: 'Desarrollo Personal, Ciudadanía y Cívica' },
];

const rolesNeedInstitution = ['director', 'subdirector', 'docente', 'docente_pip', 'estudiante'];
const rolesNeedAula = ['director', 'subdirector', 'docente', 'estudiante'];

const PAGE_SIZE = 500;

const AdminUsuarios = () => {
  const [open, setOpen] = useState(false);
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('');
  const [selectedInstitucion, setSelectedInstitucion] = useState('');
  const [selectedGradoSeccion, setSelectedGradoSeccion] = useState('');
  const [selectedMultiGrados, setSelectedMultiGrados] = useState<string[]>([]);
  const [especialidad, setEspecialidad] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Instituciones & niveles
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [nivelesGrados, setNivelesGrados] = useState<NivelGrado[]>([]);

  // List state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async (page = currentPage) => {
    setLoadingUsers(true);
    try {
      const data = await invokeEdgeFunction('list-users-optimized', {
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        roleFilter,
      });
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
      setCurrentPage(page);
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
  }, [currentPage, debouncedSearch, roleFilter, toast]);

  useEffect(() => {
    fetchUsers(0);
  }, [debouncedSearch, roleFilter]);

  // Initial load
  useEffect(() => {
    fetchUsers(0);
  }, []);

  // Fetch instituciones on mount
  useEffect(() => {
    const fetchInstituciones = async () => {
      const { data } = await supabase
        .from('instituciones')
        .select('id, nombre')
        .order('nombre');
      setInstituciones(data ?? []);
    };
    fetchInstituciones();
  }, []);

  // Fetch niveles when institution changes
  useEffect(() => {
    if (!selectedInstitucion) {
      setNivelesGrados([]);
      setSelectedGradoSeccion('');
      setSelectedMultiGrados([]);
      return;
    }
    const fetchNiveles = async () => {
      const { data } = await supabase
        .from('niveles_grados')
        .select('id, nivel, grado, seccion, institucion_id')
        .eq('institucion_id', selectedInstitucion)
        .order('nivel')
        .order('grado')
        .order('seccion');
      setNivelesGrados(data ?? []);
    };
    fetchNiveles();
  }, [selectedInstitucion]);

  // Filtered niveles for the form
  const filteredNiveles = useMemo(() => {
    return nivelesGrados.filter(ng => ng.seccion !== 'PIP');
  }, [nivelesGrados]);

  const secundariaNiveles = useMemo(() => {
    return filteredNiveles.filter(ng => ng.nivel === 'Secundaria');
  }, [filteredNiveles]);

  const showSecundariaMulti = rol === 'docente' && secundariaNiveles.length > 0;

  const needsInstitution = rolesNeedInstitution.includes(rol);
  const needsAula = rolesNeedAula.includes(rol) && rol !== 'docente_pip';
  const isSecundariaSelected = (() => {
    if (selectedMultiGrados.length > 0) return true;
    const ng = nivelesGrados.find(n => n.id === selectedGradoSeccion);
    return ng?.nivel === 'Secundaria';
  })();
  const needsEspecialidad = rol === 'docente' && isSecundariaSelected;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const email = `${dni.trim()}@dia.ugel.local`;
      const password = dni.trim();
      const isPip = rol === 'docente_pip';

      const payload: any = {
        email, password, dni, nombre_completo: nombre,
        role: isPip ? 'docente' : rol,
        is_pip: isPip || undefined,
      };

      if (needsInstitution && selectedInstitucion) {
        payload.institucion_id = selectedInstitucion;
      }

      if (needsAula && !isPip) {
        if (showSecundariaMulti && selectedMultiGrados.length > 0) {
          payload.grado_seccion_ids = selectedMultiGrados;
          payload.grado_seccion_id = selectedMultiGrados[0];
        } else if (selectedGradoSeccion) {
          payload.grado_seccion_id = selectedGradoSeccion;
        }
      }

      if (needsEspecialidad && especialidad) {
        payload.especialidad = especialidad;
      }

      await invokeEdgeFunction('create-user', payload);
      toast({ title: 'Usuario creado', description: `${nombre} registrado como ${roleLabelMap[rol] || rol}.` });
      setOpen(false);
      setDni(''); setNombre(''); setRol('');
      setSelectedInstitucion(''); setSelectedGradoSeccion('');
      setSelectedMultiGrados([]); setEspecialidad('');
      fetchUsers(currentPage);
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
      fetchUsers(currentPage);
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
      await invokeEdgeFunction('manage-user', { action: 'delete', user_id: deleteUser.id });
      toast({ title: 'Usuario eliminado', description: `${deleteUser.nombre_completo} ha sido eliminado` });
      setDeleteOpen(false);
      setDeleteUser(null);
      fetchUsers(currentPage);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al eliminar', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const { sort, handleSort } = useSort();

  const sortedUsers = sortData(users, sort, (u, key) => {
    if (key === 'dni') return u.dni;
    if (key === 'nombre_completo') return u.nombre_completo;
    if (key === 'email') return u.email;
    if (key === 'rol') return u.roles.map(r => roleLabelMap[r] || r).join(', ');
    return '';
  });

  // Group users by primary role
  const usersByRole = useMemo(() => {
    const groups: Record<string, UserRow[]> = {};
    for (const u of sortedUsers) {
      const primaryRole = u.roles[0] || 'sin_rol';
      if (!groups[primaryRole]) groups[primaryRole] = [];
      groups[primaryRole].push(u);
    }
    const roleOrder = roles.map(r => r.value);
    roleOrder.push('sin_rol');
    const sorted: [string, UserRow[]][] = [];
    for (const r of roleOrder) {
      if (groups[r]) sorted.push([r, groups[r]]);
    }
    return sorted;
  }, [sortedUsers]);

  const toggleRoleOpen = (role: string) => {
    setOpenRoles(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role); else next.add(role);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map(id => invokeEdgeFunction('manage-user', { action: 'delete', user_id: id })));
      toast({ title: 'Usuarios eliminados', description: `${ids.length} usuario(s) eliminado(s) correctamente` });
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      fetchUsers(currentPage);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al eliminar usuarios', variant: 'destructive' });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const downloadExcel = async () => {
    toast({ title: 'Exportando…', description: 'Descargando todos los usuarios del sistema.' });
    try {
      const data = await invokeEdgeFunction('export-users', {});
      if (!data?.users?.length) {
        toast({ title: 'Sin datos', description: 'No hay usuarios para exportar.', variant: 'destructive' });
        return;
      }
      const rows = data.users.map((u: any, i: number) => ({
        'N°': i + 1,
        'Distrito': u.distrito || '',
        'Centro Poblado': u.centro_poblado || '',
        'Tipo Gestión': u.tipo_gestion || '',
        'Institución Educativa': u.institucion || '',
        'Nivel': u.nivel || '',
        'Grado': u.grado || '',
        'Sección': u.seccion || '',
        'DNI': u.dni,
        'Nombre Completo': u.nombre_completo,
        'Correo Electrónico': u.email,
        'Rol': u.roles,
        'PIP': u.is_pip ? 'Sí' : 'No',
        'Fecha Registro': u.created_at,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
      XLSX.writeFile(wb, `usuarios_dia2026_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: 'Exportación completada', description: `${data.total} usuarios exportados.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al exportar', variant: 'destructive' });
    }
  };

  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Registre directores, docentes, estudiantes y demás personal</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadExcel} disabled={sortedUsers.length === 0}>
            <Download className="h-4 w-4 mr-2" />Descargar Excel
          </Button>
          <BulkUserUpload onComplete={() => fetchUsers(currentPage)} />
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
                  🔑 La contraseña inicial será el <strong>DNI</strong>.
                </p>
                <div>
                  <Label>Rol</Label>
                  <select
                    value={rol}
                    onChange={e => { setRol(e.target.value); setSelectedGradoSeccion(''); setSelectedMultiGrados([]); setEspecialidad(''); }}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="" disabled>Seleccione rol</option>
                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                {needsInstitution && (
                  <div>
                    <Label>Institución Educativa</Label>
                    <select
                      value={selectedInstitucion}
                      onChange={e => { setSelectedInstitucion(e.target.value); setSelectedGradoSeccion(''); setSelectedMultiGrados([]); }}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="" disabled>Seleccione institución</option>
                      {instituciones.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                    </select>
                  </div>
                )}

                {needsAula && selectedInstitucion && (
                  <>
                    {showSecundariaMulti ? (
                      <div>
                        <Label>Aulas de Secundaria (selección múltiple)</Label>
                        <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                          {secundariaNiveles.map(ng => (
                            <label key={ng.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1">
                              <Checkbox
                                checked={selectedMultiGrados.includes(ng.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedMultiGrados(prev =>
                                    checked ? [...prev, ng.id] : prev.filter(id => id !== ng.id)
                                  );
                                }}
                              />
                              {ng.grado} "{ng.seccion}"
                            </label>
                          ))}
                        </div>
                        {filteredNiveles.some(ng => ng.nivel !== 'Secundaria') && (
                          <div className="mt-2">
                            <Label>O seleccione un aula de otro nivel</Label>
                            <select
                              value={selectedGradoSeccion}
                              onChange={e => { setSelectedGradoSeccion(e.target.value); setSelectedMultiGrados([]); }}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="">-- Otro nivel --</option>
                              {filteredNiveles.filter(ng => ng.nivel !== 'Secundaria').map(ng => (
                                <option key={ng.id} value={ng.id}>{ng.nivel} - {ng.grado} "{ng.seccion}"</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Label>Nivel / Grado / Sección</Label>
                        <select
                          value={selectedGradoSeccion}
                          onChange={e => setSelectedGradoSeccion(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Seleccione aula</option>
                          {filteredNiveles.map(ng => (
                            <option key={ng.id} value={ng.id}>{ng.nivel} - {ng.grado} "{ng.seccion}"</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {needsEspecialidad && (
                  <div>
                    <Label>Especialidad</Label>
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
                  {isLoading ? 'Creando…' : 'Crear Usuario'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por DNI o nombre…"
                className="max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(0); }}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todos los roles</option>
                {roles.filter(r => r.value !== 'docente_pip').map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar ({selectedIds.size})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => fetchUsers(currentPage)} disabled={loadingUsers}>
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
              {totalUsers === 0
                ? 'No hay usuarios registrados. Use el botón "Nuevo Usuario" para comenzar.'
                : 'No se encontraron usuarios con ese criterio de búsqueda.'}
            </p>
          ) : (
            <div className="space-y-2">
              {usersByRole.map(([role, roleUsers]) => (
                <Collapsible key={role} open={openRoles.has(role)} onOpenChange={() => toggleRoleOpen(role)}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors text-left border border-border">
                      {openRoles.has(role) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{roleLabelMap[role] || role}</span>
                      <Badge variant="secondary" className="ml-auto">{roleUsers.length}</Badge>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="overflow-x-auto mt-1 border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableCell className="w-10 p-2">
                              <Checkbox
                                checked={roleUsers.every(u => selectedIds.has(u.id))}
                                onCheckedChange={() => {
                                  const allSelected = roleUsers.every(u => selectedIds.has(u.id));
                                  setSelectedIds(prev => {
                                    const next = new Set(prev);
                                    roleUsers.forEach(u => allSelected ? next.delete(u.id) : next.add(u.id));
                                    return next;
                                  });
                                }}
                                aria-label={`Seleccionar todos los ${roleLabelMap[role] || role}`}
                              />
                            </TableCell>
                            <SortableTableHead label="DNI" sortKey="dni" currentSort={sort} onSort={handleSort} />
                            <SortableTableHead label="Nombre Completo" sortKey="nombre_completo" currentSort={sort} onSort={handleSort} />
                            <SortableTableHead label="Correo Electrónico" sortKey="email" currentSort={sort} onSort={handleSort} />
                            <SortableTableHead label="Acciones" sortKey="" currentSort={{ key: '', direction: null }} onSort={() => {}} className="text-right" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roleUsers.map((user) => (
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
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-muted-foreground">
                  Mostrando {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalUsers)} de {totalUsers} usuarios
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0 || loadingUsers}
                    onClick={() => fetchUsers(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage + 1} de {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages - 1 || loadingUsers}
                    onClick={() => fetchUsers(currentPage + 1)}
                  >
                    Siguiente<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
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
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>Cancelar</Button>
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
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleteLoading}>Cancelar</Button>
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

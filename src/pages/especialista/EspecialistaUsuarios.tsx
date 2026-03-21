import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Loader2 } from 'lucide-react';
import { invokeEdgeFunction } from '@/lib/invokeEdgeFunction';
import SortableTableHead, { useSort, sortData } from '@/components/SortableTableHead';
import ExportUsersButton from '@/components/shared/ExportUsersButton';

interface UserRow {
  dni: string;
  nombre_completo: string;
  roles: string;
  email: string;
  institucion: string;
  distrito: string;
  centro_poblado: string;
  tipo_gestion: string;
  nivel: string;
  grado: string;
  seccion: string;
  is_pip: boolean;
  created_at: string;
}

const roleLabelMap: Record<string, string> = {
  director: 'Director',
  subdirector: 'Subdirector',
  docente: 'Docente',
  estudiante: 'Estudiante',
  especialista: 'Especialista',
  padre: 'Padre',
  administrador: 'Administrador',
};

const EspecialistaUsuarios = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [distritoFilter, setDistritoFilter] = useState('');
  const { sortField, sortDirection, handleSort } = useSort('nombre_completo', 'asc');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invokeEdgeFunction('export-users', {});
      setUsers(data?.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const distritos = useMemo(() => {
    const set = new Set(users.map(u => u.distrito).filter(Boolean));
    return [...set].sort();
  }, [users]);

  const allRoles = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => u.roles.split(', ').forEach(r => r && set.add(r)));
    return [...set].sort();
  }, [users]);

  const filtered = useMemo(() => {
    let result = users;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(u =>
        u.dni.toLowerCase().includes(q) ||
        u.nombre_completo.toLowerCase().includes(q) ||
        u.institucion.toLowerCase().includes(q)
      );
    }
    if (roleFilter) {
      result = result.filter(u => u.roles.includes(roleFilter));
    }
    if (distritoFilter) {
      result = result.filter(u => u.distrito === distritoFilter);
    }
    return sortData(result, sortField, sortDirection);
  }, [users, searchTerm, roleFilter, distritoFilter, sortField, sortDirection]);

  const roleColor = (roles: string) => {
    if (roles.includes('administrador')) return 'destructive';
    if (roles.includes('director') || roles.includes('subdirector')) return 'default';
    if (roles.includes('docente')) return 'secondary';
    if (roles.includes('estudiante')) return 'outline';
    return 'secondary';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios del Sistema</h1>
          <p className="text-muted-foreground">
            {loading ? 'Cargando…' : `${filtered.length} de ${users.length} usuarios`}
          </p>
        </div>
        <ExportUsersButton label="Exportar Todos" fileName="usuarios_ugel" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por DNI, nombre o institución…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={v => setRoleFilter(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todos los roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los roles</SelectItem>
            {allRoles.map(r => (
              <SelectItem key={r} value={r}>{roleLabelMap[r] || r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={distritoFilter} onValueChange={v => setDistritoFilter(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todos los distritos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los distritos</SelectItem>
            {distritos.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Listado de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Cargando todos los usuarios…</span>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <SortableTableHead field="index" label="N°" sortField={sortField} sortDirection={sortDirection} onSort={() => {}} className="w-12" />
                    <SortableTableHead field="dni" label="DNI" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableTableHead field="nombre_completo" label="Apellidos y Nombres" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableTableHead field="roles" label="Rol" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableTableHead field="institucion" label="Institución" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableTableHead field="distrito" label="Distrito" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableTableHead field="nivel" label="Nivel" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableTableHead field="grado" label="Grado" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableTableHead field="seccion" label="Sección" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No se encontraron usuarios</TableCell></TableRow>
                  ) : (
                    filtered.map((u, i) => (
                      <TableRow key={`${u.dni}-${i}`}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-mono">{u.dni}</TableCell>
                        <TableCell>{u.nombre_completo}{u.is_pip && <Badge variant="secondary" className="ml-2 text-xs">PIP</Badge>}</TableCell>
                        <TableCell>
                          <Badge variant={roleColor(u.roles) as any} className="text-xs">
                            {u.roles.split(', ').map(r => roleLabelMap[r] || r).join(', ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{u.institucion || '—'}</TableCell>
                        <TableCell>{u.distrito || '—'}</TableCell>
                        <TableCell>{u.nivel || '—'}</TableCell>
                        <TableCell>{u.grado || '—'}</TableCell>
                        <TableCell>{u.seccion || '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EspecialistaUsuarios;

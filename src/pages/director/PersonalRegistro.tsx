import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, RefreshCw, Pencil, Trash2, KeyRound, Search, ChevronDown, ChevronRight, Users } from 'lucide-react';
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
  is_pip: boolean;
  roles: string[];
  especialidad?: string | null;
  docente_grados_ids?: string[];
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
  const [selectedMultiGrados, setSelectedMultiGrados] = useState<string[]>([]);
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
  const [editMultiGrados, setEditMultiGrados] = useState<string[]>([]);
  const [editEspecialidad, setEditEspecialidad] = useState('');
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

  const secundariaNiveles = useMemo(() => {
    return nivelesGrados.filter(ng => ng.nivel === 'Secundaria');
  }, [nivelesGrados]);

  // Group secundaria by grado for display
  const secundariaByGrado = useMemo(() => {
    const map = new Map<string, NivelGrado[]>();
    for (const ng of secundariaNiveles) {
      const list = map.get(ng.grado) || [];
      list.push(ng);
      map.set(ng.grado, list);
    }
    return map;
  }, [secundariaNiveles]);

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
        .select('id, dni, nombre_completo, user_id, grado_seccion_id, is_pip, especialidad')
        .eq('institucion_id', profile.institucion_id)
        .neq('user_id', user?.id ?? '');

      if (error) throw error;

      const userIds = (profiles || []).map(p => p.user_id).filter(Boolean) as string[];
      let rolesMap = new Map<string, string[]>();
      let docenteGradosMap = new Map<string, string[]>();

      if (userIds.length > 0) {
        const [rolesRes, dgRes] = await Promise.all([
          supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
          supabase.from('docente_grados').select('user_id, grado_seccion_id').in('user_id', userIds),
        ]);

        for (const r of rolesRes.data || []) {
          const existing = rolesMap.get(r.user_id) || [];
          existing.push(r.role);
          rolesMap.set(r.user_id, existing);
        }
        for (const dg of dgRes.data || []) {
          const existing = docenteGradosMap.get(dg.user_id) || [];
          existing.push(dg.grado_seccion_id);
          docenteGradosMap.set(dg.user_id, existing);
        }
      }

      setPersonal((profiles || []).map(p => ({
        ...p,
        is_pip: !!(p as any).is_pip,
        roles: p.user_id ? (rolesMap.get(p.user_id) || []) : [],
        docente_grados_ids: p.user_id ? (docenteGradosMap.get(p.user_id) || []) : [],
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

  // Determine if we should show multi-select (secundaria docente, not PIP)
  const isSecundariaDocente = (rolValue: string, gradoSeccionId?: string) => {
    if (rolValue === 'docente_pip') return false;
    if (rolValue !== 'docente') return false;
    // If a single grado is selected, check if it's secundaria
    if (gradoSeccionId) {
      const ng = nivelesMap.get(gradoSeccionId);
      return ng?.nivel === 'Secundaria';
    }
    return false;
  };

  // For new docente: detect if we should show secundaria multi-select
  const showSecundariaMulti = rol === 'docente' && secundariaNiveles.length > 0;

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

    const existing = personal.find(p => p.dni === trimmedDni);
    if (existing) {
      toast({
        title: 'DNI ya registrado',
        description: `${existing.nombre_completo} ya está registrado con este DNI. Use el botón de editar para modificar sus datos.`,
        variant: 'destructive',
      });
      return;
    }

    // For secundaria docentes, validate multi-select
    const useMultiGrado = rol === 'docente' && selectedMultiGrados.length > 0;
    const isSecundaria = useMultiGrado || (() => {
      const ng = nivelesGrados.find(ng => ng.id === selectedGradoSeccion);
      return ng?.nivel === 'Secundaria';
    })();

    if (rol === 'docente' && isSecundaria && !especialidad) {
      toast({ title: 'Error', description: 'Seleccione la especialidad del docente de Secundaria', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const email = `${trimmedDni}@dia.ugel.local`;
      const password = trimmedDni;
      const isPip = rol === 'docente_pip';
      const actualRole = isPip ? 'docente' : rol;

      // Determine grado_seccion_ids
      let gradoSeccionIds: string[] = [];
      if (!isPip) {
        if (useMultiGrado) {
          gradoSeccionIds = selectedMultiGrados;
        } else if (selectedGradoSeccion) {
          gradoSeccionIds = [selectedGradoSeccion];
        }
      }

      await invokeEdgeFunction('create-user', {
        email, password, dni: trimmedDni, nombre_completo: nombre, role: actualRole,
        institucion_id: profile?.institucion_id || undefined,
        grado_seccion_id: isPip ? undefined : (gradoSeccionIds[0] || undefined),
        grado_seccion_ids: gradoSeccionIds.length > 1 ? gradoSeccionIds : undefined,
        especialidad: (actualRole === 'docente' && !isPip && isSecundaria && especialidad) ? especialidad : undefined,
        is_pip: isPip || undefined,
      });

      toast({ title: 'Personal registrado', description: `${nombre} como ${isPip ? 'Docente PIP' : actualRole}. Credenciales: DNI como usuario y contraseña.` });
      setOpen(false);
      setRol(''); setDni(''); setNombre(''); setSelectedGradoSeccion(''); setSelectedMultiGrados([]); setEspecialidad('');
      fetchPersonal();
    } catch (err: any) {
      const msg = err.message || 'Error al registrar personal';
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
    setEditRol(item.is_pip ? 'docente_pip' : (item.roles[0] || ''));
    setEditGradoSeccion(item.grado_seccion_id || '');
    setEditMultiGrados(item.docente_grados_ids || []);
    setEditEspecialidad(item.especialidad || '');
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
      const isPip = editRol === 'docente_pip';
      const actualRole = isPip ? 'docente' : editRol;

      await invokeEdgeFunction('manage-user', {
        action: 'update',
        user_id: editItem.user_id,
        dni: editDni,
        nombre_completo: editNombre,
        role: actualRole || undefined,
        especialidad: editEspecialidad || undefined,
      });

      // Update grado_seccion_id and multi-grados
      if (editItem.user_id) {
        const useMulti = editMultiGrados.length > 0;
        const primaryGrado = useMulti ? editMultiGrados[0] : (editGradoSeccion || null);

        await supabase
          .from('profiles')
          .update({
            grado_seccion_id: isPip ? null : primaryGrado,
            especialidad: editEspecialidad || null,
          })
          .eq('user_id', editItem.user_id);

        // Update docente_grados for multi-grado assignments
        if (!isPip && useMulti) {
          // Delete existing and re-insert
          await supabase.from('docente_grados').delete().eq('user_id', editItem.user_id);
          const inserts = editMultiGrados.map(gsId => ({
            user_id: editItem.user_id!,
            grado_seccion_id: gsId,
          }));
          if (inserts.length > 0) {
            await supabase.from('docente_grados').insert(inserts);
          }
        } else if (!isPip && !useMulti) {
          // Single grado - clear docente_grados
          await supabase.from('docente_grados').delete().eq('user_id', editItem.user_id);
        }
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

  const formatMultiAulas = (item: PersonalItem) => {
    const ids = item.docente_grados_ids && item.docente_grados_ids.length > 0
      ? item.docente_grados_ids
      : item.grado_seccion_id ? [item.grado_seccion_id] : [];
    if (ids.length === 0) return null;
    return ids.map(id => formatAula(id)).filter(Boolean);
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
        {nivelesGrados.filter(ng => ng.nivel !== 'Secundaria').map(ng => (
          <option key={ng.id} value={ng.id}>
            {ng.nivel} - {ng.grado} "{ng.seccion}"
          </option>
        ))}
      </select>
    </div>
  );

  const MultiGradoSelector = ({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) => {
    const toggle = (id: string) => {
      onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
    };

    return (
      <div>
        <Label>Grados y Secciones de Secundaria (seleccione varios)</Label>
        <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-3 mt-1">
          {Array.from(secundariaByGrado.entries()).map(([grado, items]) => (
            <div key={grado}>
              <p className="text-xs font-semibold text-muted-foreground mb-1">{grado}</p>
              <div className="flex flex-wrap gap-2">
                {items.map(ng => (
                  <label key={ng.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Checkbox
                      checked={selected.includes(ng.id)}
                      onCheckedChange={() => toggle(ng.id)}
                    />
                    <span>{ng.grado} "{ng.seccion}"</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {secundariaByGrado.size === 0 && (
            <p className="text-xs text-muted-foreground">No hay grados de Secundaria configurados.</p>
          )}
        </div>
      </div>
    );
  };

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
                    onChange={e => { setRol(e.target.value); setSelectedGradoSeccion(''); setSelectedMultiGrados([]); setEspecialidad(''); }}
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

                {/* Non-PIP, non-docente: single aula selector (Inicial/Primaria) */}
                {rol && rol !== 'docente_pip' && rol !== 'docente' && (
                  <AulaSelector value={selectedGradoSeccion} onChange={setSelectedGradoSeccion} />
                )}

                {/* Docente (not PIP): show both options */}
                {rol === 'docente' && (
                  <>
                    {/* Non-secundaria single selector */}
                    <AulaSelector
                      value={selectedGradoSeccion}
                      onChange={(v) => { setSelectedGradoSeccion(v); if (v) setSelectedMultiGrados([]); }}
                      label="Nivel / Grado / Sección (Inicial o Primaria)"
                    />

                    {secundariaNiveles.length > 0 && (
                      <>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">o Secundaria (múltiples aulas)</span></div>
                        </div>
                        <MultiGradoSelector
                          selected={selectedMultiGrados}
                          onChange={(ids) => { setSelectedMultiGrados(ids); if (ids.length > 0) setSelectedGradoSeccion(''); }}
                        />
                      </>
                    )}

                    {/* Especialidad: show when secundaria is selected */}
                    {(selectedMultiGrados.length > 0 || (() => {
                      const ng = nivelesGrados.find(ng => ng.id === selectedGradoSeccion);
                      return ng?.nivel === 'Secundaria';
                    })()) && (
                      <div>
                        <Label>Especialidad (Secundaria) <span className="text-destructive">*</span></Label>
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
                  </>
                )}

                {rol === 'docente_pip' && (
                  <p className="text-xs text-muted-foreground bg-muted rounded p-2">
                    ℹ️ El Docente PIP tiene privilegios de Director y no requiere aula asignada. Solo se vinculará a la institución.
                  </p>
                )}

                {/* Estudiante: show all aulas including secundaria */}
                {rol === 'estudiante' && (
                  <div>
                    <Label>Nivel / Grado / Sección</Label>
                    <select
                      value={selectedGradoSeccion}
                      onChange={e => setSelectedGradoSeccion(e.target.value)}
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
                  {sortedPersonal.map(p => {
                    const multiAulas = formatMultiAulas(p);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono">{p.dni}</TableCell>
                        <TableCell>{p.nombre_completo}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {p.is_pip ? (
                              <Badge variant="secondary">Docente PIP</Badge>
                            ) : (
                              p.roles.map(r => (
                                <Badge key={r} variant="secondary">{roleLabelMap[r] || r}</Badge>
                              ))
                            )}
                            {p.especialidad && (
                              <Badge variant="outline" className="text-xs">{p.especialidad}</Badge>
                            )}
                            {p.roles.length === 0 && !p.is_pip && <span className="text-muted-foreground text-xs">Sin rol</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {multiAulas && multiAulas.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {multiAulas.map((aula, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{aula}</Badge>
                              ))}
                            </div>
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
                    );
                  })}
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

            {editRol === 'docente' && (
              <>
                <AulaSelector
                  value={editGradoSeccion}
                  onChange={(v) => { setEditGradoSeccion(v); if (v) setEditMultiGrados([]); }}
                  label="Nivel / Grado / Sección (Inicial o Primaria)"
                />
                {secundariaNiveles.length > 0 && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">o Secundaria (múltiples aulas)</span></div>
                    </div>
                    <MultiGradoSelector
                      selected={editMultiGrados}
                      onChange={(ids) => { setEditMultiGrados(ids); if (ids.length > 0) setEditGradoSeccion(''); }}
                    />
                  </>
                )}
                {(editMultiGrados.length > 0 || (() => {
                  const ng = nivelesGrados.find(ng => ng.id === editGradoSeccion);
                  return ng?.nivel === 'Secundaria';
                })()) && (
                  <div>
                    <Label>Especialidad (Secundaria)</Label>
                    <select
                      value={editEspecialidad}
                      onChange={e => setEditEspecialidad(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="" disabled>Seleccione especialidad</option>
                      {ESPECIALIDADES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}

            {editRol !== 'docente' && editRol !== 'docente_pip' && (
              <AulaSelector value={editGradoSeccion} onChange={setEditGradoSeccion} />
            )}

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

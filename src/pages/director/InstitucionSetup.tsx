import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Search, School, Check, MapPin } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorMapper';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const InstitucionSetup = () => {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current profile to see if already associated
  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('institucion_id')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch current institution details if already associated
  const { data: currentInstitucion } = useQuery({
    queryKey: ['mi-institucion', profile?.institucion_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instituciones')
        .select('*')
        .eq('id', profile!.institucion_id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.institucion_id,
  });

  // Fetch all institutions for selection
  const { data: instituciones, isLoading: loadingInst } = useQuery({
    queryKey: ['instituciones-director-select'],
    queryFn: async () => {
      let all: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('instituciones')
          .select('*')
          .order('nombre')
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return all;
    },
  });

  const filtered = useMemo(() => {
    if (!instituciones) return [];
    if (!search.trim()) return instituciones;
    const q = search.toLowerCase();
    return instituciones.filter(inst =>
      inst.nombre.toLowerCase().includes(q) ||
      (inst.codigo_local || '').toLowerCase().includes(q) ||
      (inst.distrito || '').toLowerCase().includes(q) ||
      (inst.centro_poblado || '').toLowerCase().includes(q)
    );
  }, [instituciones, search]);

  const handleAssociate = async () => {
    if (!selectedId || !user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ institucion_id: selectedId })
        .eq('user_id', user.id);
      if (error) throw error;
      const inst = instituciones?.find(i => i.id === selectedId);
      toast({ title: 'Institución asociada', description: inst?.nombre || '' });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['mi-institucion'] });
      setSelectedId(null);
      setSearch('');
    } catch (err: any) {
      toast({ title: 'Error', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Institución Educativa</h1>
        <p className="text-muted-foreground">Seleccione la institución educativa a la que pertenece</p>
      </div>

      {/* Current association */}
      {currentInstitucion && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Institución Asociada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Nombre:</span>
                <p className="font-medium">{currentInstitucion.nombre}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Código Local:</span>
                <p className="font-medium">{currentInstitucion.codigo_local || '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Distrito:</span>
                <p className="font-medium">{currentInstitucion.distrito}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Gestión:</span>
                <Badge variant={currentInstitucion.tipo_gestion === 'Pública' ? 'default' : 'secondary'}>
                  {currentInstitucion.tipo_gestion}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and select */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            {currentInstitucion ? 'Cambiar Institución' : 'Seleccionar Institución'}
          </CardTitle>
          <CardDescription>
            Busque por nombre, código, distrito o centro poblado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar institución..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loadingInst ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {filtered.length} de {instituciones?.length || 0} instituciones
              </p>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cód. Local</TableHead>
                      <TableHead>Distrito</TableHead>
                      <TableHead>Gestión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No se encontraron instituciones
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.slice(0, 100).map(inst => (
                        <TableRow
                          key={inst.id}
                          className={`cursor-pointer transition-colors ${
                            selectedId === inst.id
                              ? 'bg-primary/10'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedId(inst.id)}
                        >
                          <TableCell>
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                              selectedId === inst.id
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground/30'
                            }`}>
                              {selectedId === inst.id && (
                                <Check className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{inst.nombre}</TableCell>
                          <TableCell className="text-muted-foreground">{inst.codigo_local || '—'}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />{inst.distrito}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={inst.tipo_gestion === 'Pública' ? 'default' : 'secondary'} className="text-xs">
                              {inst.tipo_gestion}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {filtered.length > 100 && (
                  <p className="text-center text-sm text-muted-foreground py-3">
                    Mostrando 100 de {filtered.length}. Use el buscador para refinar.
                  </p>
                )}
              </div>

              {selectedId && (
                <div className="flex justify-end">
                  <Button onClick={handleAssociate} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Asociar Institución
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitucionSetup;

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, School } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const DISTRITOS = [
  'Todos', 'Chiclayo', 'José Leonardo Ortiz', 'La Victoria', 'Cayaltí', 'Chongoyape',
  'Eten', 'Puerto Eten', 'Lagunas', 'Monsefú', 'Nueva Arica', 'Oyotún',
  'Pátapo', 'Picsi', 'Pimentel', 'Pomalca', 'Pucalá', 'Reque',
  'Santa Rosa', 'Tumán', 'Zaña',
];

const InstitucionesListado = () => {
  const [search, setSearch] = useState('');
  const [distrito, setDistrito] = useState('Todos');
  const [tipoGestion, setTipoGestion] = useState('Todos');

  const { data: instituciones, isLoading } = useQuery({
    queryKey: ['instituciones-listado'],
    queryFn: async () => {
      // Fetch all (paginated if >1000)
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

  const filtered = (instituciones || []).filter(inst => {
    const matchSearch = !search || 
      inst.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (inst.codigo_local || '').toLowerCase().includes(search.toLowerCase()) ||
      (inst.centro_poblado || '').toLowerCase().includes(search.toLowerCase());
    const matchDistrito = distrito === 'Todos' || inst.distrito === distrito;
    const matchTipo = tipoGestion === 'Todos' || inst.tipo_gestion === tipoGestion;
    return matchSearch && matchDistrito && matchTipo;
  });

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5" />
          Instituciones Registradas
        </CardTitle>
        <CardDescription>
          {isLoading ? 'Cargando...' : `${filtered.length} de ${instituciones?.length || 0} instituciones`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o centro poblado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={distrito} onValueChange={setDistrito}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Distrito" />
            </SelectTrigger>
            <SelectContent>
              {DISTRITOS.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipoGestion} onValueChange={setTipoGestion}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Pública">Pública</SelectItem>
              <SelectItem value="Privada">Privada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cód. Local</TableHead>
                  <TableHead>Distrito</TableHead>
                  <TableHead>Centro Poblado</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Gestión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No se encontraron instituciones
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, 200).map((inst, i) => (
                    <TableRow key={inst.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{inst.nombre}</TableCell>
                      <TableCell className="text-muted-foreground">{inst.codigo_local || '—'}</TableCell>
                      <TableCell>{inst.distrito}</TableCell>
                      <TableCell className="text-muted-foreground">{inst.centro_poblado || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{inst.direccion || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={inst.tipo_gestion === 'Pública' ? 'default' : 'secondary'}>
                          {inst.tipo_gestion}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {filtered.length > 200 && (
              <p className="text-center text-sm text-muted-foreground py-3">
                Mostrando 200 de {filtered.length} resultados. Use los filtros para refinar.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InstitucionesListado;

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/invokeEdgeFunction';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';

interface ParsedUser {
  dni: string;
  nombre_completo: string;
  email: string;
  rol: string;
  password: string;
  codigo_local_ie?: string;
  nivel?: string;
  grado?: string;
  seccion?: string;
  // Resolved IDs
  institucion_id?: string;
  grado_seccion_id?: string;
  // Warnings
  warning?: string;
}

interface ResultItem {
  dni: string;
  nombre_completo: string;
  success: boolean;
  error?: string;
}

interface BulkUserUploadProps {
  onComplete: () => void;
}

const TEMPLATE_HEADER = 'DNI,Nombre Completo,Rol,Código Local IE,Nivel,Grado,Sección,Contraseña';
const TEMPLATE_EXAMPLE = [
  '12345678,Juan Pérez López,docente,123456,Primaria,3,A,',
  '87654321,María García Torres,estudiante,123456,Primaria,3,A,',
  '11223344,Carlos Ruiz Díaz,director,123456,,,,',
  '55667788,Ana López Vega,subdirector,123456,,,,',
];

const BulkUserUpload = ({ onComplete }: BulkUserUploadProps) => {
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedUser[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [step, setStep] = useState<'upload' | 'resolving' | 'preview' | 'processing' | 'done'>('upload');
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const content = [TEMPLATE_HEADER, ...TEMPLATE_EXAMPLE].join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_usuarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setParsed([]);
    setResults([]);
    setStep('upload');
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const resolveIds = async (users: ParsedUser[]): Promise<ParsedUser[]> => {
    // Collect unique codigo_local values
    const codigosLocales = [...new Set(users.map(u => u.codigo_local_ie).filter(Boolean))] as string[];

    // Fetch institutions by codigo_local
    const instMap: Record<string, string> = {};
    if (codigosLocales.length > 0) {
      const { data: instituciones } = await supabase
        .from('instituciones')
        .select('id, codigo_local')
        .in('codigo_local', codigosLocales);
      (instituciones || []).forEach(i => {
        if (i.codigo_local) instMap[i.codigo_local] = i.id;
      });
    }

    // Collect unique institucion_ids to fetch niveles_grados
    const instIds = [...new Set(Object.values(instMap))];
    const gradoMap: Record<string, string> = {}; // key: instId|nivel|grado|seccion -> id
    if (instIds.length > 0) {
      const { data: niveles } = await supabase
        .from('niveles_grados')
        .select('id, institucion_id, nivel, grado, seccion')
        .in('institucion_id', instIds);
      (niveles || []).forEach(n => {
        const key = `${n.institucion_id}|${n.nivel}|${n.grado}|${n.seccion}`;
        gradoMap[key] = n.id;
      });
    }

    return users.map(u => {
      const resolved = { ...u };
      const warnings: string[] = [];

      if (u.codigo_local_ie) {
        const instId = instMap[u.codigo_local_ie];
        if (instId) {
          resolved.institucion_id = instId;
        } else {
          warnings.push(`IE '${u.codigo_local_ie}' no encontrada`);
        }

        // Resolve grado_seccion only if we have institution + nivel + grado + seccion
        if (instId && u.nivel && u.grado && u.seccion) {
          const key = `${instId}|${u.nivel}|${u.grado}|${u.seccion}`;
          const gsId = gradoMap[key];
          if (gsId) {
            resolved.grado_seccion_id = gsId;
          } else {
            warnings.push(`Aula ${u.nivel} ${u.grado}° '${u.seccion}' no encontrada en IE`);
          }
        }
      }

      if (warnings.length > 0) {
        resolved.warning = warnings.join('; ');
      }
      return resolved;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast({ title: 'Error', description: 'El archivo debe tener al menos una fila de datos además del encabezado.', variant: 'destructive' });
        return;
      }

      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';

      const users: ParsedUser[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 2) continue;

        const dni = (cols[0] || '').trim();
        const nombre = (cols[1] || '').trim();
        const rol = (cols[2] || '').toLowerCase().trim();
        const codigo_local_ie = (cols[3] || '').trim();
        const nivel = (cols[4] || '').trim();
        const grado = (cols[5] || '').trim();
        const seccion = (cols[6] || '').trim().toUpperCase();
        const password = (cols[7] || '').trim() || dni;
        const email = dni ? `${dni}@dia.ugel.local` : '';

        users.push({ dni, nombre_completo: nombre, email, rol, password, codigo_local_ie, nivel, grado, seccion });
      }

      if (users.length === 0) {
        toast({ title: 'Error', description: 'No se encontraron datos válidos en el archivo.', variant: 'destructive' });
        return;
      }

      if (users.length > 2000) {
        toast({ title: 'Error', description: 'Máximo 2000 usuarios por lote.', variant: 'destructive' });
        return;
      }

      // Resolve institution and classroom IDs
      setStep('resolving');
      try {
        const resolved = await resolveIds(users);
        setParsed(resolved);
        setStep('preview');
      } catch {
        toast({ title: 'Error', description: 'Error al buscar instituciones y aulas.', variant: 'destructive' });
        setStep('upload');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleUpload = async () => {
    setStep('processing');
    setProgress(10);

    try {
      const payload = parsed.map(u => ({
        dni: u.dni,
        nombre_completo: u.nombre_completo,
        email: u.email,
        rol: u.rol,
        password: u.password,
        institucion_id: u.institucion_id || undefined,
        grado_seccion_id: u.grado_seccion_id || undefined,
      }));

      const data = await invokeEdgeFunction('bulk-create-users', { users: payload });

      setProgress(90);
      setResults(data.results || []);
      setStep('done');
      setProgress(100);

      const { created, failed } = data.summary || {};
      toast({
        title: 'Carga completada',
        description: `${created} usuarios creados, ${failed} con errores.`,
        variant: failed > 0 ? 'destructive' : 'default',
      });

      if (created > 0) onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al procesar usuarios', variant: 'destructive' });
      setStep('preview');
      setProgress(0);
    }
  };

  const rolLabel: Record<string, string> = {
    director: 'Director', subdirector: 'Subdirector', docente: 'Docente',
    estudiante: 'Estudiante', especialista: 'Especialista', padre: 'Padre de Familia',
    administrador: 'Administrador',
  };

  const warningCount = parsed.filter(u => u.warning).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Carga Masiva</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Carga Masiva de Usuarios
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Descargue la plantilla CSV, llénela con los datos. El correo se genera como <strong>DNI@dia.ugel.local</strong> y la contraseña por defecto es el <strong>DNI</strong>.
            </p>
            <div className="text-xs text-muted-foreground border rounded-md p-3 bg-muted/50 space-y-1">
              <p className="font-medium">Columnas de la plantilla:</p>
              <p><strong>DNI</strong> (8 dígitos) · <strong>Nombre Completo</strong> · <strong>Rol</strong> (director, subdirector, docente, estudiante) · <strong>Código Local IE</strong> · <strong>Nivel</strong> (Inicial, Primaria, Secundaria) · <strong>Grado</strong> · <strong>Sección</strong> · <strong>Contraseña</strong> (opcional)</p>
              <p className="text-muted-foreground">Para directores/subdirectores solo es necesario el Código Local IE. Para docentes y estudiantes incluya también Nivel, Grado y Sección.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />Descargar Plantilla
              </Button>
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Seleccione un archivo CSV</p>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                Seleccionar Archivo
              </Button>
            </div>
          </div>
        )}

        {step === 'resolving' && (
          <div className="space-y-4 py-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Verificando instituciones y aulas…</p>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Se encontraron <strong>{parsed.length}</strong> usuarios.
              {warningCount > 0 && (
                <span className="text-amber-600 ml-2">
                  <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                  {warningCount} con advertencias (se crearán sin institución/aula asignada).
                </span>
              )}
            </p>
            <div className="overflow-x-auto max-h-[40vh] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Cód. Local IE</TableHead>
                    <TableHead>Nivel/Grado/Sección</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((u, i) => (
                    <TableRow key={i} className={u.warning ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono">{u.dni}</TableCell>
                      <TableCell>{u.nombre_completo}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rolLabel[u.rol] || u.rol}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{u.codigo_local_ie || '—'}</TableCell>
                      <TableCell className="text-xs">
                        {u.nivel && u.grado ? `${u.nivel} ${u.grado}° ${u.seccion || ''}` : '—'}
                      </TableCell>
                      <TableCell>
                        {u.warning ? (
                          <span className="text-xs text-amber-600" title={u.warning}>
                            <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />{u.warning}
                          </span>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button onClick={handleUpload}>
                <Upload className="h-4 w-4 mr-2" />Crear {parsed.length} Usuarios
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-4 py-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Creando usuarios… esto puede tomar unos momentos.</p>
            <Progress value={progress} className="max-w-sm mx-auto" />
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 py-2">
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {results.filter((r) => r.success).length} creados
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" />
                {results.filter((r) => !r.success).length} con errores
              </span>
            </div>
            {results.some((r) => !r.success) && (
              <div className="overflow-x-auto max-h-[40vh] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DNI</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.filter((r) => !r.success).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono">{r.dni}</TableCell>
                        <TableCell>{r.nombre_completo}</TableCell>
                        <TableCell><Badge variant="destructive">Error</Badge></TableCell>
                        <TableCell className="text-xs text-destructive">{r.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => { setOpen(false); reset(); }}>Cerrar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkUserUpload;

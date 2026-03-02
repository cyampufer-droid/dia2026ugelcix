import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ParsedUser {
  dni: string;
  nombre_completo: string;
  email: string;
  rol: string;
  password: string;
}

interface ResultItem {
  dni: string;
  nombre_completo: string;
  success: boolean;
  error?: string;
}

interface BulkPersonalUploadProps {
  onComplete: () => void;
}

const TEMPLATE_HEADER = 'Tipo de Personal,DNI,Apellidos y Nombres,Correo Electrónico,Contraseña';
const TEMPLATE_EXAMPLES = [
  'docente,12345678,García Pérez Juan Carlos,juan.garcia@ejemplo.com,12345678',
  'estudiante,87654321,López Torres María Elena,,',
];

const rolMap: Record<string, string> = {
  subdirector: 'subdirector',
  'subdirector(a)': 'subdirector',
  docente: 'docente',
  estudiante: 'estudiante',
};

const rolLabel: Record<string, string> = {
  subdirector: 'Subdirector(a)',
  docente: 'Docente',
  estudiante: 'Estudiante',
};

const BulkPersonalUpload = ({ onComplete }: BulkPersonalUploadProps) => {
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedUser[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'done'>('upload');
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const content = [TEMPLATE_HEADER, ...TEMPLATE_EXAMPLES].join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_personal.csv';
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast({ title: 'Error', description: 'El archivo debe tener al menos una fila de datos además del encabezado.', variant: 'destructive' });
        return;
      }

      const delimiter = lines[0].includes(';') ? ';' : ',';
      const users: ParsedUser[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 3) continue;

        const tipoRaw = (cols[0] || '').toLowerCase().trim();
        const rol = rolMap[tipoRaw] || tipoRaw;
        const dni = (cols[1] || '').trim();
        const nombre = (cols[2] || '').trim();
        const emailRaw = (cols[3] || '').trim();
        const passwordRaw = (cols[4] || '').trim();

        // Auto-generate email from DNI if not provided
        const email = emailRaw || (dni ? `${dni}@dia.ugel.local` : '');
        // Default password = DNI
        const password = passwordRaw || dni;

        users.push({ dni, nombre_completo: nombre, email, rol, password });
      }

      if (users.length === 0) {
        toast({ title: 'Error', description: 'No se encontraron datos válidos en el archivo.', variant: 'destructive' });
        return;
      }
      if (users.length > 200) {
        toast({ title: 'Error', description: 'Máximo 200 registros por lote.', variant: 'destructive' });
        return;
      }

      setParsed(users);
      setStep('preview');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleUpload = async () => {
    setStep('processing');
    setProgress(10);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-create-users', {
        body: { users: parsed },
      });

      setProgress(90);
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResults(data.results || []);
      setStep('done');
      setProgress(100);

      const { created, failed } = data.summary || {};
      toast({
        title: 'Carga completada',
        description: `${created} personal registrado, ${failed} con errores.`,
        variant: failed > 0 ? 'destructive' : 'default',
      });

      if (created > 0) onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al procesar registros', variant: 'destructive' });
      setStep('preview');
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Carga Masiva</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Carga Masiva de Personal
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Descargue la plantilla CSV, llénela con los datos del personal y súbala aquí.
              Si no se ingresa correo electrónico, se generará uno automático. La contraseña por defecto es el DNI.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />Descargar Plantilla
              </Button>
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Seleccione un archivo CSV</p>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>Seleccionar Archivo</Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Se encontraron <strong>{parsed.length}</strong> registros. Verifique los datos antes de continuar.
            </p>
            <div className="overflow-x-auto max-h-[40vh] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Apellidos y Nombres</TableHead>
                    <TableHead>Correo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((u, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell><Badge variant="secondary">{rolLabel[u.rol] || u.rol}</Badge></TableCell>
                      <TableCell className="font-mono">{u.dni}</TableCell>
                      <TableCell>{u.nombre_completo}</TableCell>
                      <TableCell className="text-xs">{u.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button onClick={handleUpload}>
                <Upload className="h-4 w-4 mr-2" />Registrar {parsed.length} Personal
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-4 py-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Registrando personal… esto puede tomar unos momentos.</p>
            <Progress value={progress} className="max-w-sm mx-auto" />
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 py-2">
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />{results.filter((r) => r.success).length} registrados
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" />{results.filter((r) => !r.success).length} con errores
              </span>
            </div>
            {results.some((r) => !r.success) && (
              <div className="overflow-x-auto max-h-[40vh] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DNI</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.filter((r) => !r.success).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono">{r.dni}</TableCell>
                        <TableCell>{r.nombre_completo}</TableCell>
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

export default BulkPersonalUpload;

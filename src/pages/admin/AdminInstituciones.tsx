import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorMapper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const CSV_HEADERS = ['nombre', 'codigo_local', 'codigo_modular', 'provincia', 'distrito', 'centro_poblado', 'direccion'];

const DISTRITOS_VALIDOS = [
  'Chiclayo', 'José Leonardo Ortiz', 'La Victoria', 'Cayaltí', 'Chongoyape',
  'Eten', 'Puerto Eten', 'Lagunas', 'Monsefú', 'Nueva Arica', 'Oyotún',
  'Pátapo', 'Picsi', 'Pimentel', 'Pomalca', 'Pucalá', 'Reque',
  'Santa Rosa', 'Tumán', 'Zaña',
];

interface ParsedRow {
  nombre: string;
  codigo_local: string;
  codigo_modular: string;
  provincia: string;
  distrito: string;
  centro_poblado: string;
  direccion: string;
  errors: string[];
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

  // Map header indices
  const idxMap: Record<string, number> = {};
  CSV_HEADERS.forEach(h => {
    const idx = header.indexOf(h);
    idxMap[h] = idx;
  });

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const row: ParsedRow = {
      nombre: idxMap['nombre'] >= 0 ? cols[idxMap['nombre']] || '' : '',
      codigo_local: idxMap['codigo_local'] >= 0 ? cols[idxMap['codigo_local']] || '' : '',
      codigo_modular: idxMap['codigo_modular'] >= 0 ? cols[idxMap['codigo_modular']] || '' : '',
      provincia: idxMap['provincia'] >= 0 ? cols[idxMap['provincia']] || 'Chiclayo' : 'Chiclayo',
      distrito: idxMap['distrito'] >= 0 ? cols[idxMap['distrito']] || '' : '',
      centro_poblado: idxMap['centro_poblado'] >= 0 ? cols[idxMap['centro_poblado']] || '' : '',
      direccion: idxMap['direccion'] >= 0 ? cols[idxMap['direccion']] || '' : '',
      errors: [],
    };

    // Validate
    if (!row.nombre) row.errors.push('Nombre es obligatorio');
    if (!row.distrito) row.errors.push('Distrito es obligatorio');
    else if (!DISTRITOS_VALIDOS.includes(row.distrito)) row.errors.push(`Distrito "${row.distrito}" no válido`);

    rows.push(row);
  }
  return rows;
}

function downloadTemplate() {
  const header = CSV_HEADERS.join(',');
  const example = 'I.E. N° 10001,123456,0123456,Chiclayo,Chiclayo,Centro Ejemplo,Av. Principal 123';
  const blob = new Blob([header + '\n' + example + '\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla_instituciones.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const AdminInstituciones = () => {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast({ title: 'Error', description: 'El archivo CSV está vacío o no tiene el formato correcto.', variant: 'destructive' });
        return;
      }
      setParsedRows(rows);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleUpload = async () => {
    const validRows = parsedRows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) {
      toast({ title: 'Sin registros válidos', description: 'Corrija los errores antes de subir.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const insertData = validRows.map(r => ({
        nombre: r.nombre,
        codigo_local: r.codigo_local || null,
        codigo_modular: r.codigo_modular || null,
        provincia: r.provincia || 'Chiclayo',
        distrito: r.distrito,
        centro_poblado: r.centro_poblado || null,
        direccion: r.direccion || null,
      }));

      const { error } = await supabase.from('instituciones').insert(insertData);
      if (error) throw error;

      const failed = parsedRows.length - validRows.length;
      setUploadResult({ success: validRows.length, failed });
      setParsedRows([]);
      toast({ title: 'Carga exitosa', description: `${validRows.length} instituciones registradas.` });
    } catch (err: any) {
      toast({ title: 'Error al subir', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = parsedRows.filter(r => r.errors.length === 0).length;
  const errorCount = parsedRows.filter(r => r.errors.length > 0).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Carga Masiva de Instituciones</h1>
        <p className="text-muted-foreground">Suba un archivo CSV con los datos de todas las instituciones educativas</p>
      </div>

      {/* Download template */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Plantilla CSV
          </CardTitle>
          <CardDescription>Descargue la plantilla, llénela con los datos y luego súbala.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Columnas: <strong>nombre</strong> (obligatorio), <strong>codigo_local</strong>, <strong>codigo_modular</strong>, <strong>provincia</strong> (def. Chiclayo), <strong>distrito</strong> (obligatorio), <strong>centro_poblado</strong>, <strong>direccion</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Distritos válidos: {DISTRITOS_VALIDOS.join(', ')}.
          </p>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Descargar Plantilla
          </Button>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Archivo CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Seleccionar archivo CSV
          </Button>

          {uploadResult && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>{uploadResult.success} registradas correctamente. {uploadResult.failed > 0 && `${uploadResult.failed} con errores omitidas.`}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview table */}
      {parsedRows.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Vista previa ({parsedRows.length} filas)</CardTitle>
            <CardDescription>
              <span className="text-green-600 font-medium">{validCount} válidas</span>
              {errorCount > 0 && <span className="text-destructive font-medium ml-3">{errorCount} con errores</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cód. Local</TableHead>
                    <TableHead>Cód. Modular</TableHead>
                    <TableHead>Distrito</TableHead>
                    <TableHead>Centro Poblado</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, i) => (
                    <TableRow key={i} className={row.errors.length > 0 ? 'bg-destructive/10' : ''}>
                      <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                      <TableCell>{row.nombre}</TableCell>
                      <TableCell>{row.codigo_local}</TableCell>
                      <TableCell>{row.codigo_modular}</TableCell>
                      <TableCell>{row.distrito}</TableCell>
                      <TableCell>{row.centro_poblado}</TableCell>
                      <TableCell>{row.direccion}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 ? (
                          <span className="flex items-center gap-1 text-destructive text-xs">
                            <AlertCircle className="h-3 w-3" />
                            {row.errors.join('; ')}
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

            <div className="flex justify-end mt-4">
              <Button onClick={handleUpload} disabled={isUploading || validCount === 0}>
                {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {isUploading ? 'Subiendo…' : `Subir ${validCount} instituciones`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminInstituciones;

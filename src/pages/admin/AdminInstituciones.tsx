import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Plus, List } from 'lucide-react';
import InstitucionesListado from '@/components/admin/InstitucionesListado';
import { getUserFriendlyError } from '@/lib/errorMapper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PROVINCIAS_DISTRITOS: Record<string, string[]> = {
  'Chiclayo': [
    'Chiclayo', 'José Leonardo Ortiz', 'La Victoria', 'Cayaltí', 'Chongoyape',
    'Eten', 'Puerto Eten', 'Lagunas', 'Monsefú', 'Nueva Arica', 'Oyotún',
    'Pátapo', 'Picsi', 'Pimentel', 'Pomalca', 'Pucalá', 'Reque',
    'Santa Rosa', 'Tumán', 'Zaña',
  ],
  'Lambayeque': [
    'Lambayeque', 'Chóchope', 'Íllimo', 'Jayanca', 'Mochumí', 'Mórrope',
    'Motupe', 'Olmos', 'Pacora', 'Salas', 'San José', 'Túcume',
  ],
  'Ferreñafe': [
    'Ferreñafe', 'Cañaris', 'Incahuasi', 'Manuel Antonio Mesones Muro', 'Pítipo', 'Pueblo Nuevo',
  ],
};

const PROVINCIAS_VALIDAS = Object.keys(PROVINCIAS_DISTRITOS);
const DISTRITOS_VALIDOS = Object.values(PROVINCIAS_DISTRITOS).flat();

// Normalize text for accent-insensitive comparison
function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function findDistrito(input: string): string | null {
  const normalized = normalizeText(input);
  return DISTRITOS_VALIDOS.find(d => normalizeText(d) === normalized) || null;
}

function findProvincia(input: string): string | null {
  const normalized = normalizeText(input);
  return PROVINCIAS_VALIDAS.find(p => normalizeText(p) === normalized) || null;
}

function getProvinciaForDistrito(distrito: string): string {
  for (const [prov, distritos] of Object.entries(PROVINCIAS_DISTRITOS)) {
    if (distritos.includes(distrito)) return prov;
  }
  return 'Chiclayo';
}

// --- CSV Bulk Upload logic ---
const CSV_HEADERS = ['nombre', 'codigo_local', 'provincia', 'distrito', 'centro_poblado', 'direccion', 'tipo_gestion'];
const TIPOS_GESTION = ['Pública', 'Privada'];

interface ParsedRow {
  nombre: string;
  codigo_local: string;
  provincia: string;
  distrito: string;
  centro_poblado: string;
  direccion: string;
  tipo_gestion: string;
  errors: string[];
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Auto-detect delimiter: semicolon or comma
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const header = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const idxMap: Record<string, number> = {};
  CSV_HEADERS.forEach(h => { idxMap[h] = header.indexOf(h); });

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
    const row: ParsedRow = {
      nombre: idxMap['nombre'] >= 0 ? cols[idxMap['nombre']] || '' : '',
      codigo_local: idxMap['codigo_local'] >= 0 ? cols[idxMap['codigo_local']] || '' : '',
      provincia: idxMap['provincia'] >= 0 ? cols[idxMap['provincia']] || 'Chiclayo' : 'Chiclayo',
      distrito: idxMap['distrito'] >= 0 ? cols[idxMap['distrito']] || '' : '',
      centro_poblado: idxMap['centro_poblado'] >= 0 ? cols[idxMap['centro_poblado']] || '' : '',
      direccion: idxMap['direccion'] >= 0 ? cols[idxMap['direccion']] || '' : '',
      tipo_gestion: idxMap['tipo_gestion'] >= 0 ? cols[idxMap['tipo_gestion']] || 'Pública' : 'Pública',
      errors: [],
    };
    if (!row.nombre) row.errors.push('Nombre es obligatorio');
    if (!row.distrito) row.errors.push('Distrito es obligatorio');
    else {
      const matched = findDistrito(row.distrito);
      if (!matched) row.errors.push(`Distrito "${row.distrito}" no válido`);
      else row.distrito = matched; // Normalize to canonical name
    }
    // Normalize tipo_gestion
    if (row.tipo_gestion) {
      const normalized = normalizeText(row.tipo_gestion);
      if (normalized === 'publica') row.tipo_gestion = 'Pública';
      else if (normalized === 'privada') row.tipo_gestion = 'Privada';
      else row.errors.push(`Tipo de gestión "${row.tipo_gestion}" no válido (Pública o Privada)`);
    }
    rows.push(row);
  }
  return rows;
}

function downloadTemplate() {
  const header = CSV_HEADERS.join(',');
  const example = 'I.E. N° 10001,123456,Chiclayo,Chiclayo,Centro Ejemplo,Av. Principal 123,Pública';
  const blob = new Blob([header + '\n' + example + '\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla_instituciones.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// --- Manual Registration Component ---
const ManualRegistro = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    codigo_local: '',
    provincia: 'Chiclayo',
    distrito: '',
    centro_poblado: '',
    direccion: '',
    tipo_gestion: 'Pública',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.distrito) {
      toast({ title: 'Campos obligatorios', description: 'Nombre y distrito son requeridos.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('instituciones').insert({
        nombre: form.nombre.trim(),
        codigo_local: form.codigo_local.trim() || null,
        provincia: form.provincia || 'Chiclayo',
        distrito: form.distrito,
        centro_poblado: form.centro_poblado.trim() || null,
        direccion: form.direccion.trim() || null,
        tipo_gestion: form.tipo_gestion,
      });
      if (error) throw error;
      toast({ title: 'Institución registrada', description: `"${form.nombre}" fue registrada exitosamente.` });
      setForm({ nombre: '', codigo_local: '', provincia: 'Chiclayo', distrito: '', centro_poblado: '', direccion: '', tipo_gestion: 'Pública' });
    } catch (err: any) {
      toast({ title: 'Error', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Registro Manual
        </CardTitle>
        <CardDescription>Complete los datos de la institución educativa.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nombre">Nombre de la Institución *</Label>
            <Input id="nombre" value={form.nombre} onChange={e => handleChange('nombre', e.target.value)} placeholder="I.E. N° 10001" maxLength={200} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigo_local">Código Local</Label>
            <Input id="codigo_local" value={form.codigo_local} onChange={e => handleChange('codigo_local', e.target.value)} placeholder="123456" maxLength={20} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="distrito">Distrito *</Label>
            <Select value={form.distrito} onValueChange={v => handleChange('distrito', v)}>
              <SelectTrigger id="distrito">
                <SelectValue placeholder="Seleccione distrito" />
              </SelectTrigger>
              <SelectContent>
                {DISTRITOS_VALIDOS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="centro_poblado">Centro Poblado</Label>
            <Input id="centro_poblado" value={form.centro_poblado} onChange={e => handleChange('centro_poblado', e.target.value)} placeholder="Centro Ejemplo" maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo_gestion">Tipo de Gestión *</Label>
            <Select value={form.tipo_gestion} onValueChange={v => handleChange('tipo_gestion', v)}>
              <SelectTrigger id="tipo_gestion">
                <SelectValue placeholder="Seleccione tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_GESTION.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" value={form.direccion} onChange={e => handleChange('direccion', e.target.value)} placeholder="Av. Principal 123" maxLength={200} />
          </div>
          <div className="md:col-span-2 flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {saving ? 'Guardando…' : 'Registrar Institución'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// --- Bulk Upload Component ---
const CargaMasiva = () => {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processCSVText = (text: string) => {
    const rows = parseCSV(text);
    if (rows.length === 0) {
      toast({ title: 'Error', description: 'El archivo CSV está vacío o no tiene el formato correcto.', variant: 'destructive' });
      return;
    }
    setParsedRows(rows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      let text = ev.target?.result as string;
      // If UTF-8 produced replacement characters, retry with Latin-1
      if (text.includes('\uFFFD')) {
        const latin1Reader = new FileReader();
        latin1Reader.onload = (ev2) => {
          const text2 = ev2.target?.result as string;
          processCSVText(text2);
        };
        latin1Reader.readAsText(file, 'ISO-8859-1');
        return;
      }
      processCSVText(text);
    };
    reader.readAsText(file);
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
        provincia: r.provincia || 'Chiclayo',
        distrito: r.distrito,
        centro_poblado: r.centro_poblado || null,
        direccion: r.direccion || null,
        tipo_gestion: r.tipo_gestion || 'Pública',
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
    <div className="space-y-6">
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
            Columnas: <strong>nombre</strong> (obligatorio), <strong>codigo_local</strong>, <strong>provincia</strong> (def. Chiclayo), <strong>distrito</strong> (obligatorio), <strong>centro_poblado</strong>, <strong>direccion</strong>, <strong>tipo_gestion</strong> (Pública o Privada, def. Pública).
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

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Archivo CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
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
                    <TableHead>Distrito</TableHead>
                     <TableHead>Centro Poblado</TableHead>
                     <TableHead>Dirección</TableHead>
                     <TableHead>Tipo Gestión</TableHead>
                     <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, i) => (
                    <TableRow key={i} className={row.errors.length > 0 ? 'bg-destructive/10' : ''}>
                      <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                      <TableCell>{row.nombre}</TableCell>
                      <TableCell>{row.codigo_local}</TableCell>
                      <TableCell>{row.distrito}</TableCell>
                      <TableCell>{row.centro_poblado}</TableCell>
                      <TableCell>{row.direccion}</TableCell>
                      <TableCell>{row.tipo_gestion}</TableCell>
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

// --- Main Page ---
const AdminInstituciones = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Instituciones</h1>
        <p className="text-muted-foreground">Registre instituciones o consulte las ya registradas</p>
      </div>

      <Tabs defaultValue="listado" className="w-full">
        <TabsList>
          <TabsTrigger value="listado">
            <List className="h-4 w-4 mr-2" />
            Listado
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Plus className="h-4 w-4 mr-2" />
            Registro Manual
          </TabsTrigger>
          <TabsTrigger value="masiva">
            <Upload className="h-4 w-4 mr-2" />
            Carga Masiva
          </TabsTrigger>
        </TabsList>
        <TabsContent value="listado">
          <InstitucionesListado />
        </TabsContent>
        <TabsContent value="manual">
          <ManualRegistro />
        </TabsContent>
        <TabsContent value="masiva">
          <CargaMasiva />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminInstituciones;

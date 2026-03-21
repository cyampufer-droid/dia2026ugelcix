import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Upload, Loader2, Users, Building2, FileSpreadsheet, Download, CheckCircle2, XCircle, Search, Pencil } from 'lucide-react';
import { invokeEdgeFunction } from '@/lib/invokeEdgeFunction';
import EditStudentDialog from '@/components/docente/EditStudentDialog';
import * as XLSX from 'xlsx';

interface Student {
  id: string;
  user_id?: string;
  dni: string;
  nombre_completo: string;
  email: string;
  institucion: string;
  nivel: string;
  grado: string;
  seccion: string;
  grado_seccion_id?: string | null;
}

interface Aula {
  id: string;
  nivel: string;
  grado: string;
  seccion: string;
}

interface ParsedStudent {
  dni: string;
  nombre_completo: string;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  dni: string;
  nombre_completo: string;
  success: boolean;
  error?: string;
}

const EstudiantesRegistro = () => {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [selectedAulaId, setSelectedAulaId] = useState<string>('');
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Import state
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'processing' | 'done'>('upload');
  const [importProgress, setImportProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const data = await invokeEdgeFunction('list-my-students', {});
      const fetchedStudents = data?.students || [];
      const fetchedAulas = data?.aulas || [];
      setAllStudents(fetchedStudents);
      setAulas(fetchedAulas);

      // Auto-select first aula if none selected
      if (fetchedAulas.length > 0 && !selectedAulaId) {
        const firstId = fetchedAulas[0].id;
        setSelectedAulaId(firstId);
        // Filter students by this aula — we match by nivel/grado/seccion
        filterStudentsByAula(fetchedStudents, fetchedAulas, firstId);
      } else if (selectedAulaId) {
        filterStudentsByAula(fetchedStudents, fetchedAulas, selectedAulaId);
      } else {
        setStudents(fetchedStudents);
      }
    } catch (err: any) {
      console.error('Error loading students:', err);
      toast({ title: 'Error', description: 'No se pudo cargar la lista de estudiantes', variant: 'destructive' });
    } finally {
      setLoadingStudents(false);
    }
  };

  const filterStudentsByAula = (allSt: Student[], allAulas: Aula[], aulaId: string) => {
    if (allAulas.length <= 1) {
      setStudents(allSt);
      return;
    }
    if (aulaId === '__orphan__') {
      setStudents(allSt.filter(s => !s.grado_seccion_id));
      return;
    }
    const aula = allAulas.find(a => a.id === aulaId);
    if (!aula) { setStudents(allSt); return; }
    // Include both assigned students and orphan students (no grado)
    setStudents(allSt.filter(s =>
      (s.nivel === aula.nivel && s.grado === aula.grado && s.seccion === aula.seccion) || !s.grado_seccion_id
    ));
  };

  const handleAulaChange = (aulaId: string) => {
    setSelectedAulaId(aulaId);
    filterStudentsByAula(allStudents, aulas, aulaId);
  };

  useEffect(() => { fetchStudents(); }, []);

  // Get the effective grado_seccion_id for registration
  const getActiveGradoSeccionId = (): string | undefined => {
    // If teacher has multi-aula, use selected one
    if (aulas.length > 0 && selectedAulaId) return selectedAulaId;
    // Fallback to profile
    return profile?.grado_seccion_id || undefined;
  };

  // Manual add
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{8}$/.test(dni)) {
      toast({ title: 'Error', description: 'DNI debe ser exactamente 8 dígitos', variant: 'destructive' });
      return;
    }
    const gradoId = getActiveGradoSeccionId();
    if (!gradoId) {
      toast({ title: 'Error', description: 'No tiene un aula asignada. Contacte a su director.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const email = `${dni}@dia.ugel.local`;
      await invokeEdgeFunction('create-user', {
        email,
        password: dni,
        dni,
        nombre_completo: nombre,
        role: 'estudiante',
        institucion_id: profile?.institucion_id,
        grado_seccion_id: gradoId,
      });
      toast({ title: 'Estudiante registrado', description: nombre });
      setOpen(false);
      setDni(''); setNombre('');
      fetchStudents();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al registrar estudiante', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- SIAGIE / Excel Import Logic ---
  const resetImport = () => {
    setParsedStudents([]);
    setImportResults([]);
    setImportStep('upload');
    setImportProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const downloadTemplate = () => {
    const content = 'DNI,Apellidos y Nombres\n71234567,García López Ana María\n71234568,Pérez Torres Carlos Alberto';
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plantilla_estudiantes_siagie.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const normalizeText = (t: string) => t.replace(/\s+/g, ' ').trim();

  const parseFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv' || ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (!text) return;
        parseCSV(text);
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        parseRows(rows);
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      toast({ title: 'Error', description: 'El archivo debe tener al menos un estudiante además del encabezado.', variant: 'destructive' });
      return;
    }
    const delimiter = lines[0].includes(';') ? ';' : ',';
    const rows = lines.map(l => l.split(delimiter).map(c => c.trim().replace(/^"|"$/g, '')));
    parseRows(rows);
  };

  const parseRows = (rows: string[][]) => {
    if (rows.length < 2) {
      toast({ title: 'Error', description: 'Archivo vacío o sin datos.', variant: 'destructive' });
      return;
    }

    const header = rows[0].map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    let dniCol = header.findIndex(h => h.includes('dni') || h.includes('documento'));
    let nombreCol = header.findIndex(h => h.includes('apellido') || h.includes('nombre') || h.includes('alumno') || h.includes('estudiante'));

    if (dniCol === -1) dniCol = 0;
    if (nombreCol === -1) nombreCol = dniCol === 0 ? 1 : 0;

    const parsed: ParsedStudent[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every(c => !c)) continue;
      const rawDni = String(row[dniCol] || '').replace(/\D/g, '');
      const rawNombre = normalizeText(String(row[nombreCol] || ''));

      let valid = true;
      let error: string | undefined;

      if (!rawDni || rawDni.length !== 8) { valid = false; error = 'DNI inválido (debe ser 8 dígitos)'; }
      else if (!rawNombre) { valid = false; error = 'Nombre vacío'; }

      parsed.push({ dni: rawDni, nombre_completo: rawNombre, valid, error });
    }

    if (parsed.length === 0) {
      toast({ title: 'Error', description: 'No se encontraron datos de estudiantes.', variant: 'destructive' });
      return;
    }
    if (parsed.length > 500) {
      toast({ title: 'Error', description: 'Máximo 500 estudiantes por lote.', variant: 'destructive' });
      return;
    }

    setParsedStudents(parsed);
    setImportStep('preview');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    const validStudents = parsedStudents.filter(s => s.valid);
    if (validStudents.length === 0) {
      toast({ title: 'Error', description: 'No hay estudiantes válidos para importar.', variant: 'destructive' });
      return;
    }
    const gradoId = getActiveGradoSeccionId();
    if (!gradoId) {
      toast({ title: 'Error', description: 'No tiene un aula asignada.', variant: 'destructive' });
      return;
    }
    setImportStep('processing');
    setImportProgress(10);

    try {
      const users = validStudents.map(s => ({
        dni: s.dni,
        nombre_completo: s.nombre_completo,
        email: `${s.dni}@dia.ugel.local`,
        password: s.dni,
        rol: 'estudiante',
        grado_seccion_id: gradoId,
      }));

      const data = await invokeEdgeFunction('bulk-create-users', {
        users,
        default_institucion_id: profile?.institucion_id || undefined,
      });

      setImportProgress(90);

      setImportResults(data.results || []);
      setImportStep('done');
      setImportProgress(100);

      const { created, failed } = data.summary || {};
      toast({
        title: 'Importación completada',
        description: `${created} estudiantes registrados, ${failed} con errores.`,
        variant: failed > 0 ? 'destructive' : 'default',
      });

      if (created > 0) fetchStudents();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al importar', variant: 'destructive' });
      setImportStep('preview');
      setImportProgress(0);
    }
  };

  const selectedAula = aulas.find(a => a.id === selectedAulaId);
  const aulaLabel = selectedAula
    ? `${students.length > 0 ? students[0].institucion + ' — ' : ''}${selectedAula.nivel} / ${selectedAula.grado} / Sección "${selectedAula.seccion}"`
    : students.length > 0
      ? `${students[0].institucion} — ${students[0].nivel} / ${students[0].grado} / Sección "${students[0].seccion}"`
      : null;

  const validCount = parsedStudents.filter(s => s.valid).length;
  const invalidCount = parsedStudents.filter(s => !s.valid).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Estudiantes</h1>
          <p className="text-muted-foreground">Registre estudiantes de forma manual o importando desde SIAGIE (Excel/CSV)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportUsersButton label="Exportar Excel" fileName="mis_estudiantes" />
          {/* SIAGIE Import Dialog */}
          <Dialog open={importOpen} onOpenChange={(v) => { setImportOpen(v); if (!v) resetImport(); }}>
            <DialogTrigger asChild>
              <Button variant="outline"><FileSpreadsheet className="h-4 w-4 mr-2" />Importar SIAGIE</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" />Importar Estudiantes desde SIAGIE</DialogTitle>
                <DialogDescription>Suba un archivo Excel o CSV exportado desde SIAGIE con las columnas DNI y Apellidos y Nombres.</DialogDescription>
              </DialogHeader>

              {importStep === 'upload' && (
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Aceptamos archivos <strong>.xlsx</strong>, <strong>.xls</strong> y <strong>.csv</strong>. El sistema detecta automáticamente las columnas de DNI y nombre del estudiante. La contraseña por defecto será el DNI.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={downloadTemplate}><Download className="h-4 w-4 mr-2" />Descargar Plantilla CSV</Button>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" onChange={handleFileChange} className="hidden" />
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">Seleccione un archivo Excel o CSV exportado desde SIAGIE</p>
                    <Button variant="secondary" onClick={() => fileRef.current?.click()}>Seleccionar Archivo</Button>
                  </div>
                </div>
              )}

              {importStep === 'preview' && (
                <div className="space-y-4 py-2">
                  <div className="flex gap-3 text-sm">
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" />{validCount} válidos</span>
                    {invalidCount > 0 && <span className="flex items-center gap-1 text-destructive"><XCircle className="h-4 w-4" />{invalidCount} con errores (serán omitidos)</span>}
                  </div>
                  <div className="overflow-x-auto max-h-[40vh] overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader><TableRow><TableHead>#</TableHead><TableHead>DNI</TableHead><TableHead>Apellidos y Nombres</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {parsedStudents.map((s, i) => (
                          <TableRow key={i} className={!s.valid ? 'bg-destructive/5' : ''}>
                            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-mono">{s.dni || '—'}</TableCell>
                            <TableCell>{s.nombre_completo || '—'}</TableCell>
                            <TableCell>{s.valid ? <Badge variant="secondary">OK</Badge> : <Badge variant="destructive">{s.error}</Badge>}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={resetImport}>Cancelar</Button>
                    <Button onClick={handleImport} disabled={validCount === 0}><Upload className="h-4 w-4 mr-2" />Importar {validCount} Estudiantes</Button>
                  </div>
                </div>
              )}

              {importStep === 'processing' && (
                <div className="space-y-4 py-8 text-center">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Registrando estudiantes… esto puede tomar unos momentos.</p>
                  <Progress value={importProgress} className="max-w-sm mx-auto" />
                </div>
              )}

              {importStep === 'done' && (
                <div className="space-y-4 py-2">
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" />{importResults.filter(r => r.success).length} registrados</span>
                    <span className="flex items-center gap-1 text-destructive"><XCircle className="h-4 w-4" />{importResults.filter(r => !r.success).length} con errores</span>
                  </div>
                  {importResults.some(r => !r.success) && (
                    <div className="overflow-x-auto max-h-[40vh] overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader><TableRow><TableHead>DNI</TableHead><TableHead>Nombre</TableHead><TableHead>Error</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {importResults.filter(r => !r.success).map((r, i) => (
                            <TableRow key={i}><TableCell className="font-mono">{r.dni}</TableCell><TableCell>{r.nombre_completo}</TableCell><TableCell className="text-xs text-destructive">{r.error}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <div className="flex justify-end"><Button onClick={() => { setImportOpen(false); resetImport(); }}>Cerrar</Button></div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Manual add */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" />Agregar Manual</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Estudiante</DialogTitle><DialogDescription>Complete los datos del nuevo estudiante. La contraseña será su DNI.</DialogDescription></DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4 mt-4">
                <div>
                  <Label>DNI del Estudiante</Label>
                  <Input value={dni} onChange={e => setDni(e.target.value)} required maxLength={8} pattern="\d{8}" placeholder="12345678" />
                </div>
                <div>
                  <Label>Apellidos y Nombres</Label>
                  <Input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="García Pérez María" />
                </div>
                {aulas.length > 1 && (
                  <div>
                    <Label>Aula destino</Label>
                    <Select value={selectedAulaId} onValueChange={handleAulaChange}>
                      <SelectTrigger><SelectValue placeholder="Seleccione aula" /></SelectTrigger>
                      <SelectContent>
                        {aulas.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.nivel} - {a.grado} "{a.seccion}"</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registrando…' : 'Registrar Estudiante'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Aula selector for multi-grado teachers */}
      {aulas.length > 1 && (
        <div className="flex items-center gap-3 flex-wrap">
          <Label className="text-sm font-medium text-muted-foreground">Aula:</Label>
          <Select value={selectedAulaId} onValueChange={handleAulaChange}>
            <SelectTrigger className="w-auto min-w-[200px]"><SelectValue placeholder="Seleccione aula" /></SelectTrigger>
            <SelectContent>
              {aulas.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.nivel} - {a.grado} "{a.seccion}"</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Aula info */}
      {aulaLabel && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-muted-foreground">{aulaLabel}</span>
          <Badge variant="secondary" className="ml-auto">{students.length} estudiante{students.length !== 1 ? 's' : ''}</Badge>
        </div>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Lista de Estudiantes</CardTitle>
            {students.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por DNI o nombre…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingStudents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando estudiantes…</span>
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay estudiantes registrados en su aula. Importe desde SIAGIE o agregue manualmente.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">N°</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">DNI</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Apellidos y Nombres</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Nivel</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Grado</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Sección</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                {students
                  .filter(s => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return s.dni.toLowerCase().includes(q) || s.nombre_completo.toLowerCase().includes(q);
                  })
                  .map((s, i) => (
                    <tr key={s.id} className={`border-b border-border hover:bg-muted/50 ${!s.grado_seccion_id ? 'bg-destructive/5' : ''}`}>
                      <td className="py-2 px-3">{i + 1}</td>
                      <td className="py-2 px-3 font-mono">{s.dni}</td>
                      <td className="py-2 px-3">
                        {s.nombre_completo}
                        {!s.grado_seccion_id && <Badge variant="destructive" className="ml-2 text-xs">Sin aula</Badge>}
                      </td>
                      <td className="py-2 px-3">{s.nivel || '—'}</td>
                      <td className="py-2 px-3">{s.grado || '—'}</td>
                      <td className="py-2 px-3">{s.seccion || '—'}</td>
                      <td className="py-2 px-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditStudent(s); setEditOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <EditStudentDialog
        student={editStudent}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={fetchStudents}
        aulas={aulas}
      />
    </div>
  );
};

export default EstudiantesRegistro;

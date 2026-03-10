import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { invokeEdgeFunction } from '@/lib/invokeEdgeFunction';
import { toast } from 'sonner';

interface PlanData {
  datos_informativos: {
    institucion: string;
    ubicacion: string;
    responsable: string;
    aula: string;
    total_estudiantes: number;
    anio: string;
    fecha_elaboracion: string;
  };
  diagnostico: string;
  objetivos: string[];
  competencias_priorizadas: { competencia: string; area: string; justificacion: string }[];
  estrategias: { estrategia: string; descripcion: string }[];
  actividades: { actividad: string; descripcion: string; responsable: string; competencia_relacionada: string }[];
  cronograma: { mes: string; actividades: string[] }[];
  recursos: { recurso: string; descripcion: string }[];
  evaluacion_seguimiento: { indicador: string; instrumento: string; frecuencia: string; responsable: string }[];
}

interface Props {
  tipo: 'institucional' | 'aula';
  label: string;
  institucionIdOverride?: string;
  gradoSeccionIdOverride?: string;
  compact?: boolean;
  disabled?: boolean;
}

const PlanRefuerzoButton = ({ tipo, label, institucionIdOverride, gradoSeccionIdOverride, compact, disabled }: Props) => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [open, setOpen] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { tipo };
      if (institucionIdOverride) body.institucion_id_override = institucionIdOverride;
      if (gradoSeccionIdOverride) body.grado_seccion_id_override = gradoSeccionIdOverride;
      const data = await invokeEdgeFunction<PlanData>('generate-plan-refuerzo', body);
      setPlan(data);
      setOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Error al generar el plan');
    } finally {
      setLoading(false);
    }
  };

  const buildHtmlContent = (forWord = false) => {
    if (!plan) return '';
    const titulo = tipo === 'institucional' ? 'Plan de Refuerzo Escolar Institucional' : 'Plan de Refuerzo Escolar de Aula';
    const wordMeta = forWord
      ? `<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
         <meta name="ProgId" content="Word.Document">
         <meta name="Generator" content="Microsoft Word 15">`
      : '';

    return `<!DOCTYPE html>
<html lang="es" ${forWord ? 'xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"' : ''}>
<head>
<meta charset="UTF-8">
${wordMeta}
<title>${titulo}</title>
<style>
  body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 30px; color: #1a1a1a; line-height: 1.6; }
  h1 { text-align: center; color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; font-size: 1.5em; }
  h2 { color: #1e3a5f; border-left: 4px solid #2563eb; padding-left: 12px; margin-top: 28px; font-size: 1.1em; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.9em; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
  th { background: #e0e7ff; color: #1e3a5f; font-weight: 600; }
  tr:nth-child(even) { background: #f8fafc; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
  .info-grid p { margin: 4px 0; }
  .info-label { font-weight: 600; color: #475569; }
  ul { padding-left: 20px; }
  li { margin-bottom: 4px; }
  .diagnostico { background: #fefce8; border: 1px solid #fde68a; padding: 14px; border-radius: 6px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>${titulo}</h1>

<h2>I. Datos Informativos</h2>
<div class="info-grid">
  <p><span class="info-label">Institución:</span> ${plan.datos_informativos.institucion}</p>
  <p><span class="info-label">Ubicación:</span> ${plan.datos_informativos.ubicacion}</p>
  <p><span class="info-label">Responsable:</span> ${plan.datos_informativos.responsable}</p>
  ${plan.datos_informativos.aula ? `<p><span class="info-label">Aula:</span> ${plan.datos_informativos.aula}</p>` : ''}
  <p><span class="info-label">Total Estudiantes:</span> ${plan.datos_informativos.total_estudiantes}</p>
  <p><span class="info-label">Año:</span> ${plan.datos_informativos.anio}</p>
  <p><span class="info-label">Fecha:</span> ${plan.datos_informativos.fecha_elaboracion}</p>
</div>

<h2>II. Diagnóstico</h2>
<div class="diagnostico">${plan.diagnostico}</div>

<h2>III. Objetivos</h2>
<ul>${plan.objetivos.map(o => `<li>${o}</li>`).join('')}</ul>

<h2>IV. Competencias Priorizadas</h2>
<table>
  <tr><th>Competencia</th><th>Área</th><th>Justificación</th></tr>
  ${plan.competencias_priorizadas.map(c => `<tr><td>${c.competencia}</td><td>${c.area}</td><td>${c.justificacion}</td></tr>`).join('')}
</table>

<h2>V. Estrategias</h2>
<table>
  <tr><th>Estrategia</th><th>Descripción</th></tr>
  ${plan.estrategias.map(e => `<tr><td>${e.estrategia}</td><td>${e.descripcion}</td></tr>`).join('')}
</table>

<h2>VI. Actividades</h2>
<table>
  <tr><th>Actividad</th><th>Descripción</th><th>Responsable</th><th>Competencia</th></tr>
  ${plan.actividades.map(a => `<tr><td>${a.actividad}</td><td>${a.descripcion}</td><td>${a.responsable}</td><td>${a.competencia_relacionada}</td></tr>`).join('')}
</table>

<h2>VII. Cronograma</h2>
<table>
  <tr><th>Mes</th><th>Actividades</th></tr>
  ${plan.cronograma.map(c => `<tr><td>${c.mes}</td><td><ul>${c.actividades.map(a => `<li>${a}</li>`).join('')}</ul></td></tr>`).join('')}
</table>

<h2>VIII. Recursos</h2>
<table>
  <tr><th>Recurso</th><th>Descripción</th></tr>
  ${plan.recursos.map(r => `<tr><td>${r.recurso}</td><td>${r.descripcion}</td></tr>`).join('')}
</table>

<h2>IX. Evaluación y Seguimiento</h2>
<table>
  <tr><th>Indicador</th><th>Instrumento</th><th>Frecuencia</th><th>Responsable</th></tr>
  ${plan.evaluacion_seguimiento.map(e => `<tr><td>${e.indicador}</td><td>${e.instrumento}</td><td>${e.frecuencia}</td><td>${e.responsable}</td></tr>`).join('')}
</table>

</body>
</html>`;
  };

  const handleDownloadWord = () => {
    if (!plan) return;
    const titulo = tipo === 'institucional' ? 'Plan_Refuerzo_Institucional' : 'Plan_Refuerzo_Aula';
    const html = buildHtmlContent(true);
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titulo}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Plan descargado en formato Word editable.');
  };

  const handleDownloadHTML = () => {
    if (!plan) return;
    const titulo = tipo === 'institucional' ? 'Plan_Refuerzo_Institucional' : 'Plan_Refuerzo_Aula';
    const html = buildHtmlContent(false);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titulo}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Plan descargado. Ábralo en su navegador e imprima como PDF (Ctrl+P).');
  };

  return (
    <>
      <Button
        onClick={handleGenerate}
        disabled={loading || disabled}
        className="gap-2"
        variant="outline"
        size={compact ? 'sm' : 'lg'}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        {loading ? 'Generando...' : label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {tipo === 'institucional' ? 'Plan de Refuerzo Escolar Institucional' : 'Plan de Refuerzo Escolar de Aula'}
            </DialogTitle>
          </DialogHeader>

          {plan && (
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="text-base font-semibold text-primary mb-2">I. Datos Informativos</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 bg-muted/50 p-4 rounded-lg">
                  <p><span className="font-medium text-muted-foreground">Institución:</span> {plan.datos_informativos.institucion}</p>
                  <p><span className="font-medium text-muted-foreground">Ubicación:</span> {plan.datos_informativos.ubicacion}</p>
                  <p><span className="font-medium text-muted-foreground">Responsable:</span> {plan.datos_informativos.responsable}</p>
                  {plan.datos_informativos.aula && <p><span className="font-medium text-muted-foreground">Aula:</span> {plan.datos_informativos.aula}</p>}
                  <p><span className="font-medium text-muted-foreground">Estudiantes:</span> {plan.datos_informativos.total_estudiantes}</p>
                  <p><span className="font-medium text-muted-foreground">Año:</span> {plan.datos_informativos.anio}</p>
                </div>
              </section>

              <section>
                <h3 className="text-base font-semibold text-primary mb-2">II. Diagnóstico</h3>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                  <p className="text-foreground">{plan.diagnostico}</p>
                </div>
              </section>

              <section>
                <h3 className="text-base font-semibold text-primary mb-2">III. Objetivos</h3>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  {plan.objetivos.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </section>

              <section>
                <h3 className="text-base font-semibold text-primary mb-2">IV. Competencias Priorizadas</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted"><th className="p-2 text-left font-semibold">Competencia</th><th className="p-2 text-left font-semibold">Área</th><th className="p-2 text-left font-semibold">Justificación</th></tr></thead>
                    <tbody>{plan.competencias_priorizadas.map((c, i) => (
                      <tr key={i} className="border-t"><td className="p-2">{c.competencia}</td><td className="p-2">{c.area}</td><td className="p-2">{c.justificacion}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-base font-semibold text-primary mb-2">V. Estrategias</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted"><th className="p-2 text-left font-semibold">Estrategia</th><th className="p-2 text-left font-semibold">Descripción</th></tr></thead>
                    <tbody>{plan.estrategias.map((e, i) => (
                      <tr key={i} className="border-t"><td className="p-2 font-medium">{e.estrategia}</td><td className="p-2">{e.descripcion}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-base font-semibold text-primary mb-2">VI. Actividades</h3>
                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted"><th className="p-2 text-left font-semibold">Actividad</th><th className="p-2 text-left font-semibold">Descripción</th><th className="p-2 text-left font-semibold">Responsable</th><th className="p-2 text-left font-semibold">Competencia</th></tr></thead>
                    <tbody>{plan.actividades.map((a, i) => (
                      <tr key={i} className="border-t"><td className="p-2 font-medium">{a.actividad}</td><td className="p-2">{a.descripcion}</td><td className="p-2">{a.responsable}</td><td className="p-2">{a.competencia_relacionada}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-base font-semibold text-primary mb-2">VII. Cronograma</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted"><th className="p-2 text-left font-semibold">Mes</th><th className="p-2 text-left font-semibold">Actividades</th></tr></thead>
                    <tbody>{plan.cronograma.map((c, i) => (
                      <tr key={i} className="border-t"><td className="p-2 font-medium">{c.mes}</td><td className="p-2"><ul className="list-disc list-inside">{c.actividades.map((a, j) => <li key={j}>{a}</li>)}</ul></td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-base font-semibold text-primary mb-2">VIII. Recursos</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted"><th className="p-2 text-left font-semibold">Recurso</th><th className="p-2 text-left font-semibold">Descripción</th></tr></thead>
                    <tbody>{plan.recursos.map((r, i) => (
                      <tr key={i} className="border-t"><td className="p-2 font-medium">{r.recurso}</td><td className="p-2">{r.descripcion}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-base font-semibold text-primary mb-2">IX. Evaluación y Seguimiento</h3>
                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted"><th className="p-2 text-left font-semibold">Indicador</th><th className="p-2 text-left font-semibold">Instrumento</th><th className="p-2 text-left font-semibold">Frecuencia</th><th className="p-2 text-left font-semibold">Responsable</th></tr></thead>
                    <tbody>{plan.evaluacion_seguimiento.map((e, i) => (
                      <tr key={i} className="border-t"><td className="p-2">{e.indicador}</td><td className="p-2">{e.instrumento}</td><td className="p-2">{e.frecuencia}</td><td className="p-2">{e.responsable}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>

              <div className="flex flex-wrap justify-center gap-3 pt-4 border-t">
                <Button onClick={handleDownloadWord} className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar Word (editable)
                </Button>
                <Button onClick={handleDownloadHTML} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar HTML/PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlanRefuerzoButton;

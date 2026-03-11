import { Download, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { evaluacionesPrimariaPdfs, type EvaluacionPdf } from '@/lib/evaluacionesPrimariaPdfs';
import { toast } from 'sonner';

interface Props {
  gradoFilter?: string | null;
  title?: string;
}

const openPdfBlob = async (pdf: EvaluacionPdf, download: boolean, setLoading: (k: string | null) => void) => {
  const key = `${pdf.fileName}-${download ? 'd' : 'v'}`;
  setLoading(key);
  try {
    const { data, error } = await supabase.storage.from('evaluaciones').download(pdf.fileName);
    if (error || !data) throw error || new Error('Sin datos');
    const url = URL.createObjectURL(data);
    if (download) {
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      window.open(url, '_blank');
    }
  } catch (e: any) {
    toast.error('No se pudo obtener el archivo: ' + (e.message || e));
  } finally {
    setLoading(null);
  }
};

const EvaluacionesDownloadCard = ({ gradoFilter, title = 'Cuadernillos de Evaluación de Entrada – Primaria' }: Props) => {
  const [loading, setLoading] = useState<string | null>(null);
  const pdfs = gradoFilter
    ? evaluacionesPrimariaPdfs.filter(p => p.grado === gradoFilter)
    : evaluacionesPrimariaPdfs;

  if (pdfs.length === 0) return null;

  const grouped = pdfs.reduce<Record<string, EvaluacionPdf[]>>((acc, p) => {
    (acc[p.grado] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="bg-card rounded-xl border p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div className="space-y-4">
        {Object.entries(grouped)
          .sort(([, a], [, b]) => a[0].gradoNumero - b[0].gradoNumero)
          .map(([grado, items]) => (
            <div key={grado}>
              {!gradoFilter && (
                <h3 className="text-sm font-semibold text-foreground mb-2">{grado} Grado</h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map(pdf => {
                  const viewKey = `${pdf.fileName}-v`;
                  const dlKey = `${pdf.fileName}-d`;
                  return (
                    <div key={pdf.fileName} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground flex-1 truncate">{pdf.titulo}</span>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8" title="Ver PDF"
                        disabled={loading === viewKey}
                        onClick={() => openPdfBlob(pdf, false, setLoading)}
                      >
                        {loading === viewKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8" title="Descargar PDF"
                        disabled={loading === dlKey}
                        onClick={() => openPdfBlob(pdf, true, setLoading)}
                      >
                        {loading === dlKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default EvaluacionesDownloadCard;

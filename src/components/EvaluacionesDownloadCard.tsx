import { Download, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { evaluacionesPdfs, getViewUrl, getDownloadUrl, type EvaluacionPdf } from '@/lib/evaluacionesPrimariaPdfs';

interface Props {
  gradoFilter?: string | null;
  nivelFilter?: 'Primaria' | 'Secundaria' | null;
  title?: string;
}

const EvaluacionesDownloadCard = ({ gradoFilter, nivelFilter, title }: Props) => {
  let pdfs = evaluacionesPdfs;

  if (nivelFilter) {
    pdfs = pdfs.filter(p => p.nivel === nivelFilter);
  } else {
    // Default to Primaria for backward compatibility
    pdfs = pdfs.filter(p => p.nivel === 'Primaria');
  }

  if (gradoFilter) {
    pdfs = pdfs.filter(p => p.grado === gradoFilter);
  }

  if (pdfs.length === 0) return null;

  const defaultTitle = nivelFilter === 'Secundaria'
    ? 'Cuadernillos de Evaluación de Entrada – Secundaria'
    : 'Cuadernillos de Evaluación de Entrada – Primaria';

  const grouped = pdfs.reduce<Record<string, EvaluacionPdf[]>>((acc, p) => {
    (acc[p.grado] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="bg-card rounded-xl border p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">{title || defaultTitle}</h2>
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
                {items.map(pdf => (
                  <div key={pdf.driveId} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground flex-1 truncate">{pdf.titulo}</span>
                    <a href={getViewUrl(pdf)} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver PDF">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                    <a href={getDownloadUrl(pdf)} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Descargar PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default EvaluacionesDownloadCard;

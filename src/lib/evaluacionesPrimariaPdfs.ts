// PDFs de evaluaciones de entrada - Primaria
// Servidos desde public/docs/ en el dominio de la app

export interface EvaluacionPdf {
  grado: string;
  gradoNumero: number;
  area: 'Comunicación' | 'Matemática';
  titulo: string;
  fileName: string;
}

export const evaluacionesPrimariaPdfs: EvaluacionPdf[] = [
  // --- Comunicación ---
  { grado: 'Primero', gradoNumero: 1, area: 'Comunicación', titulo: 'Ev. 1° Comunicación', fileName: 'comunicacion-1-primaria.pdf' },
  { grado: 'Segundo', gradoNumero: 2, area: 'Comunicación', titulo: 'Ev. 2° Comunicación', fileName: 'comunicacion-2-primaria.pdf' },
  { grado: 'Tercero', gradoNumero: 3, area: 'Comunicación', titulo: 'Ev. 3° Comunicación', fileName: 'comunicacion-3-primaria.pdf' },
  { grado: 'Cuarto', gradoNumero: 4, area: 'Comunicación', titulo: 'Ev. 4° Comunicación', fileName: 'comunicacion-4-primaria.pdf' },
  { grado: 'Quinto', gradoNumero: 5, area: 'Comunicación', titulo: 'Ev. 5° Comunicación', fileName: 'comunicacion-5-primaria.pdf' },
  { grado: 'Sexto', gradoNumero: 6, area: 'Comunicación', titulo: 'Ev. 6° Comunicación', fileName: 'comunicacion-6-primaria.pdf' },

  // --- Matemática ---
  { grado: 'Primero', gradoNumero: 1, area: 'Matemática', titulo: 'Ev. 1° Matemática', fileName: 'matematica-1-primaria.pdf' },
  { grado: 'Segundo', gradoNumero: 2, area: 'Matemática', titulo: 'Ev. 2° Matemática', fileName: 'matematica-2-primaria.pdf' },
  { grado: 'Tercero', gradoNumero: 3, area: 'Matemática', titulo: 'Ev. 3° Matemática', fileName: 'matematica-3-primaria.pdf' },
  { grado: 'Cuarto', gradoNumero: 4, area: 'Matemática', titulo: 'Ev. 4° Matemática', fileName: 'matematica-4-primaria.pdf' },
  { grado: 'Quinto', gradoNumero: 5, area: 'Matemática', titulo: 'Ev. 5° Matemática', fileName: 'matematica-5-primaria.pdf' },
  { grado: 'Sexto', gradoNumero: 6, area: 'Matemática', titulo: 'Ev. 6° Matemática', fileName: 'matematica-6-primaria.pdf' },
];

export function getViewUrl(pdf: EvaluacionPdf) {
  return `/docs/${pdf.fileName}`;
}

export function getDownloadUrl(pdf: EvaluacionPdf) {
  return `/docs/${pdf.fileName}`;
}

// PDFs de evaluaciones de entrada - Primaria
// Fuente: https://sites.google.com/ugelchiclayo.edu.pe/agp-ugel-cix/dia-2026/prueba-de-entrada/instrumentos-de-entrada/entrada-primaria

export interface EvaluacionPdf {
  grado: string;
  gradoNumero: number;
  area: 'Comunicación' | 'Matemática';
  titulo: string;
  /** Google Drive file ID (for legacy/Comunicación files) */
  driveId?: string;
  /** Local path in public/ folder (for updated files) */
  localPath?: string;
}

const BASE = 'https://drive.google.com/file/d/';

export const evaluacionesPrimariaPdfs: EvaluacionPdf[] = [
  // --- Comunicación (archivos locales actualizados) ---
  { grado: 'Primero', gradoNumero: 1, area: 'Comunicación', titulo: 'Ev. 1° Comunicación', localPath: '/evaluaciones/comunicacion-1-primaria.pdf' },
  { grado: 'Segundo', gradoNumero: 2, area: 'Comunicación', titulo: 'Ev. 2° Comunicación', localPath: '/evaluaciones/comunicacion-2-primaria.pdf' },
  { grado: 'Tercero', gradoNumero: 3, area: 'Comunicación', titulo: 'Ev. 3° Comunicación', localPath: '/evaluaciones/comunicacion-3-primaria.pdf' },
  { grado: 'Cuarto', gradoNumero: 4, area: 'Comunicación', titulo: 'Ev. 4° Comunicación', localPath: '/evaluaciones/comunicacion-4-primaria.pdf' },
  { grado: 'Quinto', gradoNumero: 5, area: 'Comunicación', titulo: 'Ev. 5° Comunicación', localPath: '/evaluaciones/comunicacion-5-primaria.pdf' },
  { grado: 'Sexto', gradoNumero: 6, area: 'Comunicación', titulo: 'Ev. 6° Comunicación', localPath: '/evaluaciones/comunicacion-6-primaria.pdf' },

  // --- Matemática (archivos locales actualizados) ---
  { grado: 'Primero', gradoNumero: 1, area: 'Matemática', titulo: 'Ev. 1° Matemática', localPath: '/evaluaciones/matematica-1-primaria.pdf' },
  { grado: 'Segundo', gradoNumero: 2, area: 'Matemática', titulo: 'Ev. 2° Matemática', localPath: '/evaluaciones/matematica-2-primaria.pdf' },
  { grado: 'Tercero', gradoNumero: 3, area: 'Matemática', titulo: 'Ev. 3° Matemática', localPath: '/evaluaciones/matematica-3-primaria.pdf' },
  { grado: 'Cuarto', gradoNumero: 4, area: 'Matemática', titulo: 'Ev. 4° Matemática', localPath: '/evaluaciones/matematica-4-primaria.pdf' },
  { grado: 'Quinto', gradoNumero: 5, area: 'Matemática', titulo: 'Ev. 5° Matemática', localPath: '/evaluaciones/matematica-5-primaria.pdf' },
  { grado: 'Sexto', gradoNumero: 6, area: 'Matemática', titulo: 'Ev. 6° Matemática', localPath: '/evaluaciones/matematica-6-primaria.pdf' },
];

export function getViewUrl(pdf: EvaluacionPdf) {
  if (pdf.localPath) return pdf.localPath;
  return `${BASE}${pdf.driveId}/view`;
}

export function getDownloadUrl(pdf: EvaluacionPdf) {
  if (pdf.localPath) return pdf.localPath;
  return `https://drive.google.com/uc?export=download&id=${pdf.driveId}`;
}

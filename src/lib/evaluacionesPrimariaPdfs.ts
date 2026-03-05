// PDFs de evaluaciones de entrada - Primaria (Google Drive)
// Fuente: https://sites.google.com/ugelchiclayo.edu.pe/agp-ugel-cix/dia-2026/prueba-de-entrada/instrumentos-de-entrada/entrada-primaria

export interface EvaluacionPdf {
  grado: string;
  gradoNumero: number;
  area: 'Comunicación' | 'Matemática';
  titulo: string;
  driveId: string;
}

const BASE = 'https://drive.google.com/file/d/';

export const evaluacionesPrimariaPdfs: EvaluacionPdf[] = [
  { grado: 'Primero', gradoNumero: 1, area: 'Comunicación', titulo: 'Ev. 1° Comunicación', driveId: '1v2GO7ZECyHScLW1WUZA2wAVDuBbmIsCd' },
  { grado: 'Primero', gradoNumero: 1, area: 'Matemática', titulo: 'Ev. 1° Matemática', driveId: '1R599mrp1YoC45vrW2wiSQHK69aRpwsKJ' },
  { grado: 'Segundo', gradoNumero: 2, area: 'Comunicación', titulo: 'Ev. 2° Comunicación', driveId: '1om4gFmUeJwo6UAZ6pELarYU685cjQpIz' },
  { grado: 'Segundo', gradoNumero: 2, area: 'Matemática', titulo: 'Ev. 2° Matemática', driveId: '1__HFBVc0JdMXQleOd-luh3zOMwdSfD0J' },
  { grado: 'Tercero', gradoNumero: 3, area: 'Comunicación', titulo: 'Ev. 3° Comunicación', driveId: '1htnIHUN3jQSYeWfK0vlywZgXVeDV_gcp' },
  { grado: 'Tercero', gradoNumero: 3, area: 'Matemática', titulo: 'Ev. 3° Matemática', driveId: '1jcpxK3mohfBLQNAMSf0kZTtUeIwbu6cH' },
  { grado: 'Cuarto', gradoNumero: 4, area: 'Comunicación', titulo: 'Ev. 4° Comunicación', driveId: '1AGcfpNB-vS6tsImiwfLfjSiV7Ay_EoHc' },
  { grado: 'Cuarto', gradoNumero: 4, area: 'Matemática', titulo: 'Ev. 4° Matemática', driveId: '1EWCk30LriY0n3PH00_DZnl3Cy-juWIQz' },
  { grado: 'Quinto', gradoNumero: 5, area: 'Comunicación', titulo: 'Ev. 5° Comunicación', driveId: '1w7wHjRwYhoYEYr5KF7f8Cq5LZOEgIOav' },
  { grado: 'Quinto', gradoNumero: 5, area: 'Matemática', titulo: 'Ev. 5° Matemática', driveId: '1OSnBvSZarJydRCu2pnRXT-R-kojq8bVu' },
  { grado: 'Sexto', gradoNumero: 6, area: 'Comunicación', titulo: 'Ev. 6° Comunicación', driveId: '1kmwuI-tZPYzoNJrZXdqoftC5aDmWktoZ' },
  { grado: 'Sexto', gradoNumero: 6, area: 'Matemática', titulo: 'Ev. 6° Matemática', driveId: '16J-2WmROtYDusLOJCMXffzkClLf7KkAX' },
];

export function getViewUrl(driveId: string) {
  return `${BASE}${driveId}/view`;
}

export function getDownloadUrl(driveId: string) {
  return `https://drive.google.com/uc?export=download&id=${driveId}`;
}

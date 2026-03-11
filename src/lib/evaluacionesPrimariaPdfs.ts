// PDFs de evaluaciones de entrada - Primaria
// Servidos desde Google Drive (enlaces públicos)

export interface EvaluacionPdf {
  grado: string;
  gradoNumero: number;
  area: 'Comunicación' | 'Matemática';
  titulo: string;
  driveId: string;
}

export const evaluacionesPrimariaPdfs: EvaluacionPdf[] = [
  // --- Comunicación ---
  { grado: 'Primero', gradoNumero: 1, area: 'Comunicación', titulo: 'Ev. 1° Comunicación', driveId: '1hvsnjgX_u8PDzjJewPstD5SSX_dD_ls8' },
  { grado: 'Segundo', gradoNumero: 2, area: 'Comunicación', titulo: 'Ev. 2° Comunicación', driveId: '1dQXyj3XU3AnQtUoSfIhsXUtm_ydxTUfy' },
  { grado: 'Tercero', gradoNumero: 3, area: 'Comunicación', titulo: 'Ev. 3° Comunicación', driveId: '1cCRYVnjpqEJJj_pbrk-0oOl71Po0CxY_' },
  { grado: 'Cuarto', gradoNumero: 4, area: 'Comunicación', titulo: 'Ev. 4° Comunicación', driveId: '1bWjOrcDDwssHCxfj2hAOxKa_JRn92Utb' },
  { grado: 'Quinto', gradoNumero: 5, area: 'Comunicación', titulo: 'Ev. 5° Comunicación', driveId: '16lUzwfS-4C6S6t3yO1Hqk9iOi_6c7m_s' },
  { grado: 'Sexto', gradoNumero: 6, area: 'Comunicación', titulo: 'Ev. 6° Comunicación', driveId: '1pdrWGUTwSzB7odVi3500cGDBVvwFowts' },

  // --- Matemática ---
  { grado: 'Primero', gradoNumero: 1, area: 'Matemática', titulo: 'Ev. 1° Matemática', driveId: '175pJS-sDN-wjS-mhYNhF08RIgOnaAzXO' },
  { grado: 'Segundo', gradoNumero: 2, area: 'Matemática', titulo: 'Ev. 2° Matemática', driveId: '15Ozs6dhx-NLPgxKjzCxTqAQVAKCKnhWq' },
  { grado: 'Tercero', gradoNumero: 3, area: 'Matemática', titulo: 'Ev. 3° Matemática', driveId: '1WKOw4cqaAnnUVvFDkYA1pKlbOqGxuxiL' },
  { grado: 'Cuarto', gradoNumero: 4, area: 'Matemática', titulo: 'Ev. 4° Matemática', driveId: '1RirrTgzPUz0UETssOCZWPP7fx7QOX02q' },
  { grado: 'Quinto', gradoNumero: 5, area: 'Matemática', titulo: 'Ev. 5° Matemática', driveId: '1fBv5N89t6f7lMYZuC6gomeP2Zh-TVF73' },
  { grado: 'Sexto', gradoNumero: 6, area: 'Matemática', titulo: 'Ev. 6° Matemática', driveId: '12T6Txat3KI6u0AOpgQHi-4y4bU4RPP7W' },
];

export function getViewUrl(pdf: EvaluacionPdf) {
  return `https://drive.google.com/file/d/${pdf.driveId}/view`;
}

export function getDownloadUrl(pdf: EvaluacionPdf) {
  return `https://drive.google.com/uc?export=download&id=${pdf.driveId}`;
}

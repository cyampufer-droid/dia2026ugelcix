// PDFs de evaluaciones de entrada - Primaria y Secundaria
// Servidos desde Google Drive (enlaces públicos)

export interface EvaluacionPdf {
  grado: string;
  gradoNumero: number;
  area: 'Comunicación' | 'Matemática';
  titulo: string;
  driveId: string;
  nivel: 'Primaria' | 'Secundaria';
}

export const evaluacionesPdfs: EvaluacionPdf[] = [
  // ===== PRIMARIA =====
  // --- Comunicación ---
  { nivel: 'Primaria', grado: 'Primero', gradoNumero: 1, area: 'Comunicación', titulo: 'Ev. 1° Comunicación', driveId: '1hvsnjgX_u8PDzjJewPstD5SSX_dD_ls8' },
  { nivel: 'Primaria', grado: 'Segundo', gradoNumero: 2, area: 'Comunicación', titulo: 'Ev. 2° Comunicación', driveId: '1dQXyj3XU3AnQtUoSfIhsXUtm_ydxTUfy' },
  { nivel: 'Primaria', grado: 'Tercero', gradoNumero: 3, area: 'Comunicación', titulo: 'Ev. 3° Comunicación', driveId: '1cCRYVnjpqEJJj_pbrk-0oOl71Po0CxY_' },
  { nivel: 'Primaria', grado: 'Cuarto', gradoNumero: 4, area: 'Comunicación', titulo: 'Ev. 4° Comunicación', driveId: '1bWjOrcDDwssHCxfj2hAOxKa_JRn92Utb' },
  { nivel: 'Primaria', grado: 'Quinto', gradoNumero: 5, area: 'Comunicación', titulo: 'Ev. 5° Comunicación', driveId: '16lUzwfS-4C6S6t3yO1Hqk9iOi_6c7m_s' },
  { nivel: 'Primaria', grado: 'Sexto', gradoNumero: 6, area: 'Comunicación', titulo: 'Ev. 6° Comunicación', driveId: '1pdrWGUTwSzB7odVi3500cGDBVvwFowts' },

  // --- Matemática ---
  { nivel: 'Primaria', grado: 'Primero', gradoNumero: 1, area: 'Matemática', titulo: 'Ev. 1° Matemática', driveId: '175pJS-sDN-wjS-mhYNhF08RIgOnaAzXO' },
  { nivel: 'Primaria', grado: 'Segundo', gradoNumero: 2, area: 'Matemática', titulo: 'Ev. 2° Matemática', driveId: '15Ozs6dhx-NLPgxKjzCxTqAQVAKCKnhWq' },
  { nivel: 'Primaria', grado: 'Tercero', gradoNumero: 3, area: 'Matemática', titulo: 'Ev. 3° Matemática', driveId: '1WKOw4cqaAnnUVvFDkYA1pKlbOqGxuxiL' },
  { nivel: 'Primaria', grado: 'Cuarto', gradoNumero: 4, area: 'Matemática', titulo: 'Ev. 4° Matemática', driveId: '1RirrTgzPUz0UETssOCZWPP7fx7QOX02q' },
  { nivel: 'Primaria', grado: 'Quinto', gradoNumero: 5, area: 'Matemática', titulo: 'Ev. 5° Matemática', driveId: '1fBv5N89t6f7lMYZuC6gomeP2Zh-TVF73' },
  { nivel: 'Primaria', grado: 'Sexto', gradoNumero: 6, area: 'Matemática', titulo: 'Ev. 6° Matemática', driveId: '12T6Txat3KI6u0AOpgQHi-4y4bU4RPP7W' },

  // ===== SECUNDARIA =====
  // --- Comunicación (Comprensión Lectora) ---
  { nivel: 'Secundaria', grado: 'Primero', gradoNumero: 1, area: 'Comunicación', titulo: 'Ev. 1° Comunicación', driveId: '12iLLJ2LJRNjw-8NF_6pMN58W4LZOGqAM' },
  { nivel: 'Secundaria', grado: 'Segundo', gradoNumero: 2, area: 'Comunicación', titulo: 'Ev. 2° Comunicación', driveId: '16dMwF62T30VnvIHyjXEwgX325ik8LhS0' },
  { nivel: 'Secundaria', grado: 'Tercero', gradoNumero: 3, area: 'Comunicación', titulo: 'Ev. 3° Comunicación', driveId: '16XEHyGfTIJefYn1_8suAIpQXMCsGiYi_' },
  { nivel: 'Secundaria', grado: 'Cuarto', gradoNumero: 4, area: 'Comunicación', titulo: 'Ev. 4° Comunicación', driveId: '1LQ2nVCkbp825C2t3ro5FB0miHQZFhUtK' },
  { nivel: 'Secundaria', grado: 'Quinto', gradoNumero: 5, area: 'Comunicación', titulo: 'Ev. 5° Comunicación', driveId: '1jC6-y9tg5Ovh6ve_J4ivX4aLaw-3M6OY' },

  // --- Matemática (Cuadernillo A y B) ---
  { nivel: 'Secundaria', grado: 'Primero', gradoNumero: 1, area: 'Matemática', titulo: 'Ev. 1° Matemática – Cuadernillo A', driveId: '18lcLVwWpdh5NxA8e176jvLIHHvwfTxK6' },
  { nivel: 'Secundaria', grado: 'Primero', gradoNumero: 1, area: 'Matemática', titulo: 'Ev. 1° Matemática – Cuadernillo B', driveId: '1RWER0zj9mANb1FbtTf5ZsG2Pdma6qVzp' },
  { nivel: 'Secundaria', grado: 'Segundo', gradoNumero: 2, area: 'Matemática', titulo: 'Ev. 2° Matemática – Cuadernillo A', driveId: '1cayG0ra-70G9rZXNhdalCNz1Q7HKL51X' },
  { nivel: 'Secundaria', grado: 'Segundo', gradoNumero: 2, area: 'Matemática', titulo: 'Ev. 2° Matemática – Cuadernillo B', driveId: '1TwScDVncpmmAgLUHBR-84LJ3MmyDVlEU' },
  { nivel: 'Secundaria', grado: 'Tercero', gradoNumero: 3, area: 'Matemática', titulo: 'Ev. 3° Matemática – Cuadernillo A', driveId: '1ubSCzo35NapSmDISXvKxXFGihyvDBbO4' },
  { nivel: 'Secundaria', grado: 'Tercero', gradoNumero: 3, area: 'Matemática', titulo: 'Ev. 3° Matemática – Cuadernillo B', driveId: '1I_ggFSuwHY4MaSRLOOLlLZl8vhzVUpGX' },
  { nivel: 'Secundaria', grado: 'Cuarto', gradoNumero: 4, area: 'Matemática', titulo: 'Ev. 4° Matemática – Cuadernillo A', driveId: '1uBG6_735xyM4Ewh2hmvQ2GTLzWRHgw3H' },
  { nivel: 'Secundaria', grado: 'Cuarto', gradoNumero: 4, area: 'Matemática', titulo: 'Ev. 4° Matemática – Cuadernillo B', driveId: '1OCm5rhDnIdfuvmA2XbDPt18wvuV3Wwz5' },
  { nivel: 'Secundaria', grado: 'Quinto', gradoNumero: 5, area: 'Matemática', titulo: 'Ev. 5° Matemática – Cuadernillo A', driveId: '1UPtll_7VJjrUAU5DcKU1euxzD6V0TpwC' },
  { nivel: 'Secundaria', grado: 'Quinto', gradoNumero: 5, area: 'Matemática', titulo: 'Ev. 5° Matemática – Cuadernillo B', driveId: '1SQigil5G2wObMJSzMFOPincbng0Nv8_u' },
];


/** @deprecated Use evaluacionesPdfs instead */
export const evaluacionesPrimariaPdfs = evaluacionesPdfs.filter(p => p.nivel === 'Primaria');

export function getViewUrl(pdf: EvaluacionPdf) {
  return `https://drive.google.com/file/d/${pdf.driveId}/view`;
}

export function getDownloadUrl(pdf: EvaluacionPdf) {
  return `https://drive.google.com/uc?export=download&id=${pdf.driveId}`;
}

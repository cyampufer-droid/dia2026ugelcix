/**
 * Calculates the total score by comparing student answers to the answer key.
 */
export function calcularPuntaje(respuestas: string[], respuestasCorrectas: string[]): number {
  let puntaje = 0;
  for (let i = 0; i < respuestas.length; i++) {
    if (respuestas[i] && respuestasCorrectas[i] && respuestas[i] === respuestasCorrectas[i]) {
      puntaje++;
    }
  }
  return puntaje;
}

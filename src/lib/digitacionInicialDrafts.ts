export const DEFAULT_NIVEL_LOGRO = 'En Inicio';

export interface ConclusionData {
  logros: string;
  dificultades: string;
  mejora: string;
  nivel_logro: string;
}

export type ConclusionesState = Record<string, ConclusionData>;

const STORAGE_PREFIX = 'digitacion-inicial-draft';

function getStorageKey(userId?: string) {
  return `${STORAGE_PREFIX}:${userId ?? 'anon'}`;
}

export function normalizeConclusionData(data?: Partial<ConclusionData> | null): ConclusionData {
  return {
    logros: data?.logros ?? '',
    dificultades: data?.dificultades ?? '',
    mejora: data?.mejora ?? '',
    nivel_logro: data?.nivel_logro ?? DEFAULT_NIVEL_LOGRO,
  };
}

export function hasMeaningfulConclusionContent(data?: Partial<ConclusionData> | null): boolean {
  const normalized = normalizeConclusionData(data);
  return Boolean(
    normalized.logros.trim() ||
      normalized.dificultades.trim() ||
      normalized.mejora.trim() ||
      normalized.nivel_logro !== DEFAULT_NIVEL_LOGRO
  );
}

export function areConclusionDataEqual(a?: Partial<ConclusionData> | null, b?: Partial<ConclusionData> | null): boolean {
  const left = normalizeConclusionData(a);
  const right = normalizeConclusionData(b);

  return (
    left.logros === right.logros &&
    left.dificultades === right.dificultades &&
    left.mejora === right.mejora &&
    left.nivel_logro === right.nivel_logro
  );
}

export function filterConclusionesState(state: ConclusionesState, allowedKeys: Set<string>): ConclusionesState {
  return Object.fromEntries(Object.entries(state).filter(([key]) => allowedKeys.has(key)));
}

export function loadDigitacionInicialDraft(userId?: string): ConclusionesState {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, Partial<ConclusionData>>;
    if (!parsed || typeof parsed !== 'object') return {};

    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, normalizeConclusionData(value)])
    );
  } catch (error) {
    console.error('Error loading Inicial draft:', error);
    return {};
  }
}

export function saveDigitacionInicialDraft(state: ConclusionesState, userId?: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch (error) {
    console.error('Error saving Inicial draft:', error);
  }
}
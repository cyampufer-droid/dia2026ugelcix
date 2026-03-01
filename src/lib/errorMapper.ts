/**
 * Maps technical database/auth errors to user-friendly messages.
 * Prevents information leakage of internal schema details.
 */
export function getUserFriendlyError(error: any): string {
  const message = error?.message || '';
  const code = error?.code || '';

  // Auth errors
  if (message.includes('Invalid login credentials')) return 'Credenciales incorrectas. Verifique su correo y contraseña.';
  if (message.includes('Email not confirmed')) return 'Su correo electrónico aún no ha sido verificado.';
  if (message.includes('User already registered')) return 'Ya existe una cuenta con ese correo electrónico.';
  if (message.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (message.includes('rate limit')) return 'Demasiados intentos. Espere un momento antes de reintentar.';

  // Database constraint errors
  if (code === '23505') return 'Este registro ya existe en el sistema.';
  if (code === '23503') return 'No se puede completar la operación. Verifique los datos ingresados.';
  if (code === '23514') return 'Los datos ingresados no cumplen con los requisitos.';

  // RLS errors
  if (message.includes('row-level security') || message.includes('RLS')) {
    return 'No tiene permisos para realizar esta acción.';
  }

  // Network errors
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Error de conexión. Verifique su conexión a internet.';
  }

  // Generic fallback
  return 'Ocurrió un error. Intente nuevamente o contacte al soporte.';
}

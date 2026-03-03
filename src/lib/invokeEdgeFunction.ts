import { supabase } from '@/integrations/supabase/client';

/**
 * Wrapper around supabase.functions.invoke that properly extracts
 * error messages from non-2xx responses instead of losing them.
 *
 * When an edge function returns e.g. 400 with { error: "DNI duplicado" },
 * supabase.functions.invoke sets `error` to a FunctionsHttpError and `data` to null,
 * losing the actual message. This helper reads the response body from the error context.
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });

  if (error) {
    // Try to extract the real error message from the response body
    let message = '';
    try {
      // FunctionsHttpError exposes the Response via .context
      const context = (error as any).context;
      if (context && typeof context.json === 'function') {
        const responseBody = await context.json();
        message = responseBody?.error || '';
      }
    } catch {
      // If json() fails, try text() as fallback
      try {
        const context = (error as any).context;
        if (context && typeof context.text === 'function') {
          const text = await context.text();
          try {
            const parsed = JSON.parse(text);
            message = parsed?.error || '';
          } catch {
            message = text || '';
          }
        }
      } catch {
        // ignore
      }
    }

    if (!message) {
      message = error.message || 'Error de conexión con el servidor';
    }

    // Clean up generic SDK messages
    if (message === 'Edge Function returned a non-2xx status code') {
      message = 'Error del servidor. Intente nuevamente.';
    }

    throw new Error(message);
  }

  // Also handle edge functions that return 200 with { error: "..." }
  if (data?.error) {
    throw new Error(data.error);
  }

  return data as T;
}

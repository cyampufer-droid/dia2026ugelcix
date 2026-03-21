import { supabase } from '@/integrations/supabase/client';

/**
 * Wrapper around direct edge-function fetch calls.
 *
 * Using fetch here avoids the Supabase SDK's FunctionsHttpError surface for expected
 * business errors (e.g. duplicate email), while still preserving the real server message.
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  try {
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { error: text } : null;
    }
  } catch {
    data = null;
  }

  const message = data?.error || data?.message || response.statusText || 'Error del servidor. Intente nuevamente.';

  if (!response.ok) {
    throw new Error(message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as T;
}

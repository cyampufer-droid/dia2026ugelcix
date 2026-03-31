import { lazy, ComponentType } from 'react';

/**
 * Wraps React.lazy with retry logic for chunk loading failures.
 * When a new deployment happens, old chunks become unavailable.
 * This retries the import and forces a reload if all retries fail.
 */
export function lazyRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 2,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await importFn();
      } catch (err) {
        if (i === retries) {
          // Last retry failed — check if we already tried reloading
          const key = 'chunk-reload-' + Date.now();
          const lastReload = sessionStorage.getItem('chunk-reload');
          if (!lastReload || Date.now() - Number(lastReload) > 10000) {
            sessionStorage.setItem('chunk-reload', String(Date.now()));
            window.location.reload();
          }
          throw err;
        }
        // Wait briefly before retry
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    throw new Error('Failed to load module');
  });
}

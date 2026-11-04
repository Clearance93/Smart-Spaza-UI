import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { NavigationError, provideRouter, withNavigationErrorHandler } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { scannerAuthInterceptor } from './core/services/scanner-auth.interceptor';
import { authInterceptor } from './core/services/auth.interceptor';

const CHUNK_RELOAD_KEY = 'smart-spaza-chunk-reload';

/**
 * A tab that stayed open across a deployment can reference chunk hashes that no
 * longer exist. Clicking a page then fails silently because the lazy import never
 * resolves. Reload once to pick up the current shell (rate-limited to avoid loops).
 */
function recoverFromStaleBundle(error: NavigationError): void {
  const message = String((error?.error as { message?: string } | undefined)?.message ?? error?.error ?? '');
  const isChunkFailure = /dynamically imported module|Importing a module script failed|Loading chunk/i.test(message);

  if (!isChunkFailure) return;

  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? '0');
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage unavailable: still reload.
  }

  window.location.reload();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withNavigationErrorHandler(recoverFromStaleBundle)),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, scannerAuthInterceptor]))
  ]
};

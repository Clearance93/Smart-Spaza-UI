import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ScannerSessionStore } from './scanner-session.store';
import {
  ApiAuthResponse,
  AuthSession,
  readStoredSession,
  writeStoredSession,
} from './auth.storage';

const SCANNER_REQUEST_HEADER = 'X-Scanner-Request';
const SCANNER_STORAGE_KEY = 'smart_spaza_scanner_session';

/** True when the access token is missing its expiry or is within a minute of it. */
function tokenNeedsRefresh(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const claims = JSON.parse(atob(padded)) as { exp?: number };

    if (!claims.exp) return true;

    return claims.exp * 1000 <= Date.now() + 60_000;
  } catch {
    return true;
  }
}

let refreshInFlight$: Observable<AuthSession> | null = null;

function refreshSession(http: HttpClient, current: AuthSession): Observable<AuthSession> {
  if (refreshInFlight$) return refreshInFlight$;

  refreshInFlight$ = http
    .post<ApiAuthResponse>(`${environment.apiUrl}/Auth/refresh-token`, {
      refreshToken: current.refreshToken,
    })
    .pipe(
      map((response) => ({ ...response, fullName: current.fullName }) as AuthSession),
      tap((session) => writeStoredSession(session)),
      finalize(() => {
        refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

  return refreshInFlight$;
}

/**
 * Attaches the access token and silently refreshes it once when the API
 * answers 401 (access tokens are short-lived, the refresh token lasts days).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);
  const scannerStore = inject(ScannerSessionStore);

  if (req.url.includes('/Auth/login') || req.url.includes('/Auth/refresh-token')) {
    return next(req);
  }

  // Scanner requests with their own scanner sign-in use the scanner token, not the
  // platform token. Scanner requests reusing the platform session fall through to
  // the normal platform token/refresh flow.
  if (req.headers.has(SCANNER_REQUEST_HEADER) && scannerStore.isOwnSession()) {
    return next(req);
  }

  const session = readStoredSession();
  if (!session?.token) return next(req);

  const token = session.token;
  const authorized = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  // Refresh before sending when the access token has expired or is about to.
  // This avoids a burst of 401s and keeps long-open dashboards usable.
  if (tokenNeedsRefresh(token)) {
    if (!session.refreshToken) {
      return signOutAndFail(router, new HttpErrorResponse({ status: 401 }));
    }

    return refreshSession(http, session).pipe(
      switchMap((refreshed) =>
        next(req.clone({ setHeaders: { Authorization: `Bearer ${refreshed.token}` } })),
      ),
      catchError((error: unknown) => {
        // Another tab may have rotated the refresh token first; use its token.
        const latest = readStoredSession();
        if (latest?.token && latest.token !== token && !tokenNeedsRefresh(latest.token)) {
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${latest.token}` } }));
        }

        return signOutAndFail(router, error);
      }),
    );
  }

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Another request may already have refreshed the token while this one was in flight.
      const latest = readStoredSession()?.token;

      if (latest && latest !== token) {
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${latest}` } }));
      }

      if (!session.refreshToken) {
        return signOutAndFail(router, error);
      }

      return refreshSession(http, session).pipe(
        switchMap((refreshed) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${refreshed.token}` } })),
        ),
        catchError(() => signOutAndFail(router, error)),
      );
    }),
  );
};

function signOutAndFail(router: Router, error: unknown) {
  const status = error instanceof HttpErrorResponse ? error.status : 0;

  // A network blip or an API outage is not the same as an invalid session.
  // Keep the user signed in and let the caller surface the error.
  if (status === 0 || status >= 500) {
    return throwError(() => error);
  }

  writeStoredSession(null);

  try {
    localStorage.removeItem(SCANNER_STORAGE_KEY);
  } catch {
    // Storage unavailable.
  }

  try {
    // Full reload so every in-memory session signal is reset, not just storage.
    // Resolve against the app's base href: the platform is served from /app on the
    // HTTPS host and from / on the .NET host, so a hard-coded '/login' would 404.
    const loginUrl = new URL('login', document.baseURI).toString();
    window.location.assign(loginUrl);
  } catch {
    try {
      router.navigate(['/login']);
    } catch {
      /* navigation unavailable (SSR) */
    }
  }

  return throwError(() => error);
}

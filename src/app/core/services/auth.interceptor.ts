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
  writeStoredSession(null);

  try {
    // Full reload so every in-memory session signal is reset, not just storage.
    window.location.assign('/login');
  } catch {
    try {
      router.navigate(['/login']);
    } catch {
      /* navigation unavailable (SSR) */
    }
  }

  return throwError(() => error);
}

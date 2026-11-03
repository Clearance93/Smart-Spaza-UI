import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ScannerSessionStore } from './scanner-session.store';

const SCANNER_REQUEST_HEADER = 'X-Scanner-Request';

interface RefreshResponse {
  token: string;
  refreshToken: string;
  email?: string | null;
  roles?: string[];
  roleUserId?: string | null;
}

let refreshInFlight$: Observable<RefreshResponse> | null = null;

function refreshSession(
  http: HttpClient,
  store: ScannerSessionStore,
  refreshToken: string,
): Observable<RefreshResponse> {
  if (refreshInFlight$) return refreshInFlight$;

  refreshInFlight$ = http
    .post<RefreshResponse>(`${environment.apiUrl}/Auth/refresh-token`, { refreshToken })
    .pipe(
      tap((response) => {
        store.save({
          token: response.token,
          refreshToken: response.refreshToken,
          email: response.email ?? store.getEmail() ?? '',
          roles: response.roles ?? store.getRoles(),
          roleUserId: response.roleUserId ?? store.getRoleUserId(),
          source: 'own',
        });
      }),
      finalize(() => {
        refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

  return refreshInFlight$;
}

/**
 * Adds the scanner token when the platform token is not already attached.
 * Scanner-only logins are refreshed automatically on a 401 instead of
 * dropping the user back to the sign-in screen.
 */
export const scannerAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(ScannerSessionStore);
  const http = inject(HttpClient);

  const isScannerRequest = req.headers.has(SCANNER_REQUEST_HEADER);

  if (!isScannerRequest) return next(req);

  const withoutMarker = req.clone({
    headers: req.headers.delete(SCANNER_REQUEST_HEADER),
  });

  // When the scanner borrowed the platform session, the platform interceptor has
  // already attached (and can refresh) the platform token.
  if (!store.isOwnSession()) return next(withoutMarker);

  const token = store.getToken();

  if (!token) return next(withoutMarker);

  const withToken = (request: typeof req, accessToken: string) =>
    request.clone({
      headers: request.headers.delete(SCANNER_REQUEST_HEADER).set('Authorization', `Bearer ${accessToken}`),
    });

  return next(withToken(req, token)).pipe(
    catchError((error: unknown) => {
      const refreshToken = store.getRefreshToken();

      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !store.isOwnSession() ||
        !refreshToken
      ) {
        return throwError(() => error);
      }

      return refreshSession(http, store, refreshToken).pipe(
        switchMap((refreshed) => next(withToken(req, refreshed.token))),
        catchError(() => {
          store.clear();
          return throwError(() => error);
        }),
      );
    }),
  );
};

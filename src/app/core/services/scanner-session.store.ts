import { Injectable, signal } from '@angular/core';
import { readStoredSession } from './auth.storage';

const KEY = 'smart_spaza_scanner_session';

export interface ScannerSession {
  token: string;
  email: string;
  roleUserId: string | null;
  roles: string[];
  refreshToken?: string | null;
  /** 'own' = signed in on the scanner, 'app' = borrowed from the platform login. */
  source?: 'own' | 'app';
}

@Injectable({ providedIn: 'root' })
export class ScannerSessionStore {
  private _session = signal<ScannerSession | null>(this.read());

  session = this._session.asReadonly();

  getToken(): string | null {
    return this.current()?.token ?? null;
  }

  getRefreshToken(): string | null {
    return this.current()?.refreshToken ?? null;
  }

  isOwnSession(): boolean {
    // Only a real scanner sign-in counts as "own". A store that has never been
    // initialised borrows the platform session, so scanner requests must fall
    // through to the platform token/refresh flow.
    return this.current()?.source === 'own';
  }

  getRoleUserId(): string | null {
    return this.current()?.roleUserId ?? null;
  }

  getEmail(): string | null {
    return this.current()?.email ?? null;
  }

  getRoles(): string[] {
    return this.current()?.roles ?? [];
  }

  isLoggedIn(): boolean {
    return !!this.current()?.token;
  }

  /**
   * The scanner session, falling back to the platform login. The fallback is
   * resolved on every read rather than once at construction, so signing in on
   * the dashboard immediately enables the scanner without a page reload.
   */
  private current(): ScannerSession | null {
    const session = this._session();
    if (session) return session;

    const auth = readStoredSession();
    if (!auth) return null;

    return {
      token: auth.token,
      email: auth.email,
      roleUserId: auth.roleUserId,
      roles: auth.roles,
      refreshToken: auth.refreshToken,
      source: 'app',
    };
  }

  save(session: ScannerSession): void {
    const next: ScannerSession = { ...session, source: session.source ?? 'own' };
    this._session.set(next);
    this.write(next);
  }

  clear(): void {
    this._session.set(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  }

  private read(): ScannerSession | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const stored = JSON.parse(raw) as ScannerSession;
        return { ...stored, source: stored.source ?? 'own' };
      }
    } catch {
      /* storage unavailable */
    }

    // Reuse the platform login so a signed-in retailer/supplier can scan straight away.
    const auth = readStoredSession();

    return auth
      ? {
          token: auth.token,
          email: auth.email,
          roleUserId: auth.roleUserId,
          roles: auth.roles,
          refreshToken: auth.refreshToken,
          source: 'app',
        }
      : null;
  }

  private write(session: ScannerSession): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(session));
    } catch {
      /* storage unavailable */
    }
  }
}

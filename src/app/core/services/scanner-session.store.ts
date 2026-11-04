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
    // Inside the platform app the platform session always wins, so scanner
    // requests must use the platform token (and its refresh flow) rather than a
    // possibly stale scanner-only sign-in.
    if (readStoredSession()) return false;

    return this._session()?.source === 'own';
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
   * The scanner session, falling back to the platform login. The platform session
   * always wins inside the app so a stale scanner sign-in can never shadow it.
   */
  private current(): ScannerSession | null {
    const auth = readStoredSession();
    if (auth) {
      return {
        token: auth.token,
        email: auth.email,
        roleUserId: auth.roleUserId,
        roles: auth.roles,
        refreshToken: auth.refreshToken,
        source: 'app',
      };
    }

    return this._session();
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

export const AUTH_STORAGE_KEY = 'smart-spaza-session';

export interface ApiAuthResponse {
  token: string;
  expiration: string;
  refreshToken: string;
  refreshTokenExpiration: string;
  email: string;
  roles: string[];
  roleUserId: string | null;
}

export interface AuthSession extends ApiAuthResponse {
  fullName: string;
}

export function readStoredSession(): AuthSession | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: AuthSession | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (session) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private browsing; the session still works in memory.
  }
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    if (typeof atob === 'undefined') return {};
    const payload = token.split('.')[1];
    if (!payload) return {};
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

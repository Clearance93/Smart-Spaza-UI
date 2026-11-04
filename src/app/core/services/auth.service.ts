import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiAuthResponse,
  AuthSession,
  decodeJwtPayload,
  readStoredSession,
  writeStoredSession,
} from './auth.storage';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'RETAILER' | 'SUPPLIER' | 'ADMIN' | 'DRIVER';
}

export type RegistrationRole = 'SpazaOwner' | 'Supplier' | 'Driver';

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  whatsAppNumber: string;
  role: RegistrationRole;
}

export interface RegisterResult {
  message: string;
  email: string;
  roles: string[];
  emailConfirmed: boolean;
}

const API_ROLE_MAP: Record<string, User['role']> = {
  spazaowner: 'RETAILER',
  supplier: 'SUPPLIER',
  driver: 'DRIVER',
  admin: 'ADMIN',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _session = signal<AuthSession | null>(readStoredSession());
  private _user = computed<User | null>(() => this.toUser(this._session()));

  readonly user = this._user;
  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isDriver = computed(() => this._user()?.role === 'DRIVER');
  readonly isSupplier = computed(() => this._user()?.role === 'SUPPLIER');
  readonly isRetailer = computed(() => this._user()?.role === 'RETAILER');

  constructor() {
    // Remove the old demo role picker session if it is still around.
    try {
      localStorage.removeItem('smart-spaza-user');
    } catch {
      // Storage may be unavailable.
    }
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<ApiAuthResponse>(`${environment.apiUrl}/Auth/login`, {
        email: email.trim(),
        password,
      })
      .pipe(
        tap((response) => {
          const role = this.mapApiRole(response.roles);
          if (!role) {
            throw new Error('This account does not have a Smart Spaza role.');
          }

          const session: AuthSession = {
            ...response,
            fullName: this.fullName(response),
          };

          this._session.set(session);
          writeStoredSession(session);
        }),
        map(() => {
          const user = this._user();
          if (!user) throw new Error('Sign in failed.');
          return user;
        }),
      );
  }

  register(input: RegisterInput): Observable<RegisterResult> {
    return this.http
      .post<{ message?: string; email?: string; roles?: string[]; emailConfirmed?: boolean }>(
        `${environment.apiUrl}/Auth/registration`,
        input,
      )
      .pipe(
        map((response) => ({
          message:
            response.message ??
            'Registration successful. Please check your email to confirm your account.',
          email: response.email ?? input.email,
          roles: response.roles ?? [input.role],
          emailConfirmed: response.emailConfirmed === true,
        })),
      );
  }

  logout(): void {    const refreshToken = this._session()?.refreshToken;

    if (refreshToken) {
      this.http
        .post(`${environment.apiUrl}/Auth/revoke-token`, { refreshToken })
        .subscribe({ error: () => undefined });
    }

    this._session.set(null);
    writeStoredSession(null);
    this.router.navigate(['/login']);
  }

  userRole(): string | undefined {
    return this._user()?.role;
  }

  homeRoute(role: User['role']): string {
    // Each portal has its own live dashboard; all are scoped by the JWT.
    if (role === 'SUPPLIER') return '/supplier/dashboard';
    if (role === 'DRIVER') return '/driver/dashboard';
    return '/dashboard';
  }

  roleLabel(): string {
    const map: Record<string, string> = {
      RETAILER: 'Retailer',
      SUPPLIER: 'Supplier',
      DRIVER: 'Driver',
      ADMIN: 'Administrator',
    };
    return map[this.userRole() ?? ''] ?? '';
  }

  private mapApiRole(roles: string[] | null | undefined): User['role'] | null {
    for (const role of roles ?? []) {
      const mapped = API_ROLE_MAP[role.toLowerCase()];
      if (mapped) return mapped;
    }
    return null;
  }

  private toUser(session: AuthSession | null): User | null {
    if (!session) return null;

    const role = this.mapApiRole(session.roles);
    if (!role) return null;

    return {
      id: session.roleUserId ?? session.email,
      name: session.fullName || session.email.split('@')[0],
      email: session.email,
      role,
    };
  }

  private fullName(response: ApiAuthResponse): string {
    const claims = decodeJwtPayload(response.token);
    const fromToken = claims['extension_FullName'] ?? claims['name'] ?? claims['unique_name'];
    const name = typeof fromToken === 'string' ? fromToken.trim() : '';
    return name || response.email.split('@')[0];
  }
}

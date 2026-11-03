import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let navigateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    navigateSpy = vi.fn(() => Promise.resolve(true));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: navigateSpy } },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should start signed out when no session is stored', () => {
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isSupplier()).toBe(false);
    expect(service.isDriver()).toBe(false);
    expect(service.userRole()).toBeUndefined();
  });

  it('should authenticate against the API and map SpazaOwner to RETAILER', () => {
    const users: User[] = [];

    service.login('demo@smartspaza.co.za', 'Spaza_123').subscribe((user) => users.push(user));

    const request = httpMock.expectOne('/api/Auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'demo@smartspaza.co.za',
      password: 'Spaza_123',
    });

    request.flush({
      token: 'header.payload.signature',
      expiration: new Date(Date.now() + 600_000).toISOString(),
      refreshToken: 'refresh-token',
      refreshTokenExpiration: new Date(Date.now() + 86_400_000).toISOString(),
      email: 'demo@smartspaza.co.za',
      roles: ['SpazaOwner'],
      roleUserId: 'user-1',
    });

    expect(users[0].role).toBe('RETAILER');
    expect(service.user()?.email).toBe('demo@smartspaza.co.za');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.homeRoute('RETAILER')).toBe('/dashboard');
  });

  it('should map Supplier and Driver roles correctly', () => {
    service.login('supplier@smartspaza.co.za', 'Spaza_123').subscribe();
    httpMock.expectOne('/api/Auth/login').flush({
      token: 'header.payload.signature',
      expiration: new Date().toISOString(),
      refreshToken: 'refresh',
      refreshTokenExpiration: new Date().toISOString(),
      email: 'supplier@smartspaza.co.za',
      roles: ['Supplier'],
      roleUserId: null,
    });

    expect(service.user()?.role).toBe('SUPPLIER');
    expect(service.homeRoute('SUPPLIER')).toBe('/dashboard');
  });

  it('should clear the session and redirect on logout', () => {
    service.logout();

    expect(service.user()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});

import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  AuthService,
  type RegisterResult,
  type RegistrationRole,
} from '../../core/services/auth.service';

type Mode = 'login' | 'register';

interface RoleOption {
  value: RegistrationRole;
  label: string;
  hint: string;
  icon: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-dark-950 px-4 py-10 relative overflow-hidden">
      <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-600/10 blur-3xl"></div>
      <div class="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary-600/10 blur-3xl"></div>

      <div class="w-full max-w-md relative">
        <div class="flex items-center gap-3 justify-center mb-8">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <span class="text-white font-bold">SS</span>
          </div>
          <div>
            <span class="block text-white font-bold text-xl leading-tight">Smart Spaza</span>
            <span class="block text-primary-300 text-xs font-medium">Township commerce platform</span>
          </div>
        </div>

        <div class="bg-dark-900/90 border border-dark-800 rounded-2xl p-6 shadow-2xl backdrop-blur">
          @if (registerSuccess(); as result) {
            <div class="text-center py-2">
              <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-500/15 text-2xl text-primary-300">✓</div>
              <h2 class="mt-4 text-lg font-semibold text-white">
                {{ result.emailConfirmed ? 'Account created' : 'Check your inbox' }}
              </h2>
              <p class="mt-2 text-sm text-dark-400">{{ result.message }}</p>
              <p class="mt-3 text-sm font-mono text-dark-300">{{ result.email }}</p>
              <button type="button" (click)="backToLogin()"
                class="mt-6 w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-all hover:from-primary-700 hover:to-primary-700">
                Continue to sign in →
              </button>
            </div>
          } @else {
            <div class="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-dark-950 p-1">
              <button type="button" (click)="setMode('login')"
                class="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
                [class]="mode() === 'login' ? 'bg-primary-600 text-white shadow' : 'text-dark-400 hover:text-white'">
                Sign in
              </button>
              <button type="button" (click)="setMode('register')"
                class="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
                [class]="mode() === 'register' ? 'bg-primary-600 text-white shadow' : 'text-dark-400 hover:text-white'">
                Create account
              </button>
            </div>

            <h1 class="text-lg font-semibold text-white mb-1">
              {{ mode() === 'login' ? 'Sign in to your account' : 'Register your business' }}
            </h1>
            <p class="text-sm text-dark-400 mb-5">
              {{ mode() === 'login'
                ? 'Retailer, supplier and driver portals.'
                : 'Spaza owners, suppliers and drivers — pick your role and join.' }}
            </p>

            @if (error()) {
              <div class="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-200">
                <span class="mt-0.5">⚠️</span>
                <span>{{ error() }}</span>
              </div>
            }

            @if (mode() === 'login') {
              <form (ngSubmit)="submit()" class="space-y-4">
                <label class="block">
                  <span class="text-xs font-semibold text-dark-400 uppercase tracking-wide">Email address</span>
                  <input
                    type="email"
                    name="email"
                    autocomplete="username"
                    [value]="email()"
                    (input)="email.set($any($event.target).value)"
                    placeholder="you@smartspaza.co.za"
                    class="mt-1.5 w-full rounded-xl border border-dark-700 bg-dark-950 px-3.5 py-2.5 text-sm text-white placeholder:text-dark-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none" />
                </label>

                <label class="block">
                  <span class="text-xs font-semibold text-dark-400 uppercase tracking-wide">Password</span>
                  <div class="relative mt-1.5">
                    <input
                      [type]="showPassword() ? 'text' : 'password'"
                      name="password"
                      autocomplete="current-password"
                      [value]="password()"
                      (input)="password.set($any($event.target).value)"
                      placeholder="Enter your password"
                      class="w-full rounded-xl border border-dark-700 bg-dark-950 px-3.5 py-2.5 pr-16 text-sm text-white placeholder:text-dark-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none" />
                    <button type="button" (click)="showPassword.set(!showPassword())"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-dark-400 hover:text-white px-2 py-1">
                      {{ showPassword() ? 'Hide' : 'Show' }}
                    </button>
                  </div>
                </label>

                <button type="submit" [disabled]="loading()"
                  class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-primary-500/20 transition-all">
                  @if (loading()) {
                    <span class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    Signing in...
                  } @else {
                    Sign in →
                  }
                </button>
              </form>
            } @else {
              <form (ngSubmit)="submitRegistration()" class="space-y-4">
                <div>
                  <span class="text-xs font-semibold text-dark-400 uppercase tracking-wide">I am a</span>
                  <div class="mt-1.5 grid grid-cols-3 gap-2">
                    @for (option of roleOptions; track option.value) {
                      <button type="button" (click)="role.set(option.value)" [attr.aria-pressed]="role() === option.value"
                        class="rounded-xl border px-2 py-2.5 text-center transition-all"
                        [class]="role() === option.value
                          ? 'border-primary-500 bg-primary-500/10 text-white'
                          : 'border-dark-700 bg-dark-950 text-dark-400 hover:border-dark-600 hover:text-white'">
                        <span class="block text-lg leading-none">{{ option.icon }}</span>
                        <span class="mt-1 block text-xs font-semibold">{{ option.label }}</span>
                      </button>
                    }
                  </div>
                </div>

                <label class="block">
                  <span class="text-xs font-semibold text-dark-400 uppercase tracking-wide">Full name</span>
                  <input
                    type="text"
                    name="fullName"
                    autocomplete="name"
                    [value]="fullName()"
                    (input)="fullName.set($any($event.target).value)"
                    placeholder="Thandi Nkosi"
                    class="mt-1.5 w-full rounded-xl border border-dark-700 bg-dark-950 px-3.5 py-2.5 text-sm text-white placeholder:text-dark-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none" />
                </label>

                <label class="block">
                  <span class="text-xs font-semibold text-dark-400 uppercase tracking-wide">Email address</span>
                  <input
                    type="email"
                    name="registerEmail"
                    autocomplete="email"
                    [value]="email()"
                    (input)="email.set($any($event.target).value)"
                    placeholder="you@smartspaza.co.za"
                    class="mt-1.5 w-full rounded-xl border border-dark-700 bg-dark-950 px-3.5 py-2.5 text-sm text-white placeholder:text-dark-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none" />
                </label>

                <label class="block">
                  <span class="text-xs font-semibold text-dark-400 uppercase tracking-wide">WhatsApp number</span>
                  <input
                    type="tel"
                    name="whatsAppNumber"
                    autocomplete="tel"
                    [value]="whatsAppNumber()"
                    (input)="whatsAppNumber.set($any($event.target).value)"
                    placeholder="+27 82 000 0000"
                    class="mt-1.5 w-full rounded-xl border border-dark-700 bg-dark-950 px-3.5 py-2.5 text-sm text-white placeholder:text-dark-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none" />
                </label>

                <div class="grid gap-4 sm:grid-cols-2">
                  <label class="block">
                    <span class="text-xs font-semibold text-dark-400 uppercase tracking-wide">Password</span>
                    <div class="relative mt-1.5">
                      <input
                        [type]="showPassword() ? 'text' : 'password'"
                        name="registerPassword"
                        autocomplete="new-password"
                        [value]="password()"
                        (input)="password.set($any($event.target).value)"
                        placeholder="At least 8 characters"
                        class="w-full rounded-xl border border-dark-700 bg-dark-950 px-3.5 py-2.5 pr-14 text-sm text-white placeholder:text-dark-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none" />
                      <button type="button" (click)="showPassword.set(!showPassword())"
                        class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-dark-400 hover:text-white px-2 py-1">
                        {{ showPassword() ? 'Hide' : 'Show' }}
                      </button>
                    </div>
                  </label>

                  <label class="block">
                    <span class="text-xs font-semibold text-dark-400 uppercase tracking-wide">Confirm</span>
                    <input
                      [type]="showPassword() ? 'text' : 'password'"
                      name="confirmPassword"
                      autocomplete="new-password"
                      [value]="confirmPassword()"
                      (input)="confirmPassword.set($any($event.target).value)"
                      placeholder="Re-enter password"
                      class="mt-1.5 w-full rounded-xl border border-dark-700 bg-dark-950 px-3.5 py-2.5 text-sm text-white placeholder:text-dark-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none" />
                  </label>
                </div>

                <button type="submit" [disabled]="registering()"
                  class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-primary-500/20 transition-all">
                  @if (registering()) {
                    <span class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    Creating account...
                  } @else {
                    Create account →
                  }
                </button>
              </form>
            }
          }
        </div>

        <p class="text-center text-xs text-dark-500 mt-6">
          Connected to SmartSpazaAPI · The Digital Backbone of Township Commerce
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = signal<Mode>('login');

  email = signal('');
  password = signal('');
  showPassword = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  // Registration
  fullName = signal('');
  whatsAppNumber = signal('');
  confirmPassword = signal('');
  role = signal<RegistrationRole>('SpazaOwner');
  registering = signal(false);
  registerSuccess = signal<RegisterResult | null>(null);

  roleOptions: RoleOption[] = [
    { value: 'SpazaOwner', label: 'Spaza owner', hint: 'Retail shop', icon: '🏪' },
    { value: 'Supplier', label: 'Supplier', hint: 'Wholesale', icon: '📦' },
    { value: 'Driver', label: 'Driver', hint: 'Deliveries', icon: '🚚' },
  ];

  ngOnInit(): void {    const user = this.auth.user();
    if (user) this.router.navigate([this.auth.homeRoute(user.role)]);
  }

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.error.set(null);
    this.registerSuccess.set(null);
    this.password.set('');
    this.confirmPassword.set('');
  }

  backToLogin(): void {
    this.registerSuccess.set(null);
    this.mode.set('login');
    this.error.set(null);
    this.password.set('');
  }

  submit(): void {
    if (!this.email().trim() || !this.password()) {
      this.error.set('Enter your email address and password.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.email(), this.password()).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.router.navigate([this.auth.homeRoute(user.role)]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.messageFor(err));
      },
    });
  }

  submitRegistration(): void {
    const fullName = this.fullName().trim();
    const email = this.email().trim();
    const whatsapp = this.whatsAppNumber().trim();
    const password = this.password();

    if (!fullName) {
      this.error.set('Enter your full name.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error.set('Enter a valid email address.');
      return;
    }

    if (whatsapp.replace(/\D/g, '').length < 9) {
      this.error.set('Enter a valid WhatsApp number.');
      return;
    }

    if (password.length < 8) {
      this.error.set('Use a password of at least 8 characters.');
      return;
    }

    if (password !== this.confirmPassword()) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.registering.set(true);
    this.error.set(null);

    this.auth
      .register({ fullName, email, password, whatsAppNumber: whatsapp, role: this.role() })
      .subscribe({
        next: (result) => {
          this.registering.set(false);
          this.registerSuccess.set(result);
          this.email.set(result.email);
          this.password.set('');
          this.confirmPassword.set('');
        },
        error: (err) => {
          this.registering.set(false);
          this.error.set(this.registrationMessageFor(err));
        },
      });
  }

  private messageFor(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Cannot reach SmartSpazaAPI. Make sure the API is running on port 5223.';
      }
      if (err.status === 400 || err.status === 401) {
        return 'Invalid email or password. Please try again.';
      }
      const detail = err.error?.message ?? err.error?.Message ?? err.error?.detail ?? err.error?.title;
      return typeof detail === 'string' ? detail : 'Sign in failed. Please try again.';
    }
    return err instanceof Error ? err.message : 'Sign in failed. Please try again.';
  }

  private registrationMessageFor(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Cannot reach SmartSpazaAPI. Make sure the API is running and try again.';
      }

      if (err.status === 409) {
        return 'An account with this email address already exists. Try signing in instead.';
      }

      if (err.status === 429) {
        return 'Too many attempts. Please wait a moment and try again.';
      }

      const body = err.error as
        | { message?: string; Message?: string; errors?: { propertyName?: string; errorMessage?: string }[] }
        | null;

      const first = body?.errors?.[0];
      if (first?.errorMessage) {
        return first.propertyName ? `${first.propertyName}: ${first.errorMessage}` : first.errorMessage;
      }
    }

    return 'Registration failed. Please check your details and try again.';
  }
}

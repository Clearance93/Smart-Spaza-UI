import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-retailer-settings',
  standalone: true,
  imports: [FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-4xl mx-auto animate-fade-in">
      <div class="mb-6">
        <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Settings</h1>
        <p class="text-dark-500 mt-1">Your account and security</p>
      </div>

      <section class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-lg font-bold text-white">
            {{ initials() }}
          </div>
          <div class="min-w-0">
            <h2 class="truncate text-lg font-bold text-dark-900">{{ user()?.name }}</h2>
            <p class="text-sm text-dark-500">{{ user()?.email }}</p>
            <span class="mt-1 inline-flex rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700">
              {{ auth.roleLabel() }}
            </span>
          </div>
        </div>

        <dl class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="rounded-xl bg-dark-50 px-4 py-3">
            <dt class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Account id</dt>
            <dd class="mt-0.5 truncate font-mono text-xs text-dark-700">{{ user()?.id }}</dd>
          </div>
          <div class="rounded-xl bg-dark-50 px-4 py-3">
            <dt class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Session expires</dt>
            <dd class="mt-0.5 text-xs text-dark-700">
              {{ auth.session()?.expiration ? (auth.session()?.expiration | date: 'd MMM yyyy, HH:mm') : '—' }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="mt-5 rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
        <h2 class="text-sm font-semibold text-dark-900">Change password</h2>
        <p class="mt-0.5 text-xs text-dark-400">
          Use at least 8 characters with an uppercase letter, a number and a symbol.
        </p>

        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="mb-1 block text-xs font-semibold text-dark-600">Current password</span>
            <input type="password" [(ngModel)]="oldPassword" autocomplete="current-password"
              class="w-full rounded-xl border border-dark-200 bg-white px-3 py-2.5 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-semibold text-dark-600">New password</span>
            <input type="password" [(ngModel)]="newPassword" autocomplete="new-password"
              class="w-full rounded-xl border border-dark-200 bg-white px-3 py-2.5 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-semibold text-dark-600">Confirm new password</span>
            <input type="password" [(ngModel)]="confirmPassword" autocomplete="new-password"
              class="w-full rounded-xl border border-dark-200 bg-white px-3 py-2.5 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </label>
        </div>

        @if (passwordMessage(); as message) {
          <p class="mt-3 rounded-lg px-3 py-2 text-sm"
            [class]="passwordOk() ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">
            {{ message }}
          </p>
        }

        <button (click)="changePassword()" [disabled]="saving()"
          class="mt-4 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60">
          {{ saving() ? 'Saving…' : 'Update password' }}
        </button>
      </section>

      <section class="mt-5 rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
        <h2 class="text-sm font-semibold text-dark-900">Session</h2>
        <p class="mt-0.5 text-xs text-dark-400">Signing out revokes this device's refresh token.</p>
        <button (click)="auth.logout()"
          class="mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100">
          Sign out
        </button>
      </section>
    </div>
  `,
})
export class RetailerSettingsComponent {
  auth = inject(AuthService);
  private http = inject(HttpClient);

  user = this.auth.user;

  oldPassword = '';
  newPassword = '';
  confirmPassword = '';

  saving = signal(false);
  passwordMessage = signal<string | null>(null);
  passwordOk = signal(false);

  initials(): string {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'SS';
  }

  changePassword(): void {
    this.passwordMessage.set(null);

    if (!this.oldPassword || !this.newPassword) {
      this.passwordOk.set(false);
      this.passwordMessage.set('Enter your current and new password.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordOk.set(false);
      this.passwordMessage.set('The new passwords do not match.');
      return;
    }

    this.saving.set(true);

    this.http
      .post(`${environment.apiUrl}/Auth/change-password`, {
        oldPassword: this.oldPassword,
        newPassword: this.newPassword,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.passwordOk.set(true);
          this.passwordMessage.set('Password changed successfully.');
          this.oldPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        },
        error: (error: { error?: { message?: string } }) => {
          this.saving.set(false);
          this.passwordOk.set(false);
          this.passwordMessage.set(
            error?.error?.message ?? 'Could not change your password. Check your current password.',
          );
        },
      });
  }
}

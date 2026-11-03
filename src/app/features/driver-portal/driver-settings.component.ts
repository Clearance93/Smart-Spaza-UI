import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { DriverService } from '../../core/services/driver.service';

@Component({
  selector: 'app-driver-settings',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-4xl mx-auto animate-fade-in">
      <app-page-header title="Settings" subtitle="Your driver profile, vehicle and preferences">
        <button (click)="save()"
          class="bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-primary-500/20 transition-all">
          Save changes
        </button>
      </app-page-header>

      @if (toast()) {
        <div class="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          <span>✅</span><span>{{ toast() }}</span>
        </div>
      }

      <form (ngSubmit)="save()" class="space-y-6">
        <section class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-lg font-bold">
              {{ initials }}
            </div>
            <div>
              <h2 class="font-bold text-dark-900">{{ profile().name }}</h2>
              <p class="text-xs text-dark-400">{{ profile().id }} · {{ profile().tier }} · {{ profile().base }}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
              <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Full name</span>
              <input name="name" [(ngModel)]="form.name" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Phone number</span>
              <input name="phone" [(ngModel)]="form.phone" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
            </label>
            <label class="block md:col-span-2">
              <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Email</span>
              <input name="email" type="email" [(ngModel)]="form.email" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
            </label>
          </div>
        </section>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
            <h2 class="font-bold text-dark-900">Vehicle</h2>
            <p class="text-xs text-dark-400 mt-0.5 mb-4">Used for deliveries and customer tracking</p>
            <div class="space-y-4">
              <label class="block">
                <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Vehicle</span>
                <input name="vehicle" [(ngModel)]="form.vehicle" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 outline-none" />
              </label>
              <label class="block">
                <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Number plate</span>
                <input name="plate" [(ngModel)]="form.plate" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 outline-none" />
              </label>
              <div class="rounded-xl bg-dark-50 p-3.5 text-xs text-dark-500">
                Next service: <span class="font-semibold text-dark-800">14 Nov 2026</span> · Fuel level 78%
              </div>
            </div>
          </section>

          <section class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
            <h2 class="font-bold text-dark-900">Preferences</h2>
            <p class="text-xs text-dark-400 mt-0.5 mb-4">Control the notifications you receive</p>
            <div class="space-y-3">
              @for (pref of preferences; track pref.key) {
                <label class="flex items-center justify-between gap-3 cursor-pointer">
                  <span class="text-sm text-dark-700">{{ pref.label }}</span>
                  <input type="checkbox" [name]="pref.key" [(ngModel)]="form[pref.key]"
                    class="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-400" />
                </label>
              }
            </div>
          </section>
        </div>
      </form>
    </div>
  `,
})
export class DriverSettingsComponent {
  private driver = inject(DriverService);

  profile = this.driver.profile;
  toast = signal<string | null>(null);

  form = {
    name: this.driver.profile().name,
    phone: this.driver.profile().phone,
    email: this.driver.profile().email,
    vehicle: this.driver.profile().vehicle,
    plate: this.driver.profile().plate,
    newAssignments: true,
    payouts: true,
    customerRatings: true,
    vehicleReminders: true,
  };

  preferences = [
    { key: 'newAssignments' as const, label: 'New delivery assignments' },
    { key: 'payouts' as const, label: 'Payout confirmations' },
    { key: 'customerRatings' as const, label: 'Customer ratings' },
    { key: 'vehicleReminders' as const, label: 'Vehicle service reminders' },
  ];

  get initials(): string {
    return this.profile().name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
  }

  save(): void {
    this.toast.set('Driver profile saved.');
  }
}

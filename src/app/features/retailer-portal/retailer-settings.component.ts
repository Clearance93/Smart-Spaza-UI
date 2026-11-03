import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { RetailerService } from '../../core/services/retailer.service';

@Component({
  selector: 'app-retailer-settings',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-4xl mx-auto animate-fade-in">
      <app-page-header title="Settings" subtitle="Manage your shop preferences">
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
          <h2 class="font-bold text-dark-900">Business Profile</h2>
          <p class="text-xs text-dark-400 mt-0.5 mb-4">Your shop information shown to suppliers and drivers</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
              <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Shop name</span>
              <input name="shopName" [(ngModel)]="form.shopName" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Owner name</span>
              <input name="ownerName" [(ngModel)]="form.ownerName" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Phone</span>
              <input name="phone" [(ngModel)]="form.phone" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Email</span>
              <input name="email" type="email" [(ngModel)]="form.email" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
            </label>
            <label class="block md:col-span-2">
              <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Address</span>
              <input name="address" [(ngModel)]="form.address" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Township</span>
              <input name="township" [(ngModel)]="form.township" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">City</span>
              <input name="city" [(ngModel)]="form.city" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
            </label>
          </div>
        </section>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
            <h2 class="font-bold text-dark-900">Operating Hours</h2>
            <p class="text-xs text-dark-400 mt-0.5 mb-4">When drivers can deliver to your shop</p>
            <div class="grid grid-cols-2 gap-4">
              <label class="block">
                <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Opening</span>
                <input name="opensAt" type="time" [(ngModel)]="form.opensAt" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 outline-none" />
              </label>
              <label class="block">
                <span class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Closing</span>
                <input name="closesAt" type="time" [(ngModel)]="form.closesAt" class="mt-1.5 w-full rounded-xl border border-dark-200 px-3 py-2.5 text-sm text-dark-800 focus:border-primary-400 outline-none" />
              </label>
            </div>
            <p class="mt-3 text-xs text-dark-400">Deliveries outside these hours will be rescheduled automatically.</p>
          </section>

          <section class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
            <h2 class="font-bold text-dark-900">Notification Preferences</h2>
            <p class="text-xs text-dark-400 mt-0.5 mb-4">Choose how we keep you updated</p>
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
export class RetailerSettingsComponent {
  private retailer = inject(RetailerService);

  toast = signal<string | null>(null);

  form = {
    shopName: this.retailer.shop().name,
    ownerName: this.retailer.shop().ownerName,
    phone: this.retailer.shop().phone,
    email: this.retailer.shop().email,
    address: this.retailer.shop().address,
    township: this.retailer.shop().township,
    city: this.retailer.shop().city,
    opensAt: '07:00',
    closesAt: '19:00',
    lowStockAlerts: true,
    deliveryUpdates: true,
    orderConfirmations: true,
    paymentReminders: false,
  };

  preferences = [
    { key: 'lowStockAlerts' as const, label: 'Low stock alerts' },
    { key: 'deliveryUpdates' as const, label: 'Delivery updates' },
    { key: 'orderConfirmations' as const, label: 'Order confirmations' },
    { key: 'paymentReminders' as const, label: 'Payment reminders' },
  ];

  save(): void {
    this.toast.set('Shop settings saved.');
  }
}

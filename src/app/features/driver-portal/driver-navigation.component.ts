import { environment } from '../../../environments/environment';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { DriverService } from '../../core/services/driver.service';

@Component({
  selector: 'app-driver-navigation',
  standalone: true,
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header title="Navigation" subtitle="Turn-by-turn guidance to your active delivery">
        <button (click)="toggleNavigation()"
          class="text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          [class]="navigationActive()
            ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
            : 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-lg shadow-primary-500/20 hover:from-primary-700 hover:to-primary-700'">
          {{ navigationActive() ? 'Stop navigation' : 'Start navigation' }}
        </button>
      </app-page-header>

      @if (toast()) {
        <div class="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          <span>🧭</span><span>{{ toast() }}</span>
        </div>
      }

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg overflow-hidden">
            <div class="flex items-center justify-between px-5 pt-5 pb-2">
              <div>
                <h2 class="font-bold text-dark-900">{{ route.shop }}</h2>
                <p class="text-xs text-dark-400 mt-0.5">{{ route.address }}</p>
              </div>
              <span class="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
                [class]="navigationActive() ? 'bg-emerald-50 text-emerald-700' : 'bg-dark-100 text-dark-500'">
                <span class="w-2 h-2 rounded-full" [class]="navigationActive() ? 'bg-emerald-500 pulse-live' : 'bg-dark-400'"></span>
                {{ navigationActive() ? 'Navigating' : 'Paused' }}
              </span>
            </div>

            <div class="relative">
              <svg viewBox="0 0 720 340" class="w-full h-80">
                <defs>
                  <linearGradient id="navRoute" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stop-color="#15b372" />
                    <stop offset="100%" stop-color="#72e3af" />
                  </linearGradient>
                </defs>
                <rect width="720" height="340" fill="#f6faf7" />
                <g stroke="#d5e5da" stroke-width="1">
                  @for (x of gridX; track x) { <line [attr.x1]="x" y1="0" [attr.x2]="x" y2="340" /> }
                  @for (y of gridY; track y) { <line x1="0" [attr.y1]="y" x2="720" [attr.y2]="y" /> }
                </g>
                <g stroke="#d5e5da" stroke-width="10" stroke-linecap="round" fill="none">
                  <path d="M0 280 L180 280 L260 200 L430 200 L520 110 L720 110" />
                  <path d="M120 0 L160 90 L310 90 L360 190 L520 190 L560 340" />
                  <path d="M0 120 L90 120 L140 60 L300 60" />
                </g>
                <path d="M60 290 L180 290 L250 210 L420 210 L510 120 L660 120"
                  fill="none" stroke="url(#navRoute)" stroke-width="6" stroke-linecap="round" />
                <circle cx="60" cy="290" r="11" fill="#0a935c" stroke="#ffffff" stroke-width="3" />
                <circle cx="660" cy="120" r="11" fill="#22c55e" stroke="#ffffff" stroke-width="3" />
                <g>
                  <circle cx="328" cy="210" r="14" fill="#ffffff" stroke="#0a935c" stroke-width="3" />
                  <circle cx="328" cy="210" r="5" fill="#0a935c" />
                </g>
                <text x="60" y="316" text-anchor="middle" font-size="11" fill="#637f72">Tiger Brands</text>
                <text x="660" y="100" text-anchor="middle" font-size="11" fill="#637f72">{{ route.shop }}</text>
              </svg>
              <div class="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/95 backdrop-blur border border-dark-100 px-4 py-2.5">
                <div class="flex items-center gap-3">
                  <span class="text-2xl font-bold text-dark-900">{{ route.remainingKm }} km</span>
                  <span class="text-xs text-dark-400">remaining · ETA {{ route.eta }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <a [href]="'tel:' + shopPhone" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700">📞 Call shop</a>
                  <a [href]="whatsappLink" target="_blank" rel="noopener" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700">WhatsApp</a>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
            <h2 class="font-bold text-dark-900 mb-1">Turn-by-turn</h2>
            <p class="text-xs text-dark-400 mb-4">Next instruction updates as you move</p>
            <div class="space-y-3">
              @for (step of steps; track step.title; let i = $index) {
                <div class="flex items-center gap-3 rounded-xl border px-4 py-3"
                  [class]="i === 0 ? 'border-primary-200 bg-primary-50' : 'border-dark-100'">
                  <span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    [class]="i === 0 ? 'bg-primary-600 text-white' : 'bg-dark-50 text-dark-500'">{{ step.icon }}</span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold" [class]="i === 0 ? 'text-primary-800' : 'text-dark-800'">{{ step.title }}</p>
                    <p class="text-xs text-dark-400">{{ step.detail }}</p>
                  </div>
                  <span class="text-xs font-semibold" [class]="i === 0 ? 'text-primary-600' : 'text-dark-400'">{{ step.distance }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="rounded-2xl bg-gradient-to-br from-[#094d34] via-[#09764c] to-[#0a5d3e] p-5 text-white card-shadow-lg">
            <p class="text-xs uppercase tracking-wider text-primary-200 font-semibold">Active delivery</p>
            <h2 class="text-xl font-bold mt-1">{{ route.orderNumber }}</h2>
            <p class="text-sm text-primary-100 mt-0.5">{{ route.shop }} · {{ route.township }}</p>
            <div class="mt-4">
              <div class="flex items-center justify-between text-xs text-primary-100 mb-1.5">
                <span>Route progress</span><span>{{ route.progress }}%</span>
              </div>
              <div class="h-2 rounded-full bg-white/20"><div class="h-full rounded-full bg-emerald-400" [style.width.%]="route.progress"></div></div>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-2 text-center">
              <div class="rounded-lg bg-white/10 py-2"><p class="text-sm font-bold">{{ route.items }}</p><p class="text-[10px] text-primary-200 uppercase">Items</p></div>
              <div class="rounded-lg bg-white/10 py-2"><p class="text-sm font-bold">{{ route.totalDistanceKm }} km</p><p class="text-[10px] text-primary-200 uppercase">Total</p></div>
              <div class="rounded-lg bg-white/10 py-2"><p class="text-sm font-bold">R {{ route.payout }}</p><p class="text-[10px] text-primary-200 uppercase">Payout</p></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
            <h2 class="font-bold text-dark-900">Vehicle</h2>
            <div class="mt-3 flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-lg">🚚</div>
              <div>
                <p class="text-sm font-semibold text-dark-900">{{ profile().vehicle }}</p>
                <p class="text-xs text-dark-400">{{ profile().plate }} · {{ profile().tier }}</p>
              </div>
            </div>
            <div class="mt-4 space-y-2 text-xs">
              <div class="flex items-center justify-between"><span class="text-dark-500">Fuel level</span><span class="font-semibold text-emerald-600">78%</span></div>
              <div class="flex items-center justify-between"><span class="text-dark-500">Next service</span><span class="font-semibold text-dark-800">14 Nov 2026</span></div>
              <div class="flex items-center justify-between"><span class="text-dark-500">Capacity used</span><span class="font-semibold text-dark-800">42%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DriverNavigationComponent {
  private driver = inject(DriverService);

  profile = this.driver.profile;
  route = this.driver.activeRoute;
  navigationActive = this.driver.navigationActive;
  toast = signal<string | null>(null);

  gridX = Array.from({ length: 19 }, (_, i) => i * 40);
  gridY = Array.from({ length: 9 }, (_, i) => i * 40);

  shopPhone = '+27 76 123 4567';
  whatsappLink =
    'https://wa.me/' + environment.supportWhatsApp + '?text=' + encodeURIComponent('Hi, Sipho here. I am 6.2 km away from your shop.');

  steps = [
    { icon: '⬆️', title: 'Continue on Vilakazi Street', detail: 'Pass Orlando West High School on your right', distance: '1.2 km' },
    { icon: '↱', title: 'Turn right onto Immink Drive', detail: 'At the traffic circle, take the second exit', distance: '2.8 km' },
    { icon: '⬆️', title: 'Continue straight', detail: 'Follow the purple route through Meadowlands', distance: '1.6 km' },
    { icon: '🏁', title: 'Arrive at destination', detail: "Mama Thandeka's Spaza, Orlando West", distance: '0.6 km' },
  ];

  toggleNavigation(): void {
    this.driver.toggleNavigation();
    this.toast.set(
      this.driver.navigationActive()
        ? 'Navigation started. Follow the highlighted route.'
        : 'Navigation paused.',
    );
  }
}

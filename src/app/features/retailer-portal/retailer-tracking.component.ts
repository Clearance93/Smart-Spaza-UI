import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { RetailerService } from '../../core/services/retailer.service';

@Component({
  selector: 'app-retailer-tracking',
  standalone: true,
  imports: [PageHeaderComponent, StatusBadgeComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header title="Live Delivery Tracking" subtitle="Real-time driver location and ETA">
        <span class="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-full">
          <span class="w-2 h-2 rounded-full bg-emerald-500 pulse-live"></span> Live
        </span>
        <button (click)="refresh()"
          class="flex items-center gap-2 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
          ↻ Refresh
        </button>
      </app-page-header>

      @if (toast()) {
        <div class="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          <span>📍</span><span>{{ toast() }}</span>
        </div>
      }

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div class="xl:col-span-2 bg-white rounded-2xl border border-dark-100 card-shadow-lg overflow-hidden">
          <div class="flex items-center justify-between px-5 pt-5 pb-2">
            <div>
              <h2 class="font-bold text-dark-900">Route Overview</h2>
              <p class="text-xs text-dark-400 mt-0.5">Soweto delivery corridor</p>
            </div>
            <span class="text-xs text-dark-400">{{ activeDeliveries().length }} active {{ activeDeliveries().length === 1 ? 'driver' : 'drivers' }}</span>
          </div>
          <div class="relative">
            <svg viewBox="0 0 640 230" class="w-full h-56">
              <defs>
                <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#15b372" />
                  <stop offset="100%" stop-color="#0a935c" />
                </linearGradient>
              </defs>
              <rect width="640" height="230" fill="#f8fbf9" />
              <g stroke="#eef4f0" stroke-width="1">
                @for (x of gridX; track x) { <line [attr.x1]="x" y1="0" [attr.x2]="x" y2="230" /> }
                @for (y of gridY; track y) { <line x1="0" [attr.y1]="y" x2="640" [attr.y2]="y" /> }
              </g>
              <g stroke="#d5e5da" stroke-width="6" stroke-linecap="round" fill="none">
                <path d="M20 190 L180 190 L240 120 L420 120 L520 60 L620 60" />
                <path d="M70 20 L120 90 L260 90 L320 180 L470 180" />
              </g>
              <path d="M82 186 C 150 186, 168 132, 246 128 S 372 118, 444 94 S 540 62, 596 54"
                fill="none" stroke="url(#routeGradient)" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 8" />
              <circle cx="82" cy="186" r="9" fill="#0a935c" stroke="#ffffff" stroke-width="3" />
              <circle cx="596" cy="54" r="9" fill="#22c55e" stroke="#ffffff" stroke-width="3" />
              <text x="82" y="212" text-anchor="middle" font-size="11" fill="#637f72">Warehouse</text>
              <text x="596" y="38" text-anchor="middle" font-size="11" fill="#637f72">Your shop</text>
            </svg>
            <div class="absolute bottom-3 left-4 flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur border border-dark-100 px-3 py-1.5 text-[11px] text-dark-500">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              {{ inTransit().length }} in transit · avg ETA {{ averageEta() }}
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
          <h2 class="font-bold text-dark-900">Delivery Summary</h2>
          <p class="text-xs text-dark-400 mt-0.5">Today's incoming stock</p>
          <div class="mt-5 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-dark-500">Active deliveries</span>
              <span class="text-lg font-bold text-dark-900">{{ activeDeliveries().length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-dark-500">In transit</span>
              <span class="text-lg font-bold text-primary-600">{{ inTransit().length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-dark-500">Completed today</span>
              <span class="text-lg font-bold text-emerald-600">{{ completed().length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-dark-500">Nearest driver</span>
              <span class="text-lg font-bold text-dark-900">{{ nearestKm() }} km</span>
            </div>
          </div>
          <div class="mt-5 rounded-xl bg-primary-50 border border-primary-100 p-3.5 text-xs text-primary-700">
            Drivers update their position every 30 seconds. Call the driver if an ETA slips.
          </div>
        </div>
      </div>

      <h2 class="font-bold text-dark-900 mb-3">On the way</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        @for (delivery of activeDeliveries(); track delivery.id) {
          <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {{ initials(delivery.driverName) }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-bold text-dark-900 truncate">{{ delivery.driverName }}</p>
                  <p class="text-xs text-dark-400 truncate">{{ delivery.vehicle }}</p>
                  <p class="text-[11px] text-amber-500 mt-0.5">★ {{ delivery.driverRating }} driver rating</p>
                </div>
              </div>
              <app-status-badge [status]="delivery.status" />
            </div>

            <div class="mt-4 flex items-center justify-between text-sm">
              <span class="font-semibold text-dark-800">{{ delivery.orderNumber }}</span>
              <span class="text-xs text-dark-500">ETA <span class="font-semibold text-primary-600">{{ delivery.eta }}</span></span>
            </div>
            <div class="mt-2 h-2 rounded-full bg-dark-100 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-500 transition-all" [style.width.%]="delivery.progress"></div>
            </div>
            <div class="flex items-center justify-between mt-1.5 text-[11px] text-dark-400">
              <span>{{ delivery.progress }}% complete</span>
              <span>{{ delivery.distanceKm }} km away</span>
            </div>
            <p class="mt-3 text-xs text-dark-500">📍 {{ delivery.address }}</p>

            <div class="mt-4 flex items-center gap-2">
              <a [href]="'tel:' + delivery.driverPhone"
                class="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors">
                📞 Call driver
              </a>
              <button (click)="refresh()"
                class="flex-1 flex items-center justify-center gap-2 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors">
                ↻ Refresh ETA
              </button>
            </div>
          </div>
        } @empty {
          <div class="lg:col-span-2 bg-white rounded-2xl border border-dark-100">
            <app-empty-state icon="🚚" title="No active deliveries" description="When you have orders out for delivery, track them here in real-time." />
          </div>
        }
      </div>

      <h2 class="font-bold text-dark-900 mb-3">Completed</h2>
      <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg overflow-hidden">
        <div class="divide-y divide-dark-100">
          @for (delivery of completed(); track delivery.id) {
            <div class="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <div class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">✓</div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-dark-900">{{ delivery.orderNumber }} · {{ delivery.driverName }}</p>
                <p class="text-xs text-dark-400">{{ delivery.vehicle }}</p>
              </div>
              <span class="text-xs text-dark-400">{{ delivery.eta }}</span>
              <app-status-badge [status]="delivery.status" />
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class RetailerTrackingComponent {
  private retailer = inject(RetailerService);

  toast = signal<string | null>(null);
  gridX = Array.from({ length: 16 }, (_, i) => i * 40);
  gridY = Array.from({ length: 6 }, (_, i) => i * 40);

  activeDeliveries = computed(() => this.retailer.deliveries().filter((d) => d.status !== 'Delivered'));
  inTransit = computed(() => this.activeDeliveries().filter((d) => d.status === 'In Transit'));
  completed = computed(() => this.retailer.deliveries().filter((d) => d.status === 'Delivered'));

  averageEta = computed(() => {
    const active = this.inTransit();
    return active.length > 0 ? active[0].eta : '—';
  });

  nearestKm = computed(() => {
    const active = this.activeDeliveries();
    return active.length > 0 ? Math.min(...active.map((d) => d.distanceKm)) : 0;
  });

  initials(name: string): string {
    return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
  }

  refresh(): void {
    this.toast.set('Delivery positions refreshed.');
  }
}

import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { RetailerService } from '../../core/services/retailer.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-retailer-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, PageHeaderComponent, StatCardComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header title="Dashboard" [subtitle]="'Welcome back, ' + firstName() + ' · ' + shop().township + ', ' + shop().city">
        <button (click)="refresh()"
          class="flex items-center gap-2 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
          <span class="text-base">↻</span> Refresh Data
        </button>
      </app-page-header>

      @if (toast()) {
        <div class="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 animate-fade-in">
          <span>✅</span><span>{{ toast() }}</span>
        </div>
      }

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <app-stat-card label="Today's Sales" value="R {{ todaySales | number:'1.2-2' }}" hint="+12.5% vs yesterday"
          icon="💰" tone="emerald" trend="up" />
        <app-stat-card label="Active Orders" [value]="activeOrders().length.toString()" hint="In progress"
          icon="📦" tone="purple" />
        <app-stat-card label="Deliveries In Transit" [value]="inTransit().length.toString()" hint="On the way"
          icon="🚚" tone="blue" />
        <app-stat-card label="Low Stock Alerts" [value]="lowStock().length.toString()" hint="Need reorder"
          icon="⚠️" tone="orange" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        @for (action of quickActions; track action.label) {
          @if (action.route) {
            <a [routerLink]="action.route"
              class="flex items-center gap-3 bg-white border border-dark-100 rounded-xl px-4 py-3.5 card-shadow hover:border-primary-300 hover:-translate-y-0.5 transition-all">
              <span class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-base">{{ action.icon }}</span>
              <span class="text-sm font-semibold text-dark-800 flex-1">{{ action.label }}</span>
              <span class="text-dark-300">→</span>
            </a>
          } @else {
            <button (click)="emergencyOrder()"
              class="flex items-center gap-3 bg-white border border-dark-100 rounded-xl px-4 py-3.5 card-shadow hover:border-primary-300 hover:-translate-y-0.5 transition-all text-left">
              <span class="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center text-base">{{ action.icon }}</span>
              <span class="text-sm font-semibold text-dark-800 flex-1">{{ action.label }}</span>
              <span class="text-dark-300">→</span>
            </button>
          }
        }
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg">
          <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h2 class="font-bold text-dark-900">Recent Orders</h2>
              <p class="text-xs text-dark-400 mt-0.5">Latest purchase orders</p>
            </div>
            <a routerLink="/orders" class="text-xs font-semibold text-primary-600 hover:text-primary-700">View All →</a>
          </div>
          <div class="divide-y divide-dark-100">
            @for (order of recentOrders(); track order.id) {
              <a [routerLink]="['/orders']" class="flex items-center gap-3 px-5 py-3.5 hover:bg-dark-50/70 transition-colors">
                <div class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-sm">📋</div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-dark-900">{{ order.orderNumber }}</p>
                  <p class="text-xs text-dark-400 truncate">{{ order.supplier }} · {{ order.items }} items</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-sm font-bold text-dark-900">R {{ order.total | number:'1.2-2' }}</p>
                  <app-status-badge [status]="order.status" />
                </div>
              </a>
            }
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg">
          <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h2 class="font-bold text-dark-900">Live Deliveries</h2>
              <p class="text-xs text-dark-400 mt-0.5">Drivers heading to your shop</p>
            </div>
            <a routerLink="/tracking" class="text-xs font-semibold text-primary-600 hover:text-primary-700">Track →</a>
          </div>
          <div class="px-5 pb-5 space-y-3">
            @for (delivery of liveDeliveries(); track delivery.id) {
              <div class="rounded-xl border border-dark-100 bg-dark-50/50 p-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-xs font-bold">
                    {{ initials(delivery.driverName) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-dark-900">{{ delivery.driverName }}</p>
                    <p class="text-xs text-dark-400">{{ delivery.orderNumber }} · {{ delivery.vehicle }}</p>
                  </div>
                  <span class="text-xs font-semibold text-primary-600">{{ delivery.eta }}</span>
                </div>
                <div class="mt-3 h-1.5 rounded-full bg-dark-200 overflow-hidden">
                  <div class="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-500" [style.width.%]="delivery.progress"></div>
                </div>
                <div class="flex items-center justify-between mt-1.5 text-[11px] text-dark-400">
                  <span>{{ delivery.progress }}% of route</span>
                  <span>{{ delivery.distanceKm }} km away</span>
                </div>
              </div>
            } @empty {
              <div class="py-10 text-center text-sm text-dark-400">No deliveries on the way right now.</div>
            }
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 bg-white rounded-2xl border border-dark-100 card-shadow-lg">
          <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h2 class="font-bold text-dark-900">Low Stock Alerts</h2>
              <p class="text-xs text-dark-400 mt-0.5">Items at or below reorder level</p>
            </div>
            <a routerLink="/inventory" class="text-xs font-semibold text-primary-600 hover:text-primary-700">Manage stock →</a>
          </div>
          <div class="divide-y divide-dark-100">
            @for (item of lowStock().slice(0, 4); track item.id) {
              <div class="flex items-center gap-3 px-5 py-3">
                <div class="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center text-sm">📦</div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-dark-800 truncate">{{ item.name }}</p>
                  <p class="text-xs text-dark-400">{{ item.sku }} · {{ item.category }}</p>
                </div>
                <span class="text-xs font-semibold text-orange-600">{{ item.quantity }} / {{ item.minStock }} min</span>
              </div>
            }
          </div>
        </div>

        <div class="bg-gradient-to-br from-[#0d1510] to-[#080e0b] rounded-2xl p-5 text-white card-shadow-lg">
          <p class="text-xs uppercase tracking-wide text-primary-300 font-semibold">Account</p>
          <p class="text-2xl font-bold mt-2">R {{ shop().outstanding | number:'1.2-2' }}</p>
          <p class="text-xs text-dark-400 mt-1">Outstanding balance</p>
          <div class="mt-5 space-y-2 text-xs">
            <div class="flex items-center justify-between text-dark-300">
              <span>Credit limit</span><span class="font-semibold text-white">R {{ shop().creditLimit | number:'1.0-0' }}</span>
            </div>
            <div class="flex items-center justify-between text-dark-300">
              <span>Available credit</span><span class="font-semibold text-emerald-400">R {{ shop().creditLimit - shop().outstanding | number:'1.0-0' }}</span>
            </div>
            <div class="flex items-center justify-between text-dark-300">
              <span>Items in reorder cart</span><span class="font-semibold text-white">{{ cartCount() }}</span>
            </div>
          </div>
          <a routerLink="/orders"
            class="mt-5 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            View orders →
          </a>
        </div>
      </div>
    </div>
  `,
})
export class RetailerDashboardComponent {
  private retailer = inject(RetailerService);
  private auth = inject(AuthService);

  shop = this.retailer.shop;
  recentOrders = this.retailer.recentOrders;
  activeOrders = this.retailer.activeOrders;
  inTransit = this.retailer.inTransit;
  lowStock = this.retailer.lowStock;
  cartCount = this.retailer.cartCount;
  liveDeliveries = computed(() =>
    this.retailer.deliveries().filter((d) => d.status !== 'Delivered').slice(0, 3),
  );

  todaySales = 1185.5;
  toast = signal<string | null>(null);

  quickActions = [
    { label: 'Reorder Stock', icon: '🔁', route: '/inventory' },
    { label: 'Track Delivery', icon: '📍', route: '/tracking' },
    { label: 'View Suppliers', icon: '🤝', route: '/suppliers' },
    { label: 'Emergency Order', icon: '🚨', route: '' },
  ];

  firstName = computed(() => {
    const name = this.auth.user()?.name ?? this.retailer.shop().ownerName;
    return name.split(' ')[0];
  });

  initials(name: string): string {
    return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
  }

  refresh(): void {
    this.toast.set('Dashboard refreshed just now.');
  }

  emergencyOrder(): void {
    this.toast.set('Emergency order request sent to your top supplier. They will call you shortly.');
  }
}

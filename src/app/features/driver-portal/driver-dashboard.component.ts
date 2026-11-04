import { Component, OnInit, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DriverOrdersService } from '../../core/services/driver-orders.service';
import {
  SUPPLIER_STATUS_LABEL,
  SUPPLIER_STATUS_PROGRESS,
  SUPPLIER_STATUS_STYLES,
  type SupplierOrder,
} from '../../core/models/supplier.models';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-6xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Driver dashboard</h1>
          <p class="text-dark-500 mt-1">
            {{ driverName() }} · {{ orders.activeOrders().length }} active route(s)
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button (click)="orders.refresh()" [disabled]="orders.loading()"
            class="rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50 disabled:opacity-60">
            {{ orders.loading() ? 'Refreshing…' : '↻ Refresh' }}
          </button>
          <a routerLink="/driver/deliveries"
            class="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            All deliveries
          </a>
        </div>
      </div>

      @if (orders.error(); as message) {
        <div class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ message }}</div>
      }

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Active deliveries</p>
          <p class="mt-1.5 text-2xl font-bold text-indigo-600">{{ orders.activeOrders().length }}</p>
          <p class="mt-1 text-xs text-dark-400">On your route</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Completed today</p>
          <p class="mt-1.5 text-2xl font-bold text-emerald-600">{{ orders.completedToday().length }}</p>
          <p class="mt-1 text-xs text-dark-400">{{ orders.deliveredOrders().length }} all time</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Driver rating</p>
          <p class="mt-1.5 text-2xl font-bold text-amber-600">
            {{ orders.averageRating() !== null ? (orders.averageRating() | number: '1.1-1') : '—' }}
          </p>
          <p class="mt-1 text-xs text-dark-400">{{ orders.ratedOrders().length }} rated drops</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Items delivered</p>
          <p class="mt-1.5 text-2xl font-bold text-dark-900">{{ orders.itemsDelivered() }}</p>
          <p class="mt-1 text-xs text-dark-400">Across completed orders</p>
        </div>
      </div>

      @if (activeRoute(); as order) {
        <section class="mb-6 overflow-hidden rounded-2xl border border-primary-200 bg-white card-shadow">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-primary-100 bg-primary-50/60 px-5 py-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wide text-primary-700">Active route</p>
              <h2 class="font-bold text-dark-900">#{{ order.deliveryNumber }} · {{ order.shopName || 'Retailer' }}</h2>
            </div>
            <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" [class]="statusStyle(order.status)">
              {{ statusLabel(order.status) }}
            </span>
          </div>

          <div class="px-5 py-5">
            <div class="flex items-center justify-between text-xs text-dark-500">
              <span>Route progress</span>
              <span class="font-semibold text-dark-700">{{ progress(order) }}%</span>
            </div>
            <div class="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-dark-100">
              <div class="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                [style.width.%]="progress(order)"></div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Arrival</p>
                <p class="text-sm font-semibold text-dark-900">{{ order.estimatedArrival || order.scheduledTime || '—' }}</p>
              </div>
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Distance left</p>
                <p class="text-sm font-semibold text-dark-900">
                  {{ order.tracking?.distanceRemaining !== null && order.tracking?.distanceRemaining !== undefined
                    ? (order.tracking?.distanceRemaining | number: '1.0-1') + ' km'
                    : '—' }}
                </p>
              </div>
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Shop contact</p>
                @if (order.shopPhone) {
                  <a [href]="'tel:' + order.shopPhone" class="text-sm font-semibold text-primary-700 hover:text-primary-800">
                    {{ order.shopPhone }}
                  </a>
                } @else {
                  <p class="text-sm font-semibold text-dark-900">—</p>
                }
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              @for (item of order.items; track $index) {
                <span class="rounded-lg border border-dark-100 bg-dark-50 px-2.5 py-1 text-xs text-dark-700">
                  {{ item.productName || 'Item' }} × {{ item.quantity }}
                </span>
              }
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <a routerLink="/driver/navigation"
                class="rounded-xl bg-dark-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dark-800">
                Open navigation
              </a>
              @if (order.status === 'Created' || order.status === 'Accepted') {
                <button (click)="start(order)" [disabled]="orders.actingId() === order.deliveryId"
                  class="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                  {{ orders.actingId() === order.deliveryId ? 'Starting…' : 'Start route' }}
                </button>
              }
              @if (order.status === 'InTransit') {
                <button (click)="onTheWay(order)" [disabled]="orders.actingId() === order.deliveryId"
                  class="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                  I'm on the way
                </button>
              }
              @if (order.status === 'OnTheWay') {
                <button (click)="deliver(order)" [disabled]="orders.actingId() === order.deliveryId"
                  class="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  Mark delivered
                </button>
              }
            </div>
          </div>
        </section>
      }

      <section class="rounded-2xl border border-dark-100 bg-white card-shadow overflow-hidden">
        <div class="flex items-center justify-between border-b border-dark-100 px-5 py-4">
          <div>
            <h2 class="text-sm font-semibold text-dark-900">Today's assignments</h2>
            <p class="text-xs text-dark-400">Every delivery assigned to you</p>
          </div>
          <a routerLink="/driver/deliveries" class="text-xs font-semibold text-primary-700 hover:text-primary-800">
            View all →
          </a>
        </div>

        @if (orders.orders().length === 0) {
          <div class="px-5 py-12 text-center">
            <p class="text-3xl">📦</p>
            <h3 class="mt-3 font-semibold text-dark-900">No deliveries assigned</h3>
            <p class="mt-1 text-sm text-dark-500">New routes from suppliers will appear here.</p>
          </div>
        } @else {
          <div class="divide-y divide-dark-100">
            @for (order of orders.orders(); track order.deliveryId) {
              <a routerLink="/driver/deliveries" class="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-dark-50/60">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-dark-900">
                    #{{ order.deliveryNumber }} · {{ order.shopName || 'Retailer' }}
                  </p>
                  <p class="text-xs text-dark-400">
                    {{ order.items.length }} line(s) · ETA {{ order.estimatedArrival || order.scheduledTime || '—' }}
                  </p>
                </div>
                <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" [class]="statusStyle(order.status)">
                  {{ statusLabel(order.status) }}
                </span>
              </a>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class DriverDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  orders = inject(DriverOrdersService);

  readonly driverName = computed(() => this.auth.user()?.name || 'Driver');

  readonly activeRoute = computed(() => {
    const active = this.orders.activeOrders();
    return active.find((order) => ['InTransit', 'OnTheWay'].includes(order.status)) ?? active[0] ?? null;
  });

  ngOnInit(): void {
    this.orders.load();
  }

  progress(order: SupplierOrder): number {
    return SUPPLIER_STATUS_PROGRESS[order.status] ?? 0;
  }

  statusLabel(status: string): string {
    return SUPPLIER_STATUS_LABEL[status] ?? status;
  }

  statusStyle(status: string): string {
    return SUPPLIER_STATUS_STYLES[status] ?? 'bg-dark-100 text-dark-700';
  }

  start(order: SupplierOrder): void {
    this.orders.startRoute(order).subscribe({ error: () => undefined });
  }

  onTheWay(order: SupplierOrder): void {
    this.orders.onTheWay(order).subscribe({ error: () => undefined });
  }

  deliver(order: SupplierOrder): void {
    this.orders.markDelivered(order).subscribe({ error: () => undefined });
  }
}

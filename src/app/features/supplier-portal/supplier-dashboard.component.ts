import { Component, OnInit, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RetailerService } from '../../core/services/retailer.service';
import { SupplierOrdersService } from '../../core/services/supplier-orders.service';
import {
  SUPPLIER_STATUS_LABEL,
  SUPPLIER_STATUS_STYLES,
} from '../../core/models/supplier.models';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Supplier dashboard</h1>
          <p class="text-dark-500 mt-1">
            {{ businessName() }} · dispatch, fleet and retail coverage
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button (click)="refresh()" [disabled]="orders.loading()"
            class="rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50 disabled:opacity-60">
            {{ orders.loading() ? 'Refreshing…' : '↻ Refresh' }}
          </button>
          <a routerLink="/supplier/orders"
            class="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            All orders
          </a>
        </div>
      </div>

      @if (orders.error(); as message) {
        <div class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ message }}</div>
      }

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Orders</p>
          <p class="mt-1.5 text-2xl font-bold text-dark-900">{{ orders.orders().length }}</p>
          <p class="mt-1 text-xs text-dark-400">All time</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">On the road</p>
          <p class="mt-1.5 text-2xl font-bold text-indigo-600">{{ orders.inTransitOrders().length }}</p>
          <p class="mt-1 text-xs text-dark-400">Active deliveries</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Delivered</p>
          <p class="mt-1.5 text-2xl font-bold text-emerald-600">{{ orders.deliveredOrders().length }}</p>
          <p class="mt-1 text-xs text-dark-400">Completed</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Retailers</p>
          <p class="mt-1.5 text-2xl font-bold text-dark-900">{{ orders.retailers().length }}</p>
          <p class="mt-1 text-xs text-dark-400">Being supplied</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Drivers</p>
          <p class="mt-1.5 text-2xl font-bold text-dark-900">{{ orders.drivers().length }}</p>
          <p class="mt-1 text-xs text-dark-400">On your routes</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Avg. rating</p>
          <p class="mt-1.5 text-2xl font-bold text-amber-600">
            {{ orders.averageRating() !== null ? (orders.averageRating() | number: '1.1-1') : '—' }}
          </p>
          <p class="mt-1 text-xs text-dark-400">{{ orders.ratedOrders().length }} rated</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-6">
        <section class="lg:col-span-2 rounded-2xl border border-dark-100 bg-white card-shadow overflow-hidden">
          <div class="flex items-center justify-between border-b border-dark-100 px-5 py-4">
            <div>
              <h2 class="text-sm font-semibold text-dark-900">Recent orders</h2>
              <p class="text-xs text-dark-400">Latest dispatches and their status</p>
            </div>
            <a routerLink="/supplier/orders" class="text-xs font-semibold text-primary-700 hover:text-primary-800">
              View all →
            </a>
          </div>

          @if (orders.loading() && !orders.loaded()) {
            <p class="px-5 py-10 text-center text-sm text-dark-500">Loading your deliveries…</p>
          } @else if (orders.orders().length === 0) {
            <div class="px-5 py-12 text-center">
              <p class="text-3xl">🚚</p>
              <h3 class="mt-3 font-semibold text-dark-900">No deliveries yet</h3>
              <p class="mt-1 text-sm text-dark-500">
                Orders you dispatch to retailers will appear here with live tracking.
              </p>
            </div>
          } @else {
            <div class="divide-y divide-dark-100">
              @for (order of recentOrders(); track order.deliveryId) {
                <a routerLink="/supplier/orders" class="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-dark-50/60">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-dark-900">
                      #{{ order.deliveryNumber }} · {{ order.shopName || 'Retailer' }}
                    </p>
                    <p class="text-xs text-dark-400">
                      {{ order.driverName || 'Driver' }} · {{ order.items.length }} line(s) ·
                      ETA {{ order.estimatedArrival || order.scheduledTime || '—' }}
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

        <section class="rounded-2xl border border-dark-100 bg-white card-shadow overflow-hidden">
          <div class="flex items-center justify-between border-b border-dark-100 px-5 py-4">
            <div>
              <h2 class="text-sm font-semibold text-dark-900">Live fleet</h2>
              <p class="text-xs text-dark-400">Drivers on the road now</p>
            </div>
            <a routerLink="/supplier/fleet" class="text-xs font-semibold text-primary-700 hover:text-primary-800">
              Track →
            </a>
          </div>

          @if (orders.inTransitOrders().length === 0) {
            <p class="px-5 py-10 text-center text-sm text-dark-500">No drivers on the road right now.</p>
          } @else {
            <div class="divide-y divide-dark-100">
              @for (order of orders.inTransitOrders(); track order.deliveryId) {
                <div class="px-5 py-3">
                  <p class="text-sm font-semibold text-dark-900">{{ order.driverName || 'Driver' }}</p>
                  <p class="text-xs text-dark-400">
                    #{{ order.deliveryNumber }} → {{ order.shopName || 'Retailer' }}
                  </p>
                  <div class="mt-2 flex items-center gap-2 text-[11px] font-semibold text-indigo-600">
                    <span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                    {{ statusLabel(order.status) }} ·
                    {{ order.tracking?.distanceRemaining !== null && order.tracking?.distanceRemaining !== undefined
                      ? (order.tracking?.distanceRemaining | number: '1.0-1') + ' km left'
                      : 'ETA ' + (order.tracking?.estimatedTime || order.estimatedArrival || '—') }}
                  </div>
                </div>
              }
            </div>
          }
        </section>
      </div>

      <section class="rounded-2xl border border-dark-100 bg-white card-shadow overflow-hidden">
        <div class="flex items-center justify-between border-b border-dark-100 px-5 py-4">
          <div>
            <h2 class="text-sm font-semibold text-dark-900">Your stock</h2>
            <p class="text-xs text-dark-400">Products you supply · {{ inventory.lowStock().length }} need attention</p>
          </div>
          <a routerLink="/inventory" class="text-xs font-semibold text-primary-700 hover:text-primary-800">
            Open inventory →
          </a>
        </div>

        @if (inventory.inventory().length === 0) {
          <p class="px-5 py-10 text-center text-sm text-dark-500">No products in your catalogue yet.</p>
        } @else {
          <div class="divide-y divide-dark-100">
            @for (item of topStock(); track item.id) {
              <div class="flex items-center justify-between px-5 py-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-dark-900">{{ item.name }}</p>
                  <p class="text-xs text-dark-400">{{ item.category }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-dark-900">{{ item.quantity }} {{ item.unit || 'units' }}</p>
                  <p class="text-[11px]" [class]="item.quantity <= 10 ? 'text-amber-600' : 'text-dark-400'">
                    {{ item.quantity <= 10 ? 'Low stock' : 'R ' + (item.sellingPrice | number: '1.2-2') }}
                  </p>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class SupplierDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  orders = inject(SupplierOrdersService);
  inventory = inject(RetailerService);

  readonly businessName = computed(() => this.auth.user()?.name || 'Your business');

  readonly recentOrders = computed(() => this.orders.orders().slice(0, 6));

  readonly topStock = computed(() =>
    this.inventory
      .inventory()
      .slice()
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
  );

  ngOnInit(): void {
    this.orders.load();
    this.inventory.loadInventory();
  }

  refresh(): void {
    this.orders.refresh();
    this.inventory.loadInventory();
  }

  statusLabel(status: string): string {
    return SUPPLIER_STATUS_LABEL[status] ?? status;
  }

  statusStyle(status: string): string {
    return SUPPLIER_STATUS_STYLES[status] ?? 'bg-dark-100 text-dark-700';
  }
}

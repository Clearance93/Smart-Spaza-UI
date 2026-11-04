import { Component, OnInit, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RetailerService } from '../../core/services/retailer.service';
import { SupplierOrdersService } from '../../core/services/supplier-orders.service';
import { SUPPLIER_STATUS_LABEL } from '../../core/models/supplier.models';

@Component({
  selector: 'app-supplier-analytics',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-6xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Analytics</h1>
          <p class="text-dark-500 mt-1">Calculated from your own orders, drivers and catalogue</p>
        </div>
        <button (click)="refresh()"
          class="self-start rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50">
          ↻ Refresh
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Orders</p>
          <p class="mt-1 text-2xl font-bold text-dark-900">{{ orders.orders().length }}</p>
          <p class="mt-1 text-xs text-dark-400">{{ orders.totalItems() }} items dispatched</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Delivered</p>
          <p class="mt-1 text-2xl font-bold text-emerald-600">{{ orders.deliveredOrders().length }}</p>
          <p class="mt-1 text-xs text-dark-400">{{ completionRate() }}% completion</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Retailers</p>
          <p class="mt-1 text-2xl font-bold text-dark-900">{{ orders.retailers().length }}</p>
          <p class="mt-1 text-xs text-dark-400">{{ orders.drivers().length }} drivers</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Avg. rating</p>
          <p class="mt-1 text-2xl font-bold text-amber-600">
            {{ orders.averageRating() !== null ? (orders.averageRating() | number: '1.1-1') : '—' }}
          </p>
          <p class="mt-1 text-xs text-dark-400">{{ orders.ratedOrders().length }} rated deliveries</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <h2 class="text-sm font-semibold text-dark-900">Orders by status</h2>
          <p class="text-xs text-dark-400 mb-4">Live from the delivery service</p>

          @if (statusBars().length === 0) {
            <p class="py-8 text-center text-sm text-dark-500">No orders recorded yet.</p>
          } @else {
            <div class="space-y-3">
              @for (bar of statusBars(); track bar.label) {
                <div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-medium text-dark-700">{{ bar.label }}</span>
                    <span class="text-dark-500">{{ bar.value }}</span>
                  </div>
                  <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-dark-100">
                    <div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" [style.width.%]="bar.percent"></div>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <section class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <h2 class="text-sm font-semibold text-dark-900">Orders per retailer</h2>
          <p class="text-xs text-dark-400 mb-4">Where your stock goes</p>

          @if (retailerBars().length === 0) {
            <p class="py-8 text-center text-sm text-dark-500">No retailers yet.</p>
          } @else {
            <div class="space-y-3">
              @for (bar of retailerBars(); track bar.label) {
                <div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="truncate pr-2 font-medium text-dark-700">{{ bar.label }}</span>
                    <span class="text-dark-500">{{ bar.value }}</span>
                  </div>
                  <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-dark-100">
                    <div class="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600" [style.width.%]="bar.percent"></div>
                  </div>
                </div>
              }
            </div>
          }
        </section>
      </div>

      <section class="mt-5 rounded-2xl border border-dark-100 bg-white card-shadow overflow-hidden">
        <div class="flex items-center justify-between border-b border-dark-100 px-5 py-4">
          <div>
            <h2 class="text-sm font-semibold text-dark-900">Driver performance</h2>
            <p class="text-xs text-dark-400">Deliveries, completion and shop rating</p>
          </div>
          <a routerLink="/supplier/drivers" class="text-xs font-semibold text-primary-700 hover:text-primary-800">
            All drivers →
          </a>
        </div>

        @if (orders.drivers().length === 0) {
          <p class="px-5 py-10 text-center text-sm text-dark-500">No drivers yet.</p>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-dark-50">
                <tr>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-dark-500">Driver</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase text-dark-500">Orders</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase text-dark-500">Delivered</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase text-dark-500">Active</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase text-dark-500">Rating</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dark-100">
                @for (driver of orders.drivers(); track driver.driverId) {
                  <tr>
                    <td class="px-5 py-3.5 text-sm font-semibold text-dark-900">{{ driver.name }}</td>
                    <td class="px-5 py-3.5 text-right text-sm text-dark-700">{{ driver.orders }}</td>
                    <td class="px-5 py-3.5 text-right text-sm text-emerald-600">{{ driver.delivered }}</td>
                    <td class="px-5 py-3.5 text-right text-sm text-indigo-600">{{ driver.active }}</td>
                    <td class="px-5 py-3.5 text-right text-sm font-semibold text-amber-600">
                      {{ driver.averageRating !== null ? '★ ' + (driver.averageRating | number: '1.1-1') : '—' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <section class="mt-5 rounded-2xl border border-dark-100 bg-white card-shadow overflow-hidden">
        <div class="flex items-center justify-between border-b border-dark-100 px-5 py-4">
          <div>
            <h2 class="text-sm font-semibold text-dark-900">Most dispatched products</h2>
            <p class="text-xs text-dark-400">Units across all your orders</p>
          </div>
        </div>

        @if (topProducts().length === 0) {
          <p class="px-5 py-10 text-center text-sm text-dark-500">No order lines yet.</p>
        } @else {
          <div class="divide-y divide-dark-100">
            @for (product of topProducts(); track product.name) {
              <div class="flex items-center justify-between px-5 py-3">
                <p class="truncate text-sm font-semibold text-dark-900">{{ product.name }}</p>
                <p class="text-sm font-bold text-dark-900">{{ product.units }} units</p>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class SupplierAnalyticsComponent implements OnInit {
  orders = inject(SupplierOrdersService);
  inventory = inject(RetailerService);

  readonly completionRate = computed(() => {
    const total = this.orders.orders().length;
    if (total === 0) return 0;
    return Math.round((this.orders.deliveredOrders().length / total) * 100);
  });

  readonly statusBars = computed(() => {
    const counts = new Map<string, number>();
    for (const order of this.orders.orders()) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    }
    const rows = Array.from(counts, ([label, value]) => ({ label: SUPPLIER_STATUS_LABEL[label] ?? label, value }));
    const max = Math.max(...rows.map((row) => row.value), 1);
    return rows.sort((a, b) => b.value - a.value).map((row) => ({ ...row, percent: Math.round((row.value / max) * 100) }));
  });

  readonly retailerBars = computed(() => {
    const rows = this.orders.retailers().map((retailer) => ({ label: retailer.name, value: retailer.orders }));
    const max = Math.max(...rows.map((row) => row.value), 1);
    return rows.slice(0, 6).map((row) => ({ ...row, percent: Math.round((row.value / max) * 100) }));
  });

  readonly topProducts = computed(() => {
    const units = new Map<string, number>();
    for (const order of this.orders.orders()) {
      for (const item of order.items) {
        const name = item.productName || 'Item';
        units.set(name, (units.get(name) ?? 0) + item.quantity);
      }
    }
    return Array.from(units, ([name, value]) => ({ name, units: value }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 6);
  });

  ngOnInit(): void {
    this.orders.load();
    this.inventory.loadInventory();
  }

  refresh(): void {
    this.orders.refresh();
    this.inventory.loadInventory();
  }
}

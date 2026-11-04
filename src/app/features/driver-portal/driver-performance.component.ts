import { Component, OnInit, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DriverOrdersService } from '../../core/services/driver-orders.service';
import { SUPPLIER_STATUS_LABEL } from '../../core/models/supplier.models';

@Component({
  selector: 'app-driver-performance',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-5xl mx-auto animate-fade-in">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Performance</h1>
          <p class="text-dark-500 mt-1">
            Delivery earnings are not tracked by the API yet, so this page shows the
            performance data that is real.
          </p>
        </div>
        <button (click)="orders.refresh()"
          class="self-start rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50">
          ↻ Refresh
        </button>
      </div>

      @if (orders.error(); as message) {
        <div class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ message }}</div>
      }

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Completed</p>
          <p class="mt-1.5 text-2xl font-bold text-emerald-600">{{ orders.deliveredOrders().length }}</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Active</p>
          <p class="mt-1.5 text-2xl font-bold text-indigo-600">{{ orders.activeOrders().length }}</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Avg. rating</p>
          <p class="mt-1.5 text-2xl font-bold text-amber-600">
            {{ orders.averageRating() !== null ? (orders.averageRating() | number: '1.1-1') : '—' }}
          </p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Items delivered</p>
          <p class="mt-1.5 text-2xl font-bold text-dark-900">{{ orders.itemsDelivered() }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <h2 class="text-sm font-semibold text-dark-900">Deliveries by status</h2>
          <p class="text-xs text-dark-400 mb-4">Across everything assigned to you</p>

          @if (statusBars().length === 0) {
            <p class="py-8 text-center text-sm text-dark-500">No deliveries yet.</p>
          } @else {
            <div class="space-y-3">
              @for (bar of statusBars(); track bar.label) {
                <div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-medium text-dark-700">{{ bar.label }}</span>
                    <span class="text-dark-500">{{ bar.value }}</span>
                  </div>
                  <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-dark-100">
                    <div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                      [style.width.%]="bar.percent"></div>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <section class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <h2 class="text-sm font-semibold text-dark-900">Shop ratings</h2>
          <p class="text-xs text-dark-400 mb-4">Feedback left by retailers</p>

          @if (orders.ratedOrders().length === 0) {
            <p class="py-8 text-center text-sm text-dark-500">No ratings yet.</p>
          } @else {
            <div class="space-y-3">
              @for (order of orders.ratedOrders(); track order.deliveryId) {
                <div class="rounded-xl bg-dark-50 px-3 py-2.5">
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-semibold text-dark-900">{{ order.shopName || 'Retailer' }}</p>
                    <p class="text-xs font-bold text-amber-600">★ {{ order.rating }}/5</p>
                  </div>
                  @if (order.ratingComment) {
                    <p class="mt-1 text-xs italic text-dark-500">"{{ order.ratingComment }}"</p>
                  }
                </div>
              }
            </div>
          }
        </section>
      </div>
    </div>
  `,
})
export class DriverPerformanceComponent implements OnInit {
  orders = inject(DriverOrdersService);

  readonly statusBars = computed(() => {
    const counts = new Map<string, number>();
    for (const order of this.orders.orders()) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    }
    const rows = Array.from(counts, ([label, value]) => ({
      label: SUPPLIER_STATUS_LABEL[label] ?? label,
      value,
    }));
    const max = Math.max(...rows.map((row) => row.value), 1);
    return rows
      .sort((a, b) => b.value - a.value)
      .map((row) => ({ ...row, percent: Math.round((row.value / max) * 100) }));
  });

  ngOnInit(): void {
    this.orders.load();
  }
}

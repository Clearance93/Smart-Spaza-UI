import { Component, OnInit, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RetailerService } from '../../core/services/retailer.service';
import { RetailerOrdersService } from '../../core/services/retailer-orders.service';
import { ORDER_STATUS_LABEL } from '../../core/models/retailer-orders.models';

@Component({
  selector: 'app-retailer-analytics',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-6xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Analytics</h1>
          <p class="text-dark-500 mt-1">Everything below is calculated from your own catalogue and orders</p>
        </div>
        <button (click)="refresh()"
          class="self-start rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50">
          ↻ Refresh
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Stock value</p>
          <p class="mt-1 text-2xl font-bold text-dark-900">R {{ inventory.stockValue() | number: '1.0-0' }}</p>
          <p class="mt-1 text-xs text-dark-400">{{ inventory.inventory().length }} products</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Low stock</p>
          <p class="mt-1 text-2xl font-bold text-amber-600">{{ inventory.lowStock().length }}</p>
          <p class="mt-1 text-xs text-dark-400">10 units or fewer</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Orders</p>
          <p class="mt-1 text-2xl font-bold text-dark-900">{{ orders.orders().length }}</p>
          <p class="mt-1 text-xs text-dark-400">{{ orders.inTransitOrders().length }} in transit</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Avg. delivery rating</p>
          <p class="mt-1 text-2xl font-bold text-amber-600">
            {{ orders.averageRating() !== null ? (orders.averageRating() | number: '1.1-1') : '—' }}
          </p>
          <p class="mt-1 text-xs text-dark-400">From {{ orders.ratedOrders().length }} rated orders</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-sm font-semibold text-dark-900">Stock value by category</h2>
              <p class="text-xs text-dark-400">At selling price</p>
            </div>
          </div>

          @if (categoryBars().length === 0) {
            <p class="py-8 text-center text-sm text-dark-500">No products yet.</p>
          } @else {
            <div class="space-y-3">
              @for (bar of categoryBars(); track bar.label) {
                <div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-medium text-dark-700">{{ bar.label }}</span>
                    <span class="text-dark-500">R {{ bar.value | number: '1.0-0' }}</span>
                  </div>
                  <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-dark-100">
                    <div class="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                      [style.width.%]="bar.percent"></div>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <section class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <div class="mb-4">
            <h2 class="text-sm font-semibold text-dark-900">Orders by status</h2>
            <p class="text-xs text-dark-400">Live from the delivery service</p>
          </div>

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
                    <div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                      [style.width.%]="bar.percent"></div>
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
            <h2 class="text-sm font-semibold text-dark-900">Top products by stock value</h2>
            <p class="text-xs text-dark-400">Quantity on hand × selling price</p>
          </div>
          <a routerLink="/inventory" class="text-xs font-semibold text-primary-700 hover:text-primary-800">
            Open inventory →
          </a>
        </div>

        @if (topProducts().length === 0) {
          <p class="px-5 py-10 text-center text-sm text-dark-500">No products yet.</p>
        } @else {
          <div class="divide-y divide-dark-100">
            @for (product of topProducts(); track product.id) {
              <div class="flex items-center justify-between px-5 py-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-dark-900">{{ product.name }}</p>
                  <p class="text-xs text-dark-400">{{ product.category }} · {{ product.quantity }} in stock</p>
                </div>
                <p class="text-sm font-bold text-dark-900">R {{ product.value | number: '1.0-0' }}</p>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class RetailerAnalyticsComponent implements OnInit {
  inventory = inject(RetailerService);
  orders = inject(RetailerOrdersService);

  readonly categoryBars = computed(() => {
    const totals = new Map<string, number>();

    for (const item of this.inventory.inventory()) {
      const value = item.quantity * item.sellingPrice;
      totals.set(item.category || 'Uncategorised', (totals.get(item.category || 'Uncategorised') ?? 0) + value);
    }

    const rows = Array.from(totals, ([label, value]) => ({ label, value }));
    const max = Math.max(...rows.map((row) => row.value), 1);

    return rows
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map((row) => ({ ...row, percent: Math.round((row.value / max) * 100) }));
  });

  readonly statusBars = computed(() => {
    const counts = new Map<string, number>();

    for (const order of this.orders.orders()) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    }

    const rows = Array.from(counts, ([label, value]) => ({
      label: ORDER_STATUS_LABEL[label] ?? label,
      value,
    }));
    const max = Math.max(...rows.map((row) => row.value), 1);

    return rows
      .sort((a, b) => b.value - a.value)
      .map((row) => ({ ...row, percent: Math.round((row.value / max) * 100) }));
  });

  readonly topProducts = computed(() =>
    this.inventory
      .inventory()
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category || 'Uncategorised',
        quantity: item.quantity,
        value: item.quantity * item.sellingPrice,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6),
  );

  ngOnInit(): void {
    this.inventory.loadInventory();
    this.orders.load();
  }

  refresh(): void {
    this.inventory.loadInventory();
    this.orders.refresh();
  }
}

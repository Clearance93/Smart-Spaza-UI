import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { RetailerService } from '../../core/services/retailer.service';
import type { RetailOrderStatus } from '../../core/models/retailer.models';

type OrderFilter = 'All' | RetailOrderStatus;

@Component({
  selector: 'app-retailer-orders',
  standalone: true,
  imports: [DatePipe, DecimalPipe, PageHeaderComponent, StatusBadgeComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header title="Order Management" subtitle="Track and manage your purchase orders">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">🔍</span>
          <input [value]="search()" (input)="search.set($any($event.target).value)"
            placeholder="Search orders or suppliers..."
            class="w-64 max-w-full bg-white border border-dark-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-dark-800 placeholder:text-dark-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
        </div>
        <button (click)="refresh()"
          class="flex items-center gap-2 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
          ↻ Refresh
        </button>
      </app-page-header>

      @if (toast()) {
        <div class="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          <span>✅</span><span>{{ toast() }}</span>
        </div>
      }

      <div class="flex flex-wrap gap-2 mb-5">
        @for (filter of filters; track filter) {
          <button (click)="activeFilter.set(filter)"
            class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            [class]="activeFilter() === filter
              ? 'bg-primary-600 border-primary-600 text-white'
              : 'bg-white border-dark-200 text-dark-600 hover:border-primary-400 hover:text-primary-600'">
            {{ filter }} <span class="opacity-70">{{ count(filter) }}</span>
          </button>
        }
      </div>

      <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg overflow-hidden">
        @if (visibleOrders().length === 0) {
          <app-empty-state icon="📭" title="No orders found" description="There are no orders matching the selected filters." />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-dark-50">
                <tr>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Order</th>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Supplier</th>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Date</th>
                  <th class="text-center px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Items</th>
                  <th class="text-right px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Amount</th>
                  <th class="text-center px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Status</th>
                  <th class="text-right px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dark-100">
                @for (order of visibleOrders(); track order.id) {
                  <tr class="hover:bg-dark-50/60 transition-colors">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-xs">📋</div>
                        <span class="text-sm font-semibold text-dark-900">{{ order.orderNumber }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-dark-700">{{ order.supplier }}</td>
                    <td class="px-5 py-3.5 text-xs text-dark-500">{{ order.createdAt | date:'d MMM yyyy' }}</td>
                    <td class="px-5 py-3.5 text-center text-sm text-dark-600">{{ order.items }}</td>
                    <td class="px-5 py-3.5 text-right text-sm font-bold text-dark-900">R {{ order.total | number:'1.2-2' }}</td>
                    <td class="px-5 py-3.5 text-center"><app-status-badge [status]="order.status" /></td>
                    <td class="px-5 py-3.5 text-right">
                      <button (click)="reorder(order.id)"
                        class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors">
                        Reorder
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      @if (cartCount() > 0) {
        <p class="text-xs text-dark-400 mt-3">{{ cartCount() }} item(s) added to your reorder cart.</p>
      }
    </div>
  `,
})
export class RetailerOrdersComponent {
  private retailer = inject(RetailerService);

  filters: OrderFilter[] = ['All', 'Pending', 'Confirmed', 'Preparing', 'Dispatched', 'Delivered'];
  activeFilter = signal<OrderFilter>('All');
  search = signal('');
  toast = signal<string | null>(null);
  cartCount = this.retailer.cartCount;

  visibleOrders = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.retailer.orders().filter((order) => {
      const matchesFilter = this.activeFilter() === 'All' || order.status === this.activeFilter();
      const matchesSearch =
        !term ||
        order.orderNumber.toLowerCase().includes(term) ||
        order.supplier.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  });

  count(filter: OrderFilter): number {
    return filter === 'All'
      ? this.retailer.orders().length
      : this.retailer.orders().filter((o) => o.status === filter).length;
  }

  refresh(): void {
    this.toast.set('Orders refreshed just now.');
  }

  reorder(id: string): void {
    this.retailer.reorder(id);
    const order = this.retailer.orders().find((o) => o.id === id);
    this.toast.set(`${order?.items ?? 1} item(s) from ${order?.orderNumber ?? 'your order'} added to your cart.`);
  }
}

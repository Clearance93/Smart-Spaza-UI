import { Component, signal, inject, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { OrdersService } from '../../core/services/orders.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { CardSkeletonComponent } from '../../shared/components/skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import type { Order } from '../../core/models';

type OrderFilter = 'ALL' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'REJECTED';

@Component({
  selector: 'app-supplier-orders',
  standalone: true,
  imports: [DecimalPipe, DatePipe, StatusBadgeComponent, CardSkeletonComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Orders</h1>
          <p class="text-dark-500 mt-1">Manage and fulfil retailer purchase orders</p>
        </div>
        <button (click)="load()"
          class="flex items-center gap-2 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
          Refresh
        </button>
      </div>

      <div class="flex flex-wrap gap-2 mb-5">
        @for (f of filters; track f) {
          <button (click)="activeFilter.set(f)"
            class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            [class]="activeFilter() === f
              ? 'bg-primary-600 border-primary-600 text-white'
              : 'bg-white border-dark-200 text-dark-600 hover:border-primary-400 hover:text-primary-600'">
            {{ label(f) }}
          </button>
        }
      </div>

      <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg">
        @if (loading()) {
          <div class="p-5"><app-card-skeleton [count]="3" /></div>
        } @else if (visibleOrders().length === 0) {
          <app-empty-state icon="📭" title="No orders found"
            description="There are no orders matching the selected status." />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-dark-50">
                <tr>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Order</th>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Retailer</th>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Township</th>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Amount</th>
                  <th class="text-center px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Status</th>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Time</th>
                  <th class="text-right px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dark-50">
                @for (order of visibleOrders(); track order.id) {
                  <tr class="hover:bg-dark-50/50 transition-colors">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                          <span class="text-primary-600 text-xs">📋</span>
                        </div>
                        <span class="text-sm font-semibold text-dark-800">{{ order.orderNumber }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-dark-700 font-medium">{{ order.retailer ?? '—' }}</td>
                    <td class="px-5 py-3.5 text-sm text-dark-500">{{ order.township ?? '—' }}</td>
                    <td class="px-5 py-3.5 text-sm font-bold text-dark-800">R {{ order.total | number:'1.2-2' }}</td>
                    <td class="px-5 py-3.5 text-center">
                      <app-status-badge [status]="order.status" />
                    </td>
                    <td class="px-5 py-3.5 text-xs text-dark-500">{{ order.createdAt | date:'d MMM yyyy' }}</td>
                    <td class="px-5 py-3.5">
                      <div class="flex items-center justify-end gap-2">
                        @if (order.status === 'PENDING_CONFIRMATION') {
                          <button (click)="confirmOrder(order.id)"
                            class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                            Confirm
                          </button>
                          <button (click)="rejectOrder(order.id)"
                            class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                            Reject
                          </button>
                        } @else {
                          <span class="text-xs text-dark-400">Actioned</span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class SupplierOrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);

  filters: OrderFilter[] = ['ALL', 'PENDING_CONFIRMATION', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'REJECTED'];
  activeFilter = signal<OrderFilter>('ALL');
  orders = signal<Order[]>([]);
  loading = signal(true);

  visibleOrders = computed(() => {
    const filter = this.activeFilter();
    const all = this.orders();
    return filter === 'ALL' ? all : all.filter(o => o.status === filter);
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.ordersService.getSupplierOrders({}).subscribe({
      next: res => { this.orders.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  confirmOrder(id: string) {
    this.ordersService.confirmOrder(id).subscribe({
      next: () => this.orders.update(list =>
        list.map(o => (o.id === id ? { ...o, status: 'CONFIRMED' } : o)))
    });
  }

  rejectOrder(id: string) {
    this.ordersService.rejectOrder(id).subscribe({
      next: () => this.orders.update(list =>
        list.map(o => (o.id === id ? { ...o, status: 'REJECTED' } : o)))
    });
  }

  label(filter: OrderFilter): string {
    return filter === 'ALL'
      ? 'All'
      : filter.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
  }
}

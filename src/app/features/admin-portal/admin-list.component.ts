import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { AdminService } from '../../core/services/admin.service';

type AdminKind = 'retailers' | 'suppliers' | 'orders';

@Component({
  selector: 'app-admin-list',
  standalone: true,
  imports: [DecimalPipe, PageHeaderComponent, StatusBadgeComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header [title]="title()" [subtitle]="subtitle()">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">🔍</span>
          <input [value]="search()" (input)="search.set($any($event.target).value)"
            [placeholder]="'Search ' + kind() + '...'"
            class="w-64 max-w-full bg-white border border-dark-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-dark-800 placeholder:text-dark-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
        </div>
      </app-page-header>

      @if (toast()) {
        <div class="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          <span>✅</span><span>{{ toast() }}</span>
        </div>
      }

      <div class="flex flex-wrap gap-2 mb-5">
        @for (status of statuses(); track status) {
          <button (click)="activeStatus.set(status)"
            class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            [class]="activeStatus() === status
              ? 'bg-primary-600 border-primary-600 text-white'
              : 'bg-white border-dark-200 text-dark-600 hover:border-primary-400 hover:text-primary-600'">
            {{ status }}
          </button>
        }
      </div>

      <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg overflow-hidden">
        @switch (kind()) {
          @case ('retailers') {
            @if (filteredRetailers().length === 0) {
              <app-empty-state icon="🏪" title="No retailers found" description="Try a different search term or status." />
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-dark-50">
                    <tr>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Retailer</th>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Owner</th>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Township</th>
                      <th class="text-center px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Orders</th>
                      <th class="text-right px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Spend</th>
                      <th class="text-center px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Status</th>
                      <th class="text-right px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-dark-100">
                    @for (retailer of filteredRetailers(); track retailer.id) {
                      <tr class="hover:bg-dark-50/60">
                        <td class="px-5 py-3.5 text-sm font-semibold text-dark-900">{{ retailer.name }}</td>
                        <td class="px-5 py-3.5 text-sm text-dark-600">{{ retailer.owner }}</td>
                        <td class="px-5 py-3.5 text-sm text-dark-600">{{ retailer.township }}</td>
                        <td class="px-5 py-3.5 text-center text-sm text-dark-600">{{ retailer.orders }}</td>
                        <td class="px-5 py-3.5 text-right text-sm font-bold text-dark-900">R {{ retailer.spend | number:'1.0-0' }}</td>
                        <td class="px-5 py-3.5 text-center"><app-status-badge [status]="retailer.status" /></td>
                        <td class="px-5 py-3.5 text-right">
                          @if (retailer.status === 'Pending') {
                            <button (click)="approveRetailer(retailer.id)"
                              class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Approve</button>
                          } @else {
                            <span class="text-xs text-dark-300">—</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
          @case ('suppliers') {
            @if (filteredSuppliers().length === 0) {
              <app-empty-state icon="🤝" title="No suppliers found" description="Try a different search term or status." />
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-dark-50">
                    <tr>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Supplier</th>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Category</th>
                      <th class="text-center px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Products</th>
                      <th class="text-center px-5 py-3 text-xs font-semibold text-dark-500 uppercase">On Time</th>
                      <th class="text-center px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Status</th>
                      <th class="text-right px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-dark-100">
                    @for (supplier of filteredSuppliers(); track supplier.id) {
                      <tr class="hover:bg-dark-50/60">
                        <td class="px-5 py-3.5 text-sm font-semibold text-dark-900">{{ supplier.name }}</td>
                        <td class="px-5 py-3.5 text-sm text-dark-600">{{ supplier.category }}</td>
                        <td class="px-5 py-3.5 text-center text-sm text-dark-600">{{ supplier.products }}</td>
                        <td class="px-5 py-3.5 text-center text-sm text-dark-600">{{ supplier.onTime }}%</td>
                        <td class="px-5 py-3.5 text-center"><app-status-badge [status]="supplier.status" /></td>
                        <td class="px-5 py-3.5 text-right">
                          @if (supplier.status === 'Pending') {
                            <button (click)="approveSupplier(supplier.id)"
                              class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Approve</button>
                          } @else {
                            <span class="text-xs text-dark-300">—</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
          @case ('orders') {
            @if (filteredOrders().length === 0) {
              <app-empty-state icon="📭" title="No orders found" description="Try a different search term or status." />
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-dark-50">
                    <tr>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Order</th>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Retailer</th>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Supplier</th>
                      <th class="text-right px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Amount</th>
                      <th class="text-center px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Status</th>
                      <th class="text-right px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-dark-100">
                    @for (order of filteredOrders(); track order.id) {
                      <tr class="hover:bg-dark-50/60">
                        <td class="px-5 py-3.5 text-sm font-semibold text-dark-900">{{ order.orderNumber }}</td>
                        <td class="px-5 py-3.5 text-sm text-dark-600">{{ order.retailer }}</td>
                        <td class="px-5 py-3.5 text-sm text-dark-600">{{ order.supplier }}</td>
                        <td class="px-5 py-3.5 text-right text-sm font-bold text-dark-900">R {{ order.amount | number:'1.2-2' }}</td>
                        <td class="px-5 py-3.5 text-center"><app-status-badge [status]="order.status" /></td>
                        <td class="px-5 py-3.5 text-right text-xs text-dark-500">{{ order.date }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        }
      </div>
    </div>
  `,
})
export class AdminListComponent {
  private route = inject(ActivatedRoute);
  private admin = inject(AdminService);

  kind = computed(() => (this.route.snapshot.data['kind'] as AdminKind) ?? 'orders');
  title = computed(() => (this.route.snapshot.data['title'] as string) ?? 'Admin');
  subtitle = computed(() => (this.route.snapshot.data['subtitle'] as string) ?? '');
  statuses = computed(() =>
    this.kind() === 'orders'
      ? ['All', 'PENDING_CONFIRMATION', 'CONFIRMED', 'PREPARING', 'DISPATCHED', 'DELIVERED']
      : ['All', 'Active', 'Pending', 'Suspended'],
  );

  search = signal('');
  activeStatus = signal('All');
  toast = signal<string | null>(null);

  filteredRetailers = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.activeStatus();
    return this.admin.retailers().filter((retailer) => {
      const matchesStatus = status === 'All' || retailer.status === status;
      const matchesSearch =
        !term || retailer.name.toLowerCase().includes(term) || retailer.owner.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  });

  filteredSuppliers = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.activeStatus();
    return this.admin.suppliers().filter((supplier) => {
      const matchesStatus = status === 'All' || supplier.status === status;
      const matchesSearch =
        !term || supplier.name.toLowerCase().includes(term) || supplier.category.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  });

  filteredOrders = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.activeStatus();
    return this.admin.orders().filter((order) => {
      const matchesStatus = status === 'All' || order.status === status;
      const matchesSearch =
        !term ||
        order.orderNumber.toLowerCase().includes(term) ||
        order.retailer.toLowerCase().includes(term) ||
        order.supplier.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  });

  approveRetailer(id: string): void {
    const name = this.admin.retailers().find((r) => r.id === id)?.name;
    this.admin.approveRetailer(id);
    this.toast.set(`${name ?? 'Retailer'} approved.`);
  }

  approveSupplier(id: string): void {
    const name = this.admin.suppliers().find((s) => s.id === id)?.name;
    this.admin.approveSupplier(id);
    this.toast.set(`${name ?? 'Supplier'} approved.`);
  }
}

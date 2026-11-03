import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, PageHeaderComponent, StatCardComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header title="Platform Overview" subtitle="Smart Spaza marketplace health and approvals">
        <span class="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-full">
          <span class="w-2 h-2 rounded-full bg-emerald-500 pulse-live"></span> All systems operational
        </span>
      </app-page-header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <app-stat-card label="Retailers" [value]="stats().retailers.toString()" hint="+6 this month" trend="up" icon="🏪" tone="purple" />
        <app-stat-card label="Suppliers" [value]="stats().suppliers.toString()" hint="+2 this month" trend="up" icon="🤝" tone="blue" />
        <app-stat-card label="Orders" [value]="stats().orders.toString()" hint="+12.5% vs last month" trend="up" icon="📋" tone="orange" />
        <app-stat-card label="GMV" value="R 2.4M" hint="Gross merchandise value" icon="💰" tone="emerald" />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div class="xl:col-span-2 bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="font-bold text-dark-900">Monthly Growth</h2>
              <p class="text-xs text-dark-400 mt-0.5">GMV over the last six months</p>
            </div>
            <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">+{{ stats().growth }}%</span>
          </div>
          <div class="h-56 flex items-end gap-3">
            @for (month of growth; track month.label) {
              <div class="flex-1 h-full flex flex-col items-center justify-end gap-1.5">
                <span class="text-[11px] font-semibold text-dark-600">R{{ month.value | number:'1.0-0' }}k</span>
                <div class="w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-300" [style.height.%]="month.height"></div>
                <span class="text-[11px] text-dark-400">{{ month.label }}</span>
              </div>
            }
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
          <div class="flex items-center justify-between mb-1">
            <h2 class="font-bold text-dark-900">Pending Approvals</h2>
            <span class="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{{ pendingRetailers() + pendingSuppliers() }}</span>
          </div>
          <p class="text-xs text-dark-400 mb-4">New partners waiting to join</p>
          <div class="space-y-3">
            @for (supplier of pendingSupplierList(); track supplier.id) {
              <div class="flex items-center gap-3 rounded-xl border border-dark-100 p-3">
                <div class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-sm">🤝</div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-dark-900 truncate">{{ supplier.name }}</p>
                  <p class="text-[11px] text-dark-400">Supplier · {{ supplier.category }}</p>
                </div>
                <button (click)="approveSupplier(supplier.id)"
                  class="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Approve</button>
              </div>
            }
            @for (retailer of pendingRetailerList(); track retailer.id) {
              <div class="flex items-center gap-3 rounded-xl border border-dark-100 p-3">
                <div class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-sm">🏪</div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-dark-900 truncate">{{ retailer.name }}</p>
                  <p class="text-[11px] text-dark-400">Retailer · {{ retailer.township }}</p>
                </div>
                <button (click)="approveRetailer(retailer.id)"
                  class="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Approve</button>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg overflow-hidden">
        <div class="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 class="font-bold text-dark-900">Recent Orders</h2>
            <p class="text-xs text-dark-400 mt-0.5">Across all retailers and suppliers</p>
          </div>
          <a routerLink="/admin/orders" class="text-xs font-semibold text-primary-600 hover:text-primary-700">View all →</a>
        </div>
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
              @for (order of orders().slice(0, 5); track order.id) {
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
      </div>
    </div>
  `,
})
export class AdminDashboardComponent {
  private admin = inject(AdminService);

  stats = this.admin.stats;
  orders = this.admin.orders;
  pendingRetailers = this.admin.pendingRetailers;
  pendingSuppliers = this.admin.pendingSuppliers;

  growth = [
    { label: 'May', value: 1420, height: 48 },
    { label: 'Jun', value: 1580, height: 54 },
    { label: 'Jul', value: 1690, height: 58 },
    { label: 'Aug', value: 1930, height: 70 },
    { label: 'Sep', value: 2140, height: 79 },
    { label: 'Oct', value: 2400, height: 92 },
  ];

  pendingSupplierList = computed(() => this.admin.suppliers().filter((s) => s.status === 'Pending'));
  pendingRetailerList = computed(() => this.admin.retailers().filter((r) => r.status === 'Pending'));

  approveSupplier(id: string): void {
    this.admin.approveSupplier(id);
  }

  approveRetailer(id: string): void {
    this.admin.approveRetailer(id);
  }
}

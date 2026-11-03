import { Component, signal, inject, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard.service';
import { OrdersService } from '../../core/services/orders.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { CardSkeletonComponent } from '../../shared/components/skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import type { Order, SupplierStats } from '../../core/models';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, StatusBadgeComponent, CardSkeletonComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Supplier Command Center</h1>
          <p class="text-dark-500 mt-1">Real-time logistics operations dashboard</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="dispatchOrders()"
            class="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-500/25">
            Dispatch Orders
          </button>
          <button (click)="refreshData()"
            class="flex items-center gap-2 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
            Refresh
          </button>
        </div>
      </div>

      @if (statsLoading()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><app-card-skeleton [count]="4" /></div>
      } @else {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-gradient-to-br from-primary-50 to-primary-50 rounded-2xl p-5 card-shadow border border-dark-100/50">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Today's Revenue</p>
                <p class="text-3xl font-bold text-dark-900 mt-2">R {{ (stats()?.totalRevenue ?? 0) | number:'1.0-0' }}</p>
                <p class="text-xs text-dark-400 mt-1">R1.2M this month</p>
              </div>
              <div class="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-3 rounded-xl shadow-lg shadow-primary-500/20">
                💰
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-primary-50 to-primary-50 rounded-2xl p-5 card-shadow border border-dark-100/50">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Active Deliveries</p>
                <p class="text-3xl font-bold text-dark-900 mt-2">{{ activeDeliveries() }}</p>
                <p class="text-xs text-dark-400 mt-1">{{ driversOnRoute() }} drivers on route</p>
              </div>
              <div class="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-3 rounded-xl shadow-lg shadow-primary-500/20">
                🚚
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 card-shadow border border-dark-100/50">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Pending Orders</p>
                <p class="text-3xl font-bold text-dark-900 mt-2">{{ stats()?.pendingOrders ?? 0 }}</p>
                <p class="text-xs text-dark-400 mt-1">Require attention</p>
              </div>
              <div class="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-3 rounded-xl shadow-lg shadow-orange-500/20">
                ⏳
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-emerald-50 to-primary-50 rounded-2xl p-5 card-shadow border border-dark-100/50">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Completed Today</p>
                <p class="text-3xl font-bold text-dark-900 mt-2">{{ stats()?.todayOrders ?? 0 }}</p>
                <p class="text-xs text-dark-400 mt-1">94% satisfaction</p>
              </div>
              <div class="bg-gradient-to-br from-emerald-500 to-primary-600 text-white p-3 rounded-xl shadow-lg shadow-emerald-500/20">
                ✅
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Charts Row -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div class="xl:col-span-2 bg-white rounded-2xl border border-dark-100 p-5 card-shadow-lg">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-bold text-dark-900">Revenue Trend</h3>
              <p class="text-xs text-dark-400 mt-0.5">Monthly performance overview</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-primary-500"></div>
                <span class="text-xs text-dark-500">Revenue</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-primary-500"></div>
                <span class="text-xs text-dark-500">Orders</span>
              </div>
            </div>
          </div>
          <div class="h-56 flex items-end gap-2 px-2">
            @for (d of revenueData; track d.month) {
              <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div class="w-full flex flex-col items-center gap-1" style="height: 100%">
                  <div class="w-full bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-md"
                    [style.height.%]="(d.revenue / maxRevenue * 100)"></div>
                  <div class="w-full bg-primary-400 rounded-md"
                    [style.height.%]="(d.orders / maxOrders * 100)"></div>
                </div>
                <span class="text-xs text-dark-400">{{ d.month }}</span>
              </div>
            }
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-dark-100 p-5 card-shadow-lg">
          <h3 class="font-bold text-dark-900 mb-4">Sales by Category</h3>
          <div class="h-40 flex items-center justify-center">
            <div class="relative w-40 h-40 rounded-full"
              [style.background]="'conic-gradient(#15b372 0% 35%, #38ce8c 35% 60%, #f59e0b 60% 80%, #10b981 80% 100%)'">
              <div class="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                <span class="text-xs font-bold text-dark-700">Categories</span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 mt-4">
            @for (cat of categoryData; track cat.name) {
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" [style.background-color]="cat.color"></div>
                <span class="text-xs text-dark-500">{{ cat.name }}: {{ cat.value }}%</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg mb-5">
        <div class="flex items-center justify-between px-5 py-4 border-b border-dark-50">
          <h2 class="font-semibold text-dark-900">Recent Orders</h2>
          <a routerLink="/supplier/orders" class="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View All
          </a>
        </div>
        @if (ordersLoading()) {
          <div class="p-5"><app-card-skeleton [count]="3" /></div>
        } @else if (pendingOrders().length === 0) {
          <app-empty-state icon="✅" title="No pending orders" description="All orders have been actioned." />
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
                @for (order of pendingOrders(); track order.id) {
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
                        <button (click)="confirmOrder(order.id)"
                          class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                          Confirm
                        </button>
                        <button (click)="rejectOrder(order.id)"
                          class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Quick links -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        @for (link of quickLinks; track link.route) {
          <a [routerLink]="link.route"
            class="bg-white rounded-2xl border border-dark-100 p-4 hover:shadow-lg hover:border-primary-200 transition-all text-center">
            <span class="text-2xl block mb-2">{{ link.icon }}</span>
            <span class="text-sm font-medium text-dark-700">{{ link.label }}</span>
          </a>
        }
      </div>
    </div>
  `
})
export class SupplierDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private ordersService = inject(OrdersService);

  stats = signal<SupplierStats | null>(null);
  pendingOrders = signal<Order[]>([]);
  statsLoading = signal(true);
  ordersLoading = signal(true);

  activeDeliveries = computed(() => this.stats()?.activeDeliveries ?? 0);
  driversOnRoute = computed(() => this.stats()?.activeDrivers ?? 0);

  revenueData = [
    { month: 'Jan', revenue: 85000, orders: 1200 },
    { month: 'Feb', revenue: 92000, orders: 1350 },
    { month: 'Mar', revenue: 78000, orders: 1100 },
    { month: 'Apr', revenue: 105000, orders: 1500 },
    { month: 'May', revenue: 118000, orders: 1680 },
    { month: 'Jun', revenue: 132000, orders: 1850 },
  ];

  categoryData = [
    { name: 'Grains', value: 35, color: '#15b372' },
    { name: 'Dairy', value: 25, color: '#38ce8c' },
    { name: 'Snacks', value: 20, color: '#f59e0b' },
    { name: 'Beverages', value: 20, color: '#10b981' },
  ];

  maxRevenue = Math.max(...this.revenueData.map(d => d.revenue));
  maxOrders = Math.max(...this.revenueData.map(d => d.orders));

  quickLinks = [
    { icon: '📦', label: 'My Products', route: '/supplier/products' },
    { icon: '📋', label: 'All Orders', route: '/supplier/orders' },
    { icon: '📷', label: 'Scan Code', route: '/scanner' },
    { icon: '📊', label: 'Analytics', route: '/supplier/analytics' },
  ];

  ngOnInit() {
    this.dashboardService.getSupplierStats().subscribe({
      next: s => { this.stats.set(s); this.statsLoading.set(false); },
      error: () => this.statsLoading.set(false)
    });
    this.ordersService.getSupplierOrders({ status: 'PENDING_CONFIRMATION', pageSize: 10 }).subscribe({
      next: res => { this.pendingOrders.set(res.data); this.ordersLoading.set(false); },
      error: () => this.ordersLoading.set(false)
    });
  }

  confirmOrder(id: string) {
    this.ordersService.confirmOrder(id).subscribe({
      next: () => this.pendingOrders.update(orders => orders.filter(o => o.id !== id))
    });
  }

  rejectOrder(id: string) {
    this.ordersService.rejectOrder(id).subscribe({
      next: () => this.pendingOrders.update(orders => orders.filter(o => o.id !== id))
    });
  }

  dispatchOrders() { this.ordersService.getSupplierOrders({}).subscribe({ next: () => {} }); }
  refreshData() {
    this.dashboardService.getSupplierStats().subscribe({ next: s => this.stats.set(s) });
    this.ordersService.getSupplierOrders({ status: 'PENDING_CONFIRMATION', pageSize: 10 }).subscribe({
      next: res => this.pendingOrders.set(res.data)
    });
  }
}

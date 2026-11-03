import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-supplier-analytics',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <div class="mb-6">
        <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Analytics</h1>
        <p class="text-dark-500 mt-1">Performance across orders, delivery and demand</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        @for (kpi of kpis; track kpi.label) {
          <div class="bg-white rounded-2xl border border-dark-100 p-5 card-shadow">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">{{ kpi.label }}</p>
                <p class="text-2xl font-bold text-dark-900 mt-2">{{ kpi.value }}</p>
                <p class="text-xs mt-1" [class]="kpi.up ? 'text-emerald-600' : 'text-red-500'">
                  {{ kpi.delta }} vs last month
                </p>
              </div>
              <div class="text-2xl">{{ kpi.icon }}</div>
            </div>
          </div>
        }
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div class="xl:col-span-2 bg-white rounded-2xl border border-dark-100 p-5 card-shadow-lg">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="font-bold text-dark-900">Revenue & Orders</h3>
              <p class="text-xs text-dark-400 mt-0.5">Last 6 months</p>
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
          <div class="h-64 flex items-end gap-3 px-2">
            @for (d of monthly; track d.month) {
              <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div class="w-full flex flex-col items-center gap-1" style="height: 100%">
                  <div class="w-full bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-md transition-all"
                    [style.height.%]="(d.revenue / maxRevenue * 100)"></div>
                  <div class="w-full bg-primary-400 rounded-md transition-all"
                    [style.height.%]="(d.orders / maxOrders * 100)"></div>
                </div>
                <span class="text-xs text-dark-400">{{ d.month }}</span>
              </div>
            }
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-dark-100 p-5 card-shadow-lg">
          <h3 class="font-bold text-dark-900 mb-5">Order Fulfilment</h3>
          <div class="space-y-4">
            @for (f of fulfilment; track f.label) {
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-sm text-dark-600">{{ f.label }}</span>
                  <span class="text-sm font-semibold text-dark-800">{{ f.value }}%</span>
                </div>
                <div class="h-2 w-full bg-dark-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full" [style.width.%]="f.value" [style.background-color]="f.color"></div>
                </div>
              </div>
            }
          </div>

          <div class="mt-6 pt-5 border-t border-dark-50">
            <h4 class="text-sm font-semibold text-dark-900 mb-3">Top Townships</h4>
            <div class="space-y-2.5">
              @for (t of townships; track t.name) {
                <div class="flex items-center justify-between text-sm">
                  <span class="text-dark-600">{{ t.name }}</span>
                  <span class="font-semibold text-dark-800">R {{ t.revenue | number:'1.0-0' }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-2xl border border-dark-100 p-5 card-shadow-lg">
          <h3 class="font-bold text-dark-900 mb-5">Sales by Category</h3>
          <div class="flex items-center gap-6">
            <div class="relative w-40 h-40 rounded-full shrink-0"
              [style.background]="'conic-gradient(#15b372 0% 35%, #38ce8c 35% 60%, #f59e0b 60% 80%, #10b981 80% 100%)'">
              <div class="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                <span class="text-xs font-bold text-dark-700">Categories</span>
              </div>
            </div>
            <div class="space-y-2.5 flex-1">
              @for (cat of categories; track cat.name) {
                <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full" [style.background-color]="cat.color"></div>
                  <span class="text-sm text-dark-600 flex-1">{{ cat.name }}</span>
                  <span class="text-sm font-semibold text-dark-800">{{ cat.value }}%</span>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-dark-100 p-5 card-shadow-lg">
          <h3 class="font-bold text-dark-900 mb-5">Delivery Performance</h3>
          <div class="grid grid-cols-2 gap-4">
            @for (m of deliveryMetrics; track m.label) {
              <div class="bg-dark-50 rounded-xl p-4">
                <p class="text-xs text-dark-500">{{ m.label }}</p>
                <p class="text-2xl font-bold text-dark-900 mt-1.5">{{ m.value }}</p>
                <p class="text-xs text-dark-400 mt-0.5">{{ m.hint }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class SupplierAnalyticsComponent {
  kpis = [
    { label: 'Revenue (MTD)', value: 'R 1.2M', delta: '+12.5%', up: true, icon: '💰' },
    { label: 'Orders (MTD)', value: '1 640', delta: '+8.2%', up: true, icon: '📋' },
    { label: 'Avg. Order Value', value: 'R 742', delta: '+3.1%', up: true, icon: '📈' },
    { label: 'Return Rate', value: '1.8%', delta: '-0.4%', up: false, icon: '↩️' },
  ];

  monthly = [
    { month: 'May', revenue: 118000, orders: 1680 },
    { month: 'Jun', revenue: 132000, orders: 1850 },
    { month: 'Jul', revenue: 126000, orders: 1720 },
    { month: 'Aug', revenue: 158000, orders: 2080 },
    { month: 'Sep', revenue: 172000, orders: 2260 },
    { month: 'Oct', revenue: 195000, orders: 2410 },
  ];

  maxRevenue = Math.max(...this.monthly.map(d => d.revenue));
  maxOrders = Math.max(...this.monthly.map(d => d.orders));

  fulfilment = [
    { label: 'On-time delivery', value: 94, color: '#22c55e' },
    { label: 'Order accuracy', value: 98, color: '#38ce8c' },
    { label: 'Confirmation rate', value: 88, color: '#15b372' },
    { label: 'Return / dispute rate', value: 6, color: '#f97316' },
  ];

  townships = [
    { name: 'Soweto', revenue: 420000 },
    { name: 'Alexandra', revenue: 285000 },
    { name: 'Khayelitsha', revenue: 241000 },
    { name: 'Tembisa', revenue: 176000 },
    { name: 'Meadowlands', revenue: 128000 },
  ];

  categories = [
    { name: 'Beverages', value: 35, color: '#15b372' },
    { name: 'Grains', value: 25, color: '#38ce8c' },
    { name: 'Snacks', value: 20, color: '#f59e0b' },
    { name: 'Dairy', value: 20, color: '#10b981' },
  ];

  deliveryMetrics = [
    { label: 'Avg. Delivery Time', value: '42 min', hint: 'Target: 45 min' },
    { label: 'On-Time Rate', value: '94.2%', hint: 'Target: 90%' },
    { label: 'Active Drivers', value: '5', hint: 'Across 7 routes' },
    { label: 'Deliveries Today', value: '48', hint: '94% satisfaction' },
  ];
}

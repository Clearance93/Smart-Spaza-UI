import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { RetailerService } from '../../core/services/retailer.service';
import type { AnalyticsRange } from '../../core/services/retailer.service';

@Component({
  selector: 'app-retailer-analytics',
  standalone: true,
  imports: [DecimalPipe, PageHeaderComponent, StatCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header title="Analytics Dashboard" subtitle="Sales trends and business insights">
        <div class="flex items-center gap-1 bg-white border border-dark-200 rounded-xl p-1">
          @for (option of ranges; track option.value) {
            <button (click)="range.set(option.value)"
              class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              [class]="range() === option.value ? 'bg-primary-600 text-white' : 'text-dark-500 hover:text-dark-800'">
              {{ option.label }}
            </button>
          }
        </div>
      </app-page-header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <app-stat-card label="Total Sales" value="R {{ totalSales() | number:'1.0-0' }}" hint="+8.4% vs previous period" trend="up" icon="💰" tone="emerald" />
        <app-stat-card label="Orders Placed" [value]="totalOrders().toString()" hint="+5.2% vs previous period" trend="up" icon="🧾" tone="purple" />
        <app-stat-card label="Avg Daily Sales" value="R {{ averageSales() | number:'1.0-0' }}" hint="Per trading day" icon="📈" tone="blue" />
        <app-stat-card label="Delivery Rate" value="96%" hint="On-time deliveries" trend="up" icon="🚚" tone="orange" />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div class="xl:col-span-2 bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="font-bold text-dark-900">Sales Trend</h2>
              <p class="text-xs text-dark-400 mt-0.5">{{ rangeLabel() }} performance</p>
            </div>
            <div class="flex items-center gap-4 text-xs text-dark-500">
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-primary-500"></span> Sales</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-primary-400"></span> Orders</span>
            </div>
          </div>
          <div class="h-60 flex items-end gap-3">
            @for (point of points(); track point.label) {
              <div class="flex-1 h-full flex flex-col items-center justify-end gap-1.5">
                <div class="w-full flex items-end justify-center gap-1 h-full">
                  <div class="w-1/2 rounded-t-md bg-gradient-to-t from-primary-600 to-primary-300 transition-all"
                    [style.height.%]="barHeight(point.sales, maxSales())" [title]="'R ' + point.sales"></div>
                  <div class="w-1/2 rounded-t-md bg-primary-400 transition-all"
                    [style.height.%]="barHeight(point.orders, maxOrders())" [title]="point.orders + ' orders'"></div>
                </div>
                <span class="text-[11px] text-dark-400">{{ point.label }}</span>
              </div>
            }
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
          <h2 class="font-bold text-dark-900">Inventory by Category</h2>
          <p class="text-xs text-dark-400 mt-0.5">Share of sales</p>
          <div class="flex items-center justify-center my-6">
            <div class="w-40 h-40 rounded-full" [style.background]="donutGradient()">
              <div class="w-full h-full flex items-center justify-center">
                <div class="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
                  <span class="text-lg font-bold text-dark-900">{{ categoryBreakdown[0].share }}%</span>
                  <span class="text-[10px] text-dark-400">Staples</span>
                </div>
              </div>
            </div>
          </div>
          <div class="space-y-2">
            @for (cat of categoryBreakdown; track cat.name) {
              <div class="flex items-center justify-between text-xs">
                <span class="flex items-center gap-2 text-dark-600">
                  <span class="w-2.5 h-2.5 rounded-full" [style.background]="cat.color"></span>{{ cat.name }}
                </span>
                <span class="font-semibold text-dark-800">{{ cat.share }}%</span>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
          <h2 class="font-bold text-dark-900 mb-1">Top Products</h2>
          <p class="text-xs text-dark-400 mb-4">By revenue in the selected period</p>
          <div class="space-y-4">
            @for (product of topProducts; track product.name) {
              <div>
                <div class="flex items-center justify-between text-sm mb-1.5">
                  <span class="text-dark-700 font-medium">{{ product.name }}</span>
                  <span class="text-dark-900 font-bold">R {{ product.revenue | number:'1.0-0' }}</span>
                </div>
                <div class="h-1.5 rounded-full bg-dark-100 overflow-hidden">
                  <div class="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-500" [style.width.%]="product.share"></div>
                </div>
                <p class="text-[11px] text-dark-400 mt-1">{{ product.units }} units sold</p>
              </div>
            }
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
          <h2 class="font-bold text-dark-900 mb-1">Delivery Performance</h2>
          <p class="text-xs text-dark-400 mb-5">Last 30 days</p>
          <div class="space-y-4">
            <div>
              <div class="flex items-center justify-between text-xs mb-1.5"><span class="text-dark-600">On time</span><span class="font-semibold text-emerald-600">94.2%</span></div>
              <div class="h-1.5 rounded-full bg-dark-100"><div class="h-full rounded-full bg-emerald-500" style="width: 94.2%"></div></div>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs mb-1.5"><span class="text-dark-600">Delivered in full</span><span class="font-semibold text-primary-600">97.6%</span></div>
              <div class="h-1.5 rounded-full bg-dark-100"><div class="h-full rounded-full bg-primary-500" style="width: 97.6%"></div></div>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs mb-1.5"><span class="text-dark-600">Damaged on arrival</span><span class="font-semibold text-orange-500">1.8%</span></div>
              <div class="h-1.5 rounded-full bg-dark-100"><div class="h-full rounded-full bg-orange-400" style="width: 1.8%"></div></div>
            </div>
          </div>
          <div class="mt-5 rounded-xl bg-dark-50 p-3.5 space-y-2 text-xs">
            <div class="flex items-center justify-between"><span class="text-dark-500">Avg delivery time</span><span class="font-semibold text-dark-800">42 min</span></div>
            <div class="flex items-center justify-between"><span class="text-dark-500">Reorder rate</span><span class="font-semibold text-dark-800">68%</span></div>
            <div class="flex items-center justify-between"><span class="text-dark-500">Avg order value</span><span class="font-semibold text-dark-800">R 486</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RetailerAnalyticsComponent {
  private retailer = inject(RetailerService);

  ranges: { value: AnalyticsRange; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
  ];

  range = signal<AnalyticsRange>('7d');
  points = computed(() => this.retailer.salesFor(this.range()));
  totalSales = computed(() => Math.round(this.points().reduce((sum, p) => sum + p.sales, 0)));
  totalOrders = computed(() => this.points().reduce((sum, p) => sum + p.orders, 0));
  averageSales = computed(() => Math.round(this.totalSales() / this.points().length));
  maxSales = computed(() => Math.max(...this.points().map((p) => p.sales)));
  maxOrders = computed(() => Math.max(...this.points().map((p) => p.orders)));

  rangeLabel = computed(() => this.ranges.find((r) => r.value === this.range())?.label ?? '');

  categoryBreakdown = [
    { name: 'Staples', share: 35, color: '#15b372' },
    { name: 'Beverages', share: 25, color: '#fbbf24' },
    { name: 'Snacks', share: 18, color: '#f59e0b' },
    { name: 'Cleaning', share: 14, color: '#22c55e' },
    { name: 'Confectionery', share: 8, color: '#38ce8c' },
  ];

  topProducts = [
    { name: 'Ace Super Maize Meal 5kg', revenue: 12100, units: 220, share: 100 },
    { name: 'Coca-Cola 2L', revenue: 8640, units: 180, share: 71 },
    { name: 'Tastic Rice 2kg', revenue: 6930, units: 154, share: 57 },
    { name: 'Simba Chips 125g', revenue: 4160, units: 260, share: 34 },
    { name: 'Omo Washing Powder 1kg', revenue: 3470, units: 56, share: 29 },
  ];

  donutGradient = computed(() => {
    const stops: string[] = [];
    let cursor = 0;
    for (const cat of this.categoryBreakdown) {
      stops.push(`${cat.color} ${cursor}% ${cursor + cat.share}%`);
      cursor += cat.share;
    }
    return `conic-gradient(${stops.join(', ')})`;
  });

  barHeight(value: number, max: number): number {
    return max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  }
}

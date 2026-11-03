import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { DriverService } from '../../core/services/driver.service';

type HistoryRange = 'Today' | 'Week' | 'Month';

@Component({
  selector: 'app-driver-history',
  standalone: true,
  imports: [DecimalPipe, PageHeaderComponent, StatCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header title="Delivery History" subtitle="Every completed delivery and what you earned">
        <div class="flex items-center gap-1 bg-white border border-dark-200 rounded-xl p-1">
          @for (option of ranges; track option) {
            <button (click)="range.set(option)"
              class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              [class]="range() === option ? 'bg-primary-600 text-white' : 'text-dark-500 hover:text-dark-800'">
              {{ option }}
            </button>
          }
        </div>
      </app-page-header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <app-stat-card label="Deliveries" [value]="history().length.toString()" hint="Completed runs" icon="📦" tone="purple" />
        <app-stat-card label="Earnings" value="R {{ totalEarnings() | number:'1.0-0' }}" hint="From shown deliveries" icon="💰" tone="emerald" />
        <app-stat-card label="Distance" [value]="totalDistance().toFixed(1) + ' km'" hint="Total travelled" icon="🛣️" tone="blue" />
        <app-stat-card label="Avg Rating" [value]="averageRating().toFixed(1)" hint="Customer ratings" icon="⭐" tone="orange" />
      </div>

      <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg overflow-hidden">
        <div class="px-5 pt-5 pb-3 border-b border-dark-100">
          <h2 class="font-bold text-dark-900">Completed deliveries</h2>
          <p class="text-xs text-dark-400 mt-0.5">{{ range() }} · {{ history().length }} runs</p>
        </div>
        <div class="divide-y divide-dark-100">
          @for (delivery of history(); track delivery.id) {
            <div class="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-dark-50/50 transition-colors">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">✓</div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-dark-900">{{ delivery.shop }}</p>
                <p class="text-xs text-dark-400">{{ delivery.orderNumber }} · {{ delivery.township }} · {{ delivery.distanceKm }} km</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-dark-400">{{ delivery.deliveredAt }}</p>
                <p class="text-[11px] text-amber-500">★ {{ delivery.rating }}</p>
              </div>
              <div class="w-20 text-right">
                <p class="text-sm font-bold text-emerald-600">R {{ delivery.payout }}</p>
                <p class="text-[10px] text-dark-400 uppercase tracking-wide">Earned</p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DriverHistoryComponent {
  private driver = inject(DriverService);

  ranges: HistoryRange[] = ['Today', 'Week', 'Month'];
  range = signal<HistoryRange>('Week');

  history = computed(() => {
    const all = this.driver.history();
    if (this.range() === 'Today') return all.filter((d) => d.deliveredAt?.startsWith('Today'));
    if (this.range() === 'Week') return all;
    return all;
  });

  totalEarnings = computed(() => this.history().reduce((sum, d) => sum + d.payout, 0));
  totalDistance = computed(() => this.history().reduce((sum, d) => sum + d.distanceKm, 0));
  averageRating = computed(() => {
    const items = this.history().filter((d) => d.rating);
    if (items.length === 0) return 0;
    return items.reduce((sum, d) => sum + (d.rating ?? 0), 0) / items.length;
  });
}

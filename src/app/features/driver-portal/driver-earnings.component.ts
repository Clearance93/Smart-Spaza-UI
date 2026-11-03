import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { DriverService } from '../../core/services/driver.service';

@Component({
  selector: 'app-driver-earnings',
  standalone: true,
  imports: [DecimalPipe, PageHeaderComponent, StatCardComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header title="Earnings & Performance" subtitle="Your payouts, bonuses and delivery performance" />

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <app-stat-card label="This Week" value="R {{ weekEarnings() | number:'1.0-0' }}" hint="+12.4% vs last week" trend="up" icon="💵" tone="emerald" />
        <app-stat-card label="Today" value="R {{ todayEarnings() | number:'1.0-0' }}" hint="{{ completedToday() }} deliveries" icon="📅" tone="purple" />
        <app-stat-card label="Lifetime Earnings" value="R {{ lifetimeEarnings() | number:'1.0-0' }}" [hint]="profile().lifetimeDeliveries + ' deliveries'" icon="🏆" tone="orange" />
        <app-stat-card label="Driver Rating" [value]="profile().rating.toFixed(1)" hint="Top 10% in Soweto" icon="⭐" tone="cyan" />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div class="xl:col-span-2 bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="font-bold text-dark-900">Daily Earnings</h2>
              <p class="text-xs text-dark-400 mt-0.5">This week · Mon to Sun</p>
            </div>
            <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">On target</span>
          </div>
          <div class="h-60 flex items-end gap-3">
            @for (day of earnings; track day.label) {
              <div class="flex-1 h-full flex flex-col items-center justify-end gap-1.5">
                <span class="text-[11px] font-semibold text-dark-600">R{{ day.amount }}</span>
                <div class="w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-300 transition-all"
                  [style.height.%]="barHeight(day.amount)"></div>
                <span class="text-[11px] text-dark-400">{{ day.label }}</span>
              </div>
            }
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-gradient-to-br from-[#094d34] via-[#09764c] to-[#0a5d3e] rounded-2xl p-5 text-white card-shadow-lg">
            <p class="text-xs uppercase tracking-wider text-primary-200 font-semibold">Gold Driver</p>
            <p class="text-3xl font-bold mt-1">{{ profile().lifetimeDeliveries | number:'1.0-0' }}</p>
            <p class="text-xs text-primary-200">lifetime deliveries</p>
            <div class="mt-4">
              <div class="flex items-center justify-between text-xs text-primary-100 mb-1.5">
                <span>Progress to Platinum</span><span>{{ platinumProgress() }}%</span>
              </div>
              <div class="h-2 rounded-full bg-white/20"><div class="h-full rounded-full bg-amber-400" [style.width.%]="platinumProgress()"></div></div>
              <p class="text-[11px] text-primary-200 mt-2">{{ 4000 - profile().lifetimeDeliveries }} deliveries to go</p>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
            <h2 class="font-bold text-dark-900">Performance</h2>
            <div class="mt-4 space-y-3 text-xs">
              <div class="flex items-center justify-between"><span class="text-dark-500">On-time rate</span><span class="font-semibold text-emerald-600">94.2%</span></div>
              <div class="flex items-center justify-between"><span class="text-dark-500">Acceptance rate</span><span class="font-semibold text-dark-800">98.1%</span></div>
              <div class="flex items-center justify-between"><span class="text-dark-500">Avg delivery time</span><span class="font-semibold text-dark-800">42 min</span></div>
              <div class="flex items-center justify-between"><span class="text-dark-500">Weekly bonus</span><span class="font-semibold text-primary-600">R 350</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg overflow-hidden">
        <div class="px-5 pt-5 pb-3 border-b border-dark-100">
          <h2 class="font-bold text-dark-900">Recent Payouts</h2>
          <p class="text-xs text-dark-400 mt-0.5">Deposited to your Capitec account</p>
        </div>
        <div class="divide-y divide-dark-100">
          @for (payout of payouts; track payout.id) {
            <div class="flex flex-wrap items-center gap-3 px-5 py-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">💸</div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-dark-900">{{ payout.label }}</p>
                <p class="text-xs text-dark-400">{{ payout.date }}</p>
              </div>
              <app-status-badge [status]="payout.status" />
              <span class="w-24 text-right text-sm font-bold text-dark-900">R {{ payout.amount | number:'1.0-0' }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DriverEarningsComponent {
  private driver = inject(DriverService);

  profile = this.driver.profile;
  earnings = this.driver.earnings;
  payouts = this.driver.payouts;
  weekEarnings = this.driver.weekEarnings;
  todayEarnings = this.driver.todayEarnings;
  completedToday = this.driver.completedToday;

  lifetimeEarnings = computed(() => 482300);
  platinumProgress = computed(() => Math.min(100, Math.round((this.profile().lifetimeDeliveries / 4000) * 100)));

  barHeight(amount: number): number {
    const max = Math.max(...this.earnings.map((day) => day.amount));
    return max > 0 ? Math.max(3, Math.round((amount / max) * 100)) : 0;
  }
}

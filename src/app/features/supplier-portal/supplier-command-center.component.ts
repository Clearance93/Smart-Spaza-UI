import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CommandCenterService, DriverStatus } from '../../core/services/command-center.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { OrdersService } from '../../core/services/orders.service';
import { CardSkeletonComponent } from '../../shared/components/skeleton.component';
import type { ActivityItem, Order, SupplierStats } from '../../core/models';

@Component({
  selector: 'app-supplier-command-center',
  standalone: true,
  imports: [DatePipe, DecimalPipe, CardSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Command Center</h1>
          <p class="text-dark-500 mt-1">Live operations, driver dispatch and order flow</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="dispatchAll()"
            class="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-500/25">
            Dispatch Pending
          </button>
          <button (click)="refresh()"
            class="flex items-center gap-2 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
            Refresh
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        @if (loading()) {
          <div class="col-span-2 lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <app-card-skeleton [count]="4" />
          </div>
        } @else {
          <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 card-shadow border border-dark-100/50">
            <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Pending</p>
            <p class="text-3xl font-bold text-dark-900 mt-2">{{ pendingOrders().length }}</p>
            <p class="text-xs text-dark-400 mt-1">Awaiting confirmation</p>
          </div>
          <div class="bg-gradient-to-br from-primary-50 to-primary-50 rounded-2xl p-5 card-shadow border border-dark-100/50">
            <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Active Deliveries</p>
            <p class="text-3xl font-bold text-dark-900 mt-2">{{ stats()?.activeDeliveries ?? 0 }}</p>
            <p class="text-xs text-dark-400 mt-1">{{ driversOnRoute() }} drivers on route</p>
          </div>
          <div class="bg-gradient-to-br from-primary-50 to-primary-50 rounded-2xl p-5 card-shadow border border-dark-100/50">
            <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Drivers Available</p>
            <p class="text-3xl font-bold text-dark-900 mt-2">{{ availableDrivers() }}</p>
            <p class="text-xs text-dark-400 mt-1">{{ drivers().length }} total fleet</p>
          </div>
          <div class="bg-gradient-to-br from-emerald-50 to-primary-50 rounded-2xl p-5 card-shadow border border-dark-100/50">
            <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Completed Today</p>
            <p class="text-3xl font-bold text-dark-900 mt-2">{{ stats()?.todayOrders ?? 0 }}</p>
            <p class="text-xs text-dark-400 mt-1">94% satisfaction</p>
          </div>
        }
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 bg-white rounded-2xl border border-dark-100 card-shadow-lg">
          <div class="flex items-center justify-between px-5 py-4 border-b border-dark-50">
            <h2 class="font-semibold text-dark-900">Dispatch Queue</h2>
            <span class="text-xs text-dark-400">{{ dispatchQueue().length }} ready to dispatch</span>
          </div>
          @if (dispatchQueue().length === 0) {
            <div class="py-12 text-center">
              <p class="text-3xl mb-2">🚚</p>
              <p class="text-sm text-dark-500">No orders waiting to be dispatched.</p>
            </div>
          } @else {
            <div class="divide-y divide-dark-50">
              @for (order of dispatchQueue(); track order.id) {
                <div class="flex items-center gap-4 px-5 py-4">
                  <div class="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <span class="text-xs">📦</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-dark-900">{{ order.orderNumber }} · {{ order.retailer }}</p>
                    <p class="text-xs text-dark-400">{{ order.township }} · {{ order.createdAt | date:'d MMM' }}</p>
                  </div>
                  <span class="text-sm font-bold text-dark-800 shrink-0">R {{ order.total | number:'1.2-2' }}</span>
                  <button (click)="dispatch(order.id)"
                    class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors shrink-0">
                    Dispatch
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <div class="bg-white rounded-2xl border border-dark-100 p-5 card-shadow-lg">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-dark-900">Live Activity</h2>
            <span class="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-live"></span> Live
            </span>
          </div>
          <div class="space-y-4">
            @for (a of activity(); track a.id) {
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 rounded-full mt-1.5 shrink-0" [style.background-color]="toneColor(a.tone)"></div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-dark-800">{{ a.title }}</p>
                  <p class="text-xs text-dark-400">{{ a.detail }}</p>
                  <p class="text-xs text-dark-300 mt-0.5">{{ a.time }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg mt-6">
        <div class="px-5 py-4 border-b border-dark-50">
          <h2 class="font-semibold text-dark-900">Driver Status</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-dark-50">
              <tr>
                <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Driver</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Vehicle</th>
                <th class="text-center px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Status</th>
                <th class="text-center px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Active</th>
                <th class="text-right px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Rating</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-dark-50">
              @for (d of drivers(); track d.id) {
                <tr class="hover:bg-dark-50/50 transition-colors">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-xs font-bold flex items-center justify-center">
                        {{ d.initials }}
                      </div>
                      <span class="text-sm font-semibold text-dark-800">{{ d.name }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-3.5 text-sm text-dark-500">{{ d.vehicle }}</td>
                  <td class="px-5 py-3.5 text-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="statusClass(d.status)">
                      {{ statusLabel(d.status) }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-center text-sm font-semibold text-dark-800">{{ d.activeDeliveries }}</td>
                  <td class="px-5 py-3.5 text-right text-sm text-dark-700">⭐ {{ d.rating }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SupplierCommandCenterComponent implements OnInit {
  private commandCenter = inject(CommandCenterService);
  private dashboard = inject(DashboardService);
  private ordersService = inject(OrdersService);

  stats = signal<SupplierStats | null>(null);
  drivers = signal<DriverStatus[]>([]);
  activity = signal<ActivityItem[]>([]);
  orders = signal<Order[]>([]);
  loading = signal(true);

  dispatchQueue = () => this.orders().filter(o => o.status === 'CONFIRMED');
  pendingOrders = () => this.orders().filter(o => o.status === 'PENDING_CONFIRMATION');
  driversOnRoute = () => this.drivers().filter(d => d.status === 'ON_ROUTE').length;
  availableDrivers = () => this.drivers().filter(d => d.status === 'AVAILABLE').length;

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.dashboard.getSupplierStats().subscribe({ next: s => this.stats.set(s) });
    this.commandCenter.getDrivers().subscribe({ next: d => this.drivers.set(d) });
    this.commandCenter.getActivity().subscribe({ next: a => this.activity.set(a) });
    this.ordersService.getSupplierOrders({}).subscribe({
      next: res => { this.orders.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  dispatch(id: string) {
    this.orders.update(list => list.map(o => (o.id === id ? { ...o, status: 'DISPATCHED' } : o)));
  }

  dispatchAll() {
    const ids = this.orders().filter(o => o.status === 'CONFIRMED').map(o => o.id);
    this.orders.update(list =>
      list.map(o => (ids.includes(o.id) ? { ...o, status: 'DISPATCHED' } : o)));
  }

  statusLabel(status: DriverStatus['status']): string {
    return { ON_ROUTE: 'On Route', AVAILABLE: 'Available', OFFLINE: 'Offline' }[status];
  }

  statusClass(status: DriverStatus['status']): string {
    return {
      ON_ROUTE: 'bg-primary-100 text-primary-800',
      AVAILABLE: 'bg-green-100 text-green-800',
      OFFLINE: 'bg-gray-100 text-gray-700',
    }[status];
  }

  toneColor(tone: ActivityItem['tone']): string {
    return {
      success: '#22c55e',
      info: '#38ce8c',
      warning: '#f59e0b',
      danger: '#ef4444',
    }[tone];
  }
}

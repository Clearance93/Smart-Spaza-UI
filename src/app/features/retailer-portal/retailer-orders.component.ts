import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { RetailerOrdersService } from '../../core/services/retailer-orders.service';
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLES,
  type ShopOrder,
} from '../../core/models/retailer-orders.models';

type OrderFilter = 'All' | 'Pending' | 'In transit' | 'Delivered';

@Component({
  selector: 'app-retailer-orders',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-6xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Orders</h1>
          <p class="text-dark-500 mt-1">Purchase orders from your suppliers, tracked end to end</p>
        </div>
        <button (click)="refresh()" [disabled]="orders.loading()"
          class="self-start rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 transition-colors hover:bg-dark-50 disabled:opacity-60">
          {{ orders.loading() ? 'Refreshing…' : '↻ Refresh' }}
        </button>
      </div>

      @if (orders.error(); as message) {
        <div class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ message }}</div>
      }

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        @for (stat of stats(); track stat.label) {
          <div class="rounded-2xl border border-dark-100 bg-white p-4 card-shadow">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">{{ stat.label }}</p>
            <p class="mt-1 text-2xl font-bold" [class]="stat.tone">{{ stat.value }}</p>
          </div>
        }
      </div>

      <div class="mb-5 flex flex-wrap gap-2">
        @for (option of filters; track option) {
          <button (click)="filter.set(option)"
            class="rounded-full px-4 py-2 text-xs font-semibold transition-colors"
            [class]="filter() === option
              ? 'bg-dark-900 text-white'
              : 'border border-dark-200 bg-white text-dark-600 hover:bg-dark-50'">
            {{ option }}
            <span class="ml-1 opacity-70">{{ countFor(option) }}</span>
          </button>
        }
      </div>

      @if (orders.loading() && !orders.loaded()) {
        <p class="rounded-2xl border border-dark-100 bg-white px-5 py-12 text-center text-sm text-dark-500">
          Loading your orders…
        </p>
      } @else if (visibleOrders().length === 0) {
        <div class="rounded-2xl border border-dark-100 bg-white px-5 py-14 text-center card-shadow">
          <p class="text-3xl">🧾</p>
          <h2 class="mt-3 font-semibold text-dark-900">No orders here yet</h2>
          <p class="mx-auto mt-1 max-w-md text-sm text-dark-500">
            When a supplier dispatches stock to your shop it appears here with its delivery status and driver.
          </p>
          <a routerLink="/inventory"
            class="mt-5 inline-flex rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            Check your inventory
          </a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (order of visibleOrders(); track order.deliveryId) {
            <article class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="font-bold text-dark-900">#{{ order.deliveryNumber }}</h2>
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      [class]="statusStyle(order.status)">
                      {{ statusLabel(order.status) }}
                    </span>
                    @if (order.priority) {
                      <span class="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        {{ order.priority }} priority
                      </span>
                    }
                  </div>
                  <p class="mt-1 text-xs text-dark-400">
                    {{ order.supplierName || 'Supplier' }}
                    · placed {{ order.creationTime | date: 'd MMM, HH:mm' }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-xs font-semibold uppercase tracking-wide text-dark-400">ETA</p>
                  <p class="text-sm font-bold text-dark-900">
                    {{ order.estimatedArrival || order.scheduledTime || '—' }}
                  </p>
                  <p class="text-[11px] text-dark-400">{{ itemCount(order) }} item(s)</p>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                @for (item of order.items; track $index) {
                  <span class="rounded-lg border border-dark-100 bg-dark-50 px-2.5 py-1 text-xs text-dark-700">
                    {{ item.productName || 'Item' }} × {{ item.quantity }}
                  </span>
                }
                @if (order.items.length === 0) {
                  <span class="text-xs text-dark-400">No item lines recorded for this order.</span>
                }
              </div>

              <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dark-100 pt-3">
                <div class="flex flex-wrap items-center gap-3 text-xs text-dark-500">
                  <span>🚚 {{ order.driverName || 'Driver not assigned' }}</span>
                  @if (order.driverPhone) {
                    <a [href]="'tel:' + order.driverPhone" class="font-semibold text-primary-700 hover:text-primary-800">
                      {{ order.driverPhone }}
                    </a>
                  }
                  @if (order.tracking?.distanceRemaining !== null) {
                    <span>{{ order.tracking?.distanceRemaining | number: '1.0-1' }} km left</span>
                  }
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  @if (order.status !== 'Delivered' && order.status !== 'Rejected') {
                    <a routerLink="/tracking"
                      class="rounded-xl border border-dark-200 bg-white px-3.5 py-2 text-xs font-semibold text-dark-700 hover:bg-dark-50">
                      Track delivery
                    </a>
                  }
                  @if (order.status === 'Delivered') {
                    @if (order.rating === null) {
                      <div class="flex items-center gap-1">
                        <span class="mr-1 text-xs text-dark-500">Rate</span>
                        @for (star of [1, 2, 3, 4, 5]; track star) {
                          <button (click)="rate(order, star)" [disabled]="ratingId() === order.deliveryId"
                            class="text-lg leading-none text-amber-400 transition-transform hover:scale-110 disabled:opacity-50"
                            [attr.aria-label]="'Rate ' + star + ' out of 5'">★</button>
                        }
                      </div>
                    } @else {
                      <span class="text-xs font-semibold text-amber-600">
                        {{ order.rating }}/5 rated
                      </span>
                    }
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class RetailerOrdersComponent implements OnInit, OnDestroy {
  orders = inject(RetailerOrdersService);

  filter = signal<OrderFilter>('All');
  ratingId = signal<string | null>(null);

  readonly filters: OrderFilter[] = ['All', 'Pending', 'In transit', 'Delivered'];

  private subscription?: Subscription;

  readonly stats = computed(() => [
    { label: 'All orders', value: this.orders.orders().length, tone: 'text-dark-900' },
    { label: 'Pending', value: this.orders.pendingOrders().length, tone: 'text-slate-700' },
    { label: 'In transit', value: this.orders.inTransitOrders().length, tone: 'text-indigo-600' },
    { label: 'Delivered', value: this.orders.deliveredOrders().length, tone: 'text-emerald-600' },
  ]);

  readonly visibleOrders = computed(() => {
    switch (this.filter()) {
      case 'Pending':
        return this.orders.pendingOrders();
      case 'In transit':
        return this.orders.inTransitOrders();
      case 'Delivered':
        return this.orders.deliveredOrders();
      default:
        return this.orders.orders();
    }
  });

  ngOnInit(): void {
    this.orders.load();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  refresh(): void {
    this.orders.refresh();
  }

  countFor(filter: OrderFilter): number {
    switch (filter) {
      case 'Pending':
        return this.orders.pendingOrders().length;
      case 'In transit':
        return this.orders.inTransitOrders().length;
      case 'Delivered':
        return this.orders.deliveredOrders().length;
      default:
        return this.orders.orders().length;
    }
  }

  statusLabel(status: string): string {
    return ORDER_STATUS_LABEL[status] ?? status;
  }

  statusStyle(status: string): string {
    return ORDER_STATUS_STYLES[status] ?? 'bg-dark-100 text-dark-700';
  }

  itemCount(order: ShopOrder): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  rate(order: ShopOrder, rating: number): void {
    this.ratingId.set(order.deliveryId);
    this.subscription = this.orders.rate(order, rating).subscribe({
      next: () => this.ratingId.set(null),
      error: () => this.ratingId.set(null),
    });
  }
}

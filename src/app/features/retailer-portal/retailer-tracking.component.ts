import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RetailerOrdersService } from '../../core/services/retailer-orders.service';
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_PROGRESS,
  ORDER_STATUS_STYLES,
  type ShopOrder,
} from '../../core/models/retailer-orders.models';

const TIMELINE = ['Created', 'Accepted', 'InTransit', 'OnTheWay', 'Delivered'];

@Component({
  selector: 'app-retailer-tracking',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-6xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Live tracking</h1>
          <p class="text-dark-500 mt-1">Driver position, distance and ETA for orders on the road</p>
        </div>
        <button (click)="orders.refresh()" [disabled]="orders.loading()"
          class="self-start rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50 disabled:opacity-60">
          {{ orders.loading() ? 'Refreshing…' : '↻ Refresh' }}
        </button>
      </div>

      @if (orders.error(); as message) {
        <div class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ message }}</div>
      }

      @if (orders.activeOrders().length === 0) {
        <div class="rounded-2xl border border-dark-100 bg-white px-5 py-14 text-center card-shadow">
          <p class="text-3xl">🛰️</p>
          <h2 class="mt-3 font-semibold text-dark-900">No active deliveries</h2>
          <p class="mx-auto mt-1 max-w-md text-sm text-dark-500">
            When a supplier puts an order on the road, the driver's progress and ETA show up here.
          </p>
          <a routerLink="/orders"
            class="mt-5 inline-flex rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            View orders
          </a>
        </div>
      } @else {
        <div class="space-y-5">
          @for (order of orders.activeOrders(); track order.deliveryId) {
            <article class="overflow-hidden rounded-2xl border border-dark-100 bg-white card-shadow">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-dark-100 px-5 py-4">
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="font-bold text-dark-900">#{{ order.deliveryNumber }}</h2>
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" [class]="statusStyle(order.status)">
                      {{ statusLabel(order.status) }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-dark-400">
                    {{ order.supplierName || 'Supplier' }} · {{ itemCount(order) }} item(s)
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-xs font-semibold uppercase tracking-wide text-dark-400">ETA</p>
                  <p class="text-lg font-bold text-dark-900">
                    {{ order.tracking?.estimatedTime || order.estimatedArrival || '—' }}
                  </p>
                </div>
              </div>

              <div class="px-5 py-5">
                <div class="flex items-center justify-between text-xs text-dark-500">
                  <span>Progress</span>
                  <span class="font-semibold text-dark-700">{{ progress(order) }}%</span>
                </div>
                <div class="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-dark-100">
                  <div class="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                    [style.width.%]="progress(order)"></div>
                </div>

                <div class="mt-4 flex flex-wrap justify-between gap-2">
                  @for (step of timeline; track step) {
                    <div class="flex items-center gap-1.5 text-[11px] font-semibold"
                      [class]="isReached(order, step) ? 'text-primary-700' : 'text-dark-300'">
                      <span class="h-1.5 w-1.5 rounded-full"
                        [class]="isReached(order, step) ? 'bg-primary-600' : 'bg-dark-200'"></span>
                      {{ statusLabel(step) }}
                    </div>
                  }
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3 border-t border-dark-100 bg-dark-50/60 px-5 py-4 sm:grid-cols-3">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Driver</p>
                  <p class="text-sm font-semibold text-dark-900">{{ order.driverName || 'Not assigned' }}</p>
                  @if (order.driverPhone) {
                    <a [href]="'tel:' + order.driverPhone" class="text-xs font-semibold text-primary-700 hover:text-primary-800">
                      {{ order.driverPhone }}
                    </a>
                  }
                </div>
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Distance left</p>
                  <p class="text-sm font-semibold text-dark-900">
                    {{ order.tracking?.distanceRemaining !== null
                      ? (order.tracking?.distanceRemaining | number: '1.0-1') + ' km'
                      : '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Last update</p>
                  <p class="text-sm font-semibold text-dark-900">
                    {{ order.tracking?.updated ? (order.tracking?.updated | date: 'HH:mm') : '—' }}
                  </p>
                </div>
              </div>

              @if (order.tracking?.latitude !== null && order.tracking?.longitude !== null) {
                <div class="flex items-center justify-between border-t border-dark-100 px-5 py-3 text-xs text-dark-500">
                  <span>Last known position</span>
                  <a [href]="mapUrl(order)" target="_blank" rel="noopener noreferrer"
                    class="font-semibold text-primary-700 hover:text-primary-800">
                    {{ order.tracking?.latitude | number: '1.4-4' }}, {{ order.tracking?.longitude | number: '1.4-4' }} · Open map →
                  </a>
                </div>
              }
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class RetailerTrackingComponent implements OnInit {
  orders = inject(RetailerOrdersService);

  readonly timeline = TIMELINE;

  ngOnInit(): void {
    this.orders.load();
  }

  progress(order: ShopOrder): number {
    return ORDER_STATUS_PROGRESS[order.status] ?? 0;
  }

  isReached(order: ShopOrder, step: string): boolean {
    return this.progress(order) >= (ORDER_STATUS_PROGRESS[step] ?? 0);
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

  mapUrl(order: ShopOrder): string {
    return `https://www.google.com/maps/search/?api=1&query=${order.tracking?.latitude},${order.tracking?.longitude}`;
  }

  get activeCount(): number {
    return this.orders.activeOrders().length;
  }
}

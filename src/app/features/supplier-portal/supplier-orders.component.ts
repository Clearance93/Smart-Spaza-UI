import { Component, OnInit, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupplierOrdersService } from '../../core/services/supplier-orders.service';
import {
  SUPPLIER_STATUS_LABEL,
  SUPPLIER_STATUS_STYLES,
  type SupplierOrder,
} from '../../core/models/supplier.models';

type SupplierFilter = 'All' | 'Pending' | 'In transit' | 'Delivered';

@Component({
  selector: 'app-supplier-orders',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Orders</h1>
          <p class="text-dark-500 mt-1">Deliveries you dispatch to retailers</p>
        </div>
        <button (click)="orders.refresh()" [disabled]="orders.loading()"
          class="self-start rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50 disabled:opacity-60">
          {{ orders.loading() ? 'Refreshing…' : '↻ Refresh' }}
        </button>
      </div>

      @if (orders.error(); as message) {
        <div class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ message }}</div>
      }

      <div class="mb-5 flex flex-wrap gap-2">
        @for (option of filters; track option) {
          <button (click)="filter.set(option)"
            class="rounded-full px-4 py-2 text-xs font-semibold transition-colors"
            [class]="filter() === option
              ? 'bg-dark-900 text-white'
              : 'border border-dark-200 bg-white text-dark-600 hover:bg-dark-50'">
            {{ option }} <span class="ml-1 opacity-70">{{ countFor(option) }}</span>
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
          <h2 class="mt-3 font-semibold text-dark-900">No orders in this view</h2>
          <p class="mx-auto mt-1 max-w-md text-sm text-dark-500">
            Dispatches you create for your retailers appear here with status and driver.
          </p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (order of visibleOrders(); track order.deliveryId) {
            <article class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="font-bold text-dark-900">#{{ order.deliveryNumber }}</h2>
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" [class]="statusStyle(order.status)">
                      {{ statusLabel(order.status) }}
                    </span>
                    @if (order.priority) {
                      <span class="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        {{ order.priority }} priority
                      </span>
                    }
                  </div>
                  <p class="mt-1 text-xs text-dark-400">
                    {{ order.shopName || 'Retailer' }} · placed {{ order.creationTime | date: 'd MMM, HH:mm' }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-xs font-semibold uppercase tracking-wide text-dark-400">ETA</p>
                  <p class="text-sm font-bold text-dark-900">{{ order.estimatedArrival || order.scheduledTime || '—' }}</p>
                  <p class="text-[11px] text-dark-400">{{ itemCount(order) }} item(s)</p>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                @for (item of order.items; track $index) {
                  <span class="rounded-lg border border-dark-100 bg-dark-50 px-2.5 py-1 text-xs text-dark-700">
                    {{ item.productName || 'Item' }} × {{ item.quantity }}
                  </span>
                }
              </div>

              <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dark-100 pt-3">
                <div class="flex flex-wrap items-center gap-4 text-xs text-dark-500">
                  <span>🏪 {{ order.shopName || 'Retailer' }}</span>
                  @if (order.shopPhone) {
                    <a [href]="'tel:' + order.shopPhone" class="font-semibold text-primary-700 hover:text-primary-800">
                      {{ order.shopPhone }}
                    </a>
                  }
                  <span>🚚 {{ order.driverName || 'Driver not assigned' }}</span>
                  @if (order.tracking?.distanceRemaining !== null && order.tracking?.distanceRemaining !== undefined) {
                    <span>{{ order.tracking?.distanceRemaining | number: '1.0-1' }} km left</span>
                  }
                  @if (order.rating !== null) {
                    <span class="font-semibold text-amber-600">★ {{ order.rating }}/5</span>
                  }
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  @if (order.status === 'Created') {
                    <button (click)="accept(order)" [disabled]="actingId() === order.deliveryId"
                      class="rounded-xl bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                      {{ actingId() === order.deliveryId ? 'Accepting…' : 'Accept order' }}
                    </button>
                  }
                  @if (order.status !== 'Delivered' && order.status !== 'Rejected') {
                    <a routerLink="/supplier/fleet"
                      class="rounded-xl border border-dark-200 bg-white px-3.5 py-2 text-xs font-semibold text-dark-700 hover:bg-dark-50">
                      Track delivery
                    </a>
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
export class SupplierOrdersComponent implements OnInit {
  orders = inject(SupplierOrdersService);

  filter = signal<SupplierFilter>('All');
  actingId = signal<string | null>(null);

  readonly filters: SupplierFilter[] = ['All', 'Pending', 'In transit', 'Delivered'];

  private subscription?: Subscription;

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

  countFor(filter: SupplierFilter): number {
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
    return SUPPLIER_STATUS_LABEL[status] ?? status;
  }

  statusStyle(status: string): string {
    return SUPPLIER_STATUS_STYLES[status] ?? 'bg-dark-100 text-dark-700';
  }

  itemCount(order: SupplierOrder): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  accept(order: SupplierOrder): void {
    this.actingId.set(order.deliveryId);
    this.subscription = this.orders.accept(order).subscribe({
      next: () => this.actingId.set(null),
      error: () => this.actingId.set(null),
    });
  }
}

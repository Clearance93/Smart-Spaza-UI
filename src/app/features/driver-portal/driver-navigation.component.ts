import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DriverOrdersService } from '../../core/services/driver-orders.service';
import {
  SUPPLIER_STATUS_LABEL,
  SUPPLIER_STATUS_PROGRESS,
  SUPPLIER_STATUS_STYLES,
  type SupplierOrder,
} from '../../core/models/supplier.models';

@Component({
  selector: 'app-driver-navigation',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-5xl mx-auto animate-fade-in">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Navigation</h1>
          <p class="text-dark-500 mt-1">Your next stop, with the shop's details</p>
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
          <p class="text-3xl">🧭</p>
          <h2 class="mt-3 font-semibold text-dark-900">No active route</h2>
          <p class="mx-auto mt-1 max-w-md text-sm text-dark-500">
            Accept a delivery and start the route to see navigation here.
          </p>
          <a routerLink="/driver/deliveries"
            class="mt-5 inline-flex rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            View deliveries
          </a>
        </div>
      } @else {
        <div class="space-y-5">
          @for (order of orders.activeOrders(); track order.deliveryId) {
            <article class="overflow-hidden rounded-2xl border border-dark-100 bg-white card-shadow">
              <div class="flex flex-wrap items-start justify-between gap-3 border-b border-dark-100 px-5 py-4">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Destination</p>
                  <h2 class="text-lg font-bold text-dark-900">{{ order.shopName || 'Retailer' }}</h2>
                  <p class="text-xs text-dark-400">{{ order.shopOwnerName || '' }}</p>
                </div>
                <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" [class]="statusStyle(order.status)">
                  {{ statusLabel(order.status) }}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-4">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">ETA</p>
                  <p class="text-sm font-bold text-dark-900">{{ order.tracking?.estimatedTime || order.estimatedArrival || '—' }}</p>
                </div>
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Distance</p>
                  <p class="text-sm font-bold text-dark-900">
                    {{ order.tracking?.distanceRemaining !== null && order.tracking?.distanceRemaining !== undefined
                      ? (order.tracking?.distanceRemaining | number: '1.0-1') + ' km'
                      : '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Items</p>
                  <p class="text-sm font-bold text-dark-900">{{ itemCount(order) }}</p>
                </div>
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Progress</p>
                  <p class="text-sm font-bold text-dark-900">{{ progress(order) }}%</p>
                </div>
              </div>

              <div class="flex flex-wrap gap-2 px-5 pb-5">
                <a [href]="mapUrl(order)" target="_blank" rel="noopener noreferrer"
                  class="rounded-xl bg-dark-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dark-800">
                  Open in Google Maps
                </a>
                @if (order.shopPhone) {
                  <a [href]="'tel:' + order.shopPhone"
                    class="rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50">
                    Call shop
                  </a>
                  <a [href]="'https://wa.me/' + waNumber(order.shopPhone)" target="_blank" rel="noopener noreferrer"
                    class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                    WhatsApp
                  </a>
                }
                @if (order.status === 'Accepted') {
                  <button (click)="start(order)" [disabled]="orders.actingId() === order.deliveryId"
                    class="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                    Start route
                  </button>
                }
                @if (order.status === 'InTransit') {
                  <button (click)="onTheWay(order)" [disabled]="orders.actingId() === order.deliveryId"
                    class="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                    I'm on the way
                  </button>
                }
                @if (order.status === 'OnTheWay') {
                  <button (click)="deliver(order)" [disabled]="orders.actingId() === order.deliveryId"
                    class="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                    Mark delivered
                  </button>
                }
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class DriverNavigationComponent implements OnInit {
  orders = inject(DriverOrdersService);

  ngOnInit(): void {
    this.orders.load();
  }

  progress(order: SupplierOrder): number {
    return SUPPLIER_STATUS_PROGRESS[order.status] ?? 0;
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

  mapUrl(order: SupplierOrder): string {
    if (order.tracking?.latitude != null && order.tracking?.longitude != null) {
      return `https://www.google.com/maps/dir/?api=1&destination=${order.tracking.latitude},${order.tracking.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shopName || 'Retailer')}`;
  }

  waNumber(phone: string): string {
    const digits = phone.replace(/[^\d]/g, '');
    return digits.startsWith('0') ? `27${digits.slice(1)}` : digits;
  }

  start(order: SupplierOrder): void {
    this.orders.startRoute(order).subscribe({ error: () => undefined });
  }

  onTheWay(order: SupplierOrder): void {
    this.orders.onTheWay(order).subscribe({ error: () => undefined });
  }

  deliver(order: SupplierOrder): void {
    this.orders.markDelivered(order).subscribe({ error: () => undefined });
  }
}

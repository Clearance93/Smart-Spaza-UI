import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DriverOrdersService } from '../../core/services/driver-orders.service';

@Component({
  selector: 'app-driver-history',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-5xl mx-auto animate-fade-in">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">History</h1>
          <p class="text-dark-500 mt-1">Deliveries you have completed</p>
        </div>
        <button (click)="orders.refresh()" [disabled]="orders.loading()"
          class="self-start rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50 disabled:opacity-60">
          {{ orders.loading() ? 'Refreshing…' : '↻ Refresh' }}
        </button>
      </div>

      @if (orders.error(); as message) {
        <div class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ message }}</div>
      }

      @if (orders.deliveredOrders().length === 0) {
        <div class="rounded-2xl border border-dark-100 bg-white px-5 py-14 text-center card-shadow">
          <p class="text-3xl">🗂️</p>
          <h2 class="mt-3 font-semibold text-dark-900">No completed deliveries yet</h2>
          <p class="mx-auto mt-1 max-w-md text-sm text-dark-500">
            Once you mark a route delivered it moves here with the shop's rating.
          </p>
          <a routerLink="/driver/deliveries"
            class="mt-5 inline-flex rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            View deliveries
          </a>
        </div>
      } @else {
        <div class="overflow-hidden rounded-2xl border border-dark-100 bg-white card-shadow">
          <div class="divide-y divide-dark-100">
            @for (order of orders.deliveredOrders(); track order.deliveryId) {
              <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-dark-900">
                    #{{ order.deliveryNumber }} · {{ order.shopName || 'Retailer' }}
                  </p>
                  <p class="text-xs text-dark-400">
                    Delivered {{ order.actualArrival || '—' }} ·
                    {{ order.creationTime | date: 'd MMM yyyy' }} ·
                    {{ itemCount(order) }} item(s)
                  </p>
                  @if (order.ratingComment) {
                    <p class="mt-1 text-xs italic text-dark-500">"{{ order.ratingComment }}"</p>
                  }
                </div>
                <div class="text-right">
                  @if (order.rating !== null) {
                    <p class="text-sm font-bold text-amber-600">★ {{ order.rating }}/5</p>
                  } @else {
                    <p class="text-xs text-dark-400">Not rated</p>
                  }
                  <p class="text-[11px] text-dark-400">{{ order.shopOwnerName || '' }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DriverHistoryComponent implements OnInit {
  orders = inject(DriverOrdersService);

  ngOnInit(): void {
    this.orders.load();
  }

  itemCount(order: { items: { quantity: number }[] }): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupplierOrdersService } from '../../core/services/supplier-orders.service';

@Component({
  selector: 'app-supplier-drivers',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-6xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Drivers</h1>
          <p class="text-dark-500 mt-1">Everyone carrying your deliveries, with live performance</p>
        </div>
        <button (click)="orders.refresh()" [disabled]="orders.loading()"
          class="self-start rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50 disabled:opacity-60">
          {{ orders.loading() ? 'Refreshing…' : '↻ Refresh' }}
        </button>
      </div>

      @if (orders.drivers().length === 0) {
        <div class="rounded-2xl border border-dark-100 bg-white px-5 py-14 text-center card-shadow">
          <p class="text-3xl">🧑‍✈️</p>
          <h2 class="mt-3 font-semibold text-dark-900">No drivers yet</h2>
          <p class="mx-auto mt-1 max-w-md text-sm text-dark-500">
            Drivers appear here as soon as you assign them to a delivery.
          </p>
          <a routerLink="/supplier/orders"
            class="mt-5 inline-flex rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            View orders
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          @for (driver of orders.drivers(); track driver.driverId) {
            <article class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
              <div class="flex items-start gap-3">
                <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm font-bold text-white">
                  {{ initials(driver.name) }}
                </div>
                <div class="min-w-0 flex-1">
                  <h2 class="truncate font-bold text-dark-900">{{ driver.name }}</h2>
                  @if (driver.phone) {
                    <a [href]="'tel:' + driver.phone" class="text-xs font-semibold text-primary-700 hover:text-primary-800">
                      {{ driver.phone }}
                    </a>
                  }
                </div>
                @if (driver.averageRating !== null) {
                  <span class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    ★ {{ driver.averageRating | number: '1.1-1' }}
                  </span>
                }
              </div>

              <div class="mt-4 grid grid-cols-3 gap-2">
                <div class="rounded-xl bg-dark-50 px-3 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Orders</p>
                  <p class="text-lg font-bold text-dark-900">{{ driver.orders }}</p>
                </div>
                <div class="rounded-xl bg-dark-50 px-3 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Delivered</p>
                  <p class="text-lg font-bold text-emerald-600">{{ driver.delivered }}</p>
                </div>
                <div class="rounded-xl bg-dark-50 px-3 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Active</p>
                  <p class="text-lg font-bold text-indigo-600">{{ driver.active }}</p>
                </div>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class SupplierDriversComponent implements OnInit {
  orders = inject(SupplierOrdersService);

  ngOnInit(): void {
    this.orders.load();
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}

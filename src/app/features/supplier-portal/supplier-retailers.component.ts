import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupplierOrdersService } from '../../core/services/supplier-orders.service';

@Component({
  selector: 'app-supplier-retailers',
  standalone: true,
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-6xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Retailers</h1>
          <p class="text-dark-500 mt-1">Shops you supply, with their order history</p>
        </div>
        <button (click)="orders.refresh()" [disabled]="orders.loading()"
          class="self-start rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50 disabled:opacity-60">
          {{ orders.loading() ? 'Refreshing…' : '↻ Refresh' }}
        </button>
      </div>

      @if (orders.retailers().length === 0) {
        <div class="rounded-2xl border border-dark-100 bg-white px-5 py-14 text-center card-shadow">
          <p class="text-3xl">🏪</p>
          <h2 class="mt-3 font-semibold text-dark-900">No retailers yet</h2>
          <p class="mx-auto mt-1 max-w-md text-sm text-dark-500">
            Retailers appear here as soon as you dispatch an order to them.
          </p>
          <a routerLink="/supplier/orders"
            class="mt-5 inline-flex rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            View orders
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          @for (retailer of orders.retailers(); track retailer.shopId) {
            <article class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
              <div class="flex items-start gap-3">
                <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-bold text-white">
                  {{ initials(retailer.name) }}
                </div>
                <div class="min-w-0 flex-1">
                  <h2 class="truncate font-bold text-dark-900">{{ retailer.name }}</h2>
                  <p class="text-xs text-dark-400">{{ retailer.owner || 'Shop owner' }}</p>
                </div>
                @if (retailer.active > 0) {
                  <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                    {{ retailer.active }} active
                  </span>
                }
              </div>

              <div class="mt-4 grid grid-cols-3 gap-2">
                <div class="rounded-xl bg-dark-50 px-3 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Orders</p>
                  <p class="text-lg font-bold text-dark-900">{{ retailer.orders }}</p>
                </div>
                <div class="rounded-xl bg-dark-50 px-3 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Delivered</p>
                  <p class="text-lg font-bold text-emerald-600">{{ retailer.delivered }}</p>
                </div>
                <div class="rounded-xl bg-dark-50 px-3 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Last order</p>
                  <p class="text-xs font-bold text-dark-900">
                    {{ retailer.lastOrder ? (retailer.lastOrder | date: 'd MMM') : '—' }}
                  </p>
                </div>
              </div>

              <div class="mt-3 space-y-1 text-xs text-dark-500">
                @if (retailer.phone) {
                  <p>📞 <a [href]="'tel:' + retailer.phone" class="font-semibold text-primary-700 hover:text-primary-800">{{ retailer.phone }}</a></p>
                }
                @if (retailer.email) {
                  <p>✉️ <a [href]="'mailto:' + retailer.email" class="font-semibold text-primary-700 hover:text-primary-800">{{ retailer.email }}</a></p>
                }
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class SupplierRetailersComponent implements OnInit {
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

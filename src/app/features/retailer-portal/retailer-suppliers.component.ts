import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RetailerOrdersService } from '../../core/services/retailer-orders.service';

@Component({
  selector: 'app-retailer-suppliers',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-6xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Suppliers</h1>
          <p class="text-dark-500 mt-1">The businesses that stock your catalogue</p>
        </div>
        <button (click)="orders.refresh()" [disabled]="orders.loading()"
          class="self-start rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50 disabled:opacity-60">
          {{ orders.loading() ? 'Refreshing…' : '↻ Refresh' }}
        </button>
      </div>

      @if (orders.error(); as message) {
        <div class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ message }}</div>
      }

      @if (orders.loading() && !orders.loaded()) {
        <p class="rounded-2xl border border-dark-100 bg-white px-5 py-12 text-center text-sm text-dark-500">
          Loading your suppliers…
        </p>
      } @else if (orders.suppliers().length === 0) {
        <div class="rounded-2xl border border-dark-100 bg-white px-5 py-14 text-center card-shadow">
          <p class="text-3xl">🏭</p>
          <h2 class="mt-3 font-semibold text-dark-900">No suppliers linked yet</h2>
          <p class="mx-auto mt-1 max-w-md text-sm text-dark-500">
            Suppliers appear here automatically once their products carry a supplier on your catalogue.
          </p>
          <a routerLink="/inventory"
            class="mt-5 inline-flex rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            Review your catalogue
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          @for (supplier of orders.suppliers(); track supplier.supplierId) {
            <article class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
              <div class="flex items-start gap-3">
                <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-bold text-white">
                  {{ initials(supplier.supplierName) }}
                </div>
                <div class="min-w-0 flex-1">
                  <h2 class="truncate font-bold text-dark-900">{{ supplier.supplierName || 'Supplier' }}</h2>
                  <p class="text-xs text-dark-400">{{ supplier.contactName || 'No contact person recorded' }}</p>
                </div>
                @if (supplier.ratings) {
                  <span class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    ★ {{ supplier.ratings }}
                  </span>
                }
              </div>

              <div class="mt-4 grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-dark-50 px-3 py-2">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Orders</p>
                  <p class="text-lg font-bold text-dark-900">{{ supplier.orderCount }}</p>
                </div>
                <div class="rounded-xl bg-dark-50 px-3 py-2">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Products</p>
                  <p class="text-lg font-bold text-dark-900">{{ supplier.productCount }}</p>
                </div>
              </div>
              @if (supplier.stockValue > 0) {
                <p class="mt-2 text-xs text-dark-500">
                  R {{ supplier.stockValue | number: '1.0-0' }} of stock supplied
                </p>
              }

              <div class="mt-4 space-y-1.5 text-xs text-dark-500">
                @if (supplier.address) {
                  <p>📍 {{ supplier.address }}</p>
                }
                @if (supplier.email) {
                  <p>✉️ <a [href]="'mailto:' + supplier.email" class="font-semibold text-primary-700 hover:text-primary-800">{{ supplier.email }}</a></p>
                }
                @if (supplier.contactNumber) {
                  <p>📞 <a [href]="'tel:' + supplier.contactNumber" class="font-semibold text-primary-700 hover:text-primary-800">{{ supplier.contactNumber }}</a></p>
                }
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class RetailerSuppliersComponent implements OnInit {
  orders = inject(RetailerOrdersService);

  ngOnInit(): void {
    this.orders.load();
  }

  initials(name: string | null): string {
    if (!name) return 'SU';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}

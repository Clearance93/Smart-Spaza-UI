import { Component, OnInit, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ScannerApiService } from '../../core/services/scanner-api.service';
import { RetailerOrdersService } from '../../core/services/retailer-orders.service';
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLES } from '../../core/models/retailer-orders.models';
import type { ScannedProduct } from '../../core/models/scanner.models';

/**
 * Live business dashboard. Everything here comes from SmartSpazaAPI and is already
 * filtered to the signed-in business by the server.
 */
@Component({
  selector: 'app-live-dashboard',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Dashboard</h1>
          <p class="text-dark-500 mt-1">
            {{ portalLabel() }} · your live catalogue and stock
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button (click)="load()"
            class="rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 transition-colors hover:bg-dark-50">
            ↻ Refresh
          </button>
          <a routerLink="/inventory"
            class="rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 transition-colors hover:bg-dark-50">
            Inventory
          </a>
          <a routerLink="/scanner"
            class="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700">
            Scan code
          </a>
        </div>
      </div>

      @if (error()) {
        <div class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ error() }}
        </div>
      }

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Products</p>
          <p class="mt-1.5 text-2xl font-bold text-dark-900">{{ products().length }}</p>
          <p class="mt-1 text-xs text-dark-400">In your catalogue</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Units in stock</p>
          <p class="mt-1.5 text-2xl font-bold text-dark-900">{{ totalUnits() }}</p>
          <p class="mt-1 text-xs text-dark-400">Across all products</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Low stock</p>
          <p class="mt-1.5 text-2xl font-bold text-amber-600">{{ lowStock().length }}</p>
          <p class="mt-1 text-xs text-dark-400">10 units or fewer</p>
        </div>
        <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Stock value</p>
          <p class="mt-1.5 text-2xl font-bold text-dark-900">R {{ totalValue() | number:'1.0-0' }}</p>
          <p class="mt-1 text-xs text-dark-400">At selling price</p>
        </div>
      </div>

      @if (isRetailer()) {
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <a routerLink="/orders"
          class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow transition-colors hover:border-primary-200">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Orders</p>
          <p class="mt-1.5 text-2xl font-bold text-dark-900">{{ orders.orders().length }}</p>
          <p class="mt-1 text-xs text-dark-400">{{ orders.inTransitOrders().length }} in transit</p>
        </a>
        <a routerLink="/tracking"
          class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow transition-colors hover:border-primary-200">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Active deliveries</p>
          <p class="mt-1.5 text-2xl font-bold text-indigo-600">{{ orders.activeOrders().length }}</p>
          <p class="mt-1 text-xs text-dark-400">On the way to you</p>
        </a>
        <a routerLink="/suppliers"
          class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow transition-colors hover:border-primary-200">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Suppliers</p>
          <p class="mt-1.5 text-2xl font-bold text-dark-900">{{ orders.suppliers().length }}</p>
          <p class="mt-1 text-xs text-dark-400">Stocking your catalogue</p>
        </a>
        <a routerLink="/notifications"
          class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow transition-colors hover:border-primary-200">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-500">Needs attention</p>
          <p class="mt-1.5 text-2xl font-bold text-amber-600">{{ lowStock().length }}</p>
          <p class="mt-1 text-xs text-dark-400">Low stock alerts</p>
        </a>
      </div>

      @if (orders.orders().length > 0) {
        <div class="mb-6 rounded-2xl border border-dark-100 bg-white card-shadow overflow-hidden">
          <div class="flex items-center justify-between border-b border-dark-100 px-5 py-4">
            <div>
              <h2 class="text-sm font-semibold text-dark-900">Recent orders</h2>
              <p class="text-xs text-dark-400">Live delivery status from your suppliers</p>
            </div>
            <a routerLink="/orders" class="text-xs font-semibold text-primary-700 hover:text-primary-800">
              View all →
            </a>
          </div>
          <div class="divide-y divide-dark-100">
            @for (order of recentOrders(); track order.deliveryId) {
              <a routerLink="/orders" class="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-dark-50/60">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-dark-900">
                    #{{ order.deliveryNumber }} · {{ order.supplierName || 'Supplier' }}
                  </p>
                  <p class="text-xs text-dark-400">
                    {{ order.items.length }} line(s) · ETA {{ order.estimatedArrival || order.scheduledTime || '—' }}
                  </p>
                </div>
                <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" [class]="statusStyle(order.status)">
                  {{ statusLabel(order.status) }}
                </span>
              </a>
            }
          </div>
        </div>
      }

      }

      <div class="rounded-2xl border border-dark-100 bg-white card-shadow overflow-hidden">
        <div class="flex items-center justify-between border-b border-dark-100 px-5 py-4">
          <div>
            <h2 class="text-sm font-semibold text-dark-900">Your products</h2>
            <p class="text-xs text-dark-400">Only your own catalogue is shown</p>
          </div>
          <a routerLink="/scanner" class="text-xs font-semibold text-primary-700 hover:text-primary-800">
            Add or restock →
          </a>
        </div>

        @if (loading()) {
          <p class="px-5 py-10 text-center text-sm text-dark-500">Loading your catalogue…</p>
        } @else if (products().length === 0) {
          <div class="px-5 py-14 text-center">
            <p class="text-3xl">📦</p>
            <h3 class="mt-3 font-semibold text-dark-900">No products yet</h3>
            <p class="mt-1 text-sm text-dark-500">
              Scan a barcode to add your first item — it is stored against your business only.
            </p>
            <a routerLink="/scanner"
              class="mt-5 inline-flex rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
              Open the scanner
            </a>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-dark-50">
                <tr>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-dark-500">Product</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-dark-500">Barcode</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-dark-500">Category</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase text-dark-500">Price</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase text-dark-500">Stock</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dark-100">
                @for (product of products(); track product.productId) {
                  <tr class="hover:bg-dark-50/60 transition-colors">
                    <td class="px-5 py-3.5 text-sm font-semibold text-dark-900">{{ product.name }}</td>
                    <td class="px-5 py-3.5 font-mono text-xs text-dark-500">{{ product.barcode || '—' }}</td>
                    <td class="px-5 py-3.5 text-sm text-dark-600">{{ product.category || 'Uncategorised' }}</td>
                    <td class="px-5 py-3.5 text-right text-sm text-dark-800">R {{ product.price | number:'1.2-2' }}</td>
                    <td class="px-5 py-3.5 text-right">
                      <span class="rounded-full px-2.5 py-1 text-xs font-semibold"
                        [class]="product.stockQuantity <= 0
                          ? 'bg-red-50 text-red-700'
                          : product.stockQuantity <= 10
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'">
                        {{ product.stockQuantity }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class LiveDashboardComponent implements OnInit {
  private api = inject(ScannerApiService);
  private auth = inject(AuthService);

  orders = inject(RetailerOrdersService);

  isRetailer = this.auth.isRetailer;

  products = signal<ScannedProduct[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  portalLabel = computed(() => this.auth.roleLabel() || 'Business');

  recentOrders = computed(() => this.orders.orders().slice(0, 3));

  totalUnits = computed(() => this.products().reduce((sum, p) => sum + p.stockQuantity, 0));
  totalValue = computed(() =>
    this.products().reduce((sum, p) => sum + p.price * p.stockQuantity, 0),
  );
  lowStock = computed(() => this.products().filter((p) => p.stockQuantity <= 10));

  ngOnInit(): void {
    this.load();
    if (this.isRetailer()) {
      this.orders.load();
    }
  }

  statusLabel(status: string): string {
    return ORDER_STATUS_LABEL[status] ?? status;
  }

  statusStyle(status: string): string {
    return ORDER_STATUS_STYLES[status] ?? 'bg-dark-100 text-dark-700';
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getAllProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.products.set([]);
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }
}

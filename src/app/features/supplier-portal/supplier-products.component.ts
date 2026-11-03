import { Component, signal, inject, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { CardSkeletonComponent } from '../../shared/components/skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import type { Product } from '../../core/models';

@Component({
  selector: 'app-supplier-products',
  standalone: true,
  imports: [DecimalPipe, FormsModule, CardSkeletonComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">My Products</h1>
          <p class="text-dark-500 mt-1">Catalogue, pricing and stock levels</p>
        </div>
        <input [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Search products or SKU…"
          class="bg-white border border-dark-200 rounded-xl px-4 py-2.5 text-sm text-dark-700 w-full lg:w-72 focus:outline-none focus:ring-2 focus:ring-primary-400" />
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-gradient-to-br from-primary-50 to-primary-50 rounded-2xl p-5 card-shadow border border-dark-100/50">
          <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Total Products</p>
          <p class="text-3xl font-bold text-dark-900 mt-2">{{ products().length }}</p>
          <p class="text-xs text-dark-400 mt-1">Across {{ categoryCount() }} categories</p>
        </div>
        <div class="bg-gradient-to-br from-primary-50 to-primary-50 rounded-2xl p-5 card-shadow border border-dark-100/50">
          <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Stock Value</p>
          <p class="text-3xl font-bold text-dark-900 mt-2">R {{ stockValue() | number:'1.0-0' }}</p>
          <p class="text-xs text-dark-400 mt-1">Total on hand</p>
        </div>
        <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 card-shadow border border-dark-100/50">
          <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Low Stock</p>
          <p class="text-3xl font-bold text-dark-900 mt-2">{{ lowStock().length }}</p>
          <p class="text-xs text-dark-400 mt-1">Need reorder</p>
        </div>
        <div class="bg-gradient-to-br from-emerald-50 to-primary-50 rounded-2xl p-5 card-shadow border border-dark-100/50">
          <p class="text-xs font-semibold text-dark-500 uppercase tracking-wide">Healthy</p>
          <p class="text-3xl font-bold text-dark-900 mt-2">{{ products().length - lowStock().length }}</p>
          <p class="text-xs text-dark-400 mt-1">Above reorder level</p>
        </div>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"><app-card-skeleton [count]="6" /></div>
      } @else if (filtered().length === 0) {
        <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg">
          <app-empty-state icon="🔍" title="No products found" description="Try a different search term." />
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (p of filtered(); track p.id) {
            <div class="bg-white rounded-2xl border border-dark-100 p-5 card-shadow hover:shadow-xl hover:border-primary-200 transition-all">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="font-semibold text-dark-900 truncate">{{ p.name }}</h3>
                  <p class="text-xs text-dark-400 mt-0.5">{{ p.sku }} · per {{ p.unit }}</p>
                </div>
                <span class="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-primary-50 text-primary-700">
                  {{ p.category }}
                </span>
              </div>

              <div class="flex items-end justify-between mt-4">
                <div>
                  <p class="text-xs text-dark-400">Price</p>
                  <p class="text-xl font-bold text-dark-900">R {{ p.price | number:'1.2-2' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs text-dark-400">In stock</p>
                  <p class="text-xl font-bold" [class]="isLow(p) ? 'text-orange-600' : 'text-emerald-600'">
                    {{ p.stock }}
                  </p>
                </div>
              </div>

              <div class="mt-4">
                <div class="h-1.5 w-full bg-dark-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full"
                    [class]="isLow(p) ? 'bg-orange-500' : 'bg-emerald-500'"
                    [style.width.%]="stockPct(p)"></div>
                </div>
                <p class="text-xs mt-1.5" [class]="isLow(p) ? 'text-orange-600 font-medium' : 'text-dark-400'">
                  {{ isLow(p) ? 'Below reorder level (' + p.reorderLevel + ')' : 'Reorder level: ' + p.reorderLevel }}
                </p>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class SupplierProductsComponent implements OnInit {
  private productsService = inject(ProductsService);

  products = signal<Product[]>([]);
  loading = signal(true);
  search = signal('');

  lowStock = computed(() => this.products().filter(p => this.isLow(p)));
  categoryCount = computed(() => new Set(this.products().map(p => p.category)).size);
  stockValue = computed(() => this.products().reduce((sum, p) => sum + p.price * p.stock, 0));

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.products();
    return this.products().filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  });

  ngOnInit() {
    this.productsService.getProducts().subscribe({
      next: list => { this.products.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  isLow(p: Product): boolean {
    return p.stock < p.reorderLevel;
  }

  stockPct(p: Product): number {
    const target = p.reorderLevel * 4;
    return Math.min(100, Math.round((p.stock / target) * 100));
  }
}

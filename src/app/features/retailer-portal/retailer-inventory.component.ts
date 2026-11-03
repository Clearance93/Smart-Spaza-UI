import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { RetailerService } from '../../core/services/retailer.service';
import { ScannerSessionStore } from '../../core/services/scanner-session.store';
import type { StockItem } from '../../core/models/retailer.models';

@Component({
  selector: 'app-retailer-inventory',
  standalone: true,
  imports: [DecimalPipe, RouterLink, PageHeaderComponent, StatCardComponent, StatusBadgeComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header title="Inventory Management" subtitle="Live stock from the Smart Spaza database">
        <a routerLink="/scanner"
          class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
          ➕ Scan / add item
        </a>
        <button (click)="refresh()"
          class="flex items-center gap-2 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
          ↻ Refresh
        </button>
      </app-page-header>

      @if (toast()) {
        <div class="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          <span>✅</span><span>{{ toast() }}</span>
        </div>
      }

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <app-stat-card label="Total Products" [value]="inventory().length.toString()" hint="Active SKUs" icon="📦" tone="purple" />
        <app-stat-card label="Critical Stock" [value]="criticalCount().toString()" hint="Below reorder level" icon="🚨" tone="pink" />
        <app-stat-card label="Needs Reorder" [value]="lowStock().length.toString()" hint="Including critical" icon="⚠️" tone="orange" />
        <app-stat-card label="Stock Value" value="R {{ stockValue() | number:'1.0-0' }}" hint="At selling price" icon="💰" tone="emerald" />
      </div>

      <div class="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <div class="relative flex-1 max-w-md">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">🔍</span>
          <input [value]="search()" (input)="search.set($any($event.target).value)"
            placeholder="Search product or SKU..."
            class="w-full bg-white border border-dark-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-dark-800 placeholder:text-dark-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
        </div>
        <select [value]="category()" (change)="category.set($any($event.target).value)"
          class="bg-white border border-dark-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 focus:border-primary-400 outline-none">
          <option value="All">All Categories</option>
          @for (c of categories(); track c) { <option [value]="c">{{ c }}</option> }
        </select>
        <span class="text-xs text-dark-400 lg:ml-auto">{{ visibleItems().length }} of {{ inventory().length }} products</span>
      </div>

      <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg overflow-hidden">
        @if (visibleItems().length === 0) {
          <app-empty-state icon="🔍" title="No products found" description="Try a different search term or category." />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-dark-50">
                <tr>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Product</th>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Category</th>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase w-44">Stock Level</th>
                  <th class="text-center px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Status</th>
                  <th class="text-right px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Selling Price</th>
                  <th class="text-right px-5 py-3 text-xs font-semibold text-dark-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dark-100">
                @for (item of visibleItems(); track item.id) {
                  <tr class="hover:bg-dark-50/60 transition-colors">
                    <td class="px-5 py-3.5">
                      <p class="text-sm font-semibold text-dark-900">{{ item.name }}</p>
                      <p class="text-[11px] text-dark-400">{{ item.sku }}</p>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-dark-600">{{ item.category }}</td>
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-2">
                        <div class="h-1.5 flex-1 rounded-full bg-dark-100 overflow-hidden">
                          <div class="h-full rounded-full"
                            [class]="item.quantity <= item.minStock ? 'bg-red-400' : item.quantity <= item.minStock * 1.5 ? 'bg-amber-400' : 'bg-emerald-400'"
                            [style.width.%]="barWidth(item)"></div>
                        </div>
                        <span class="text-xs font-medium text-dark-600 w-14 text-right">{{ item.quantity }} / {{ item.maxStock }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-3.5 text-center"><app-status-badge [status]="status(item)" /></td>
                    <td class="px-5 py-3.5 text-right text-sm font-semibold text-dark-800">R {{ item.sellingPrice | number:'1.2-2' }}</td>
                    <td class="px-5 py-3.5 text-right">
                      @if (canManage(item)) {
                        <button (click)="restock(item.id)"
                          class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors">
                          Restock
                        </button>
                      } @else {
                        <span class="text-[11px] font-semibold text-dark-400">Supplier item</span>
                      }
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
export class RetailerInventoryComponent implements OnInit {
  private retailer = inject(RetailerService);
  private session = inject(ScannerSessionStore);

  inventory = this.retailer.inventory;
  lowStock = this.retailer.lowStock;
  stockValue = this.retailer.stockValue;
  search = signal('');
  category = signal('All');
  toast = signal<string | null>(null);

  ngOnInit(): void {
    this.retailer.loadInventory();
  }

  categories = computed(() => [...new Set(this.retailer.inventory().map((item) => item.category))]);
  criticalCount = computed(
    () => this.retailer.inventory().filter((item) => this.retailer.statusOf(item) === 'Critical').length,
  );

  visibleItems = computed(() => {
    const term = this.search().trim().toLowerCase();
    const cat = this.category();
    return this.retailer.inventory().filter((item) => {
      const matchesCategory = cat === 'All' || item.category === cat;
      const matchesSearch =
        !term || item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  });

  status(item: StockItem): string {
    return this.retailer.statusOf(item);
  }

  /** The API only lets the owning business change price/stock. */
  canManage(item: StockItem): boolean {
    const me = this.session.getRoleUserId();
    if (!me) return false;

    return this.session.getRoles().includes('Supplier')
      ? item.supplierId === me
      : item.shopOwnerId === me;
  }

  barWidth(item: StockItem): number {
    return Math.min(100, Math.round((item.quantity / item.maxStock) * 100));
  }

  refresh(): void {
    this.retailer.loadInventory();
    this.toast.set('Stock levels refreshed from the database.');
  }

  restock(id: string): void {
    const item = this.retailer.inventory().find((i) => i.id === id);
    this.toast.set(`Restocking ${item?.name ?? 'product'}…`);

    this.retailer.restock(id).subscribe({
      next: (updated) => {
        this.toast.set(`${updated.name} restocked — ${updated.quantity} units in stock.`);
      },
      error: (err: Error) => {
        this.toast.set(err.message);
      },
    });
  }
}

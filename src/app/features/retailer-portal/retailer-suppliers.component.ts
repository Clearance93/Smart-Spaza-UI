import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { RetailerService } from '../../core/services/retailer.service';

@Component({
  selector: 'app-retailer-suppliers',
  standalone: true,
  imports: [DecimalPipe, PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header title="Suppliers Marketplace" subtitle="Find the best prices from verified suppliers">
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

      <div class="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
        <div class="relative flex-1 max-w-md">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">🔍</span>
          <input [value]="search()" (input)="search.set($any($event.target).value)"
            placeholder="Search suppliers..."
            class="w-full bg-white border border-dark-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-dark-800 placeholder:text-dark-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
        </div>
        <div class="flex flex-wrap gap-2">
          @for (c of categories(); track c) {
            <button (click)="category.set(c)"
              class="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors"
              [class]="category() === c
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-white border-dark-200 text-dark-600 hover:border-primary-400 hover:text-primary-600'">
              {{ c }}
            </button>
          }
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        @for (supplier of visibleSuppliers(); track supplier.id) {
          <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5 flex flex-col">
            <div class="flex items-start gap-3">
              <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {{ supplier.name.charAt(0) }}
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-sm font-bold text-dark-900 leading-tight">{{ supplier.name }}</h3>
                <p class="text-xs text-dark-400 mt-0.5">{{ supplier.category }} · {{ supplier.city }}</p>
                <p class="text-xs text-amber-500 mt-1">★ {{ supplier.rating }} <span class="text-dark-400">supplier rating</span></p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 mt-4 text-center">
              <div class="rounded-lg bg-dark-50 py-2">
                <p class="text-sm font-bold text-dark-900">{{ supplier.onTime }}%</p>
                <p class="text-[10px] text-dark-400 uppercase tracking-wide">On time</p>
              </div>
              <div class="rounded-lg bg-dark-50 py-2">
                <p class="text-sm font-bold text-dark-900">R {{ supplier.minimumOrder | number:'1.0-0' }}</p>
                <p class="text-[10px] text-dark-400 uppercase tracking-wide">Min order</p>
              </div>
              <div class="rounded-lg bg-dark-50 py-2">
                <p class="text-sm font-bold text-dark-900">{{ supplier.leadTime }}</p>
                <p class="text-[10px] text-dark-400 uppercase tracking-wide">Lead time</p>
              </div>
            </div>

            <div class="mt-4 flex items-center gap-2">
              <button (click)="order(supplier.name)"
                class="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors">
                Place order
              </button>
              <a [href]="'tel:+27110000000'"
                class="px-3 py-2.5 rounded-lg border border-dark-200 text-dark-600 hover:bg-dark-50 text-xs font-semibold transition-colors">
                Contact
              </a>
            </div>
          </div>
        } @empty {
          <div class="md:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-dark-100">
            <app-empty-state icon="🤝" title="No suppliers found" description="Try a different search term or category." />
          </div>
        }
      </div>
    </div>
  `,
})
export class RetailerSuppliersComponent {
  private retailer = inject(RetailerService);

  search = signal('');
  category = signal('All');
  toast = signal<string | null>(null);

  categories = computed(() => ['All', ...new Set(this.retailer.suppliers().map((s) => s.category))]);

  visibleSuppliers = computed(() => {
    const term = this.search().trim().toLowerCase();
    const cat = this.category();
    return this.retailer.suppliers().filter((supplier) => {
      const matchesCategory = cat === 'All' || supplier.category === cat;
      const matchesSearch = !term || supplier.name.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  });

  refresh(): void {
    this.toast.set('Supplier catalogue refreshed.');
  }

  order(name: string): void {
    this.toast.set(`Order request sent to ${name}. They will confirm stock and delivery time.`);
  }
}

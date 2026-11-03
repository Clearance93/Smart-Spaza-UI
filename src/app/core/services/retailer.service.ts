import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ScannerApiService } from './scanner-api.service';
import type { StockItem, StockStatus } from '../models/retailer.models';

/**
 * Live inventory for the signed-in business. SmartSpazaAPI already filters products
 * by the caller's user id, so nothing here can see another business's stock.
 */
@Injectable({ providedIn: 'root' })
export class RetailerService {
  private inventoryApi = inject(ScannerApiService);

  private _inventory = signal<StockItem[]>([]);

  readonly inventory = this._inventory.asReadonly();

  readonly lowStock = computed(() => this._inventory().filter((i) => i.quantity <= i.minStock));

  readonly stockValue = computed(() =>
    this._inventory().reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0),
  );

  loadInventory(): void {
    this.inventoryApi.getAllProducts().subscribe({
      next: (products) =>
        this._inventory.set(
          products.map((product) => {
            const quantity = product.stockQuantity;

            return {
              id: product.productId,
              name: product.name,
              sku: product.stockKeepUnit || product.barcode || product.productId.slice(0, 8),
              category: product.category ?? 'Uncategorised',
              quantity,
              minStock: 10,
              maxStock: Math.max(quantity, 20),
              costPrice: product.price,
              sellingPrice: product.price,
              barcode: product.barcode ?? undefined,
              unit: product.unit ?? undefined,
              supplierId: product.supplierId,
              shopOwnerId: product.shopOwnerId,
            } satisfies StockItem;
          }),
        ),
      error: () => {
        /* keep whatever is on screen when the API is unreachable */
      },
    });
  }

  /** Top the item back up to its maximum and persist it to the API. */
  restock(itemId: string): Observable<StockItem> {
    const item = this._inventory().find((i) => i.id === itemId);

    if (!item) {
      throw new Error('Unknown product.');
    }

    const target = Math.max(item.maxStock, item.quantity + 10);

    return this.inventoryApi
      .updateProduct(item.id, {
        barcode: item.barcode ?? item.sku,
        name: item.name,
        category: item.category === 'Uncategorised' ? null : item.category,
        price: item.sellingPrice,
        stockQuantity: target,
        unit: item.unit ?? null,
        stockKeepUnit: item.sku,
      })
      .pipe(
        map((updated) => {
          this.loadInventory();

          return {
            ...item,
            quantity: updated.stockQuantity,
            maxStock: Math.max(updated.stockQuantity, item.maxStock),
          } satisfies StockItem;
        }),
      );
  }

  statusOf(item: StockItem): StockStatus {
    if (item.quantity <= item.minStock * 0.6) return 'Critical';
    if (item.quantity <= item.minStock) return 'Low';
    return 'Healthy';
  }
}

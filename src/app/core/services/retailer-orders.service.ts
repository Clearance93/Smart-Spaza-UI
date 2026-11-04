import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ShopOrder, ShopSupplier } from '../models/retailer-orders.models';

/**
 * Purchase orders and suppliers for the signed-in shop.
 *
 * SmartSpazaAPI resolves the shop from the JWT, so these calls cannot be pointed at
 * another business. Both lists come from the same aggregate endpoints the dashboard,
 * orders, tracking, suppliers, analytics and notifications screens share.
 */
@Injectable({ providedIn: 'root' })
export class RetailerOrdersService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private _orders = signal<ShopOrder[]>([]);
  private _suppliers = signal<ShopSupplier[]>([]);
  private _loading = signal(false);
  private _loaded = signal(false);
  private _error = signal<string | null>(null);
  private loadingSince = 0;

  readonly orders = this._orders.asReadonly();
  readonly suppliers = this._suppliers.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly error = this._error.asReadonly();

  readonly activeOrders = computed(() =>
    this._orders().filter((order) => order.status !== 'Delivered' && order.status !== 'Rejected'),
  );

  readonly deliveredOrders = computed(() =>
    this._orders().filter((order) => order.status === 'Delivered'),
  );

  readonly inTransitOrders = computed(() =>
    this._orders().filter((order) => ['Accepted', 'InTransit', 'OnTheWay'].includes(order.status)),
  );

  readonly pendingOrders = computed(() =>
    this._orders().filter((order) => order.status === 'Created'),
  );

  readonly ratedOrders = computed(() => this._orders().filter((order) => order.rating != null));

  readonly averageRating = computed(() => {
    const rated = this.ratedOrders();
    if (rated.length === 0) return null;
    return rated.reduce((sum, order) => sum + (order.rating ?? 0), 0) / rated.length;
  });

  readonly totalItemsOrdered = computed(() =>
    this._orders().reduce(
      (sum, order) => sum + order.items.reduce((lineSum, item) => lineSum + item.quantity, 0),
      0,
    ),
  );

  /** Loads both lists once; pass true to force a refresh. */
  load(force = false): void {
    // A request aborted by a navigation can leave the loading flag set forever.
    // Treat a stale flag as not loading so Refresh always recovers.
    const stale = this._loading() && Date.now() - this.loadingSince > 10000;
    if (this._loading() && !stale) return;
    if (this._loaded() && !force) return;

    this.loadingSince = Date.now();
    this._loading.set(true);
    this._error.set(null);

    forkJoin({
      orders: this.http.get<ShopOrder[]>(`${this.base}/Delivery/shopOrders`),
      suppliers: this.http.get<ShopSupplier[]>(`${this.base}/Delivery/shopSuppliers`),
    }).pipe(timeout(20000)).subscribe({
      next: ({ orders, suppliers }) => {
        this._orders.set(orders ?? []);
        this._suppliers.set(suppliers ?? []);
        this._loaded.set(true);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this._error.set('Could not load your orders right now. Please try again.');
      },
    });
  }

  /** Records or updates this shop's rating for a delivered order. */
  rate(order: ShopOrder, rating: number, comments?: string): Observable<unknown> {
    return this.http
      .post(`${this.base}/Delivery/upsert`, {
        deliveryId: order.deliveryId,
        driverId: order.driverId,
        ratings: rating,
        comments: comments ?? null,
      })
      .pipe(
        tap(() => {
          this._orders.update((orders) =>
            orders.map((entry) =>
              entry.deliveryId === order.deliveryId ? { ...entry, rating } : entry,
            ),
          );
        }),
      );
  }

  refresh(): void {
    this.load(true);
  }
}

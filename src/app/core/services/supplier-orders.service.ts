import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  SupplierDriver,
  SupplierOrder,
  SupplierRetailer,
} from '../models/supplier.models';

/**
 * Deliveries dispatched by the signed-in supplier.
 *
 * SmartSpazaAPI resolves the supplier from the JWT, so these calls cannot be
 * pointed at another business. Retailers, drivers and analytics are derived from
 * the same real order list.
 */
@Injectable({ providedIn: 'root' })
export class SupplierOrdersService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private _orders = signal<SupplierOrder[]>([]);
  private _loading = signal(false);
  private _loaded = signal(false);
  private _error = signal<string | null>(null);
  private loadingSince = 0;

  readonly orders = this._orders.asReadonly();
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

  readonly totalItems = computed(() =>
    this._orders().reduce(
      (sum, order) => sum + order.items.reduce((line, item) => line + item.quantity, 0),
      0,
    ),
  );

  readonly retailers = computed<SupplierRetailer[]>(() => {
    const map = new Map<string, SupplierRetailer>();

    for (const order of this._orders()) {
      const existing = map.get(order.shopId);

      if (!existing) {
        map.set(order.shopId, {
          shopId: order.shopId,
          name: order.shopName || 'Retailer',
          owner: order.shopOwnerName,
          phone: order.shopPhone,
          email: order.shopEmail,
          orders: 1,
          delivered: order.status === 'Delivered' ? 1 : 0,
          active:
            order.status !== 'Delivered' && order.status !== 'Rejected' ? 1 : 0,
          lastOrder: order.creationTime,
        });
        continue;
      }

      existing.orders += 1;
      if (order.status === 'Delivered') existing.delivered += 1;
      if (order.status !== 'Delivered' && order.status !== 'Rejected') existing.active += 1;
      if (order.creationTime && (!existing.lastOrder || order.creationTime > existing.lastOrder)) {
        existing.lastOrder = order.creationTime;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.orders - a.orders);
  });

  readonly drivers = computed<SupplierDriver[]>(() => {
    const map = new Map<string, { driver: SupplierDriver; ratingTotal: number; ratingCount: number }>();

    for (const order of this._orders()) {
      const existing = map.get(order.driverId);

      if (!existing) {
        map.set(order.driverId, {
          driver: {
            driverId: order.driverId,
            name: order.driverName || 'Driver',
            phone: order.driverPhone,
            orders: 1,
            delivered: order.status === 'Delivered' ? 1 : 0,
            active:
              order.status !== 'Delivered' && order.status !== 'Rejected' ? 1 : 0,
            averageRating: null,
          },
          ratingTotal: order.rating ?? 0,
          ratingCount: order.rating != null ? 1 : 0,
        });
        continue;
      }

      existing.driver.orders += 1;
      if (order.status === 'Delivered') existing.driver.delivered += 1;
      if (order.status !== 'Delivered' && order.status !== 'Rejected') existing.driver.active += 1;
      if (order.rating != null) {
        existing.ratingTotal += order.rating;
        existing.ratingCount += 1;
      }
    }

    return Array.from(map.values())
      .map(({ driver, ratingTotal, ratingCount }) => ({
        ...driver,
        averageRating: ratingCount > 0 ? ratingTotal / ratingCount : null,
      }))
      .sort((a, b) => b.orders - a.orders);
  });

  load(force = false): void {
    // A request aborted by a navigation can leave the loading flag set forever.
    // Treat a stale flag as not loading so Refresh always recovers.
    const stale = this._loading() && Date.now() - this.loadingSince > 10000;
    if (this._loading() && !stale) return;
    if (this._loaded() && !force) return;

    this.loadingSince = Date.now();
    this._loading.set(true);
    this._error.set(null);

    this.http.get<SupplierOrder[]>(`${this.base}/Delivery/supplierOrders`).pipe(timeout(20000)).subscribe({
      next: (orders) => {
        this._orders.set(orders ?? []);
        this._loaded.set(true);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this._error.set('Could not load your deliveries right now. Please try again.');
      },
    });
  }

  refresh(): void {
    this.load(true);
  }

  /** Marks a pending order as accepted by the supplier. */
  accept(order: SupplierOrder): Observable<unknown> {
    return this.updateStatus(order, 'Accepted');
  }

  updateStatus(order: SupplierOrder, status: string): Observable<unknown> {
    return this.http
      .put(`${this.base}/Delivery/updateDelivery?id=${order.deliveryId}`, {
        deliveryId: order.deliveryId,
        driverId: order.driverId,
        shopId: order.shopId,
        deliveryStatus: statusValue(status),
        priority: order.priority,
        scheduledTime: order.scheduledTime ?? '00:00',
        estimatedArrival: order.estimatedArrival ?? '00:00',
        actualArrival: order.actualArrival ?? '00:00',
        notes: order.notes,
      })
      .pipe(
        tap(() => {
          this._orders.update((orders) =>
            orders.map((entry) =>
              entry.deliveryId === order.deliveryId ? { ...entry, status } : entry,
            ),
          );
        }),
      );
  }
}

/** DeliveryStatus enum values accepted by the API. */
function statusValue(status: string): number {
  switch (status) {
    case 'Accepted':
      return 1;
    case 'InTransit':
      return 2;
    case 'OnTheWay':
      return 3;
    case 'Delivered':
      return 4;
    case 'Rejected':
      return 5;
    default:
      return 6;
  }
}

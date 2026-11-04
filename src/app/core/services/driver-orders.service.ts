import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, switchMap, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { SupplierOrder } from '../models/supplier.models';
import { readStoredSession } from './auth.storage';

/**
 * Deliveries assigned to the signed-in driver.
 *
 * The API resolves the driver from the JWT (`DriverOnly`), so this list can only
 * ever contain the caller's own routes. Status changes write both a tracking point
 * and the delivery status, so shops and suppliers see the update immediately.
 */
@Injectable({ providedIn: 'root' })
export class DriverOrdersService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private _orders = signal<SupplierOrder[]>([]);
  private _loading = signal(false);
  private _loaded = signal(false);
  private _error = signal<string | null>(null);
  private loadingSince = 0;
  private ownerId: string | null = null;
  private _actingId = signal<string | null>(null);

  readonly orders = this._orders.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly error = this._error.asReadonly();
  readonly actingId = this._actingId.asReadonly();

  readonly activeOrders = computed(() =>
    this._orders().filter((order) => order.status !== 'Delivered' && order.status !== 'Rejected'),
  );

  readonly deliveredOrders = computed(() =>
    this._orders().filter((order) => order.status === 'Delivered'),
  );

  readonly onTheWayOrders = computed(() =>
    this._orders().filter((order) => ['InTransit', 'OnTheWay'].includes(order.status)),
  );

  readonly completedToday = computed(() => {
    const today = new Date().toDateString();
    return this.deliveredOrders().filter(
      (order) => order.creationTime && new Date(order.creationTime).toDateString() === today,
    );
  });

  readonly ratedOrders = computed(() => this._orders().filter((order) => order.rating != null));

  readonly averageRating = computed(() => {
    const rated = this.ratedOrders();
    if (rated.length === 0) return null;
    return rated.reduce((sum, order) => sum + (order.rating ?? 0), 0) / rated.length;
  });

  readonly itemsDelivered = computed(() =>
    this.deliveredOrders().reduce(
      (sum, order) => sum + order.items.reduce((line, item) => line + item.quantity, 0),
      0,
    ),
  );

  load(force = false): void {
    // A different account must never inherit the previous user's cached rows.
    const owner = readStoredSession()?.roleUserId ?? null;
    if (owner !== this.ownerId) {
      this.ownerId = owner;
      this._orders.set([]);
        this._loaded.set(false);
        this._error.set(null);
      this._loading.set(false);
    }

    // A request aborted by a navigation can leave the loading flag set forever.
    // Treat a stale flag as not loading so Refresh always recovers.
    const stale = this._loading() && Date.now() - this.loadingSince > 10000;
    if (this._loading() && !stale) return;
    if (this._loaded() && !force) return;

    this.loadingSince = Date.now();
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<SupplierOrder[]>(`${this.base}/Delivery/driverOrders`)
      .pipe(timeout(20000))
      .subscribe({
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

  /** Created → Accepted (driver picks the job up). */
  accept(order: SupplierOrder): Observable<unknown> {
    return this.updateStatus(order, 'Accepted');
  }

  startRoute(order: SupplierOrder): Observable<unknown> {
    return this.updateStatus(order, 'InTransit');
  }

  onTheWay(order: SupplierOrder): Observable<unknown> {
    return this.updateStatus(order, 'OnTheWay');
  }

  markDelivered(order: SupplierOrder): Observable<unknown> {
    return this.updateStatus(order, 'Delivered');
  }

  /**
   * Writes a fresh tracking point, then the delivery status. Both calls are
   * scoped to this driver by the API.
   */
  private updateStatus(order: SupplierOrder, status: string): Observable<unknown> {
    this._actingId.set(order.deliveryId);

    const trackingBody = {
      driverId: order.driverId,
      deliveryId: order.deliveryId,
      deliveryStatus: statusValue(status),
      latitude: order.tracking?.latitude ?? null,
      longitude: order.tracking?.longitude ?? null,
      distanceRemaining: status === 'Delivered' ? 0 : order.tracking?.distanceRemaining ?? null,
      estimatedTime: order.tracking?.estimatedTime || order.estimatedArrival || '00:00',
    };

    const deliveryBody = {
      deliveryId: order.deliveryId,
      driverId: order.driverId,
      shopId: order.shopId,
      deliveryStatus: statusValue(status),
      priority: order.priority,
      scheduledTime: order.scheduledTime || '00:00',
      estimatedArrival: order.estimatedArrival || '00:00',
      actualArrival: status === 'Delivered' ? nowTime() : order.actualArrival || '00:00',
      notes: order.notes,
    };

    return this.http.post(`${this.base}/Delivery/add-delivery`, trackingBody).pipe(
      switchMap(() =>
        this.http.put(`${this.base}/Delivery/updateDelivery?id=${order.deliveryId}`, deliveryBody),
      ),
      tap(() => {
        this._orders.update((orders) =>
          orders.map((entry) =>
            entry.deliveryId === order.deliveryId
              ? {
                  ...entry,
                  status,
                  actualArrival: status === 'Delivered' ? nowTime() : entry.actualArrival,
                  tracking: {
                    status,
                    latitude: entry.tracking?.latitude ?? null,
                    longitude: entry.tracking?.longitude ?? null,
                    distanceRemaining: status === 'Delivered' ? 0 : entry.tracking?.distanceRemaining ?? null,
                    estimatedTime: entry.tracking?.estimatedTime ?? entry.estimatedArrival,
                    updated: new Date().toISOString(),
                  },
                }
              : entry,
          ),
        );
        this._actingId.set(null);
      }),
      finalize(() => this._actingId.set(null)),
    );
  }
}

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

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

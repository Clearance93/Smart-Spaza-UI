import { Component, OnInit, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RetailerService } from '../../core/services/retailer.service';
import { SupplierOrdersService } from '../../core/services/supplier-orders.service';

interface SupplierAlert {
  id: string;
  tone: 'amber' | 'sky' | 'red' | 'emerald';
  icon: string;
  title: string;
  detail: string;
  route: string;
  action: string;
}

const READ_KEY = 'smart-spaza-supplier-read-alerts';

@Component({
  selector: 'app-supplier-notifications',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-4xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Notifications</h1>
          <p class="text-dark-500 mt-1">
            {{ alerts().length }} alert(s) generated from your deliveries and stock
          </p>
        </div>
        @if (unreadCount() > 0) {
          <button (click)="markAllRead()"
            class="self-start rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50">
            Mark all as read
          </button>
        }
      </div>

      @if (alerts().length === 0) {
        <div class="rounded-2xl border border-dark-100 bg-white px-5 py-14 text-center card-shadow">
          <p class="text-3xl">✅</p>
          <h2 class="mt-3 font-semibold text-dark-900">All clear</h2>
          <p class="mx-auto mt-1 max-w-md text-sm text-dark-500">
            Accepted orders, deliveries on the road and stock levels look healthy.
          </p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (alert of alerts(); track alert.id) {
            <article class="rounded-2xl border border-dark-100 bg-white p-4 card-shadow"
              [class]="isRead(alert.id) ? 'opacity-70' : ''">
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                  [class]="toneClass(alert.tone)">
                  {{ alert.icon }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-sm font-semibold text-dark-900">{{ alert.title }}</h2>
                    @if (!isRead(alert.id)) {
                      <span class="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-700">
                        New
                      </span>
                    }
                  </div>
                  <p class="mt-0.5 text-xs text-dark-500">{{ alert.detail }}</p>
                </div>
                <a [routerLink]="alert.route"
                  class="flex-shrink-0 rounded-lg border border-dark-200 bg-white px-3 py-1.5 text-xs font-semibold text-dark-700 hover:bg-dark-50">
                  {{ alert.action }}
                </a>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class SupplierNotificationsComponent implements OnInit {
  private orders = inject(SupplierOrdersService);
  private inventory = inject(RetailerService);

  private readIds = signal<Set<string>>(this.readFromStorage());

  readonly alerts = computed<SupplierAlert[]>(() => {
    const alerts: SupplierAlert[] = [];

    for (const order of this.orders.pendingOrders()) {
      alerts.push({
        id: `pending-${order.deliveryId}`,
        tone: 'amber',
        icon: '📥',
        title: `New order #${order.deliveryNumber} needs accepting`,
        detail: `${order.shopName || 'Retailer'} · ${order.items.length} line(s) · scheduled ${order.scheduledTime || 'today'}`,
        route: '/supplier/orders',
        action: 'Accept',
      });
    }

    for (const order of this.orders.inTransitOrders()) {
      alerts.push({
        id: `transit-${order.deliveryId}`,
        tone: 'sky',
        icon: '🚚',
        title: `#${order.deliveryNumber} is on the road`,
        detail: `${order.driverName || 'Driver'} → ${order.shopName || 'Retailer'} · ETA ${order.tracking?.estimatedTime || order.estimatedArrival || '—'}`,
        route: '/supplier/fleet',
        action: 'Track',
      });
    }

    for (const item of this.inventory.lowStock()) {
      alerts.push({
        id: `stock-${item.id}`,
        tone: item.quantity <= 0 ? 'red' : 'emerald',
        icon: item.quantity <= 0 ? '⛔' : '⚠️',
        title: item.quantity <= 0 ? `${item.name} is out of stock` : `${item.name} is running low`,
        detail:
          item.quantity <= 0
            ? 'You cannot dispatch this product until it is restocked.'
            : `Only ${item.quantity} ${item.unit || 'unit(s)'} left in your warehouse.`,
        route: '/inventory',
        action: 'Restock',
      });
    }

    return alerts;
  });

  readonly unreadCount = computed(
    () => this.alerts().filter((alert) => !this.readIds().has(alert.id)).length,
  );

  ngOnInit(): void {
    this.orders.load();
    this.inventory.loadInventory();
  }

  isRead(id: string): boolean {
    return this.readIds().has(id);
  }

  markAllRead(): void {
    const next = new Set(this.readIds());
    for (const alert of this.alerts()) next.add(alert.id);
    this.readIds.set(next);
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // Storage unavailable.
    }
  }

  toneClass(tone: SupplierAlert['tone']): string {
    switch (tone) {
      case 'red':
        return 'bg-red-50 text-red-600';
      case 'amber':
        return 'bg-amber-50 text-amber-600';
      case 'sky':
        return 'bg-sky-50 text-sky-600';
      default:
        return 'bg-emerald-50 text-emerald-600';
    }
  }

  private readFromStorage(): Set<string> {
    try {
      const raw = localStorage.getItem(READ_KEY);
      return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set<string>();
    }
  }
}

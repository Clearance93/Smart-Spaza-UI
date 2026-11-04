import { Component, OnInit, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RetailerService } from '../../core/services/retailer.service';
import { RetailerOrdersService } from '../../core/services/retailer-orders.service';

interface PortalAlert {
  id: string;
  tone: 'red' | 'amber' | 'sky' | 'emerald';
  icon: string;
  title: string;
  detail: string;
  route: string;
  action: string;
}

const READ_KEY = 'smart-spaza-read-alerts';

@Component({
  selector: 'app-retailer-notifications',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-4xl mx-auto animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Notifications</h1>
          <p class="text-dark-500 mt-1">
            {{ alerts().length }} alert(s) generated from your stock and live deliveries
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
          <h2 class="mt-3 font-semibold text-dark-900">Nothing needs your attention</h2>
          <p class="mx-auto mt-1 max-w-md text-sm text-dark-500">
            Stock levels and deliveries look healthy. New alerts appear here automatically.
          </p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (alert of alerts(); track alert.id) {
            <article class="rounded-2xl border bg-white p-4 card-shadow transition-colors"
              [class]="isRead(alert.id) ? 'border-dark-100 opacity-70' : 'border-' + alert.tone + '-200'">
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
export class RetailerNotificationsComponent implements OnInit {
  private inventory = inject(RetailerService);
  private orders = inject(RetailerOrdersService);

  private readIds = signal<Set<string>>(this.readFromStorage());

  readonly alerts = computed<PortalAlert[]>(() => {
    const alerts: PortalAlert[] = [];

    for (const item of this.inventory.inventory()) {
      if (item.quantity <= 0) {
        alerts.push({
          id: `out-${item.id}`,
          tone: 'red',
          icon: '⛔',
          title: `${item.name} is out of stock`,
          detail: 'Sell-through has reached zero. Restock before the next customer asks.',
          route: '/inventory',
          action: 'Restock',
        });
      } else if (item.quantity <= 10) {
        alerts.push({
          id: `low-${item.id}`,
          tone: 'amber',
          icon: '⚠️',
          title: `${item.name} is running low`,
          detail: `Only ${item.quantity} ${item.unit || 'unit(s)'} left in the shop.`,
          route: '/inventory',
          action: 'Restock',
        });
      }
    }

    for (const order of this.orders.inTransitOrders()) {
      alerts.push({
        id: `transit-${order.deliveryId}`,
        tone: 'sky',
        icon: '🚚',
        title: `Order #${order.deliveryNumber} is on the way`,
        detail: `${order.driverName || 'Driver'} · ETA ${order.tracking?.estimatedTime || order.estimatedArrival || 'soon'}`,
        route: '/tracking',
        action: 'Track',
      });
    }

    for (const order of this.orders.deliveredOrders()) {
      if (order.rating === null) {
        alerts.push({
          id: `rate-${order.deliveryId}`,
          tone: 'emerald',
          icon: '⭐',
          title: `Rate delivery #${order.deliveryNumber}`,
          detail: 'Tell us how the delivery went so we can keep quality high.',
          route: '/orders',
          action: 'Rate',
        });
      }
    }

    return alerts;
  });

  readonly unreadCount = computed(
    () => this.alerts().filter((alert) => !this.readIds().has(alert.id)).length,
  );

  ngOnInit(): void {
    this.inventory.loadInventory();
    this.orders.load();
  }

  isRead(id: string): boolean {
    return this.readIds().has(id);
  }

  markAllRead(): void {
    const next = new Set(this.readIds());
    for (const alert of this.alerts()) {
      next.add(alert.id);
    }
    this.readIds.set(next);
    this.persist(next);
  }

  toneClass(tone: PortalAlert['tone']): string {
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

  private persist(ids: Set<string>): void {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids)));
    } catch {
      // Storage unavailable: read state stays in memory.
    }
  }
}

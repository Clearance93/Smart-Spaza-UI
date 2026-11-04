import { Component, OnInit, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DriverOrdersService } from '../../core/services/driver-orders.service';

interface DriverAlert {
  id: string;
  tone: 'amber' | 'sky' | 'emerald';
  icon: string;
  title: string;
  detail: string;
  route: string;
  action: string;
}

const READ_KEY = 'smart-spaza-driver-read-alerts';

@Component({
  selector: 'app-driver-notifications',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-4xl mx-auto animate-fade-in">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Notifications</h1>
          <p class="text-dark-500 mt-1">{{ alerts().length }} alert(s) from your routes</p>
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
            No new assignments or routes waiting on you.
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
export class DriverNotificationsComponent implements OnInit {
  private orders = inject(DriverOrdersService);
  private readIds = signal<Set<string>>(this.readFromStorage());

  readonly alerts = computed<DriverAlert[]>(() => {
    const alerts: DriverAlert[] = [];

    for (const order of this.orders.orders()) {
      if (order.status === 'Created' || order.status === 'Accepted') {
        alerts.push({
          id: `assign-${order.deliveryId}`,
          tone: 'amber',
          icon: '📥',
          title: `#${order.deliveryNumber} is waiting for you`,
          detail: `${order.shopName || 'Retailer'} · ${order.items.length} line(s) · scheduled ${order.scheduledTime || 'today'}`,
          route: '/driver/deliveries',
          action: 'Open',
        });
      }

      if (order.status === 'InTransit' || order.status === 'OnTheWay') {
        alerts.push({
          id: `route-${order.deliveryId}`,
          tone: 'sky',
          icon: '🧭',
          title: `#${order.deliveryNumber} is on your route`,
          detail: `${order.shopName || 'Retailer'} · ETA ${order.tracking?.estimatedTime || order.estimatedArrival || '—'}`,
          route: '/driver/navigation',
          action: 'Navigate',
        });
      }

      if (order.rating !== null) {
        alerts.push({
          id: `rate-${order.deliveryId}`,
          tone: 'emerald',
          icon: '⭐',
          title: `${order.shopName || 'Retailer'} rated you ${order.rating}/5`,
          detail: order.ratingComment || 'Thanks for the delivery.',
          route: '/driver/performance',
          action: 'View',
        });
      }
    }

    return alerts;
  });

  readonly unreadCount = computed(
    () => this.alerts().filter((alert) => !this.readIds().has(alert.id)).length,
  );

  ngOnInit(): void {
    this.orders.load();
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

  toneClass(tone: DriverAlert['tone']): string {
    switch (tone) {
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

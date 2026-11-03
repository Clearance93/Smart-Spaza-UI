import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { DriverService } from '../../core/services/driver.service';
import type { DriverDeliveryStatus } from '../../core/models/driver.models';

type DeliveryFilter = 'All' | DriverDeliveryStatus;

@Component({
  selector: 'app-driver-deliveries',
  standalone: true,
  imports: [PageHeaderComponent, StatCardComponent, StatusBadgeComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header title="Assigned Deliveries" subtitle="Accept, start and complete your delivery runs">
        <span class="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border"
          [class]="online() ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-dark-100 border-dark-200 text-dark-500'">
          <span class="w-2 h-2 rounded-full" [class]="online() ? 'bg-emerald-500' : 'bg-dark-400'"></span>
          {{ online() ? 'Online' : 'Offline' }}
        </span>
      </app-page-header>

      @if (toast()) {
        <div class="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          <span>✅</span><span>{{ toast() }}</span>
        </div>
      }

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <app-stat-card label="Total" [value]="deliveries().length.toString()" hint="On your list" icon="📋" tone="purple" />
        <app-stat-card label="Assigned" [value]="count('Assigned').toString()" hint="Awaiting acceptance" icon="🕓" tone="orange" />
        <app-stat-card label="Active" [value]="(count('Accepted') + count('In Transit')).toString()" hint="In progress" icon="🚚" tone="blue" />
        <app-stat-card label="Delivered" [value]="count('Delivered').toString()" hint="Completed today" icon="✅" tone="emerald" />
      </div>

      <div class="flex flex-wrap gap-2 mb-5">
        @for (filter of filters; track filter) {
          <button (click)="activeFilter.set(filter)"
            class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            [class]="activeFilter() === filter
              ? 'bg-primary-600 border-primary-600 text-white'
              : 'bg-white border-dark-200 text-dark-600 hover:border-primary-400 hover:text-primary-600'">
            {{ filter }} <span class="opacity-70">{{ count(filter) }}</span>
          </button>
        }
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        @for (delivery of visibleDeliveries(); track delivery.id) {
          <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-lg flex-shrink-0">📦</div>
                <div class="min-w-0">
                  <p class="text-sm font-bold text-dark-900 truncate">{{ delivery.shop }}</p>
                  <p class="text-xs text-dark-400">{{ delivery.township }} · {{ delivery.orderNumber }}</p>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1">
                <app-status-badge [status]="delivery.status" />
                @if (delivery.urgent) {
                  <span class="text-[10px] font-bold uppercase tracking-wide text-red-500">Urgent</span>
                }
              </div>
            </div>

            <p class="mt-3 text-xs text-dark-500">📍 {{ delivery.address }}</p>

            <div class="mt-3 grid grid-cols-3 gap-2 text-center">
              <div class="rounded-lg bg-dark-50 py-2">
                <p class="text-sm font-bold text-dark-900">{{ delivery.distanceKm }} km</p>
                <p class="text-[10px] text-dark-400 uppercase tracking-wide">Distance</p>
              </div>
              <div class="rounded-lg bg-dark-50 py-2">
                <p class="text-sm font-bold text-dark-900">{{ delivery.items }}</p>
                <p class="text-[10px] text-dark-400 uppercase tracking-wide">Items</p>
              </div>
              <div class="rounded-lg bg-dark-50 py-2">
                <p class="text-sm font-bold text-emerald-600">R {{ delivery.payout }}</p>
                <p class="text-[10px] text-dark-400 uppercase tracking-wide">Payout</p>
              </div>
            </div>

            <div class="mt-4 flex items-center gap-2">
              @if (delivery.status !== 'Delivered') {
                <button (click)="advance(delivery.id)"
                  class="flex-1 text-xs font-bold px-3 py-2.5 rounded-lg transition-colors"
                  [class]="delivery.status === 'In Transit'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'">
                  {{ actionLabel(delivery.status) }}
                </button>
                <a [href]="'tel:' + deliveryPhone"
                  class="px-3 py-2.5 rounded-lg border border-dark-200 text-dark-600 hover:bg-dark-50 text-xs font-semibold transition-colors">
                  📞 Call
                </a>
              } @else {
                <span class="flex-1 text-center text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg py-2.5">
                  ✓ Delivered {{ delivery.deliveredAt ?? '' }}
                </span>
              }
            </div>
          </div>
        } @empty {
          <div class="lg:col-span-2 bg-white rounded-2xl border border-dark-100">
            <app-empty-state icon="🎉" title="Nothing here" description="No deliveries match this filter. You are all caught up." />
          </div>
        }
      </div>
    </div>
  `,
})
export class DriverDeliveriesComponent {
  private driver = inject(DriverService);

  online = this.driver.online;
  deliveries = this.driver.deliveries;
  toast = signal<string | null>(null);
  activeFilter = signal<DeliveryFilter>('All');
  filters: DeliveryFilter[] = ['All', 'Assigned', 'Accepted', 'In Transit', 'Delivered'];
  deliveryPhone = '+27 76 123 4567';

  visibleDeliveries = computed(() => {
    const filter = this.activeFilter();
    return filter === 'All'
      ? this.driver.deliveries()
      : this.driver.deliveries().filter((d) => d.status === filter);
  });

  count(filter: DeliveryFilter): number {
    return filter === 'All'
      ? this.driver.deliveries().length
      : this.driver.deliveries().filter((d) => d.status === filter).length;
  }

  actionLabel(status: DriverDeliveryStatus): string {
    switch (status) {
      case 'Assigned':
        return 'Accept delivery';
      case 'Accepted':
        return 'Start delivery';
      case 'In Transit':
        return 'Mark as delivered';
      default:
        return 'Delivered';
    }
  }

  advance(id: string): void {
    const delivery = this.driver.deliveries().find((d) => d.id === id);
    this.driver.advanceDelivery(id);
    if (!delivery) return;
    const message: Record<DriverDeliveryStatus, string> = {
      Assigned: 'Delivery accepted.',
      Accepted: `${delivery.shop} delivery started.`,
      'In Transit': `${delivery.shop} marked delivered. R${delivery.payout} added to your earnings.`,
      Delivered: 'Already delivered.',
    };
    this.toast.set(message[delivery.status]);
  }
}

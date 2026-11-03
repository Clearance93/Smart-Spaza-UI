import { Component, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="statusClass()">
      <span class="w-1.5 h-1.5 rounded-full" [class]="dotClass()"></span>
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  status = input.required<string>();

  label = () => this.status().replaceAll('_', ' ');

  private key = () => this.status().toUpperCase();

  statusClass = () => {
    const map: Record<string, string> = {
      PENDING_CONFIRMATION: 'bg-orange-100 text-orange-800',
      PENDING: 'bg-orange-100 text-orange-800',
      PREPARING: 'bg-amber-100 text-amber-800',
      CONFIRMED: 'bg-primary-100 text-primary-800',
      ASSIGNED: 'bg-dark-100 text-dark-700',
      ACCEPTED: 'bg-primary-100 text-primary-800',
      DISPATCHED: 'bg-primary-100 text-primary-800',
      IN_TRANSIT: 'bg-primary-100 text-primary-800',
      DELIVERED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-green-100 text-green-800',
      ACTIVE: 'bg-green-100 text-green-800',
      PAID: 'bg-green-100 text-green-800',
      PROCESSING: 'bg-primary-100 text-primary-800',
      LOW: 'bg-amber-100 text-amber-800',
      REJECTED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-red-100 text-red-800',
      CRITICAL: 'bg-red-100 text-red-800',
      HEALTHY: 'bg-green-100 text-green-800',
    };
    return map[this.key()] ?? 'bg-gray-100 text-gray-800';
  };

  dotClass = () => {
    const map: Record<string, string> = {
      DELIVERED: 'bg-green-500',
      COMPLETED: 'bg-green-500',
      ACTIVE: 'bg-green-500',
      PAID: 'bg-green-500',
      HEALTHY: 'bg-green-500',
      IN_TRANSIT: 'bg-primary-500',
      DISPATCHED: 'bg-primary-500',
      CONFIRMED: 'bg-primary-500',
      PROCESSING: 'bg-primary-500',
      ACCEPTED: 'bg-primary-500',
      PREPARING: 'bg-amber-500',
      LOW: 'bg-amber-500',
      PENDING_CONFIRMATION: 'bg-orange-500',
      PENDING: 'bg-orange-500',
      ASSIGNED: 'bg-dark-400',
      CRITICAL: 'bg-red-500',
      REJECTED: 'bg-red-500',
      SUSPENDED: 'bg-red-500',
      CANCELLED: 'bg-red-500',
    };
    return map[this.key()] ?? 'bg-dark-400';
  };
}

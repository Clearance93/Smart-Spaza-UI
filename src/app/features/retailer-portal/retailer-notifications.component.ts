import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { RetailerService } from '../../core/services/retailer.service';

@Component({
  selector: 'app-retailer-notifications',
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-4xl mx-auto animate-fade-in">
      <app-page-header title="Notifications" subtitle="Alerts and updates for your shop">
        <button (click)="markAllRead()"
          class="bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
          Mark all read
        </button>
      </app-page-header>

      @if (toast()) {
        <div class="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          <span>✅</span><span>{{ toast() }}</span>
        </div>
      }

      <div class="flex flex-wrap gap-2 mb-5">
        <button (click)="tab.set('all')"
          class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors"
          [class]="tab() === 'all' ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-dark-200 text-dark-600 hover:border-primary-400'">
          All <span class="opacity-70">{{ notifications().length }}</span>
        </button>
        <button (click)="tab.set('unread')"
          class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors"
          [class]="tab() === 'unread' ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-dark-200 text-dark-600 hover:border-primary-400'">
          Unread <span class="opacity-70">{{ unreadCount() }}</span>
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg overflow-hidden">
        @if (visible().length === 0) {
          <app-empty-state icon="🔔" title="Nothing unread" description="You are all caught up on notifications." />
        } @else {
          <div class="divide-y divide-dark-100">
            @for (notification of visible(); track notification.id) {
              <button (click)="open(notification.id)"
                class="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-dark-50/60 transition-colors">
                <span class="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0" [class]="toneClass(notification.tone)">
                  {{ notification.icon }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-dark-900">{{ notification.title }}</span>
                    @if (!notification.read) {
                      <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                    }
                  </span>
                  <span class="block text-xs text-dark-500 mt-0.5">{{ notification.message }}</span>
                  <span class="block text-[11px] text-dark-400 mt-1">{{ notification.time }}</span>
                </span>
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class RetailerNotificationsComponent {
  private retailer = inject(RetailerService);

  notifications = this.retailer.notifications;
  unreadCount = this.retailer.unreadCount;
  tab = signal<'all' | 'unread'>('all');
  toast = signal<string | null>(null);

  visible = computed(() =>
    this.tab() === 'all' ? this.retailer.notifications() : this.retailer.notifications().filter((n) => !n.read),
  );

  toneClass(tone: string): string {
    const map: Record<string, string> = {
      info: 'bg-primary-50 text-primary-600',
      success: 'bg-emerald-50 text-emerald-600',
      warning: 'bg-amber-50 text-amber-600',
      danger: 'bg-red-50 text-red-600',
    };
    return map[tone] ?? 'bg-dark-50 text-dark-500';
  }

  open(id: string): void {
    this.retailer.markRead(id);
  }

  markAllRead(): void {
    this.retailer.markAllRead();
    this.toast.set('All notifications marked as read.');
  }
}

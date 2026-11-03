import { environment } from '../../../environments/environment';
import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { DriverService } from '../../core/services/driver.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, PageHeaderComponent, StatCardComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-7xl mx-auto animate-fade-in">
      <app-page-header title="Driver Dashboard" [subtitle]="'Good morning, ' + firstName() + ' · ' + profile().tier">
        <span class="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border"
          [class]="online() ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-dark-100 border-dark-200 text-dark-500'">
          <span class="w-2 h-2 rounded-full" [class]="online() ? 'bg-emerald-500 pulse-live' : 'bg-dark-400'"></span>
          {{ online() ? 'Online' : 'Offline' }}
        </span>
        <button (click)="toggleOnline()"
          class="text-sm font-semibold px-4 py-2.5 rounded-xl transition-all border"
          [class]="online()
            ? 'bg-white border-dark-200 hover:bg-dark-50 text-dark-700'
            : 'bg-gradient-to-r from-emerald-500 to-primary-600 text-white border-transparent shadow-lg shadow-emerald-500/20'">
          {{ online() ? 'Go Offline' : 'Go Online' }}
        </button>
      </app-page-header>

      @if (toast()) {
        <div class="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          <span>✅</span><span>{{ toast() }}</span>
        </div>
      }

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div class="xl:col-span-2 rounded-2xl bg-gradient-to-br from-[#094d34] via-[#09764c] to-[#0a5d3e] p-6 text-white card-shadow-lg relative overflow-hidden">
          <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"></div>
          <div class="flex items-start justify-between gap-4 relative">
            <div>
              <p class="text-xs uppercase tracking-wider text-primary-200 font-semibold flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400 pulse-live"></span> Active Route
              </p>
              <h2 class="text-2xl font-bold mt-1">{{ route.orderNumber }}</h2>
              <p class="text-sm text-primary-100 mt-0.5">{{ route.shop }} · {{ route.township }}</p>
            </div>
            <div class="text-right">
              <p class="text-3xl font-bold">{{ route.remainingKm }} km</p>
              <p class="text-xs text-primary-200">remaining</p>
            </div>
          </div>

          <div class="mt-5 relative">
            <div class="flex items-center justify-between text-xs text-primary-100 mb-1.5">
              <span>Route progress</span><span>{{ route.progress }}%</span>
            </div>
            <div class="h-2 rounded-full bg-white/20 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all" [style.width.%]="route.progress"></div>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-3 text-center relative">
            <div class="rounded-xl bg-white/10 border border-white/10 py-2.5">
              <p class="text-lg font-bold">{{ route.eta }}</p>
              <p class="text-[10px] uppercase tracking-wide text-primary-200">ETA</p>
            </div>
            <div class="rounded-xl bg-white/10 border border-white/10 py-2.5">
              <p class="text-sm font-bold truncate px-1">{{ route.township }}</p>
              <p class="text-[10px] uppercase tracking-wide text-primary-200">Destination</p>
            </div>
            <div class="rounded-xl bg-white/10 border border-white/10 py-2.5">
              <p class="text-lg font-bold">{{ route.items }}</p>
              <p class="text-[10px] uppercase tracking-wide text-primary-200">Items</p>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap items-center gap-2 relative">
            <a routerLink="/driver/navigation"
              class="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-white text-primary-700 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-primary-50 transition-colors">
              🧭 Open Navigation
            </a>
            <a [href]="'tel:' + shopPhone"
              class="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/15 transition-colors">
              📞 Call
            </a>
            <a [href]="whatsappLink" target="_blank" rel="noopener"
              class="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
              WhatsApp
            </a>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-bold text-dark-900">Route Stops</h2>
              <p class="text-xs text-dark-400 mt-0.5">Pickup and delivery</p>
            </div>
            <span class="text-xs font-semibold text-primary-600">{{ online() ? 'On trip' : 'Paused' }}</span>
          </div>
          <div class="mt-4 space-y-4">
            <div class="flex gap-3">
              <div class="flex flex-col items-center">
                <span class="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
                <span class="w-px h-12 bg-dark-200"></span>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-dark-900">Pickup · Tiger Brands</p>
                <p class="text-[11px] text-dark-400">14 Industrial Road, Johannesburg</p>
                <p class="text-[11px] text-emerald-600 font-medium mt-0.5">Collected 09:12</p>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="flex flex-col items-center">
                <span class="w-3 h-3 rounded-full bg-primary-500 ring-4 ring-primary-100"></span>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-dark-900">Drop-off · {{ route.shop }}</p>
                <p class="text-[11px] text-dark-400">{{ route.address }}</p>
                <p class="text-[11px] text-primary-600 font-medium mt-0.5">ETA {{ route.eta }} · {{ route.remainingKm }} km left</p>
              </div>
            </div>
          </div>
          <button (click)="toggleRoute()"
            class="mt-5 w-full text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            [class]="routeStarted() ? 'bg-dark-100 text-dark-600 hover:bg-dark-200' : 'bg-gradient-to-r from-primary-600 to-primary-600 text-white hover:from-primary-700 hover:to-primary-700'">
            {{ routeStarted() ? 'Route in progress' : 'Start Route' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <app-stat-card label="Active Deliveries" [value]="activeDeliveries().length.toString()" hint="On your route" icon="📦" tone="purple" />
        <app-stat-card label="Completed Today" [value]="completedToday().toString()" hint="+1 vs yesterday" trend="up" icon="✅" tone="emerald" />
        <app-stat-card label="Today's Earnings" value="R {{ todayEarnings() | number:'1.0-0' }}" hint="Paid per delivery" icon="💰" tone="orange" />
        <app-stat-card label="Driver Rating" [value]="profile().rating.toFixed(1)" [hint]="profile().lifetimeDeliveries + ' deliveries'" icon="⭐" tone="cyan" />
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        @for (action of quickActions; track action.label) {
          @if (action.route) {
            <a [routerLink]="action.route"
              class="flex items-center gap-3 bg-white border border-dark-100 rounded-xl px-4 py-3.5 card-shadow hover:border-primary-300 hover:-translate-y-0.5 transition-all">
              <span class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-base">{{ action.icon }}</span>
              <span class="text-sm font-semibold text-dark-800 flex-1">{{ action.label }}</span>
              <span class="text-dark-300">→</span>
            </a>
          } @else {
            <a [href]="'tel:' + shopPhone"
              class="flex items-center gap-3 bg-white border border-dark-100 rounded-xl px-4 py-3.5 card-shadow hover:border-primary-300 hover:-translate-y-0.5 transition-all">
              <span class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-base">{{ action.icon }}</span>
              <span class="text-sm font-semibold text-dark-800 flex-1">{{ action.label }}</span>
              <span class="text-dark-300">→</span>
            </a>
          }
        }
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 bg-white rounded-2xl border border-dark-100 card-shadow-lg">
          <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h2 class="font-bold text-dark-900">Today's Assignments</h2>
              <p class="text-xs text-dark-400 mt-0.5">{{ activeDeliveries().length }} deliveries on your list</p>
            </div>
            <a routerLink="/driver/deliveries" class="text-xs font-semibold text-primary-600 hover:text-primary-700">View all →</a>
          </div>
          <div class="divide-y divide-dark-100">
            @for (delivery of activeDeliveries(); track delivery.id) {
              <a routerLink="/driver/deliveries" class="flex items-center gap-3 px-5 py-3.5 hover:bg-dark-50/60 transition-colors">
                <div class="w-9 h-9 rounded-lg bg-dark-50 text-dark-500 flex items-center justify-center text-sm">📦</div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-dark-900 truncate">{{ delivery.shop }}</p>
                  <p class="text-xs text-dark-400">{{ delivery.township }} · {{ delivery.distanceKm }} km · {{ delivery.items }} items</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-sm font-bold text-dark-900">R {{ delivery.payout }}</p>
                  <app-status-badge [status]="delivery.status" />
                </div>
              </a>
            }
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg p-5">
          <h2 class="font-bold text-dark-900">Today at a Glance</h2>
          <p class="text-xs text-dark-400 mt-0.5">Soweto / Johannesburg South</p>
          <div class="mt-5 space-y-4">
            <div>
              <div class="flex items-center justify-between text-xs mb-1.5"><span class="text-dark-600">Distance covered</span><span class="font-semibold text-dark-900">{{ todayDistance() }} km</span></div>
              <div class="h-1.5 rounded-full bg-dark-100"><div class="h-full rounded-full bg-primary-500" [style.width.%]="distanceShare()"></div></div>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs mb-1.5"><span class="text-dark-600">On-time rate</span><span class="font-semibold text-emerald-600">94%</span></div>
              <div class="h-1.5 rounded-full bg-dark-100"><div class="h-full rounded-full bg-emerald-500" style="width: 94%"></div></div>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs mb-1.5"><span class="text-dark-600">Weekly target</span><span class="font-semibold text-dark-900">R {{ weekEarnings() | number:'1.0-0' }}</span></div>
              <div class="h-1.5 rounded-full bg-dark-100"><div class="h-full rounded-full bg-primary-500" [style.width.%]="weekShare()"></div></div>
            </div>
          </div>
          <div class="mt-5 rounded-xl bg-primary-50 border border-primary-100 p-3.5">
            <p class="text-xs font-semibold text-primary-700">Keep it up, {{ firstName() }}!</p>
            <p class="text-[11px] text-primary-600 mt-0.5">You have covered {{ distanceShare() }}% of your 120 km daily target.</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DriverDashboardComponent {
  private driver = inject(DriverService);
  private auth = inject(AuthService);

  profile = this.driver.profile;
  online = this.driver.online;
  routeStarted = this.driver.routeStarted;
  activeDeliveries = this.driver.activeDeliveries;
  completedToday = this.driver.completedToday;
  todayEarnings = this.driver.todayEarnings;
  todayDistance = this.driver.todayDistance;
  weekEarnings = this.driver.weekEarnings;
  route = this.driver.activeRoute;
  toast = signal<string | null>(null);

  shopPhone = '+27 76 123 4567';
  whatsappLink =
    'https://wa.me/' + environment.supportWhatsApp + '?text=' +
    encodeURIComponent("Hi Thandeka, this is Sipho from Smart Spaza. I'm on my way with your order SS-2024-0847.");

  quickActions = [
    { label: 'Start Route', icon: '🧭', route: '/driver/navigation' },
    { label: 'View Deliveries', icon: '📦', route: '/driver/deliveries' },
    { label: 'Call Active Shop', icon: '📞', route: '' },
    { label: 'My Earnings', icon: '💰', route: '/driver/earnings' },
  ];

  firstName = computed(() => {
    const name = this.auth.user()?.name ?? this.driver.profile().name;
    return name.split(' ')[0];
  });
  distanceShare = computed(() => Math.min(100, Math.round((this.driver.todayDistance() / 120) * 100)));
  weekShare = computed(() => Math.min(100, Math.round((this.driver.weekEarnings() / 7000) * 100)));

  toggleOnline(): void {
    this.driver.toggleOnline();
    this.toast.set(this.driver.online() ? 'You are online and receiving new deliveries.' : 'You are offline. New assignments are paused.');
  }

  toggleRoute(): void {
    this.driver.toggleRouteStarted();
    this.toast.set(this.driver.routeStarted() ? 'Route started. Navigation is ready.' : 'Route paused.');
  }
}

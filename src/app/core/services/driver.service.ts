import { Injectable, signal, computed } from '@angular/core';
import type {
  ActiveRoute,
  DriverDelivery,
  DriverNotification,
  DriverProfile,
  EarningsPoint,
  Payout,
} from '../models/driver.models';

const PROFILE: DriverProfile = {
  id: 'DRV001',
  name: 'Sipho Nkosi',
  phone: '+27 76 123 4567',
  email: 'sipho.nkosi@smartspaza.co.za',
  vehicle: 'Toyota Hilux',
  plate: 'GP 12-34 XY',
  tier: 'Gold Driver',
  rating: 4.8,
  lifetimeDeliveries: 2847,
  driverSince: 'Jan 2022',
  base: 'Soweto / Johannesburg South',
};

const ROUTE: ActiveRoute = {
  orderNumber: 'SS-2024-0847',
  shop: "Mama Thandeka's Spaza",
  township: 'Orlando West',
  address: '1234 Vilakazi Street, Orlando West',
  items: 3,
  totalDistanceKm: 18.4,
  remainingKm: 6.2,
  progress: 66,
  eta: '10:30',
  payout: 180,
};

const DELIVERIES: DriverDelivery[] = [
  {
    id: 't1',
    orderNumber: 'SS-2024-0847',
    shop: "Mama Thandeka's Spaza",
    township: 'Orlando West',
    address: '1234 Vilakazi Street, Orlando West',
    distanceKm: 18.4,
    payout: 180,
    items: 3,
    status: 'In Transit',
    urgent: true,
    eta: '10:30',
  },
  {
    id: 't2',
    orderNumber: 'SS-2024-0848',
    shop: "Bra Mike's Store",
    township: 'Diepkloof',
    address: '88 Immink Drive, Diepkloof',
    distanceKm: 12.7,
    payout: 145,
    items: 2,
    status: 'Accepted',
    eta: '11:15',
  },
  {
    id: 't3',
    orderNumber: 'SS-2024-0849',
    shop: 'Khumalo Family Shop',
    township: 'Meadowlands',
    address: '21 Ndaba Street, Meadowlands',
    distanceKm: 9.3,
    payout: 120,
    items: 4,
    status: 'Assigned',
    eta: '12:00',
  },
  {
    id: 't4',
    orderNumber: 'SS-2024-0850',
    shop: "Ntombi's Mini Market",
    township: 'Naledi',
    address: '47 Kgotso Avenue, Naledi',
    distanceKm: 14.1,
    payout: 160,
    items: 5,
    status: 'Assigned',
    eta: '12:40',
  },
  {
    id: 't5',
    orderNumber: 'SS-2024-0846',
    shop: 'Spar Soweto',
    township: 'Pimville',
    address: '5 Klipspruit Valley Road, Pimville',
    distanceKm: 7.8,
    payout: 130,
    items: 1,
    status: 'Delivered',
    deliveredAt: 'Today, 08:42',
    rating: 5,
  },
];

const HISTORY: DriverDelivery[] = [
  {
    id: 'h1',
    orderNumber: 'SS-2024-0846',
    shop: 'Spar Soweto',
    township: 'Pimville',
    address: '5 Klipspruit Valley Road, Pimville',
    distanceKm: 7.8,
    payout: 130,
    items: 1,
    status: 'Delivered',
    deliveredAt: 'Today, 08:42',
    rating: 5,
  },
  {
    id: 'h2',
    orderNumber: 'SS-2024-0841',
    shop: "Zanele's Corner Shop",
    township: 'Orlando East',
    address: '19 Mooki Street, Orlando East',
    distanceKm: 11.2,
    payout: 145,
    items: 3,
    status: 'Delivered',
    deliveredAt: 'Yesterday, 16:10',
    rating: 4.8,
  },
  {
    id: 'h3',
    orderNumber: 'SS-2024-0838',
    shop: 'Diepkloof Superette',
    township: 'Diepkloof',
    address: '102 Old Potchefstroom Road, Diepkloof',
    distanceKm: 9.6,
    payout: 120,
    items: 2,
    status: 'Delivered',
    deliveredAt: 'Yesterday, 13:25',
    rating: 5,
  },
  {
    id: 'h4',
    orderNumber: 'SS-2024-0832',
    shop: 'Maponya Mini Market',
    township: 'Dube',
    address: '8 Dube Street, Dube',
    distanceKm: 14.5,
    payout: 165,
    items: 4,
    status: 'Delivered',
    deliveredAt: '27 Oct, 11:05',
    rating: 4.9,
  },
];

const EARNINGS: EarningsPoint[] = [
  { label: 'Mon', amount: 720 },
  { label: 'Tue', amount: 980 },
  { label: 'Wed', amount: 860 },
  { label: 'Thu', amount: 1140 },
  { label: 'Fri', amount: 130 },
  { label: 'Sat', amount: 0 },
  { label: 'Sun', amount: 0 },
];

const PAYOUTS: Payout[] = [
  { id: 'pay1', label: 'Weekly payout · 20–26 Oct', date: '27 Oct 2026', amount: 5240, status: 'Paid' },
  { id: 'pay2', label: 'Weekly payout · 13–19 Oct', date: '20 Oct 2026', amount: 4980, status: 'Paid' },
  { id: 'pay3', label: 'Weekly payout · 6–12 Oct', date: '13 Oct 2026', amount: 4610, status: 'Paid' },
];

const NOTIFICATIONS: DriverNotification[] = [
  { id: 'dn1', title: 'New Delivery Assignment', message: 'SS-2024-0852 has been assigned to you. Pick up from Tiger Brands, Johannesburg.', time: '2 min ago', icon: '📦', tone: 'info', read: false },
  { id: 'dn2', title: 'Payment Received', message: 'R1,250 weekly payout has been deposited into your account.', time: '1 h ago', icon: '💰', tone: 'success', read: false },
  { id: 'dn3', title: 'New 5-Star Rating', message: "Mama Thandeka's Spaza rated your delivery 5 stars.", time: '3 h ago', icon: '⭐', tone: 'success', read: false },
  { id: 'dn4', title: 'Vehicle Service Due', message: 'Your vehicle service is due in 7 days. Book a slot to stay on the road.', time: 'Yesterday', icon: '🛠️', tone: 'warning', read: true },
];

@Injectable({ providedIn: 'root' })
export class DriverService {
  private _profile = signal<DriverProfile>(PROFILE);
  private _online = signal(true);
  private _routeStarted = signal(true);
  private _navigationActive = signal(false);
  private _deliveries = signal<DriverDelivery[]>(DELIVERIES);
  private _history = signal<DriverDelivery[]>(HISTORY);
  private _notifications = signal<DriverNotification[]>(NOTIFICATIONS);
  private _todayEarnings = signal(130);

  readonly profile = this._profile.asReadonly();
  readonly online = this._online.asReadonly();
  readonly routeStarted = this._routeStarted.asReadonly();
  readonly navigationActive = this._navigationActive.asReadonly();
  readonly deliveries = this._deliveries.asReadonly();
  readonly history = this._history.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly todayEarnings = this._todayEarnings.asReadonly();
  readonly activeRoute = ROUTE;
  readonly earnings = EARNINGS;
  readonly payouts = PAYOUTS;

  readonly activeDeliveries = computed(() =>
    this._deliveries().filter((d) => d.status !== 'Delivered'),
  );
  readonly completedToday = computed(
    () => this._deliveries().filter((d) => d.status === 'Delivered').length,
  );
  readonly unreadCount = computed(() => this._notifications().filter((n) => !n.read).length);
  readonly weekEarnings = computed(() =>
    EARNINGS.reduce((sum, day) => sum + day.amount, 0),
  );
  readonly todayDistance = computed(() =>
    this._deliveries().reduce((sum, d) => sum + d.distanceKm, 0),
  );

  statusCount(status: DriverDelivery['status']): number {
    return this._deliveries().filter((d) => d.status === status).length;
  }

  toggleOnline(): void {
    this._online.update((v) => !v);
  }

  toggleRouteStarted(): void {
    this._routeStarted.update((v) => !v);
  }

  toggleNavigation(): void {
    this._navigationActive.update((v) => !v);
  }

  advanceDelivery(id: string): void {
    const next: Record<string, DriverDelivery['status']> = {
      Assigned: 'Accepted',
      Accepted: 'In Transit',
      'In Transit': 'Delivered',
      Delivered: 'Delivered',
    };
    const current = this._deliveries().find((d) => d.id === id);
    if (!current) return;
    const status = next[current.status];
    this._deliveries.update((items) =>
      items.map((d) =>
        d.id === id
          ? {
              ...d,
              status,
              deliveredAt: status === 'Delivered' ? 'Just now' : d.deliveredAt,
              rating: status === 'Delivered' ? 5 : d.rating,
            }
          : d,
      ),
    );
    if (status === 'Delivered') {
      this._todayEarnings.update((amount) => amount + current.payout);
      this._history.update((items) => [
        { ...current, status: 'Delivered', deliveredAt: 'Just now', rating: 5 },
        ...items,
      ]);
    }
  }

  markAllRead(): void {
    this._notifications.update((items) => items.map((n) => ({ ...n, read: true })));
  }

  markRead(id: string): void {
    this._notifications.update((items) => items.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  resetNotifications(): void {
    this._notifications.set(NOTIFICATIONS.map((n) => ({ ...n })));
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ScannerApiService } from './scanner-api.service';
import type {
  RetailDelivery,
  RetailNotification,
  RetailOrder,
  RetailSupplier,
  SalesPoint,
  Shop,
  StockItem,
  StockStatus,
} from '../models/retailer.models';

const SHOP: Shop = {
  name: 'Mama Busi General Store',
  ownerName: 'Busisiwe Mokoena',
  phone: '+27 83 123 4567',
  email: 'busi@mamageneral.co.za',
  address: '12 Vilakazi Street',
  township: 'Soweto',
  city: 'Johannesburg',
  balance: 0,
  creditLimit: 15000,
  outstanding: 2300,
};

const ORDERS: RetailOrder[] = [
  { id: 'o1', orderNumber: 'SPZ-2025-0003', supplier: 'Mthembu Cleaning Products', items: 1, total: 210, status: 'Pending', createdAt: '2026-10-30T08:15:00' },
  { id: 'o2', orderNumber: 'SPZ-2025-0001', supplier: 'Khumalo Foods & Beverages', items: 2, total: 425, status: 'Confirmed', createdAt: '2026-10-29T14:22:00' },
  { id: 'o3', orderNumber: 'SPZ-2025-0002', supplier: 'Ndlovu General Supplies', items: 2, total: 156, status: 'Preparing', createdAt: '2026-10-29T09:40:00' },
  { id: 'o4', orderNumber: 'SPZ-2025-0004', supplier: 'Dlamini Fresh Produce', items: 4, total: 540, status: 'Dispatched', createdAt: '2026-10-28T16:05:00' },
  { id: 'o5', orderNumber: 'ORD-2024-001', supplier: 'Khumalo Foods & Beverages', items: 3, total: 2340, status: 'Delivered', createdAt: '2026-10-22T11:10:00' },
  { id: 'o6', orderNumber: 'SPZ-2025-0005', supplier: 'Zulu Beverages Wholesale', items: 6, total: 862, status: 'Delivered', createdAt: '2026-10-18T10:30:00' },
  { id: 'o7', orderNumber: 'SPZ-2025-0006', supplier: 'Dlamini Fresh Produce', items: 5, total: 318, status: 'Delivered', createdAt: '2026-10-12T13:45:00' },
];

const DELIVERIES: RetailDelivery[] = [
  {
    id: 'd1',
    orderNumber: 'SPZ-2025-0001',
    driverName: 'Siphamandla Cele',
    driverPhone: '+27 72 333 4444',
    vehicle: 'Isuzu D-Max · KZN 34 DEF',
    driverRating: 4.7,
    status: 'In Transit',
    progress: 62,
    distanceKm: 4.8,
    eta: '14:20',
    address: '12 Vilakazi Street, Orlando West',
  },
  {
    id: 'd2',
    orderNumber: 'SPZ-2025-0004',
    driverName: 'Thabo Mahlangu',
    driverPhone: '+27 71 555 0182',
    vehicle: 'Toyota Hilux · GP 09-77 LM',
    driverRating: 4.8,
    status: 'In Transit',
    progress: 38,
    distanceKm: 8.2,
    eta: '15:05',
    address: '12 Vilakazi Street, Orlando West',
  },
  {
    id: 'd3',
    orderNumber: 'SPZ-2025-0002',
    driverName: 'Nomsa Dlamini',
    driverPhone: '+27 82 440 7719',
    vehicle: 'Nissan NP200 · GP 44-12 TT',
    driverRating: 4.9,
    status: 'Assigned',
    progress: 0,
    distanceKm: 11.6,
    eta: '16:10',
    address: '12 Vilakazi Street, Orlando West',
  },
  {
    id: 'd4',
    orderNumber: 'ORD-2024-001',
    driverName: 'Siphamandla Cele',
    driverPhone: '+27 72 333 4444',
    vehicle: 'Isuzu D-Max · KZN 34 DEF',
    driverRating: 4.7,
    status: 'Delivered',
    progress: 100,
    distanceKm: 0,
    eta: 'Delivered 09:42',
    address: '12 Vilakazi Street, Orlando West',
  },
];



const SUPPLIERS: RetailSupplier[] = [
  { id: 's1', name: 'Mthembu Cleaning Products', category: 'Cleaning & Hygiene', city: 'Pretoria', rating: 4.9, onTime: 98, minimumOrder: 400, leadTime: '1 day' },
  { id: 's2', name: 'Khumalo Foods & Beverages', category: 'Food & Beverage', city: 'Johannesburg', rating: 4.8, onTime: 98, minimumOrder: 500, leadTime: '1 day' },
  { id: 's3', name: 'Dlamini Fresh Produce', category: 'Fresh Produce', city: 'Durban', rating: 4.7, onTime: 93, minimumOrder: 250, leadTime: '2 days' },
  { id: 's4', name: 'Ndlovu General Supplies', category: 'General Merchandise', city: 'Soweto', rating: 4.6, onTime: 94, minimumOrder: 350, leadTime: '1 day' },
  { id: 's5', name: 'Zulu Beverages Wholesale', category: 'Beverages', city: 'Durban', rating: 4.5, onTime: 91, minimumOrder: 600, leadTime: '3 days' },
];

const NOTIFICATIONS: RetailNotification[] = [
  { id: 'n1', title: 'Low Stock Alert', message: 'Ace Super Maize Meal 5kg is running low (8 units remaining). Reorder now!', time: '27 min ago', icon: '📦', tone: 'warning', read: false },
  { id: 'n2', title: 'Order In Transit', message: 'Your order SPZ-2025-0001 is on its way. ETA 14:20.', time: '48 min ago', icon: '🚚', tone: 'info', read: false },
  { id: 'n3', title: 'Order Confirmed', message: 'Order SPZ-2025-0002 has been confirmed by Khumalo Foods.', time: '2 h ago', icon: '✅', tone: 'success', read: false },
  { id: 'n4', title: 'Product Expiring Soon', message: 'Simba Chips 125g will expire in 19 days. Consider a markdown.', time: '5 h ago', icon: '⏳', tone: 'danger', read: true },
];

const SALES_7: SalesPoint[] = [
  { label: 'Sat', sales: 1381, orders: 19 },
  { label: 'Sun', sales: 1245, orders: 17 },
  { label: 'Mon', sales: 1606, orders: 26 },
  { label: 'Tue', sales: 1389, orders: 24 },
  { label: 'Wed', sales: 1102, orders: 15 },
  { label: 'Thu', sales: 1534, orders: 21 },
  { label: 'Fri', sales: 1185.5, orders: 18 },
];

const SALES_30: SalesPoint[] = [
  { label: 'W1', sales: 8420, orders: 121 },
  { label: 'W2', sales: 9135, orders: 134 },
  { label: 'W3', sales: 7880, orders: 112 },
  { label: 'W4', sales: 10240, orders: 148 },
];

const SALES_90: SalesPoint[] = [
  { label: 'Aug', sales: 32140, orders: 462 },
  { label: 'Sep', sales: 35680, orders: 508 },
  { label: 'Oct', sales: 38915, orders: 547 },
];

export type AnalyticsRange = '7d' | '30d' | '90d';

@Injectable({ providedIn: 'root' })
export class RetailerService {
  private inventoryApi = inject(ScannerApiService);

  private _shop = signal<Shop>(SHOP);
  private _orders = signal<RetailOrder[]>(ORDERS);
  private _deliveries = signal<RetailDelivery[]>(DELIVERIES);
  private _inventory = signal<StockItem[]>([]);
  private _notifications = signal<RetailNotification[]>(NOTIFICATIONS);
  private _cartCount = signal(0);

  readonly shop = this._shop.asReadonly();
  readonly orders = this._orders.asReadonly();
  readonly deliveries = this._deliveries.asReadonly();
  readonly inventory = this._inventory.asReadonly();
  readonly suppliers = signal<RetailSupplier[]>(SUPPLIERS).asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly cartCount = this._cartCount.asReadonly();

  readonly activeOrders = computed(() =>
    this._orders().filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled'),
  );
  readonly inTransit = computed(() => this._deliveries().filter((d) => d.status === 'In Transit'));
  readonly recentOrders = computed(() => this._orders().slice(0, 4));
  readonly unreadCount = computed(() => this._notifications().filter((n) => !n.read).length);
  readonly lowStock = computed(() => this._inventory().filter((i) => i.quantity <= i.minStock));
  readonly stockValue = computed(() =>
    this._inventory().reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0),
  );

  /** Pull the live product catalogue (SQL Server, via SmartSpazaAPI). */
  loadInventory(): void {
    this.inventoryApi.getAllProducts().subscribe({
      next: (products) =>
        this._inventory.set(
          products.map((product) => {
            const quantity = product.stockQuantity;

            return {
              id: product.productId,
              name: product.name,
              sku: product.stockKeepUnit || product.barcode || product.productId.slice(0, 8),
              category: product.category ?? 'Uncategorised',
              quantity,
              minStock: 10,
              maxStock: Math.max(quantity, 20),
              costPrice: product.price,
              sellingPrice: product.price,
              barcode: product.barcode ?? undefined,
              unit: product.unit ?? undefined,
              supplierId: product.supplierId,
              shopOwnerId: product.shopOwnerId,
            } satisfies StockItem;
          }),
        ),
      error: () => {
        /* keep whatever is on screen when the API is unreachable */
      },
    });
  }

  salesFor(range: AnalyticsRange): SalesPoint[] {
    return range === '7d' ? SALES_7 : range === '30d' ? SALES_30 : SALES_90;
  }

  statusOf(item: StockItem): StockStatus {
    if (item.quantity <= item.minStock * 0.6) return 'Critical';
    if (item.quantity <= item.minStock) return 'Low';
    return 'Healthy';
  }

  reorder(orderId: string): void {
    const order = this._orders().find((o) => o.id === orderId);
    if (order) this._cartCount.update((count) => count + order.items);
  }

  /** Top the item back up to its maximum and persist it to the API. */
  restock(itemId: string): Observable<StockItem> {
    const item = this._inventory().find((i) => i.id === itemId);

    if (!item) {
      throw new Error('Unknown product.');
    }

    const target = Math.max(item.maxStock, item.quantity + 10);

    return this.inventoryApi
      .updateProduct(item.id, {
        barcode: item.barcode ?? item.sku,
        name: item.name,
        category: item.category === 'Uncategorised' ? null : item.category,
        price: item.sellingPrice,
        stockQuantity: target,
        unit: item.unit ?? null,
        stockKeepUnit: item.sku,
      })
      .pipe(
        map((updated) => {
          this.loadInventory();

          return {
            ...item,
            quantity: updated.stockQuantity,
            maxStock: Math.max(updated.stockQuantity, item.maxStock),
          } satisfies StockItem;
        }),
      );
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

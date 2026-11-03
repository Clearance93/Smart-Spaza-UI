import { Injectable, signal, computed } from '@angular/core';
import type { AdminOrder, AdminRetailer, AdminStats, AdminSupplier } from '../models/admin.models';

const RETAILERS: AdminRetailer[] = [
  { id: 'r1', name: 'Mama Busi General Store', owner: 'Busisiwe Mokoena', township: 'Soweto', status: 'Active', orders: 84, spend: 38650 },
  { id: 'r2', name: 'Thandeka Spaza Shop', owner: 'Thandeka Zulu', township: 'Orlando West', status: 'Active', orders: 62, spend: 27480 },
  { id: 'r3', name: 'Khumalo Family Shop', owner: 'Sanele Khumalo', township: 'Meadowlands', status: 'Active', orders: 51, spend: 19230 },
  { id: 'r4', name: 'Ntombi Mini Market', owner: 'Ntombi Mahlangu', township: 'Naledi', status: 'Pending', orders: 0, spend: 0 },
  { id: 'r5', name: 'Diepkloof Superette', owner: 'Peter Molefe', township: 'Diepkloof', status: 'Active', orders: 39, spend: 14120 },
  { id: 'r6', name: 'Zanele Corner Shop', owner: 'Zanele Dube', township: 'Orlando East', status: 'Suspended', orders: 12, spend: 4310 },
];

const SUPPLIERS: AdminSupplier[] = [
  { id: 's1', name: 'Khumalo Foods & Beverages', category: 'Food & Beverage', status: 'Active', products: 148, onTime: 98 },
  { id: 's2', name: 'Mthembu Cleaning Products', category: 'Cleaning & Hygiene', status: 'Active', products: 86, onTime: 98 },
  { id: 's3', name: 'Dlamini Fresh Produce', category: 'Fresh Produce', status: 'Active', products: 63, onTime: 93 },
  { id: 's4', name: 'Ndlovu General Supplies', category: 'General Merchandise', status: 'Pending', products: 0, onTime: 0 },
  { id: 's5', name: 'Zulu Beverages Wholesale', category: 'Beverages', status: 'Active', products: 94, onTime: 91 },
  { id: 's6', name: 'Soweto Snacks Distributors', category: 'Snacks', status: 'Pending', products: 0, onTime: 0 },
];

const ORDERS: AdminOrder[] = [
  { id: 'ao1', orderNumber: 'SPZ-2025-0003', retailer: 'Mama Busi General Store', supplier: 'Mthembu Cleaning Products', amount: 210, status: 'PENDING_CONFIRMATION', date: '30 Oct' },
  { id: 'ao2', orderNumber: 'SPZ-2025-0001', retailer: 'Mama Busi General Store', supplier: 'Khumalo Foods & Beverages', amount: 425, status: 'CONFIRMED', date: '29 Oct' },
  { id: 'ao3', orderNumber: 'SPZ-2025-0002', retailer: 'Mama Busi General Store', supplier: 'Ndlovu General Supplies', amount: 156, status: 'PREPARING', date: '29 Oct' },
  { id: 'ao4', orderNumber: 'SPZ-2025-0007', retailer: 'Thandeka Spaza Shop', supplier: 'Dlamini Fresh Produce', amount: 318, status: 'DISPATCHED', date: '28 Oct' },
  { id: 'ao5', orderNumber: 'SPZ-2025-0008', retailer: 'Khumalo Family Shop', supplier: 'Zulu Beverages Wholesale', amount: 862, status: 'DELIVERED', date: '27 Oct' },
  { id: 'ao6', orderNumber: 'ORD-2024-001', retailer: 'Mama Busi General Store', supplier: 'Khumalo Foods & Beverages', amount: 2340, status: 'DELIVERED', date: '22 Oct' },
];

const STATS: AdminStats = { retailers: 128, suppliers: 24, orders: 1284, gmv: 2400000, growth: 12.5 };

@Injectable({ providedIn: 'root' })
export class AdminService {
  private _retailers = signal<AdminRetailer[]>(RETAILERS);
  private _suppliers = signal<AdminSupplier[]>(SUPPLIERS);

  readonly stats = signal<AdminStats>(STATS).asReadonly();
  readonly retailers = this._retailers.asReadonly();
  readonly suppliers = this._suppliers.asReadonly();
  readonly orders = signal<AdminOrder[]>(ORDERS).asReadonly();

  readonly pendingRetailers = computed(() => this.retailers().filter((r) => r.status === 'Pending').length);
  readonly pendingSuppliers = computed(() => this.suppliers().filter((s) => s.status === 'Pending').length);
  readonly pendingOrders = computed(() =>
    this.orders().filter((o) => o.status === 'PENDING_CONFIRMATION').length,
  );

  approveRetailer(id: string): void {
    this._retailers.update((items) => items.map((r) => (r.id === id ? { ...r, status: 'Active' } : r)));
  }

  approveSupplier(id: string): void {
    this._suppliers.update((items) => items.map((s) => (s.id === id ? { ...s, status: 'Active' } : s)));
  }
}

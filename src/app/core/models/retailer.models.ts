export type RetailOrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Dispatched' | 'Delivered' | 'Cancelled';
export type StockStatus = 'Critical' | 'Low' | 'Healthy';

export interface Shop {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  township: string;
  city: string;
  balance: number;
  creditLimit: number;
  outstanding: number;
}

export interface RetailOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  items: number;
  total: number;
  status: RetailOrderStatus;
  createdAt: string;
}

export interface RetailDelivery {
  id: string;
  orderNumber: string;
  driverName: string;
  driverPhone: string;
  vehicle: string;
  driverRating: number;
  status: 'Assigned' | 'In Transit' | 'Delivered';
  progress: number;
  distanceKm: number;
  eta: string;
  address: string;
}

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  costPrice: number;
  sellingPrice: number;
  expiryDate?: string;
  barcode?: string;
  unit?: string;
  supplierId?: string | null;
  shopOwnerId?: string | null;
}

export interface RetailSupplier {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  onTime: number;
  minimumOrder: number;
  leadTime: string;
}

export interface RetailNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
  read: boolean;
}

export interface SalesPoint {
  label: string;
  sales: number;
  orders: number;
}

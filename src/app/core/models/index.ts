export interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  retailer?: string;
  township?: string;
}

export interface SupplierStats {
  totalRevenue: number;
  pendingOrders: number;
  todayOrders: number;
  activeDeliveries: number;
  activeDrivers: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  reorderLevel: number;
  unit: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: 'success' | 'info' | 'warning' | 'danger';
}

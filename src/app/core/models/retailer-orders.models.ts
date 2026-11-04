export interface ShopOrderItem {
  productName: string | null;
  quantity: number;
  unit: string | null;
  weight: string | null;
}

export interface ShopOrderTracking {
  status: string;
  latitude: number | null;
  longitude: number | null;
  distanceRemaining: number | null;
  estimatedTime: string | null;
  updated: string | null;
}

export interface ShopOrder {
  deliveryId: string;
  deliveryNumber: string;
  status: string;
  priority: string | null;
  scheduledTime: string | null;
  estimatedArrival: string | null;
  actualArrival: string | null;
  creationTime: string | null;
  notes: string | null;
  supplierId: string;
  supplierName: string | null;
  supplierPhone: string | null;
  driverId: string;
  driverName: string | null;
  driverPhone: string | null;
  rating: number | null;
  ratingComment: string | null;
  items: ShopOrderItem[];
  tracking: ShopOrderTracking | null;
}

export interface ShopSupplier {
  supplierId: string;
  supplierName: string | null;
  contactName: string | null;
  email: string | null;
  contactNumber: string | null;
  address: string | null;
  logoUrl: string | null;
  ratings: string | null;
  totalOrders: string | null;
  productCount: number;
  orderCount: number;
  stockValue: number;
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  Created: 'Created',
  Accepted: 'Accepted',
  InTransit: 'In transit',
  OnTheWay: 'On the way',
  Delivered: 'Delivered',
  Rejected: 'Rejected',
};

export const ORDER_STATUS_STYLES: Record<string, string> = {
  Created: 'bg-slate-100 text-slate-700',
  Accepted: 'bg-sky-50 text-sky-700',
  InTransit: 'bg-indigo-50 text-indigo-700',
  OnTheWay: 'bg-amber-50 text-amber-700',
  Delivered: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-700',
};

/** 0-100 progress used by the tracking timeline. */
export const ORDER_STATUS_PROGRESS: Record<string, number> = {
  Created: 10,
  Accepted: 30,
  InTransit: 60,
  OnTheWay: 85,
  Delivered: 100,
  Rejected: 0,
};

export type DriverDeliveryStatus = 'Assigned' | 'Accepted' | 'In Transit' | 'Delivered';

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  plate: string;
  tier: string;
  rating: number;
  lifetimeDeliveries: number;
  driverSince: string;
  base: string;
}

export interface DriverDelivery {
  id: string;
  orderNumber: string;
  shop: string;
  township: string;
  address: string;
  distanceKm: number;
  payout: number;
  items: number;
  status: DriverDeliveryStatus;
  urgent?: boolean;
  eta?: string;
  deliveredAt?: string;
  rating?: number;
}

export interface ActiveRoute {
  orderNumber: string;
  shop: string;
  township: string;
  address: string;
  items: number;
  totalDistanceKm: number;
  remainingKm: number;
  progress: number;
  eta: string;
  payout: number;
}

export interface DriverNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
  read: boolean;
}

export interface EarningsPoint {
  label: string;
  amount: number;
}

export interface Payout {
  id: string;
  label: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Processing';
}

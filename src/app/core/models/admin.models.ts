export interface AdminStats {
  retailers: number;
  suppliers: number;
  orders: number;
  gmv: number;
  growth: number;
}

export interface AdminRetailer {
  id: string;
  name: string;
  owner: string;
  township: string;
  status: 'Active' | 'Pending' | 'Suspended';
  orders: number;
  spend: number;
}

export interface AdminSupplier {
  id: string;
  name: string;
  category: string;
  status: 'Active' | 'Pending' | 'Suspended';
  products: number;
  onTime: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  retailer: string;
  supplier: string;
  amount: number;
  status: string;
  date: string;
}

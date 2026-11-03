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

export type StockStatus = 'Healthy' | 'Low' | 'Critical';

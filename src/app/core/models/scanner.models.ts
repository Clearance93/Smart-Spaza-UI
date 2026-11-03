import { Product } from '../../core/models';

export interface ScannedProduct {
  productId: string;
  barcode: string | null;
  stockKeepUnit: string | null;
  name: string;
  category: string | null;
  price: number;
  stockQuantity: number;
  unit: string | null;
  supplierId: string | null;
  shopOwnerId: string | null;
}

export interface CartLine {
  product: ScannedProduct;
  quantity: number;
}

export interface LoginResponse {
  token: string | null;
  expiration?: string | null;
  refreshToken?: string | null;
  refreshTokenExpiration?: string | null;
  email?: string | null;
  roles?: string[];
  roleUserId?: string | null;
}

export interface CatalogProduct extends Product {
  barcode: string | null;
}

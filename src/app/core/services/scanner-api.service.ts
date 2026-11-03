import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ScannerSessionStore } from './scanner-session.store';
import type { ScannedProduct, LoginResponse, CartLine } from '../models/scanner.models';

interface ProductDto {
  productId: string;
  barcode?: string | null;
  stockKeepUnit?: string | null;
  name?: string | null;
  category?: string | null;
  price?: number;
  stockQuantity?: number;
  unit?: string | null;
  supplierId?: string | null;
  shopOwnerId?: string | null;
}

interface PagedProductsDto {
  items?: ProductDto[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

interface CheckoutResponseDto {
  message?: string | null;
  products?: ProductDto[];
}

export interface ScannedProductInput {
  barcode: string;
  name: string;
  category?: string | null;
  price: number;
  stockQuantity: number;
  unit?: string | null;
  stockKeepUnit?: string | null;
  supplierId?: string | null;
  shopOwnerId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ScannerApiService {
  private http = inject(HttpClient);
  private session = inject(ScannerSessionStore);
  private base = environment.apiUrl;

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<LoginResponse>(`${this.base}/Auth/login`, { email: email.trim(), password })
      .pipe(
        map(res => {
          if (!res?.token) {
            throw new Error('Sign in failed. Please check your credentials.');
          }
          this.session.save({
            token: res.token,
            refreshToken: res.refreshToken ?? null,
            email: res.email ?? email.trim(),
            roleUserId: res.roleUserId ?? null,
            roles: res.roles ?? [],
          });
        }),
        catchError(err => this.fail(err, 'Sign in failed. Please check your credentials.'))
      );
  }

  getAllProducts(): Observable<ScannedProduct[]> {
    const params: Record<string, string | number> = { page: 1, pageSize: 100 };
    const roleUserId = this.session.getRoleUserId();

    if (roleUserId) {
      params['id'] = roleUserId;
    }

    return this.http
      .get<ProductDto[] | PagedProductsDto>(`${this.base}/Products/all-products`, {
        params,
        headers: { 'X-Scanner-Request': 'true' },
      })
      .pipe(
        map(res => this.unwrapProducts(res)),
        map(list => list.map(dto => this.toProduct(dto))),
        catchError(err => this.fail(err, 'Could not load products.'))
      );
  }

  getProductByBarcode(barcode: string): Observable<ScannedProduct> {
    return this.http
      .get<ProductDto>(`${this.base}/Products/barcode`, {
        params: { code: barcode },
        headers: { 'X-Scanner-Request': 'true' },
      })
      .pipe(
        map(dto => {
          if (!dto) throw new Error(`No product matches barcode ${barcode}.`);
          return this.toProduct(dto);
        }),
        catchError(err => this.fail(err, `No product matches barcode ${barcode}.`))
      );
  }

  checkout(items: CartLine[]): Observable<ScannedProduct[]> {
    const body = {
      shopOwnerId: this.session.getRoleUserId(),
      items: items.map(i => ({
        productId: i.product.productId,
        barcode: i.product.barcode,
        quantity: i.quantity,
      })),
    };

    return this.http
      .post<CheckoutResponseDto>(`${this.base}/Products/checkout`, body, {
        headers: { 'X-Scanner-Request': 'true' },
      })
      .pipe(
        map(res => (res?.products ?? []).map(dto => this.toProduct(dto))),
        catchError(err => this.fail(err, 'Checkout failed. Please try again.'))
      );
  }

  createProduct(input: ScannedProductInput): Observable<ScannedProduct> {
    const roles = this.session.getRoles();
    const isSupplier = roles.includes('Supplier');
    const roleUserId = this.session.getRoleUserId();

    const body = {
      ...input,
      shopOwnerId: input.shopOwnerId ?? (isSupplier ? null : roleUserId),
      supplierId: input.supplierId ?? (isSupplier ? roleUserId : null),
      productId: '00000000-0000-0000-0000-000000000000',
    };

    return this.http
      .post<ProductDto>(`${this.base}/Products/add-product`, body, {
        headers: { 'X-Scanner-Request': 'true' },
      })
      .pipe(
        map(dto => this.toProduct(dto)),
        catchError(err => this.fail(err, 'Could not add the product.'))
      );
  }

  updateProduct(productId: string, input: ScannedProductInput): Observable<ScannedProduct> {
    return this.http
      .put<ProductDto>(`${this.base}/Products/update-product`, { ...input, productId }, {
        params: { id: productId },
        headers: { 'X-Scanner-Request': 'true' },
      })
      .pipe(
        map(dto => this.toProduct(dto)),
        catchError(err => this.fail(err, 'Could not update the product.'))
      );
  }

  deleteProduct(productId: string): Observable<void> {
    return this.http
      .delete<{ message?: string }>(`${this.base}/Products/delete-product`, {
        params: { id: productId },
        headers: { 'X-Scanner-Request': 'true' },
      })
      .pipe(
        map(() => void 0),
        catchError(err => this.fail(err, 'Could not remove the product.'))
      );
  }

  logout(): void {
    this.session.clear();
  }

  isLoggedIn(): boolean {
    return this.session.isLoggedIn();
  }

  /** The scanner is used by shop owners (sales) and suppliers (catalogue/restock). */
  hasScannerRole(): boolean {
    return this.session.getRoles().some(role => {
      const normalized = role.toLowerCase();
      return normalized === 'spazaowner' || normalized === 'supplier';
    });
  }

  /** Business users (shop owners and suppliers) may record a sale. */
  canCheckout(): boolean {
    return this.session.getRoles().some(role => {
      const normalized = role.toLowerCase();
      return normalized === 'spazaowner' || normalized === 'supplier';
    });
  }

  currentEmail(): string | null {
    return this.session.getEmail();
  }

  private unwrapProducts(res: ProductDto[] | PagedProductsDto | null): ProductDto[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    return Array.isArray(res.items) ? res.items : [];
  }

  private toProduct(dto: ProductDto): ScannedProduct {
    return {
      productId: dto.productId,
      barcode: dto.barcode ?? null,
      stockKeepUnit: dto.stockKeepUnit ?? null,
      name: dto.name?.trim() || 'Unnamed product',
      category: dto.category ?? null,
      price: dto.price ?? 0,
      stockQuantity: dto.stockQuantity ?? 0,
      unit: dto.unit ?? null,
      supplierId: dto.supplierId ?? null,
      shopOwnerId: dto.shopOwnerId ?? null,
    };
  }

  private fail(err: unknown, fallback: string): Observable<never> {
    if (err instanceof Error) return throwError(() => err);

    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return throwError(() => new Error('Cannot reach the Smart Spaza server. Check the connection and try again.'));
      }
      if (err.status === 401) {
        return throwError(() => new Error('Your session has expired. Please sign in again.'));
      }
      if (err.status === 403) {
        return throwError(
          () =>
            new Error(
              'This product belongs to another business. You can sell it, but only its owner can change the price or stock.'
            )
        );
      }
      const message =
        this.extractMessage(err.error) ??
        `${fallback} (HTTP ${err.status})`;
      return throwError(() => new Error(message));
    }

    return throwError(() => new Error(fallback));
  }

  private extractMessage(body: unknown): string | null {
    if (!body) return null;
    if (typeof body === 'string') return body;
    if (typeof body === 'object') {
      const record = body as Record<string, unknown>;
      const message = record['message'] ?? record['Message'] ?? record['title'];
      if (typeof message === 'string' && message.trim()) return message;
    }
    return null;
  }
}

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RetailerService } from './retailer.service';
import { ScannerApiService } from './scanner-api.service';
import type { ScannedProduct } from '../models/scanner.models';

const product = (overrides: Partial<ScannedProduct> = {}): ScannedProduct => ({
  productId: 'p1',
  barcode: '6009510800128',
  stockKeepUnit: 'SKU-BREAD',
  name: 'White Bread Loaf',
  category: 'Bakery',
  price: 18.99,
  stockQuantity: 8,
  unit: 'loaf',
  supplierId: null,
  shopOwnerId: 'shop-1',
  ...overrides,
});

const scannerStub = {
  getAllProducts: () => of([product()]),
  updateProduct: (_id: string, input: { stockQuantity: number }) =>
    of(product({ stockQuantity: input.stockQuantity })),
};

describe('RetailerService', () => {
  let service: RetailerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ScannerApiService, useValue: scannerStub }],
    });
    service = TestBed.inject(RetailerService);
  });

  it('should expose the demo shop and order pipeline', () => {
    expect(service.shop().name).toBe('Mama Busi General Store');
    expect(service.orders().length).toBe(7);
    expect(service.activeOrders().length).toBe(4);
    expect(service.inTransit().length).toBe(2);
    expect(service.unreadCount()).toBe(3);
  });

  it('should load the inventory from the product API', () => {
    expect(service.inventory().length).toBe(0);

    service.loadInventory();

    expect(service.inventory().length).toBe(1);
    expect(service.inventory()[0].name).toBe('White Bread Loaf');
    expect(service.inventory()[0].sellingPrice).toBe(18.99);
    expect(service.lowStock().length).toBe(1);
  });

  it('should restock through the API and reflect the new quantity', () => {
    service.loadInventory();

    let updated: { quantity: number } | undefined;
    service.restock('p1').subscribe((item) => (updated = item));

    expect(updated?.quantity).toBe(20);
  });

  it('should reject restocking an unknown product', () => {
    expect(() => service.restock('missing')).toThrowError('Unknown product.');
  });

  it('should add reordered items to the cart', () => {
    service.reorder('o1');
    service.reorder('o2');

    expect(service.cartCount()).toBe(3);
  });

  it('should mark every notification as read', () => {
    service.markAllRead();

    expect(service.unreadCount()).toBe(0);
  });
});

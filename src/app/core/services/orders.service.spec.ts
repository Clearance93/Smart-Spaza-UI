import { TestBed } from '@angular/core/testing';
import { OrdersService } from './orders.service';
import type { OrdersResponse } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrdersService);
  });

  it('should return pending supplier orders', () => {
    let response: OrdersResponse | undefined;
    service
      .getSupplierOrders({ status: 'PENDING_CONFIRMATION', pageSize: 10 })
      .subscribe((value) => (response = value));

    expect(response?.data.length).toBe(3);
    expect(response?.data[0].orderNumber).toBe('SPZ-001');
    expect(response?.data[0].retailer).toBe('Spaza A');
  });

  it('should complete confirmOrder without error', () => {
    let completed = false;
    service.confirmOrder('1').subscribe({ complete: () => (completed = true) });
    expect(completed).toBe(true);
  });

  it('should complete rejectOrder without error', () => {
    let completed = false;
    service.rejectOrder('1').subscribe({ complete: () => (completed = true) });
    expect(completed).toBe(true);
  });
});

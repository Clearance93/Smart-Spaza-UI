import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
import type { SupplierStats } from '../models';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit supplier stats', () => {
    let stats: SupplierStats | undefined;
    service.getSupplierStats().subscribe((value) => (stats = value));

    expect(stats).toEqual({
      totalRevenue: 245000,
      pendingOrders: 12,
      todayOrders: 48,
      activeDeliveries: 7,
      activeDrivers: 5,
    });
  });
});

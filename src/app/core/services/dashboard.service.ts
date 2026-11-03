import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SupplierStats } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  getSupplierStats(): Observable<SupplierStats> {
    return of({
      totalRevenue: 245000,
      pendingOrders: 12,
      todayOrders: 48,
      activeDeliveries: 7,
      activeDrivers: 5,
    });
  }
}

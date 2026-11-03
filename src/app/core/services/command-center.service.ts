import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ActivityItem } from '../models';

export interface DriverStatus {
  id: string;
  name: string;
  initials: string;
  vehicle: string;
  status: 'ON_ROUTE' | 'AVAILABLE' | 'OFFLINE';
  activeDeliveries: number;
  rating: number;
}

@Injectable({ providedIn: 'root' })
export class CommandCenterService {
  getDrivers(): Observable<DriverStatus[]> {
    return of([
      { id: '1', name: 'Sipho Nkosi', initials: 'SN', vehicle: 'GP 12-34 XY', status: 'ON_ROUTE', activeDeliveries: 4, rating: 4.8 },
      { id: '2', name: 'Moses Dlamini', initials: 'MD', vehicle: 'GP 45-67 AB', status: 'ON_ROUTE', activeDeliveries: 3, rating: 4.6 },
      { id: '3', name: 'Thabo Mahlangu', initials: 'TM', vehicle: 'GP 78-90 CD', status: 'AVAILABLE', activeDeliveries: 0, rating: 4.9 },
      { id: '4', name: 'Lerato Khumalo', initials: 'LK', vehicle: 'GP 11-22 EF', status: 'AVAILABLE', activeDeliveries: 0, rating: 4.7 },
      { id: '5', name: 'Jabu Zulu', initials: 'JZ', vehicle: 'GP 33-44 GH', status: 'OFFLINE', activeDeliveries: 0, rating: 4.5 },
    ]);
  }

  getActivity(): Observable<ActivityItem[]> {
    return of([
      { id: '1', title: 'Order delivered', detail: 'Soweto Spaza · SPZ-009', time: '2 min ago', tone: 'success' },
      { id: '2', title: 'New order received', detail: 'R2 450 from Tembisa', time: '5 min ago', tone: 'info' },
      { id: '3', title: 'Driver assigned', detail: 'Moses → SPZ-006', time: '8 min ago', tone: 'info' },
      { id: '4', title: 'Low stock alert', detail: 'Maize Meal 5kg', time: '15 min ago', tone: 'warning' },
      { id: '5', title: 'Order dispatched', detail: '3 orders to Alexandra', time: '22 min ago', tone: 'info' },
      { id: '6', title: 'Order rejected', detail: 'Zola Corner · SPZ-010', time: '41 min ago', tone: 'danger' },
    ]);
  }
}

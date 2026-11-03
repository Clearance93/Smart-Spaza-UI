import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Order } from '../models';

export interface OrdersQuery {
  status?: string;
  pageSize?: number;
}

export interface OrdersResponse {
  data: Order[];
}

const ALL_ORDERS: Order[] = [
  { id: '1', orderNumber: 'SPZ-001', total: 1250, status: 'PENDING_CONFIRMATION', createdAt: '2026-10-07T08:12:00.000Z', retailer: 'Spaza A', township: 'Soweto' },
  { id: '2', orderNumber: 'SPZ-002', total: 890, status: 'PENDING_CONFIRMATION', createdAt: '2026-10-07T08:40:00.000Z', retailer: 'Spaza B', township: 'Alexandra' },
  { id: '3', orderNumber: 'SPZ-003', total: 2100, status: 'PENDING_CONFIRMATION', createdAt: '2026-10-07T09:05:00.000Z', retailer: 'Spaza C', township: 'Khayelitsha' },
  { id: '4', orderNumber: 'SPZ-004', total: 640, status: 'CONFIRMED', createdAt: '2026-10-07T07:20:00.000Z', retailer: 'Mama Thandeka', township: 'Orlando West' },
  { id: '5', orderNumber: 'SPZ-005', total: 1780, status: 'CONFIRMED', createdAt: '2026-10-07T07:55:00.000Z', retailer: 'Bra Mike Store', township: 'Diepkloof' },
  { id: '6', orderNumber: 'SPZ-006', total: 3200, status: 'DISPATCHED', createdAt: '2026-10-07T06:30:00.000Z', retailer: 'Khumalo Shop', township: 'Meadowlands' },
  { id: '7', orderNumber: 'SPZ-007', total: 1450, status: 'DISPATCHED', createdAt: '2026-10-07T06:48:00.000Z', retailer: "Ntombi's Market", township: 'Naledi' },
  { id: '8', orderNumber: 'SPZ-008', total: 990, status: 'DELIVERED', createdAt: '2026-10-06T15:10:00.000Z', retailer: 'Tembisa Foods', township: 'Tembisa' },
  { id: '9', orderNumber: 'SPZ-009', total: 2450, status: 'DELIVERED', createdAt: '2026-10-06T13:25:00.000Z', retailer: 'Soweto Spaza', township: 'Soweto' },
  { id: '10', orderNumber: 'SPZ-010', total: 430, status: 'REJECTED', createdAt: '2026-10-06T11:02:00.000Z', retailer: 'Zola Corner', township: 'Zola' },
];

@Injectable({ providedIn: 'root' })
export class OrdersService {
  getSupplierOrders(query: OrdersQuery): Observable<OrdersResponse> {
    let data = ALL_ORDERS;
    if (query.status) data = data.filter(o => o.status === query.status);
    if (query.pageSize != null) data = data.slice(0, query.pageSize);
    return of({ data: data.map(o => ({ ...o })) });
  }

  confirmOrder(_id: string): Observable<void> {
    return of(void 0);
  }

  rejectOrder(_id: string): Observable<void> {
    return of(void 0);
  }
}

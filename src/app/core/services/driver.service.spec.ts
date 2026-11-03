import { TestBed } from '@angular/core/testing';
import { DriverService } from './driver.service';

describe('DriverService', () => {
  let service: DriverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DriverService);
  });

  it('should expose the demo driver and deliveries', () => {
    expect(service.profile().name).toBe('Sipho Nkosi');
    expect(service.activeDeliveries().length).toBe(4);
    expect(service.completedToday()).toBe(1);
    expect(service.weekEarnings()).toBe(3830);
    expect(service.unreadCount()).toBe(3);
  });

  it('should move a delivery through the status flow and pay out on completion', () => {
    service.advanceDelivery('t3');
    expect(service.deliveries().find((d) => d.id === 't3')?.status).toBe('Accepted');

    const before = service.todayEarnings();
    service.advanceDelivery('t1');
    expect(service.deliveries().find((d) => d.id === 't1')?.status).toBe('Delivered');
    expect(service.todayEarnings()).toBe(before + 180);
    expect(service.activeDeliveries().length).toBe(3);
  });

  it('should toggle the online state', () => {
    expect(service.online()).toBe(true);
    service.toggleOnline();
    expect(service.online()).toBe(false);
  });

  it('should mark all notifications as read', () => {
    service.markAllRead();
    expect(service.unreadCount()).toBe(0);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SupplierDashboardComponent } from './supplier-dashboard.component';

describe('SupplierDashboardComponent', () => {
  let fixture: ComponentFixture<SupplierDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierDashboardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplierDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should render pending orders with retailer and township', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('SPZ-001');
    expect(text).toContain('Spaza A');
    expect(text).toContain('Soweto');
  });

  it('should render one row per pending order', () => {
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
  });

  it('should remove an order when confirmed', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const confirm = buttons.find((button) => button.textContent?.trim() === 'Confirm');

    expect(confirm).toBeTruthy();
    confirm!.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
  });

  it('should remove an order when rejected', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const reject = buttons.find((button) => button.textContent?.trim() === 'Reject');

    expect(reject).toBeTruthy();
    reject!.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
  });
});

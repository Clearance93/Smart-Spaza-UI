import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;

  async function createComponent(status: string) {
    await TestBed.configureTestingModule({ imports: [StatusBadgeComponent] }).compileComponents();
    fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
  }

  it('should render the status label', async () => {
    await createComponent('CONFIRMED');
    expect(fixture.nativeElement.textContent).toContain('CONFIRMED');
  });

  it('should apply the mapped class for a known status', async () => {
    await createComponent('DELIVERED');
    const badge = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(badge.classList.contains('bg-green-100')).toBe(true);
  });

  it('should fall back to a neutral class for an unknown status', async () => {
    await createComponent('SOMETHING_ELSE');
    const badge = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(badge.classList.contains('bg-gray-100')).toBe(true);
  });
});

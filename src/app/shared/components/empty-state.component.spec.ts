import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EmptyStateComponent] }).compileComponents();
    fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.componentRef.setInput('icon', '✅');
    fixture.componentRef.setInput('title', 'No pending orders');
    fixture.componentRef.setInput('description', 'All orders have been actioned.');
    fixture.detectChanges();
  });

  it('should render icon, title and description', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('✅');
    expect(text).toContain('No pending orders');
    expect(text).toContain('All orders have been actioned.');
  });
});

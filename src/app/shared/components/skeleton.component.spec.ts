import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardSkeletonComponent } from './skeleton.component';

describe('CardSkeletonComponent', () => {
  let fixture: ComponentFixture<CardSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardSkeletonComponent] }).compileComponents();
    fixture = TestBed.createComponent(CardSkeletonComponent);
  });

  it('should render a single card by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.animate-pulse').length).toBe(1);
  });

  it('should render the requested number of cards', () => {
    fixture.componentRef.setInput('count', 4);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.animate-pulse').length).toBe(4);
  });
});

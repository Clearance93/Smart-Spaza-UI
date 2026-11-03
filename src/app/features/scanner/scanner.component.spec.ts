import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ScannerComponent } from './scanner.component';

describe('ScannerComponent', () => {
  let fixture: ComponentFixture<ScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ScannerComponent);
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should report unsupported when camera scanning is unavailable', () => {
    expect(fixture.componentInstance.cameraSupported()).toBe(false);
  });

  it('should not start scanning when unsupported', async () => {
    await fixture.componentInstance.start();
    expect(fixture.componentInstance.scanning()).toBe(false);
    expect(fixture.componentInstance.error()).toBeNull();
  });
});

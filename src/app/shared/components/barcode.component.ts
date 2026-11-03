import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import JsBarcode from 'jsbarcode';

/**
 * Renders a scannable barcode as inline SVG.
 *
 * Uses real retail EAN-13 when the value is a valid 13-digit GTIN (what shop
 * scanners and ML Kit expect for packaged goods) and falls back to CODE128 for
 * anything else (SKUs, short codes).
 */
@Component({
  selector: 'app-barcode',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      #svg
      class="block w-full h-auto"
      role="img"
      [attr.aria-label]="'Barcode ' + value">
    </svg>
  `,
})
export class BarcodeComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) value = '';
  @Input() height = 46;
  @Input() showText = true;

  private svg = viewChild<ElementRef<SVGSVGElement>>('svg');

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.svg()) {
      this.render();
    }
  }

  /** Download the rendered barcode as a high-resolution PNG image. */
  downloadPng(fileName: string): void {
    const svg = this.svg()?.nativeElement;
    if (!svg || typeof document === 'undefined') return;

    const width = svg.width.baseVal.value || 320;
    const height = svg.height.baseVal.value || 120;
    const scale = 3;

    const serialized = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob(['<?xml version="1.0" standalone="no"?>' + serialized], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const objectUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);

      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);

      canvas.toBlob((blob) => {
        if (!blob) return;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName.toLowerCase().endsWith('.png') ? fileName : `${fileName}.png`;
        link.click();

        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }, 'image/png');
    };

    image.onerror = () => URL.revokeObjectURL(objectUrl);
    image.src = objectUrl;
  }

  private render(): void {
    const element = this.svg()?.nativeElement;
    if (!element || !this.value) return;

    const format = isEan13(this.value) ? 'EAN13' : 'CODE128';

    try {
      JsBarcode(element, this.value, {
        format,
        width: format === 'EAN13' ? 1.5 : 1.7,
        height: this.height,
        displayValue: this.showText,
        font: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 13,
        textMargin: 2,
        margin: format === 'EAN13' ? 8 : 6,
        background: '#ffffff',
        lineColor: '#0d1510',
      });
    } catch {
      element.replaceChildren();
    }
  }
}

/** 13 digits with a correct EAN-13 check digit. */
function isEan13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(value[i]) * (i % 2 === 0 ? 1 : 3);
  }

  return (10 - (sum % 10)) % 10 === Number(value[12]);
}

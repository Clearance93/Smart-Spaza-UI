import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { isPlatformBrowser, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/browser';
import { ScannerApiService } from '../../core/services/scanner-api.service';
import { ScannerSessionStore } from '../../core/services/scanner-session.store';
import { BarcodeComponent } from '../../shared/components/barcode.component';
import type { CartLine, ScannedProduct } from '../../core/models/scanner.models';

interface DetectedBarcode {
  rawValue: string;
  format: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
}

type Stage = 'login' | 'scan' | 'labels' | 'add' | 'cart' | 'receipt';
type ScannerStatus = 'idle' | 'scanning' | 'error';
type DecodeEngine = 'native' | 'zxing' | 'none';

interface SaleReceipt {
  lines: CartLine[];
  total: number;
  tendered: number;
  change: number;
  at: Date;
}

const DETECTOR_FORMATS = [
  'qr_code',
  'ean_13',
  'ean_8',
  'code_128',
  'code_39',
  'upc_a',
  'upc_e',
  'itf',
];

const ZXING_FORMATS: BarcodeFormat[] = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
];

const ENGINE_LABEL: Record<DecodeEngine, string> = {
  native: 'Native barcode detection',
  zxing: 'ZXing decoder (broad browser support)',
  none: 'No camera decoding available',
};

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe, BarcodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-5xl mx-auto animate-fade-in">

      @switch (stage()) {

        @case ('login') {
          <div class="max-w-md mx-auto mt-6">
            <div class="bg-white rounded-2xl border border-dark-100 p-6 card-shadow-lg">
              <div class="flex items-center gap-3 mb-1">
                <span class="text-2xl"></span>
                <h1 class="text-xl font-bold text-dark-900">Scanner sign in</h1>
              </div>
              <p class="text-sm text-dark-500 mb-5">Sign in to scan products and record sales.</p>

              <label for="scanner-email" class="block text-xs font-semibold text-dark-500 uppercase mb-1.5">Email</label>
              <input id="scanner-email" [ngModel]="email()" (ngModelChange)="email.set($event)" type="email"
                autocomplete="username" placeholder="you@example.com"
                class="w-full bg-white border border-dark-200 rounded-xl px-4 py-2.5 text-sm text-dark-800 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-400"
                (keyup.enter)="submitLogin()" />

              <label for="scanner-password" class="block text-xs font-semibold text-dark-500 uppercase mb-1.5">Password</label>
              <input id="scanner-password" [ngModel]="password()" (ngModelChange)="password.set($event)" type="password"
                autocomplete="current-password" placeholder="********"
                class="w-full bg-white border border-dark-200 rounded-xl px-4 py-2.5 text-sm text-dark-800 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-400"
                (keyup.enter)="submitLogin()" />

              @if (error(); as message) {
                <p class="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {{ message }}
                </p>
              }

              <button (click)="submitLogin()" [disabled]="loggingIn()"
                class="w-full bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-500/25">
                {{ loggingIn() ? 'Signing in...' : 'Sign in' }}
              </button>
            </div>
          </div>
        }

        @case ('scan') {
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div>
              <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Scan items</h1>
              <p class="text-dark-500 mt-1">
                Signed in as {{ email() || 'shop owner' }} -
                {{ products().length }} products loaded
              </p>
              <p class="text-xs text-dark-400 mt-1"> {{ engineLabel() }} - camera sleeps after 2 minutes without a scan</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button (click)="openAdd()"
                class="flex items-center gap-2 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
                + Add item
              </button>
              <button (click)="openLabels()"
                class="flex items-center gap-2 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
                 Barcode labels
              </button>
              @if (cartCount() > 0) {
                <button (click)="openCart()"
                  class="flex items-center gap-2 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
                   Cart ({{ cartCount() }})
                </button>
              }
              <button (click)="signOut()"
                class="flex items-center gap-2 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
                Sign out
              </button>
            </div>
          </div>

          @if (scanMessage(); as message) {
            <p class="mb-4 text-sm rounded-lg px-3 py-2 border"
              [class]="scanFailed()
                ? 'text-red-600 bg-red-50 border-red-100'
                : 'text-emerald-700 bg-emerald-50 border-emerald-100'">
              {{ message }}
            </p>
          }

          @if (missingBarcode(); as code) {
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
              <p class="text-sm text-amber-900">
                Barcode <span class="font-mono font-semibold">{{ code }}</span> isn't in the catalogue yet.
              </p>
              <button (click)="openAdd(code)"
                class="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600">
                + Add this item
              </button>
            </div>
          }

          <div class="bg-white rounded-2xl border border-dark-100 overflow-hidden card-shadow-lg">
            <div class="relative bg-dark-950 aspect-video flex items-center justify-center">
              <video #video class="w-full h-full object-cover" playsinline muted autoplay></video>

              @if (!scanning()) {
                <div class="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 bg-dark-950/80">
                  <div class="text-4xl"></div>
                  <p class="text-dark-300 text-sm px-6">
                    Camera is off. Tap "Start camera" to scan - it switches itself off again after 2 minutes without a scan.
                  </p>
                </div>
              }

              @if (scanning()) {
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="w-64 h-40 border-2 border-primary-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]"></div>
                </div>
              }

              @if (!canScan()) {
                <div class="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 bg-dark-950/90 px-6">
                  <div class="text-4xl"></div>
                  <p class="text-dark-300 text-sm">
                    Camera scanning isn't available in this browser. Use the manual entry below.
                  </p>
                </div>
              }
            </div>

            <div class="p-5">
              @if (error(); as message) {
                <p class="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {{ message }}
                </p>
              }

              <div class="flex flex-wrap items-center gap-3">
                @if (canScan()) {
                  @if (scanning()) {
                    <button (click)="stop()"
                      class="bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
                      Stop camera
                    </button>
                  } @else {
                    <button (click)="start()"
                      class="bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-500/25">
                      Start camera
                    </button>
                  }
                }

                <div class="flex items-center gap-2 flex-1 min-w-[240px]">
                  <input [ngModel]="manualBarcode()" (ngModelChange)="manualBarcode.set($event)"
                    placeholder="Enter barcode manually..."
                    class="flex-1 bg-white border border-dark-200 rounded-xl px-4 py-2.5 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    (keyup.enter)="lookupManual()" />
                  <button (click)="lookupManual()" [disabled]="looking()"
                    class="text-sm font-semibold px-4 py-2.5 rounded-xl bg-dark-900 text-white hover:bg-dark-800 disabled:opacity-60 transition-colors">
                    {{ looking() ? '...' : 'Add' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          @if (lastScanned(); as item) {
            <div class="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary-200 bg-primary-50 px-5 py-4">
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-wide text-primary-700">Last scanned</p>
                <p class="truncate text-sm font-bold text-dark-900">{{ item.name }}</p>
                <p class="text-xs text-dark-500">
                  {{ item.category || 'Uncategorised' }} -
                  {{ item.stockQuantity }} in stock - barcode {{ item.barcode || '-' }}
                  @if (quantityInCart(item.productId) > 0) {
                    - <span class="font-semibold text-primary-700">x{{ quantityInCart(item.productId) }} in basket</span>
                  }
                </p>
              </div>
              <div class="flex items-center gap-3">
                <p class="text-lg font-bold text-dark-900">R {{ item.price | number:'1.2-2' }}</p>
                @if (canManage(item)) {
                  <button (click)="openRestock(item)"
                    class="bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    Restock
                  </button>
                }
                <button (click)="openCart()"
                  class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  View cart
                </button>
              </div>
            </div>
          }

          @if (cartCount() > 0) {
            <div class="sticky bottom-2 z-20 mt-4">
              <div class="flex items-center justify-between gap-3 rounded-2xl border border-primary-200 bg-white/95 px-4 py-3 shadow-xl shadow-black/10 backdrop-blur">
                <div class="min-w-0">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">Basket total</p>
                  <p class="text-lg font-bold text-dark-900">R {{ cartTotal() | number:'1.2-2' }}</p>
                  <p class="truncate text-xs text-dark-500">{{ cartCount() }} item(s) scanned</p>
                </div>
                <button (click)="openCart()"
                  class="shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                  View cart
                </button>
              </div>
            </div>
          }
        }

        @case ('labels') {
          <div class="flex flex-wrap items-center justify-between gap-4 mb-5 no-print">
            <div>
              <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Barcode labels</h1>
              <p class="text-dark-500 mt-1">
                Print these labels and scan them with the camera - each one rings up a real product.
              </p>
            </div>
            <div class="flex items-center gap-3">
              <button (click)="printLabels()"
                class="bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-500/25">
                Print labels
              </button>
              <button (click)="stage.set('scan')"
                class="bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
                <- Back to scanning
              </button>
            </div>
          </div>

          @if (products().length === 0) {
            <div class="bg-white rounded-2xl border border-dark-100 py-14 text-center card-shadow-lg">
              <p class="text-4xl mb-3"></p>
              <h3 class="font-semibold text-dark-900">No products to label yet</h3>
              <p class="text-sm text-dark-500 mt-1">Add products with barcodes and they will appear here.</p>
            </div>
          } @else {
            <div class="print-area bg-white rounded-2xl border border-dark-100 p-5 card-shadow-lg">
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                @for (product of products(); track product.productId) {
                  <div class="break-inside-avoid rounded-xl border border-dark-200 p-3">
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-dark-400">
                      {{ product.category || 'Product' }}
                    </p>
                    <p class="truncate text-sm font-bold text-dark-900">{{ product.name }}</p>
                    <p class="text-xs text-dark-500">
                      R {{ product.price | number:'1.2-2' }} - per {{ product.unit || 'item' }}
                    </p>
                    @if (product.barcode) {
                      <div class="mt-2">
                        <app-barcode #labelBarcode [value]="product.barcode" [height]="40" />
                      </div>
                      <button type="button" (click)="labelBarcode.downloadPng(product.name)"
                        class="no-print mt-2 w-full rounded-lg border border-dark-200 bg-dark-50 px-2 py-1.5 text-[11px] font-semibold text-dark-700 hover:bg-dark-100 transition-colors">
                        Download PNG
                      </button>
                    } @else {
                      <p class="mt-3 text-xs font-semibold text-red-600">No barcode set for this product.</p>
                    }
                  </div>
                }
              </div>
            </div>
          }
        }

        @case ('add') {
          <div class="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">
                {{ addMode() === 'restock' ? 'Restock item' : 'Add item' }}
              </h1>
              <p class="text-dark-500 mt-1">
                Scan the barcode or type it. Unknown codes create a product, known codes add stock.
              </p>
            </div>
            <button (click)="stage.set('scan')"
              class="bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
              <- Back to scanning
            </button>
          </div>

          <div class="bg-white rounded-2xl border border-dark-100 p-5 card-shadow-lg max-w-3xl">
            <label class="block">
              <span class="block text-xs font-semibold text-dark-500 uppercase mb-1.5">Barcode</span>
              <div class="flex gap-2">
                <input
                  [ngModel]="addBarcode()"
                  (ngModelChange)="addBarcode.set($event)"
                  (keyup.enter)="lookupAddBarcode()"
                  placeholder="Scan or type barcode..."
                  class="flex-1 bg-white border border-dark-200 rounded-xl px-4 py-2.5 text-sm font-mono text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400" />
                <button type="button" (click)="lookupAddBarcode()" [disabled]="savingProduct()"
                  class="text-sm font-semibold px-4 py-2.5 rounded-xl bg-dark-900 text-white hover:bg-dark-800 disabled:opacity-60 transition-colors">
                  Look up
                </button>
              </div>
            </label>

            @if (addError(); as message) {
              <p class="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {{ message }}
              </p>
            }

            @if (addMode() === 'restock' && restockProduct(); as product) {
              <div class="mt-5 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-primary-700">Editing an existing item</p>
                  <p class="text-lg font-bold text-dark-900">{{ product.name }}</p>
                  <p class="text-sm text-dark-600">
                    Linked to barcode <span class="font-mono">{{ product.barcode }}</span> -
                    {{ product.stockQuantity }} in stock
                  </p>
                </div>
                <button (click)="deleteProduct()" [disabled]="savingProduct()"
                  class="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors">
                  Remove item
                </button>
              </div>

              @if (!canManage(product)) {
                <p class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This item belongs to another business. You can sell it, but only its owner can change the price,
                  stock or details.
                </p>
              }
            }

            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <label class="block sm:col-span-2">
                <span class="block text-xs font-semibold text-dark-500 uppercase mb-1.5">Item name</span>
                <input [ngModel]="addName()" (ngModelChange)="addName.set($event)"
                  placeholder="e.g. Brown Bread Loaf"
                  class="w-full bg-white border border-dark-200 rounded-xl px-4 py-2.5 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </label>

              <label class="block">
                <span class="block text-xs font-semibold text-dark-500 uppercase mb-1.5">Category</span>
                <input [ngModel]="addCategory()" (ngModelChange)="addCategory.set($event)"
                  placeholder="Bakery"
                  class="w-full bg-white border border-dark-200 rounded-xl px-4 py-2.5 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </label>

              <label class="block">
                <span class="block text-xs font-semibold text-dark-500 uppercase mb-1.5">Unit</span>
                <input [ngModel]="addUnit()" (ngModelChange)="addUnit.set($event)"
                  placeholder="loaf / bottle / pack"
                  class="w-full bg-white border border-dark-200 rounded-xl px-4 py-2.5 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </label>

              <label class="block">
                <span class="block text-xs font-semibold text-dark-500 uppercase mb-1.5">Selling price (R)</span>
                <input type="number" min="0" step="0.01"
                  [ngModel]="addPrice()" (ngModelChange)="addPrice.set(toNumber($event))"
                  placeholder="0.00"
                  class="w-full bg-white border border-dark-200 rounded-xl px-4 py-2.5 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </label>

              @if (addMode() === 'restock') {
                <label class="block">
                  <span class="block text-xs font-semibold text-dark-500 uppercase mb-1.5">Units received</span>
                  <input type="number" min="0" step="1"
                    [ngModel]="restockAmount()" (ngModelChange)="restockAmount.set(toNumber($event))"
                    placeholder="0"
                    class="w-full bg-white border border-dark-200 rounded-xl px-4 py-2.5 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400" />
                  <span class="mt-1 block text-[11px] text-dark-400">
                    New stock will be
                    {{ (restockProduct()?.stockQuantity ?? 0) + (restockAmount() ?? 0) }}
                  </span>
                </label>
              } @else {
                <label class="block">
                  <span class="block text-xs font-semibold text-dark-500 uppercase mb-1.5">Opening stock</span>
                  <input type="number" min="0" step="1"
                    [ngModel]="addStock()" (ngModelChange)="addStock.set(toNumber($event))"
                    placeholder="0"
                    class="w-full bg-white border border-dark-200 rounded-xl px-4 py-2.5 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </label>
              }

              <label class="block sm:col-span-2">
                <span class="block text-xs font-semibold text-dark-500 uppercase mb-1.5">SKU (optional)</span>
                <input [ngModel]="addSku()" (ngModelChange)="addSku.set($event)"
                  placeholder="SKU-BREAD-BROWN"
                  class="w-full bg-white border border-dark-200 rounded-xl px-4 py-2.5 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </label>
            </div>

            <div class="mt-5 flex justify-end">
              <button (click)="saveProduct()" [disabled]="savingProduct() || !canEditCurrent()"
                class="bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-500/25">
                {{ savingProduct() ? 'Saving...' : (addMode() === 'restock' ? 'Save changes' : 'Add to inventory') }}
              </button>
            </div>
          </div>
        }

        @case ('cart') {
          <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">Cart</h1>
              <p class="text-dark-500 mt-1">
                {{ cartCount() }} item(s) - R {{ cartTotal() | number:'1.2-2' }} total
              </p>
            </div>
            <button (click)="stage.set('scan')"
              class="self-start whitespace-nowrap bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all sm:self-auto">
              <- Back to scanning
            </button>
          </div>

          @if (error(); as message) {
            <p class="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {{ message }}
            </p>
          }

          @if (cart().length === 0) {
            <div class="bg-white rounded-2xl border border-dark-100 py-14 text-center card-shadow-lg">
              <p class="text-4xl mb-3"></p>
              <h3 class="font-semibold text-dark-900">The cart is empty</h3>
              <p class="text-sm text-dark-500 mt-1">Scan a product to add it here.</p>
            </div>
          } @else {
            <div class="bg-white rounded-2xl border border-dark-100 card-shadow-lg">
              <div class="divide-y divide-dark-50">
                @for (line of cart(); track line.product.productId) {
                  <div class="px-4 py-4 sm:px-5">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-dark-900">{{ line.product.name }}</p>
                        <p class="mt-0.5 text-xs text-dark-500">
                          R {{ line.product.price | number:'1.2-2' }} each -
                          {{ line.product.stockQuantity }} in stock
                        </p>
                      </div>
                      <p class="shrink-0 text-sm font-bold text-dark-800">
                        R {{ line.product.price * line.quantity | number:'1.2-2' }}
                      </p>
                    </div>

                    <div class="mt-3 flex items-center justify-between gap-3">
                      <div class="flex items-center gap-1">
                        <button (click)="decrement(line.product.productId)"
                          class="h-9 w-9 rounded-lg border border-dark-200 text-lg leading-none text-dark-600 hover:bg-dark-50 transition-colors">-</button>
                        <span class="w-9 text-center text-sm font-semibold text-dark-900">{{ line.quantity }}</span>
                        <button (click)="increment(line.product.productId)"
                          [disabled]="line.quantity >= line.product.stockQuantity"
                          class="h-9 w-9 rounded-lg border border-dark-200 text-lg leading-none text-dark-600 hover:bg-dark-50 disabled:opacity-40 transition-colors">+</button>
                      </div>
                      <button (click)="remove(line.product.productId)"
                        class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                }
              </div>

              <div class="border-t border-dark-50 px-5 py-4 space-y-4">
                <div class="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p class="text-xs font-semibold text-dark-500 uppercase">Total</p>
                    <p class="text-xl font-bold text-dark-900">R {{ cartTotal() | number:'1.2-2' }}</p>
                  </div>

                  <div class="flex items-end gap-2">
                    <label class="block">
                      <span class="block text-xs font-semibold text-dark-500 uppercase mb-1">Cash received</span>
                      <input type="number" min="0" step="0.01"
                        [ngModel]="tenderAmount()" (ngModelChange)="setTender($event)"
                        placeholder="0.00"
                        class="w-32 bg-white border border-dark-200 rounded-xl px-3 py-2 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-400" />
                    </label>
                    <button (click)="setTender(cartTotal())"
                      class="text-sm font-semibold px-3 py-2 rounded-xl border border-dark-200 text-dark-700 hover:bg-dark-50 transition-colors">
                      Exact
                    </button>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  @for (amount of quickTenderAmounts; track amount) {
                    <button (click)="setTender(amount)"
                      class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-dark-50 text-dark-700 hover:bg-dark-100 transition-colors">
                      R {{ amount }}
                    </button>
                  }
                </div>

                @if (tenderAmount() !== null) {
                  <p class="text-sm font-semibold"
                    [class]="changeDue() >= 0 ? 'text-primary-700' : 'text-red-600'">
                    {{ changeDue() >= 0 ? 'Change due' : 'Short by' }}:
                    R {{ (changeDue() >= 0 ? changeDue() : -changeDue()) | number:'1.2-2' }}
                  </p>
                }

                @if (canCheckout()) {
                  <div class="flex justify-end">
                    <button (click)="checkout()" [disabled]="checkingOut() || !tenderIsValid()"
                      class="bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-500/25">
                      {{ checkingOut() ? 'Processing...' : 'Complete sale' }}
                    </button>
                  </div>
                } @else {
                  <p class="text-xs text-dark-500">
                    Only a shop owner or supplier can complete a sale.
                  </p>
                }
              </div>
            </div>
          }
        }

        @case ('receipt') {
          @if (receipt(); as sale) {
            <div class="max-w-md mx-auto mt-2">
              <div class="bg-white rounded-2xl border border-dark-100 overflow-hidden card-shadow-lg">
                <div class="bg-gradient-to-br from-primary-600 to-primary-800 px-6 py-6 text-center text-white">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-100">Payment received</p>
                  <p class="mt-1 text-3xl font-bold">R {{ sale.total | number:'1.2-2' }}</p>
                  <p class="mt-1 text-xs text-primary-100">{{ sale.at | date:'medium' }}</p>
                </div>

                <div class="px-6 py-4 space-y-2">
                  @for (line of sale.lines; track line.product.productId) {
                    <div class="flex justify-between gap-4 text-sm">
                      <span class="text-dark-700">
                        {{ line.quantity }} x {{ line.product.name }}
                        <span class="text-dark-400">&#64; R {{ line.product.price | number:'1.2-2' }}</span>
                      </span>
                      <span class="font-semibold text-dark-900">
                        R {{ line.product.price * line.quantity | number:'1.2-2' }}
                      </span>
                    </div>
                  }
                </div>

                <div class="border-t border-dashed border-dark-200 px-6 py-4 space-y-1.5 text-sm">
                  <div class="flex justify-between text-dark-600">
                    <span>Items</span>
                    <span>{{ receiptItemCount() }}</span>
                  </div>
                  <div class="flex justify-between text-dark-600">
                    <span>Cash received</span>
                    <span>R {{ sale.tendered | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between font-bold text-primary-700">
                    <span>Change</span>
                    <span>R {{ sale.change | number:'1.2-2' }}</span>
                  </div>
                </div>

                <div class="px-6 pb-6 flex gap-2">
                  <button (click)="newSale()"
                    class="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                    New sale
                  </button>
                  <button (click)="stage.set('scan')"
                    class="flex-1 bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                    Back to scanner
                  </button>
                </div>
              </div>
            </div>
          }
        }
      }
    </div>
  `
})
export class ScannerComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private api = inject(ScannerApiService);
  private session = inject(ScannerSessionStore);

  videoElement = viewChild<ElementRef<HTMLVideoElement>>('video');

  stage = signal<Stage>('scan');
  email = signal('');
  password = signal('');
  loggingIn = signal(false);

  products = signal<ScannedProduct[]>([]);
  cart = signal<CartLine[]>([]);
  error = signal<string | null>(null);
  scanMessage = signal<string | null>(null);
  scanFailed = signal(false);

  lastScanned = signal<ScannedProduct | null>(null);
  tenderAmount = signal<number | null>(null);
  receipt = signal<SaleReceipt | null>(null);

  // Add / restock inventory
  missingBarcode = signal<string | null>(null);
  addBarcode = signal('');
  addName = signal('');
  addCategory = signal('');
  addPrice = signal<number | null>(null);
  addUnit = signal('');
  addStock = signal<number | null>(1);
  addSku = signal('');
  addMode = signal<'create' | 'restock'>('create');
  restockProduct = signal<ScannedProduct | null>(null);
  restockAmount = signal<number | null>(1);
  savingProduct = signal(false);
  addError = signal<string | null>(null);

  readonly quickTenderAmounts = [50, 100, 200, 500];

  manualBarcode = signal('');
  looking = signal(false);
  checkingOut = signal(false);

  status = signal<ScannerStatus>('idle');
  cameraSupported = signal(false);
  engine = signal<DecodeEngine>('none');

  engineLabel = computed(() => ENGINE_LABEL[this.engine()]);
  canScan = computed(() => this.cameraSupported() && this.engine() !== 'none');

  scanning = computed(() => this.status() === 'scanning');
  cartCount = computed(() => this.cart().reduce((n, l) => n + l.quantity, 0));
  cartTotal = computed(() => this.cart().reduce((sum, l) => sum + l.product.price * l.quantity, 0));
  canCheckout = computed(() => this.api.canCheckout());

  quantityInCart(productId: string): number {
    return this.cart().find((line) => line.product.productId === productId)?.quantity ?? 0;
  }

  isSupplier(): boolean {
    return this.session.getRoles().includes('Supplier');
  }

  /** Mirrors the API rule: only the product's owner may change price or stock. */
  canManage(product: ScannedProduct): boolean {
    const me = this.session.getRoleUserId();
    if (!me) return false;

    return this.isSupplier() ? product.supplierId === me : product.shopOwnerId === me;
  }

  canEditCurrent = computed(() => {
    if (this.addMode() === 'create') return true;

    const product = this.restockProduct();
    return product ? this.canManage(product) : false;
  });

  receiptItemCount = computed(() =>
    this.receipt()?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0);

  changeDue = computed(() => {
    const tender = this.tenderAmount();
    if (tender === null) return 0;
    return Math.round((tender - this.cartTotal()) * 100) / 100;
  });

  tenderIsValid = computed(() => {
    const tender = this.tenderAmount();
    return tender === null || tender >= this.cartTotal();
  });

  private detector: BarcodeDetectorLike | null = null;
  private zxing: BrowserMultiFormatReader | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private rafId = 0;
  private lastBarcode: string | null = null;
  private lastBarcodeAt = 0;
  private lastActivityAt = 0;
  private lastDecodeAt = 0;
  private inactivityTimer: ReturnType<typeof setInterval> | null = null;

  private static readonly IDLE_TIMEOUT_MS = 2 * 60 * 1000;
  private static readonly REPEAT_COOLDOWN_MS = 2000;
  private static readonly DECODE_THROTTLE_MS = 140;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const hasCamera = !!navigator.mediaDevices?.getUserMedia;
      const hasDetector =
        typeof (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector === 'function';

      this.cameraSupported.set(hasCamera && typeof document !== 'undefined');
      this.engine.set(!hasCamera ? 'none' : hasDetector ? 'native' : 'zxing');
    }

    if (this.api.isLoggedIn()) {
      this.stage.set('scan');
      this.email.set(this.api.currentEmail() ?? '');
      this.loadProducts();
    } else {
      this.stage.set('login');
    }
  }

  submitLogin(): void {
    this.error.set(null);
    this.loggingIn.set(true);

    this.api.login(this.email(), this.password()).subscribe({
      next: () => {
        if (!this.api.hasScannerRole()) {
          this.api.logout();
          this.loggingIn.set(false);
          this.password.set('');
          this.error.set('The scanner is available to shop owners and suppliers. Drivers should use the driver portal.');
          return;
        }

        this.loggingIn.set(false);
        this.password.set('');
        this.stage.set('scan');
        this.loadProducts();
      },
      error: (err: Error) => {
        this.loggingIn.set(false);
        this.error.set(err.message);
      },
    });
  }

  signOut(): void {
    this.stop();
    this.api.logout();
    this.cart.set([]);
    this.products.set([]);
    this.lastScanned.set(null);
    this.receipt.set(null);
    this.stage.set('login');
  }

  openLabels(): void {
    this.stop();
    this.stage.set('labels');
  }

  openAdd(barcode = ''): void {
    this.stop();
    this.resetAddForm();
    this.addBarcode.set(barcode);
    this.addMode.set('create');
    this.restockProduct.set(null);
    this.addError.set(null);
    this.stage.set('add');

    if (barcode) {
      this.lookupAddBarcode();
    }
  }

  openRestock(product: ScannedProduct): void {
    this.stop();
    this.resetAddForm();
    this.addBarcode.set(product.barcode ?? '');
    this.restockProduct.set(product);
    this.addMode.set('restock');
    this.restockAmount.set(0);
    this.fillFormFromProduct(product);
    this.addError.set(null);
    this.stage.set('add');
  }

  lookupAddBarcode(): void {
    const barcode = this.addBarcode().trim();

    if (!barcode) {
      this.addError.set('Scan or type a barcode first.');
      return;
    }

    this.savingProduct.set(true);
    this.addError.set(null);

    this.api.getProductByBarcode(barcode).subscribe({
      next: (product) => {
        this.savingProduct.set(false);
        this.restockProduct.set(product);
        this.addMode.set('restock');
        this.restockAmount.set(0);
        this.fillFormFromProduct(product);
      },
      error: () => {
        // Not in the catalogue yet - the barcode becomes a new item.
        this.savingProduct.set(false);
        this.restockProduct.set(null);
        this.addMode.set('create');
        this.addName.set('');
        this.addCategory.set('');
        this.addPrice.set(null);
        this.addUnit.set('');
        this.addSku.set('');
        this.addStock.set(1);
      },
    });
  }

  private fillFormFromProduct(product: ScannedProduct): void {
    this.addName.set(product.name);
    this.addCategory.set(product.category ?? '');
    this.addPrice.set(product.price);
    this.addUnit.set(product.unit ?? '');
    this.addSku.set(product.stockKeepUnit ?? '');
  }

  deleteProduct(): void {
    const product = this.restockProduct();
    if (!product) return;

    if (
      isPlatformBrowser(this.platformId) &&
      !window.confirm(`Remove "${product.name}" from the catalogue? Past sales are kept.`)
    ) {
      return;
    }

    this.savingProduct.set(true);
    this.addError.set(null);

    this.api.deleteProduct(product.productId).subscribe({
      next: () => {
        this.savingProduct.set(false);
        this.scanMessage.set(`${product.name} removed from the catalogue.`);
        this.scanFailed.set(false);
        this.missingBarcode.set(null);
        this.loadProducts();
        this.stage.set('scan');
      },
      error: (err: Error) => {
        this.savingProduct.set(false);
        this.addError.set(err.message);
      },
    });
  }

  saveProduct(): void {
    const barcode = this.addBarcode().trim();
    this.addError.set(null);

    if (this.addMode() === 'restock') {
      const product = this.restockProduct();
      const received = this.restockAmount() ?? 0;
      const name = this.addName().trim();
      const price = this.addPrice();

      if (!product) return;

      if (received < 0) {
        this.addError.set('Units received cannot be negative.');
        return;
      }

      if (!name) {
        this.addError.set('Give the item a name.');
        return;
      }

      if (price === null || price < 0) {
        this.addError.set('Enter a valid price.');
        return;
      }

      this.savingProduct.set(true);

      this.api
        .updateProduct(product.productId, {
          barcode: product.barcode ?? barcode,
          name,
          category: this.addCategory().trim() || null,
          price,
          stockQuantity: product.stockQuantity + received,
          unit: this.addUnit().trim() || null,
          stockKeepUnit: this.addSku().trim() || null,
          supplierId: product.supplierId,
          shopOwnerId: product.shopOwnerId,
        })
        .subscribe({
          next: (updated) => {
            this.savingProduct.set(false);
            this.scanMessage.set(
              `${updated.name} saved - ${updated.stockQuantity} in stock.`
            );
            this.scanFailed.set(false);
            this.missingBarcode.set(null);
            this.loadProducts();
            this.stage.set('scan');
          },
          error: (err: Error) => {
            this.savingProduct.set(false);
            this.addError.set(err.message);
          },
        });

      return;
    }

    const name = this.addName().trim();
    const price = this.addPrice();
    const stock = this.addStock();
    const stockValue = stock === null ? 0 : stock;

    if (!/^\d{6,14}$/.test(barcode)) {
      this.addError.set('Enter a barcode of 6-14 digits.');
      return;
    }

    if (!name) {
      this.addError.set('Give the item a name.');
      return;
    }

    if (price === null || price < 0) {
      this.addError.set('Enter a valid price.');
      return;
    }

    if (stock === null || stock < 0) {
      this.addError.set('Enter the opening stock quantity.');
      return;
    }

    this.savingProduct.set(true);

    this.api
      .createProduct({
        barcode,
        name,
        category: this.addCategory().trim() || null,
        price,
        stockQuantity: stockValue,
        unit: this.addUnit().trim() || null,
        stockKeepUnit: this.addSku().trim() || null,
      })
      .subscribe({
        next: (created) => {
          this.savingProduct.set(false);
          this.scanMessage.set(
            `${created.name} added - ${created.stockQuantity} in stock. Scan it to sell it.`
          );
          this.scanFailed.set(false);
          this.missingBarcode.set(null);
          this.loadProducts();
          this.stage.set('scan');
        },
        error: (err: Error) => {
          this.savingProduct.set(false);
          this.addError.set(err.message);
        },
      });
  }

  private resetAddForm(): void {
    this.addBarcode.set('');
    this.addName.set('');
    this.addCategory.set('');
    this.addPrice.set(null);
    this.addUnit.set('');
    this.addStock.set(1);
    this.addSku.set('');
    this.addError.set(null);
  }

  printLabels(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.print();
    }
  }

  setTender(value: number | string | null): void {
    if (value === null || value === '') {
      this.tenderAmount.set(null);
      return;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    this.tenderAmount.set(Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null);
  }

  toNumber(value: number | string | null): number | null {
    if (value === null || value === '') return null;

    const parsed = typeof value === 'number' ? value : Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  newSale(): void {
    this.receipt.set(null);
    this.error.set(null);
    this.lastScanned.set(null);
    this.stage.set('scan');
  }

  private loadProducts(): void {
    this.api.getAllProducts().subscribe({
      next: list => this.products.set(list),
      error: (err: Error) => this.error.set(err.message),
    });
  }

  async start(): Promise<void> {
    if (!this.canScan()) return;

    this.error.set(null);

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      const video = this.videoElement()?.nativeElement;
      if (!video) {
        this.stopStream();
        return;
      }

      video.srcObject = this.stream;
      await video.play();

      if (this.engine() === 'native') {
        const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
        if (!Ctor) {
          this.error.set('Barcode Detector API is unavailable.');
          this.stopStream();
          return;
        }
        this.detector = new Ctor({ formats: DETECTOR_FORMATS });
      } else {
        this.zxing = new BrowserMultiFormatReader();
        this.zxing.possibleFormats = ZXING_FORMATS;
        this.canvas = document.createElement('canvas');
      }

      this.status.set('scanning');
      this.startInactivityWatch();
      void this.scanFrame();
    } catch (err) {
      this.error.set(this.describeCameraError(err));
      this.status.set('idle');
      this.stopStream();
    }
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    this.stopInactivityWatch();
    this.stopStream();
    if (this.status() === 'scanning') this.status.set('idle');
  }

  /** Leave the camera behind when moving to another screen. */
  openCart(): void {
    this.stop();
    this.stage.set('cart');
  }

  private startInactivityWatch(): void {
    this.stopInactivityWatch();
    this.lastActivityAt = Date.now();

    this.inactivityTimer = setInterval(() => {
      if (this.status() !== 'scanning') return;

      if (Date.now() - this.lastActivityAt >= ScannerComponent.IDLE_TIMEOUT_MS) {
        this.stop();
        this.scanMessage.set(
          'Camera switched off after 2 minutes without a scan. Tap "Start camera" when you are ready.'
        );
        this.scanFailed.set(false);
      }
    }, 5000);
  }

  private stopInactivityWatch(): void {
    if (this.inactivityTimer !== null) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  lookupManual(): void {
    const barcode = this.manualBarcode().trim();
    if (!barcode) return;
    this.addByBarcode(barcode);
    this.manualBarcode.set('');
  }

  private addByBarcode(barcode: string): void {
    this.looking.set(true);
    this.error.set(null);

    this.api.getProductByBarcode(barcode).subscribe({
      next: product => {
        this.looking.set(false);
        this.addToCart(product);
      },
      error: (err: Error) => {
        this.looking.set(false);
        this.scanMessage.set(err.message);
        this.scanFailed.set(true);
        this.missingBarcode.set(barcode);
      },
    });
  }

  private addToCart(product: ScannedProduct): void {
    const existing = this.cart().find(l => l.product.productId === product.productId);

    if (existing && existing.quantity >= product.stockQuantity) {
      this.scanMessage.set(`Only ${product.stockQuantity} of ${product.name} in stock.`);
      this.scanFailed.set(true);
      return;
    }

    this.cart.update(lines =>
      existing
        ? lines.map(l =>
            l.product.productId === product.productId ? { ...l, quantity: l.quantity + 1 } : l)
        : [...lines, { product, quantity: 1 }]
    );

    this.lastScanned.set(product);
    this.missingBarcode.set(null);
    this.scanMessage.set(
      `Added ${product.name} - R ${product.price.toFixed(2)} - ${product.stockQuantity} in stock`
    );
    this.scanFailed.set(false);
  }

  increment(productId: string): void {
    this.cart.update(lines =>
      lines.map(l =>
        l.product.productId === productId && l.quantity < l.product.stockQuantity
          ? { ...l, quantity: l.quantity + 1 }
          : l));
  }

  decrement(productId: string): void {
    this.cart.update(lines =>
      lines.flatMap(l => {
        if (l.product.productId !== productId) return [l];
        return l.quantity > 1 ? [{ ...l, quantity: l.quantity - 1 }] : [];
      }));
  }

  remove(productId: string): void {
    this.cart.update(lines => lines.filter(l => l.product.productId !== productId));
  }

  checkout(): void {
    const lines = this.cart();
    if (lines.length === 0) return;

    if (!this.api.canCheckout()) {
      this.error.set('Only a shop owner or supplier can complete a sale. Sign in with a business account to checkout.');
      return;
    }

    if (!this.tenderIsValid()) {
      this.error.set('Cash received is less than the total. Add more cash or tap Exact.');
      return;
    }

    const total = this.cartTotal();
    const tendered = this.tenderAmount() ?? total;

    this.checkingOut.set(true);
    this.error.set(null);

    this.api.checkout(lines).subscribe({
      next: () => {
        this.checkingOut.set(false);
        this.receipt.set({
          lines,
          total,
          tendered,
          change: Math.round((tendered - total) * 100) / 100,
          at: new Date(),
        });
        this.cart.set([]);
        this.tenderAmount.set(null);
        this.lastScanned.set(null);
        this.stage.set('receipt');
        this.loadProducts();
      },
      error: (err: Error) => {
        this.checkingOut.set(false);
        this.error.set(err.message);
      },
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    this.stopInactivityWatch();
    this.stopStream();
  }

  private async scanFrame(): Promise<void> {
    if (this.status() !== 'scanning') return;

    const video = this.videoElement()?.nativeElement;
    const now = Date.now();

    if (
      video &&
      video.readyState >= video.HAVE_CURRENT_DATA &&
      now - this.lastDecodeAt >= ScannerComponent.DECODE_THROTTLE_MS
    ) {
      this.lastDecodeAt = now;

      const barcode = this.engine() === 'native'
        ? await this.decodeNative(video)
        : this.decodeZxing(video);

      if (barcode) {
        this.onDetected(barcode);
      } else if (this.lastBarcode && now - this.lastBarcodeAt > 800) {
        // The barcode left the frame, so scanning the same item again will count.
        this.lastBarcode = null;
      }
    }

    if (this.status() === 'scanning') {
      this.rafId = requestAnimationFrame(() => void this.scanFrame());
    }
  }

  private async decodeNative(video: HTMLVideoElement): Promise<DetectedBarcode | null> {
    const detector = this.detector;
    if (!detector) return null;

    try {
      const codes = await detector.detect(video);
      return codes[0] ?? null;
    } catch {
      return null;
    }
  }

  private decodeZxing(video: HTMLVideoElement): DetectedBarcode | null {
    const reader = this.zxing;
    const canvas = this.canvas;
    if (!reader || !canvas) return null;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    context.drawImage(video, 0, 0, width, height);

    try {
      const result = reader.decodeFromCanvas(canvas);
      const text = result?.getText();
      if (!text) return null;
      return { rawValue: text, format: String(result.getBarcodeFormat()) };
    } catch {
      return null;
    }
  }

  private onDetected(code: DetectedBarcode): void {
    const now = Date.now();
    this.lastActivityAt = now;

    // A lookup is already running; let the next pass pick the item up.
    if (this.looking()) return;

    // Scanning the same item again adds to its quantity, but not once per camera frame.
    if (
      code.rawValue === this.lastBarcode &&
      now - this.lastBarcodeAt < ScannerComponent.REPEAT_COOLDOWN_MS
    ) {
      return;
    }

    this.lastBarcode = code.rawValue;
    this.lastBarcodeAt = now;
    navigator.vibrate?.(60);
    this.addByBarcode(code.rawValue);
  }

  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    const video = this.videoElement()?.nativeElement;
    if (video) video.srcObject = null;

    this.detector = null;
    this.zxing = null;
    this.canvas = null;
  }

  private describeCameraError(err: unknown): string {
    if (err instanceof DOMException) {
      switch (err.name) {
        case 'NotAllowedError':
          return 'Camera permission was denied. Allow camera access and try again.';
        case 'NotFoundError':
        case 'OverconstrainedError':
          return 'No camera was found on this device.';
        case 'NotReadableError':
          return 'The camera is already in use by another application.';
        default:
          return `Camera error: ${err.message}`;
      }
    }
    return 'Unable to start the camera.';
  }
}


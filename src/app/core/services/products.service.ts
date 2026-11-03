import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Product } from '../models';

const PRODUCTS: Product[] = [
  { id: '1', sku: 'BEV-1001', name: 'Coca-Cola 2L', category: 'Beverages', price: 28, stock: 480, reorderLevel: 100, unit: 'bottle' },
  { id: '2', sku: 'BEV-1002', name: 'Fanta Orange 2L', category: 'Beverages', price: 28, stock: 62, reorderLevel: 100, unit: 'bottle' },
  { id: '3', sku: 'BEV-1003', name: 'Still Water 5L', category: 'Beverages', price: 35, stock: 210, reorderLevel: 80, unit: 'bottle' },
  { id: '4', sku: 'GRN-2001', name: 'Maize Meal 5kg', category: 'Grains', price: 62, stock: 34, reorderLevel: 120, unit: 'bag' },
  { id: '5', sku: 'GRN-2002', name: 'White Rice 10kg', category: 'Grains', price: 145, stock: 190, reorderLevel: 60, unit: 'bag' },
  { id: '6', sku: 'GRN-2003', name: 'Sugar 2.5kg', category: 'Grains', price: 48, stock: 140, reorderLevel: 70, unit: 'pack' },
  { id: '7', sku: 'SNK-3001', name: 'Simba Chips 125g', category: 'Snacks', price: 18, stock: 520, reorderLevel: 150, unit: 'pack' },
  { id: '8', sku: 'SNK-3002', name: 'Bakers Marie Biscuits', category: 'Snacks', price: 24, stock: 88, reorderLevel: 100, unit: 'pack' },
  { id: '9', sku: 'DRY-4001', name: 'Full Cream Milk 1L', category: 'Dairy', price: 22, stock: 96, reorderLevel: 120, unit: 'carton' },
  { id: '10', sku: 'DRY-4002', name: 'Amasi 1L', category: 'Dairy', price: 26, stock: 45, reorderLevel: 60, unit: 'carton' },
  { id: '11', sku: 'DRY-4003', name: 'Cheddar Cheese 400g', category: 'Dairy', price: 68, stock: 130, reorderLevel: 50, unit: 'pack' },
  { id: '12', sku: 'HOM-5001', name: 'Sunlight Soap 2-pack', category: 'Household', price: 42, stock: 275, reorderLevel: 90, unit: 'pack' },
];

@Injectable({ providedIn: 'root' })
export class ProductsService {
  getProducts(): Observable<Product[]> {
    return of(PRODUCTS.map(p => ({ ...p })));
  }
}

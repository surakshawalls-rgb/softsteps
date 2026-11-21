import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { CartItem, NewCartItem } from '../../shared/models/cart.model';

const STORAGE_KEY = 'softsteps.cart.v1';
const MAX_QUANTITY_PER_LINE = 99;

/** Shows a price the way the rest of the site does (₹ with Indian digit grouping). */
export function formatMoney(value: number, currency = 'INR'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'AED' ? 'AED ' : '₹';
  return symbol + value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/**
 * The shopping cart. Items are saved in the visitor's browser (localStorage),
 * so the cart survives a page refresh. Each line is found by product code + size.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly lines = signal<CartItem[]>(this.load());

  readonly items = this.lines.asReadonly();
  readonly count = computed(() => this.lines().reduce((total, item) => total + item.quantity, 0));
  readonly subtotal = computed(() =>
    this.lines().reduce((total, item) => total + item.unitPrice * item.quantity, 0),
  );
  readonly currency = computed(() => this.lines()[0]?.currency ?? 'INR');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // keep several open tabs in step with each other
      window.addEventListener('storage', event => {
        if (event.key === STORAGE_KEY) {
          this.lines.set(this.load());
        }
      });
    }
  }

  lineId(productCode: string, size: string): string {
    return `${productCode}|${size}`;
  }

  /** Adds a rug. If the same product code + size is already in the cart, the quantity goes up. */
  add(item: NewCartItem, quantity = 1): void {
    const code = item.productCode.trim();
    if (!code || !Number.isFinite(item.unitPrice)) {
      return;
    }

    const id = this.lineId(code, item.size);
    const amount = this.cleanQuantity(quantity);

    this.update(current => {
      const existing = current.find(line => line.id === id);
      if (existing) {
        return current.map(line =>
          line.id === id
            ? { ...line, ...item, productCode: code, id, quantity: this.cleanQuantity(line.quantity + amount) }
            : line,
        );
      }
      return [...current, { ...item, productCode: code, id, quantity: amount }];
    });
  }

  setQuantity(id: string, quantity: number): void {
    if (quantity < 1) {
      this.remove(id);
      return;
    }
    this.update(current =>
      current.map(line => (line.id === id ? { ...line, quantity: this.cleanQuantity(quantity) } : line)),
    );
  }

  remove(id: string): void {
    this.update(current => current.filter(line => line.id !== id));
  }

  clear(): void {
    this.update(() => []);
  }

  private cleanQuantity(value: number): number {
    const whole = Math.floor(Number(value));
    if (!Number.isFinite(whole) || whole < 1) return 1;
    return Math.min(whole, MAX_QUANTITY_PER_LINE);
  }

  private update(change: (current: CartItem[]) => CartItem[]): void {
    const next = change(this.lines());
    this.lines.set(next);
    this.save(next);
  }

  private load(): CartItem[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (line): line is CartItem =>
          !!line &&
          typeof line.id === 'string' &&
          typeof line.productCode === 'string' &&
          typeof line.name === 'string' &&
          typeof line.size === 'string' &&
          typeof line.unitPrice === 'number' &&
          typeof line.quantity === 'number' &&
          line.quantity > 0,
      );
    } catch {
      return [];
    }
  }

  private save(items: CartItem[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // private browsing / full storage: the cart still works until the page is closed
    }
  }
}
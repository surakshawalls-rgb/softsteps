import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService, formatMoney } from '../../../core/services/cart.service';
import { OfferBadge } from '../../../shared/components/offer-badge/offer-badge';
import { CartItem } from '../../../shared/models/cart.model';

/** WhatsApp number used across the site (same as the enquiry form). */
const WHATSAPP_NUMBER = '917007131072';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, OfferBadge],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css',
})
export class CartPage {
  protected readonly cart = inject(CartService);

  money(value: number, currency: string): string {
    return formatMoney(value, currency);
  }

  lineTotal(item: CartItem): number {
    return item.unitPrice * item.quantity;
  }

  /** How much cheaper one piece is because of its offer (0 when there is no offer). */
  unitSaving(item: CartItem): number {
    const original = item.originalUnitPrice;
    return typeof original === 'number' && original > item.unitPrice ? original - item.unitPrice : 0;
  }

  lineSaving(item: CartItem): number {
    return this.unitSaving(item) * item.quantity;
  }

  /** Total saved across the cart. */
  get totalSaving(): number {
    return this.cart.items().reduce((total, item) => total + this.lineSaving(item), 0);
  }

  /** What the cart would cost without any offers. */
  get subtotalBeforeOffers(): number {
    return this.cart.subtotal() + this.totalSaving;
  }

  /** Percent saved on the whole cart, rounded (0 when there is no offer). */
  get savingPercent(): number {
    const before = this.subtotalBeforeOffers;
    return before > 0 ? Math.round((this.totalSaving / before) * 100) : 0;
  }

  /** Names of the offers used in the cart, e.g. "Black Friday Offer". */
  get offerNames(): string {
    const names = this.cart
      .items()
      .map(item => item.offer?.name)
      .filter((name): name is string => !!name);

    return Array.from(new Set(names)).join(' & ');
  }

  /** Opens WhatsApp with the whole cart written out, listed by product code. */
  get whatsappUrl(): string {
    const lines = this.cart.items().map(
      (item, index) =>
        `${index + 1}. ${item.name} | Code: ${item.productCode} | Size: ${item.size} | Qty: ${item.quantity} | ${formatMoney(this.lineTotal(item), item.currency)}${item.offer ? ` | Offer: ${item.offer.name} (${item.offer.percentOff}% off)` : ''}`,
    );

    const message = [
      'Order request: Soft Steps Carpets & Rugs',
      '',
      ...lines,
      '',
      `Total: ${formatMoney(this.cart.subtotal(), this.cart.currency())}`,
      '',
      'Please confirm availability, delivery and payment details.',
    ].join('\n');

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }
}
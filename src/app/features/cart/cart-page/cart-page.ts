import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService, formatMoney } from '../../../core/services/cart.service';
import { CartItem } from '../../../shared/models/cart.model';

/** WhatsApp number used across the site (same as the enquiry form). */
const WHATSAPP_NUMBER = '917007131072';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink],
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

  /** Opens WhatsApp with the whole cart written out, listed by product code. */
  get whatsappUrl(): string {
    const lines = this.cart.items().map(
      (item, index) =>
        `${index + 1}. ${item.name} | Code: ${item.productCode} | Size: ${item.size} | Qty: ${item.quantity} | ${formatMoney(this.lineTotal(item), item.currency)}`,
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
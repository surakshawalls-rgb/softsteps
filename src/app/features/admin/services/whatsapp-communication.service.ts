import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WhatsAppCommunicationService {
  buildWhatsAppUrl(recipientPhone: string, message: string): string {
    const phone = recipientPhone.replace(/\D/g, '');

    if (!phone || phone.length < 8) {
      throw new Error('Please enter a valid WhatsApp number, including the country code.');
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }
}

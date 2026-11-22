import { Component, Input } from '@angular/core';

import { AppliedOffer } from '../../models/offer.model';

/** Small label shown on a product that is in a live offer, e.g. "Diwali Offer · 15% OFF". */
@Component({
  selector: 'app-offer-badge',
  template: `
    @if (offer) {
      <span class="offer-badge" [class.large]="large">
        <span class="offer-badge-name">{{ offer.name }}</span>
        <span class="offer-badge-off">{{ offer.percentOff }}% OFF</span>
        @if (showEnds && endsText) {
          <span class="offer-badge-ends">{{ endsText }}</span>
        }
      </span>
    }
  `,
  styles: [
    `
      .offer-badge {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.2rem 0.55rem;
        padding: 0.3rem 0.75rem;
        border-radius: 999px;
        background: #7a1f1f;
        box-shadow: 0 4px 14px rgba(26, 22, 18, 0.25);
        color: #fff;
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        line-height: 1.3;
        text-transform: uppercase;
      }

      .offer-badge.large {
        padding: 0.45rem 1rem;
        font-size: 0.74rem;
      }

      .offer-badge-off {
        color: #ffd98a;
      }

      .offer-badge-ends {
        font-weight: 600;
        letter-spacing: 0.02em;
        opacity: 0.85;
        text-transform: none;
      }
    `,
  ],
})
export class OfferBadge {
  @Input() offer: AppliedOffer | null | undefined = null;
  @Input() large = false;
  @Input() showEnds = false;

  get endsText(): string | null {
    const ends = this.offer?.endsAt;

    if (!ends) {
      return null;
    }

    const msLeft = new Date(ends).getTime() - Date.now();

    if (msLeft <= 0) {
      return null;
    }

    const daysLeft = Math.ceil(msLeft / 86_400_000);

    if (msLeft < 86_400_000) {
      return 'Ends today';
    }

    if (daysLeft <= 14) {
      return `Ends in ${daysLeft} days`;
    }

    return `Ends ${new Date(ends).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  }
}
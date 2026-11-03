import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { SupabaseService } from '../../../core/services/supabase.service';
import {
  HeroContent,
  describeOffer,
  festivalFromOfferLabel,
  heroForFestival,
  resolveHero,
} from './festival-hero';

interface OfferRow {
  offer_label: string | null;
  offer_discount_type: string | null;
  offer_discount_value: number | string | null;
}

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home-hero.html',
  host: { style: 'display: block' },
})
export class HomeHero implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly sanitizer = inject(DomSanitizer);

  /** What the hero shows (festival banner + texts, or the normal hero). */
  readonly content = signal<HeroContent>(resolveHero(new Date()));

  /**
   * Festival banner for the single slide. null = normal hero with the original photos.
   * While a festival banner is live the original photos are not shown at all.
   */
  readonly art = computed<SafeUrl | string | null>(() => {
    const art = this.content().art;

    return art?.startsWith('data:') ? this.sanitizer.bypassSecurityTrustUrl(art) : art;
  });

  /** e.g. "Up to 15% off", filled in when the admin has applied this festival's offer. */
  readonly offerText = signal<string | null>(null);

  readonly eyebrow = computed(() => {
    const offer = this.offerText();
    const content = this.content();

    return offer && content.offerLabel ? `${content.offerLabel} · ${offer}` : content.eyebrow;
  });

  readonly primaryCta = computed(() => {
    const content = this.content();

    return this.offerText() && content.festivalName
      ? `Shop ${content.festivalName} offer`
      : content.primaryCta;
  });

  ngOnInit(): void {
    void this.loadOffers();
  }

  /**
   * Looks at the offers that are live right now:
   * - during a festival, shows the offer for that festival in the hero text;
   * - after the festival date, the festival banner stays for as long as that festival's
   *   offer is still applied to products, and goes away when the admin removes the offer.
   */
  private async loadOffers(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('products')
        .select('offer_label, offer_discount_type, offer_discount_value')
        .not('offer_type', 'is', null)
        .limit(1000);

      if (error || !data) {
        return;
      }

      const rows = data as OfferRow[];
      let current = this.content();

      if (!current.festivalName) {
        const counts = new Map<string, number>();

        for (const row of rows) {
          const festival = festivalFromOfferLabel(row.offer_label);

          if (festival) {
            counts.set(festival, (counts.get(festival) ?? 0) + 1);
          }
        }

        const live = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

        if (!live) {
          return;
        }

        current = heroForFestival(live);
        this.content.set(current);
      }

      const matching = rows.filter((row) => row.offer_label === current.offerLabel);
      this.offerText.set(describeOffer(matching));
    } catch {
      // the hero simply keeps what it already shows
    }
  }
}
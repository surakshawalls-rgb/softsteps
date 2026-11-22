import { Injectable, inject } from '@angular/core';

import { DiscountType, OfferType, ProductOffer } from '../../shared/models/offer.model';
import { Product } from '../../shared/models/product.model';
import { applyOffersToProduct, isOfferLive } from '../../shared/utils/offer-pricing';
import { SupabaseService } from './supabase.service';

/** What the admin sends when creating or changing an offer. */
export interface OfferInput {
  name: string;
  offer_type: OfferType;
  discount_type: DiscountType;
  discount_value: number;
  product_codes: string[];
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
}

const CACHE_MS = 60_000;

/**
 * Offers on products.
 * - Visitors: getLiveOffers() / applyTo() lower the prices of products that are in a live offer.
 * - Admin: listAll(), create(), update(), setActive(), remove() manage the offers.
 */
@Injectable({ providedIn: 'root' })
export class OfferService {
  private readonly client = inject(SupabaseService).client;
  private cache: { at: number; offers: ProductOffer[] } | null = null;
  private pending: Promise<ProductOffer[]> | null = null;

  // ------------------------------------------------------------------
  // Visitors
  // ------------------------------------------------------------------

  /** Offers that are running right now. Never fails: if anything goes wrong there are simply no offers. */
  async getLiveOffers(): Promise<ProductOffer[]> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) {
      return this.cache.offers;
    }

    if (!this.pending) {
      this.pending = this.fetchLive().finally(() => {
        this.pending = null;
      });
    }

    return this.pending;
  }

  /** Returns the products with live offers applied to their prices. */
  async applyTo(products: Product[]): Promise<Product[]> {
    const offers = await this.getLiveOffers();

    return offers.length === 0 ? products : products.map((product) => applyOffersToProduct(product, offers));
  }

  /** Forget the saved list so the next visit asks the database again. */
  invalidate(): void {
    this.cache = null;
  }

  private async fetchLive(): Promise<ProductOffer[]> {
    let offers: ProductOffer[] = [];

    try {
      const now = new Date().toISOString();
      const { data, error } = await this.client
        .from('product_offers')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gt.${now}`);

      if (error) {
        throw error;
      }

      offers = (data ?? [])
        .map((row: Record<string, unknown>) => this.toOffer(row))
        .filter((offer: ProductOffer) => isOfferLive(offer));
    } catch {
      offers = []; // e.g. the offers table has not been created yet
    }

    this.cache = { at: Date.now(), offers };

    return offers;
  }

  // ------------------------------------------------------------------
  // Admin (needs a signed-in admin: the database checks this)
  // ------------------------------------------------------------------

  async listAll(): Promise<ProductOffer[]> {
    const { data, error } = await this.client
      .from('product_offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: Record<string, unknown>) => this.toOffer(row));
  }

  async create(input: OfferInput): Promise<void> {
    const { error } = await this.client.from('product_offers').insert(input);

    if (error) {
      throw error;
    }

    this.invalidate();
  }

  async update(id: string, input: OfferInput): Promise<void> {
    const { error } = await this.client.from('product_offers').update(input).eq('id', id);

    if (error) {
      throw error;
    }

    this.invalidate();
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.client.from('product_offers').update({ is_active: isActive }).eq('id', id);

    if (error) {
      throw error;
    }

    this.invalidate();
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('product_offers').delete().eq('id', id);

    if (error) {
      throw error;
    }

    this.invalidate();
  }

  private toOffer(row: Record<string, unknown>): ProductOffer {
    return {
      id: String(row['id']),
      name: String(row['name'] ?? ''),
      offer_type: row['offer_type'] as OfferType,
      discount_type: row['discount_type'] as DiscountType,
      discount_value: Number(row['discount_value']),
      product_codes: Array.isArray(row['product_codes']) ? row['product_codes'].map(String) : [],
      starts_at: String(row['starts_at']),
      ends_at: row['ends_at'] ? String(row['ends_at']) : null,
      is_active: row['is_active'] !== false,
      created_at: row['created_at'] ? String(row['created_at']) : undefined,
    };
  }
}
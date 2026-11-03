import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SupabaseService } from '../../../../core/services/supabase.service';
import {
  UpcomingFestival,
  calendarNeedsUpdate,
  describeDaysLeft,
  findFestival,
  formatFestivalDate,
  getUpcomingFestivals,
} from '../festival-calendar';

type OfferType = 'festive' | 'big_billion' | 'discount' | 'custom';
type DiscountType = 'percent' | 'flat';
type OfferFilter = 'all' | 'with' | 'without';

interface OfferOption {
  value: OfferType;
  title: string;
  description: string;
}

interface OfferProduct {
  id: string;
  name: string;
  slug: string | null;
  product_code: string | null;
  base_price: number | null;
  compare_at_price: number | null;
  currency: string | null;
  offer_type: OfferType | null;
  offer_label: string | null;
  offer_discount_type: DiscountType | null;
  offer_discount_value: number | null;
  offer_original_base_price: number | null;
  offer_original_compare_at_price: number | null;
  category: { name: string | null } | { name: string | null }[] | null;
}

const OFFER_OPTIONS: OfferOption[] = [
  {
    value: 'festive',
    title: 'Festive Offer',
    description: 'Seasonal and festival pricing.',
  },
  {
    value: 'big_billion',
    title: 'Big Billion Sale',
    description: 'Big sale-event discounts.',
  },
  {
    value: 'discount',
    title: 'Discount Offer',
    description: 'A simple discount on selected products.',
  },
  {
    value: 'custom',
    title: 'Custom Offer',
    description: 'Your own offer name and discount.',
  },
];

@Component({
  selector: 'app-admin-offers-page',
  standalone: true,
  imports: [],
  templateUrl: './offers-page.html',
  styleUrl: './offers-page.css',
})
export class AdminOffersPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly route = inject(ActivatedRoute);

  readonly offerOptions = OFFER_OPTIONS;

  // ----- festival calendar -----
  readonly upcomingFestivals: UpcomingFestival[] = getUpcomingFestivals(new Date(), 6);
  readonly calendarStale = calendarNeedsUpdate();
  readonly festival = signal<UpcomingFestival | null>(null);

  // ----- data -----
  readonly products = signal<OfferProduct[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');

  // ----- offer form -----
  readonly offerType = signal<OfferType>('festive');
  readonly customLabel = signal('');
  readonly discountType = signal<DiscountType>('percent');
  readonly discountValue = signal<number | null>(10);

  // ----- product list -----
  readonly search = signal('');
  readonly filter = signal<OfferFilter>('all');
  readonly selectedIds = signal<ReadonlySet<string>>(new Set<string>());

  // ----- feedback -----
  readonly saving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly offerLabel = computed(() => {
    if (this.offerType() === 'custom') {
      return this.customLabel().trim();
    }

    const festival = this.festival();

    if (this.offerType() === 'festive' && festival) {
      return `${festival.name} Offer`;
    }

    return OFFER_OPTIONS.find((option) => option.value === this.offerType())?.title ?? '';
  });

  readonly filteredProducts = computed(() => {
    const term = this.search().trim().toLowerCase();
    const filter = this.filter();

    return this.products().filter((product) => {
      if (filter === 'with' && !product.offer_type) {
        return false;
      }

      if (filter === 'without' && product.offer_type) {
        return false;
      }

      if (!term) {
        return true;
      }

      const haystack = [product.name, product.product_code ?? '', this.categoryName(product)]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  });

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly selectedWithOfferCount = computed(
    () => this.products().filter((p) => this.selectedIds().has(p.id) && !!p.offer_type).length,
  );

  readonly allVisibleSelected = computed(() => {
    const visible = this.filteredProducts();
    const selected = this.selectedIds();

    return visible.length > 0 && visible.every((product) => selected.has(product.id));
  });

  readonly activeOffersCount = computed(() => this.products().filter((p) => !!p.offer_type).length);

  /** Why the Apply button is disabled (empty text = everything is fine). */
  readonly validationMessage = computed(() => {
    const value = this.discountValue();

    if (this.offerType() === 'custom' && !this.customLabel().trim()) {
      return 'Enter a name for your custom offer.';
    }

    if (value === null || !Number.isFinite(value) || value <= 0) {
      return 'Enter a discount greater than zero.';
    }

    if (this.discountType() === 'percent' && value > 90) {
      return 'Percentage discount cannot be more than 90%.';
    }

    if (this.selectedCount() === 0) {
      return 'Select at least one product below.';
    }

    return '';
  });

  ngOnInit(): void {
    // Opened from the festival reminder: /admin/offers?festival=<id>
    const festivalId = this.route.snapshot.queryParamMap.get('festival');

    if (festivalId) {
      const found = findFestival(festivalId);

      if (found) {
        this.useFestival(found);
      }
    }

    void this.loadProducts();
  }

  // ==========================================================================
  // Loading
  // ==========================================================================

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');

    try {
      const { data, error } = await this.supabase.client
        .from('products')
        .select(
          'id, name, slug, product_code, base_price, compare_at_price, currency, offer_type, offer_label, offer_discount_type, offer_discount_value, offer_original_base_price, offer_original_compare_at_price, category:categories(name)',
        )
        .eq('status', 'active')
        .order('name', { ascending: true })
        .limit(1000);

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as unknown as OfferProduct[];
      this.products.set(rows);

      // forget selections that no longer exist
      const ids = new Set(rows.map((row) => row.id));
      this.selectedIds.set(new Set([...this.selectedIds()].filter((id) => ids.has(id))));
    } catch (error: unknown) {
      console.error('Unable to load products for offers:', error);
      this.products.set([]);
      this.loadError.set(
        'Unable to load products. Make sure the offers SQL has been run in Supabase, then try again.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  // ==========================================================================
  // Form handlers
  // ==========================================================================

  chooseOffer(type: OfferType): void {
    this.offerType.set(type);

    if (type !== 'festive') {
      this.festival.set(null);
    }

    this.clearMessages();
  }

  useFestival(festival: UpcomingFestival): void {
    this.festival.set(festival);
    this.offerType.set('festive');
    this.clearMessages();
  }

  toggleFestival(festival: UpcomingFestival): void {
    if (this.festival()?.id === festival.id) {
      this.festival.set(null);
      this.clearMessages();
      return;
    }

    this.useFestival(festival);
  }

  daysLabel(daysLeft: number): string {
    return describeDaysLeft(daysLeft);
  }

  dateLabel(date: Date): string {
    return formatFestivalDate(date);
  }

  setDiscountType(type: DiscountType): void {
    this.discountType.set(type);
    this.clearMessages();
  }

  onDiscountValue(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.discountValue.set(raw === '' ? null : Number(raw));
    this.clearMessages();
  }

  onCustomLabel(event: Event): void {
    this.customLabel.set((event.target as HTMLInputElement).value);
    this.clearMessages();
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setFilter(filter: OfferFilter): void {
    this.filter.set(filter);
  }

  // ==========================================================================
  // Selection
  // ==========================================================================

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggle(id: string): void {
    const next = new Set(this.selectedIds());

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    this.selectedIds.set(next);
    this.clearMessages();
  }

  toggleAllVisible(): void {
    const next = new Set(this.selectedIds());
    const visible = this.filteredProducts();

    if (this.allVisibleSelected()) {
      visible.forEach((product) => next.delete(product.id));
    } else {
      visible.forEach((product) => next.add(product.id));
    }

    this.selectedIds.set(next);
    this.clearMessages();
  }

  clearSelection(): void {
    this.selectedIds.set(new Set<string>());
  }

  // ==========================================================================
  // Actions
  // ==========================================================================

  async applyOffer(): Promise<void> {
    if (this.saving() || this.validationMessage()) {
      return;
    }

    const count = this.selectedCount();
    const label = this.offerLabel();

    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Apply "${label}" (${this.discountSummary()}) to ${count} product${count === 1 ? '' : 's'}? Prices on the website will change immediately.`,
      )
    ) {
      return;
    }

    this.saving.set(true);
    this.clearMessages();

    try {
      const { data, error } = await this.supabase.client.rpc('apply_product_offer', {
        p_product_ids: [...this.selectedIds()],
        p_offer_type: this.offerType(),
        p_offer_label: label,
        p_discount_type: this.discountType(),
        p_discount_value: this.discountValue(),
      });

      if (error) {
        throw error;
      }

      const updated = typeof data === 'number' ? data : count;
      this.successMessage.set(
        `"${label}" applied to ${updated} product${updated === 1 ? '' : 's'}. The new prices are live on the website.`,
      );
      this.clearSelection();
      await this.loadProducts();
    } catch (error: unknown) {
      console.error('Unable to apply offer:', error);
      this.errorMessage.set(this.readError(error, 'Unable to apply the offer. Please try again.'));
    } finally {
      this.saving.set(false);
    }
  }

  async removeSelected(): Promise<void> {
    await this.removeOffers([...this.selectedIds()]);
  }

  async removeOne(id: string): Promise<void> {
    await this.removeOffers([id]);
  }

  private async removeOffers(ids: string[]): Promise<void> {
    if (this.saving() || ids.length === 0) {
      return;
    }

    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Remove the offer from ${ids.length} product${ids.length === 1 ? '' : 's'} and restore the original prices?`,
      )
    ) {
      return;
    }

    this.saving.set(true);
    this.clearMessages();

    try {
      const { data, error } = await this.supabase.client.rpc('remove_product_offer', {
        p_product_ids: ids,
      });

      if (error) {
        throw error;
      }

      const updated = typeof data === 'number' ? data : ids.length;
      this.successMessage.set(
        updated === 0
          ? 'Nothing to remove: the selected products have no active offer.'
          : `Offer removed from ${updated} product${updated === 1 ? '' : 's'}. Original prices are back.`,
      );
      this.clearSelection();
      await this.loadProducts();
    } catch (error: unknown) {
      console.error('Unable to remove offer:', error);
      this.errorMessage.set(this.readError(error, 'Unable to remove the offer. Please try again.'));
    } finally {
      this.saving.set(false);
    }
  }

  // ==========================================================================
  // Display helpers
  // ==========================================================================

  categoryName(product: OfferProduct): string {
    const category = Array.isArray(product.category) ? product.category[0] : product.category;

    return category?.name ?? '';
  }

  /** Price the customer pays today. */
  currentPrice(product: OfferProduct): number | null {
    return product.base_price;
  }

  /** Price before any offer from this page (what a new offer is calculated from). */
  originalPrice(product: OfferProduct): number | null {
    return product.offer_type ? product.offer_original_base_price : product.base_price;
  }

  /** Price this product will have after the offer currently set in the form. */
  previewPrice(product: OfferProduct): number | null {
    const value = this.discountValue();
    const original = this.originalPrice(product);

    if (original === null || value === null || !Number.isFinite(value) || value <= 0) {
      return null;
    }

    const next =
      this.discountType() === 'percent'
        ? Math.round(original * (1 - value / 100))
        : Math.round(original - value);

    return Math.max(next, 1);
  }

  discountSummary(): string {
    const value = this.discountValue();

    if (value === null) {
      return '';
    }

    return this.discountType() === 'percent' ? `${value}% off` : `${value} off`;
  }

  offerBadge(product: OfferProduct): string {
    if (!product.offer_type) {
      return '';
    }

    const label = product.offer_label || 'Offer';
    const value = product.offer_discount_value;

    if (value === null || value === undefined) {
      return label;
    }

    return product.offer_discount_type === 'percent'
      ? `${label} · ${value}% off`
      : `${label} · ${value} off`;
  }

  formatMoney(value: number | null, currency: string | null): string {
    if (value === null || value === undefined) {
      return '—';
    }

    const symbol = currency === 'USD' ? '$' : currency === 'AED' ? 'AED ' : '₹';

    return `${symbol}${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)}`;
  }

  private clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  private readError(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String((error as { message: unknown }).message ?? '');

      if (/admin access required/i.test(message)) {
        return 'Your account does not have admin permission to change prices.';
      }

      if (/function .* does not exist|could not find the function/i.test(message)) {
        return 'The offers SQL has not been run in Supabase yet. Run the offers migration first.';
      }

      if (message) {
        return message;
      }
    }

    return fallback;
  }
}
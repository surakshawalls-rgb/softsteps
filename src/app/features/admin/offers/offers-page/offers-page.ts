import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { OfferInput, OfferService } from '../../../../core/services/offer.service';
import {
  FestivalBannerService,
  HERO_BANNER_MAX_BYTES,
  HERO_BANNER_SIZE,
  ImageSize,
  checkBannerFile,
  readImageSize,
} from '../../../../core/services/festival-banner.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { DiscountType, OfferType, ProductOffer } from '../../../../shared/models/offer.model';
import { Product } from '../../../../shared/models/product.model';
import {
  discountedPrice,
  isOfferLive,
  normalizeCode,
  parseCodeList,
  sellingPrice,
} from '../../../../shared/utils/offer-pricing';
import {
  UpcomingFestival,
  calendarNeedsUpdate,
  describeDaysLeft,
  findFestival,
  formatFestivalDate,
  getUpcomingFestivals,
} from '../festival-calendar';
import { OFFERS_SETUP_SQL } from '../offers-setup-sql';

type OfferStatus = 'live' | 'scheduled' | 'ended' | 'paused';
type ProductFilter = 'all' | 'selected' | 'on-offer';

interface OfferOption {
  value: OfferType;
  title: string;
  description: string;
}

interface AdminProduct {
  id: string;
  name: string;
  slug: string | null;
  product_code: string | null;
  base_price: number | null;
  compare_at_price: number | null;
  currency: string | null;
  specifications: Record<string, unknown> | null;
  category: { name: string | null } | { name: string | null }[] | null;
  variants: { price: number | null; sale_price: number | null; is_active: boolean | null }[] | null;
}

const OFFER_OPTIONS: OfferOption[] = [
  { value: 'festive', title: 'Festive Offer', description: 'Seasonal and festival pricing.' },
  { value: 'big_billion', title: 'Big Billion Sale', description: 'Big sale-event discounts.' },
  { value: 'discount', title: 'Discount Offer', description: 'A simple discount on selected products.' },
  { value: 'custom', title: 'Custom Offer', description: 'Your own offer name and discount.' },
];

/** What one festival card shows for its home hero banner. */
interface BannerView {
  saved: string | null;
  preview: string | null;
  error: string;
  message: string;
  busy: boolean;
}

const NO_BANNER: BannerView = { saved: null, preview: null, error: '', message: '', busy: false };

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Date -> value for <input type="datetime-local"> (local time). */
function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

@Component({
  selector: 'app-admin-offers-page',
  standalone: true,
  imports: [],
  templateUrl: './offers-page.html',
  styleUrl: './offers-page.css',
})
export class AdminOffersPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly offerService = inject(OfferService);
  private readonly bannerService = inject(FestivalBannerService);
  private readonly route = inject(ActivatedRoute);

  readonly offerOptions = OFFER_OPTIONS;
  readonly setupSql = OFFERS_SETUP_SQL;

  // ----- festival calendar -----
  readonly upcomingFestivals: UpcomingFestival[] = getUpcomingFestivals(new Date(), 6);
  readonly calendarStale = calendarNeedsUpdate();
  readonly festival = signal<UpcomingFestival | null>(null);

  // ----- home hero banner upload (one per festival) -----
  readonly bannerSize = HERO_BANNER_SIZE;
  readonly bannerMaxMb = HERO_BANNER_MAX_BYTES / (1024 * 1024);
  readonly banners = signal<Record<string, BannerView>>({});
  readonly bannerSetupNeeded = signal(false);

  // ----- data -----
  readonly products = signal<AdminProduct[]>([]);
  readonly offers = signal<ProductOffer[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly setupNeeded = signal(false);
  readonly copied = signal(false);

  // ----- offer form -----
  readonly editingId = signal<string | null>(null);
  readonly offerType = signal<OfferType>('festive');
  readonly name = signal('Festive Offer');
  readonly discountType = signal<DiscountType>('percent');
  readonly discountValue = signal<number | null>(10);
  readonly startsAt = signal(toLocalInput(new Date()));
  readonly hasEnd = signal(false);
  readonly endsAt = signal('');

  // ----- products in the offer -----
  readonly codeText = signal('');
  readonly codeMessage = signal('');
  readonly search = signal('');
  readonly filter = signal<ProductFilter>('all');
  readonly selectedIds = signal<ReadonlySet<string>>(new Set<string>());

  // ----- feedback -----
  readonly saving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  // ==========================================================================
  // Derived values
  // ==========================================================================

  readonly selectedProducts = computed(() =>
    this.products().filter((product) => this.selectedIds().has(product.id)),
  );

  /** product code (normalised) -> live offers that already include it (not counting the one being edited) */
  readonly liveOffersByCode = computed(() => {
    const map = new Map<string, ProductOffer[]>();
    const editing = this.editingId();

    for (const offer of this.offers()) {
      if (offer.id === editing || this.statusOf(offer) !== 'live') {
        continue;
      }

      for (const code of offer.product_codes) {
        const key = normalizeCode(code);
        map.set(key, [...(map.get(key) ?? []), offer]);
      }
    }

    return map;
  });

  readonly filteredProducts = computed(() => {
    const term = this.search().trim().toLowerCase();
    const filter = this.filter();
    const selected = this.selectedIds();
    const onOffer = this.liveOffersByCode();

    return this.products().filter((product) => {
      if (filter === 'selected' && !selected.has(product.id)) {
        return false;
      }

      if (filter === 'on-offer' && !onOffer.has(normalizeCode(product.product_code))) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [product.name, product.product_code ?? '', this.categoryName(product)]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  });

  readonly allVisibleSelected = computed(() => {
    const visible = this.filteredProducts().filter((product) => !!product.product_code);
    const selected = this.selectedIds();

    return visible.length > 0 && visible.every((product) => selected.has(product.id));
  });

  readonly liveCount = computed(() => this.offers().filter((offer) => this.statusOf(offer) === 'live').length);
  readonly scheduledCount = computed(
    () => this.offers().filter((offer) => this.statusOf(offer) === 'scheduled').length,
  );
  readonly productsOnOfferCount = computed(() => {
    const codes = new Set<string>();

    for (const offer of this.offers()) {
      if (this.statusOf(offer) === 'live') {
        offer.product_codes.forEach((code) => codes.add(normalizeCode(code)));
      }
    }

    return codes.size;
  });

  /** Why the Save button is disabled (empty text = everything is fine). */
  readonly validationMessage = computed(() => {
    const value = this.discountValue();

    if (!this.name().trim()) {
      return 'Give the offer a name.';
    }

    if (value === null || !Number.isFinite(value) || value <= 0) {
      return 'Enter a discount greater than zero.';
    }

    if (this.discountType() === 'percent' && value > 90) {
      return 'Percentage discount cannot be more than 90%.';
    }

    const start = new Date(this.startsAt());

    if (!this.startsAt() || Number.isNaN(start.getTime())) {
      return 'Choose when the offer starts.';
    }

    if (this.hasEnd()) {
      const end = new Date(this.endsAt());

      if (!this.endsAt() || Number.isNaN(end.getTime())) {
        return 'Choose when the offer ends, or switch off "End date".';
      }

      if (end.getTime() <= start.getTime()) {
        return 'The end must be after the start.';
      }
    }

    if (this.selectedProducts().length === 0) {
      return 'Add at least one product (by product code or by ticking it below).';
    }

    return '';
  });

  // ==========================================================================
  // Loading
  // ==========================================================================

  ngOnInit(): void {
    // Opened from the festival reminder: /admin/offers?festival=<id>
    const festivalId = this.route.snapshot.queryParamMap.get('festival');

    if (festivalId) {
      const found = findFestival(festivalId);

      if (found) {
        this.useFestival(found);
      }
    }

    void this.loadAll();
    void this.loadBanners();
  }

  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    this.setupNeeded.set(false);

    try {
      await Promise.all([this.loadOffers(), this.loadProducts()]);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadOffers(): Promise<void> {
    try {
      this.offers.set(await this.offerService.listAll());
    } catch (error: unknown) {
      const text = this.messageOf(error);

      if (/product_offers|schema cache|does not exist|42P01|PGRST205/i.test(text)) {
        this.setupNeeded.set(true);
      } else {
        console.error('Unable to load offers:', error);
        this.loadError.set(text || 'Unable to load offers.');
      }
    }
  }

  private async loadProducts(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('products')
        .select(
          'id, name, slug, product_code, base_price, compare_at_price, currency, specifications, category:categories(name), variants:product_variants(*)',
        )
        .eq('status', 'active')
        .order('product_code', { ascending: true })
        .limit(1000);

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as unknown as AdminProduct[];
      this.products.set(rows);

      const ids = new Set(rows.map((row) => row.id));
      this.selectedIds.set(new Set([...this.selectedIds()].filter((id) => ids.has(id))));
    } catch (error: unknown) {
      console.error('Unable to load products for offers:', error);
      this.products.set([]);
      this.loadError.set('Unable to load products. ' + this.messageOf(error));
    }
  }

  // ==========================================================================
  // Home hero banners
  // ==========================================================================

  private async loadBanners(): Promise<void> {
    try {
      const rows = await this.bannerService.listAll();
      const saved: Record<string, BannerView> = {};

      for (const row of rows) {
        saved[row.festival] = { ...NO_BANNER, saved: row.image_url };
      }

      // keep anything the admin already did while this was loading
      this.banners.update((current) => ({ ...saved, ...current }));
    } catch (error: unknown) {
      const text = this.messageOf(error);

      if (/festival_banners|schema cache|does not exist|42P01|PGRST205/i.test(text)) {
        this.bannerSetupNeeded.set(true);
      } else {
        console.error('Unable to load festival banners:', error);
      }
    }
  }

  bannerOf(festivalName: string): BannerView {
    return this.banners()[festivalName] ?? NO_BANNER;
  }

  private patchBanner(festivalName: string, patch: Partial<BannerView>): void {
    this.banners.update((current) => ({
      ...current,
      [festivalName]: { ...(current[festivalName] ?? NO_BANNER), ...patch },
    }));
  }

  async onBannerChosen(item: UpcomingFestival, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    const name = item.name;
    const oldPreview = this.bannerOf(name).preview;

    if (oldPreview) {
      URL.revokeObjectURL(oldPreview);
    }

    // the chosen image is shown right away, so an error can be shown below it
    const preview = URL.createObjectURL(file);
    this.patchBanner(name, { preview, error: '', message: '', busy: true });

    let size: ImageSize;

    try {
      size = await readImageSize(file);
    } catch (error: unknown) {
      this.patchBanner(name, { busy: false, error: this.messageOf(error) });
      return;
    }

    const problem = checkBannerFile(file, size);

    if (problem) {
      this.patchBanner(name, { busy: false, error: problem });
      return;
    }

    try {
      const banner = await this.bannerService.save(name, file, size);
      URL.revokeObjectURL(preview);
      this.patchBanner(name, {
        saved: banner.image_url,
        preview: null,
        busy: false,
        message: 'Banner saved. The home page shows it while this festival is live.',
      });
    } catch (error: unknown) {
      this.patchBanner(name, { busy: false, error: this.bannerErrorText(error) });
    }
  }

  async removeBanner(item: UpcomingFestival): Promise<void> {
    const name = item.name;
    const preview = this.bannerOf(name).preview;
    this.patchBanner(name, { busy: true, error: '', message: '' });

    try {
      await this.bannerService.remove(name);

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      this.patchBanner(name, {
        saved: null,
        preview: null,
        busy: false,
        message: 'Banner removed. The home page uses the standard festival artwork again.',
      });
    } catch (error: unknown) {
      this.patchBanner(name, { busy: false, error: this.bannerErrorText(error) });
    }
  }

  private bannerErrorText(error: unknown): string {
    const message = this.messageOf(error);

    if (/festival_banners|schema cache|does not exist|42P01|PGRST205|bucket not found/i.test(message)) {
      this.bannerSetupNeeded.set(true);
      return 'Banner uploads need the one-time database setup shown above.';
    }

    if (/row-level security|permission denied|42501|unauthorized/i.test(message)) {
      return 'Your account is not allowed to change banners. Sign in with an admin account.';
    }

    return message || 'The banner could not be saved. Try again.';
  }

  // ==========================================================================
  // Setup help
  // ==========================================================================

  async copySetupSql(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.setupSql);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 3000);
    } catch {
      this.errorMessage.set('Could not copy automatically. Select the text below and copy it.');
    }
  }

  // ==========================================================================
  // Form handlers
  // ==========================================================================

  chooseOffer(type: OfferType): void {
    const previousDefault = this.defaultName(this.offerType());
    this.offerType.set(type);

    if (type !== 'festive') {
      this.festival.set(null);
    }

    // keep what the admin typed; only replace names that were filled in automatically
    if (!this.name().trim() || this.name() === previousDefault) {
      this.name.set(this.defaultName(type));
    }

    this.clearMessages();
  }

  useFestival(festival: UpcomingFestival): void {
    const end = new Date(festival.date.getFullYear(), festival.date.getMonth(), festival.date.getDate(), 23, 59);

    this.festival.set(festival);
    this.offerType.set('festive');
    this.name.set(`${festival.name} Offer`);
    this.startsAt.set(toLocalInput(new Date()));
    this.hasEnd.set(true);
    this.endsAt.set(toLocalInput(end));
    this.clearMessages();
  }

  toggleFestival(festival: UpcomingFestival): void {
    if (this.festival()?.id === festival.id) {
      this.festival.set(null);
      this.name.set(this.defaultName('festive'));
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

  onName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
    this.clearMessages();
  }

  onDiscountValue(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.discountValue.set(raw === '' ? null : Number(raw));
    this.clearMessages();
  }

  onStartsAt(event: Event): void {
    this.startsAt.set((event.target as HTMLInputElement).value);
    this.clearMessages();
  }

  onEndsAt(event: Event): void {
    this.endsAt.set((event.target as HTMLInputElement).value);
    this.clearMessages();
  }

  toggleHasEnd(): void {
    const next = !this.hasEnd();
    this.hasEnd.set(next);

    if (next && !this.endsAt()) {
      const week = new Date();
      week.setDate(week.getDate() + 7);
      week.setHours(23, 59, 0, 0);
      this.endsAt.set(toLocalInput(week));
    }

    this.clearMessages();
  }

  onCodeText(event: Event): void {
    this.codeText.set((event.target as HTMLTextAreaElement).value);
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setFilter(filter: ProductFilter): void {
    this.filter.set(filter);
  }

  // ==========================================================================
  // Product selection (by code or by ticking)
  // ==========================================================================

  /** Reads the typed product codes and ticks the matching products. */
  addCodes(): void {
    const wanted = parseCodeList(this.codeText());

    if (wanted.length === 0) {
      this.codeMessage.set('Type or paste product codes first, for example SS_1001, SS_1002 or SS_1001-SS_1010.');
      return;
    }

    const byCode = new Map<string, AdminProduct>();
    this.products().forEach((product) => {
      if (product.product_code) {
        byCode.set(normalizeCode(product.product_code), product);
      }
    });

    const next = new Set(this.selectedIds());
    const missing: string[] = [];
    let added = 0;

    for (const code of wanted) {
      const product = byCode.get(normalizeCode(code));

      if (!product) {
        missing.push(code);
        continue;
      }

      if (!next.has(product.id)) {
        next.add(product.id);
        added++;
      }
    }

    this.selectedIds.set(next);
    this.codeText.set(missing.join(', '));
    this.codeMessage.set(
      `${added} product${added === 1 ? '' : 's'} added.` +
        (missing.length ? ` Not found: ${missing.join(', ')}.` : ''),
    );
    this.clearMessages();
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggle(product: AdminProduct): void {
    if (!product.product_code) {
      return;
    }

    const next = new Set(this.selectedIds());

    if (next.has(product.id)) {
      next.delete(product.id);
    } else {
      next.add(product.id);
    }

    this.selectedIds.set(next);
    this.clearMessages();
  }

  toggleAllVisible(): void {
    const next = new Set(this.selectedIds());
    const visible = this.filteredProducts().filter((product) => !!product.product_code);

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
    this.codeMessage.set('');
  }

  // ==========================================================================
  // Save / edit / pause / delete
  // ==========================================================================

  async save(): Promise<void> {
    if (this.saving() || this.validationMessage()) {
      return;
    }

    const codes = this.selectedProducts()
      .map((product) => product.product_code)
      .filter((code): code is string => !!code);

    const input: OfferInput = {
      name: this.name().trim(),
      offer_type: this.offerType(),
      discount_type: this.discountType(),
      discount_value: Number(this.discountValue()),
      product_codes: codes,
      starts_at: new Date(this.startsAt()).toISOString(),
      ends_at: this.hasEnd() ? new Date(this.endsAt()).toISOString() : null,
      is_active: true,
    };

    this.saving.set(true);
    this.clearMessages();

    try {
      const editing = this.editingId();

      if (editing) {
        await this.offerService.update(editing, input);
      } else {
        await this.offerService.create(input);
      }

      this.successMessage.set(
        `"${input.name}" saved for ${codes.length} product${codes.length === 1 ? '' : 's'}. ` +
          (new Date(input.starts_at).getTime() > Date.now()
            ? 'It will start automatically at the chosen time.'
            : 'The new prices are live on the website.'),
      );
      this.resetForm();
      await this.loadOffers();
    } catch (error: unknown) {
      console.error('Unable to save offer:', error);
      this.errorMessage.set(this.readError(error, 'Unable to save the offer. Please try again.'));
    } finally {
      this.saving.set(false);
    }
  }

  editOffer(offer: ProductOffer): void {
    this.fillForm(offer, offer.id);
  }

  duplicateOffer(offer: ProductOffer): void {
    this.fillForm({ ...offer, name: `${offer.name} (copy)` }, null);
  }

  cancelEdit(): void {
    this.resetForm();
  }

  async toggleActive(offer: ProductOffer): Promise<void> {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.clearMessages();

    try {
      await this.offerService.setActive(offer.id, !offer.is_active);
      this.successMessage.set(
        offer.is_active
          ? `"${offer.name}" is paused. Prices are back to normal.`
          : `"${offer.name}" is on again.`,
      );
      await this.loadOffers();
    } catch (error: unknown) {
      this.errorMessage.set(this.readError(error, 'Unable to change the offer.'));
    } finally {
      this.saving.set(false);
    }
  }

  async deleteOffer(offer: ProductOffer): Promise<void> {
    if (this.saving()) {
      return;
    }

    if (typeof window !== 'undefined' && !window.confirm(`Delete "${offer.name}"? Prices go back to normal.`)) {
      return;
    }

    this.saving.set(true);
    this.clearMessages();

    try {
      await this.offerService.remove(offer.id);

      if (this.editingId() === offer.id) {
        this.resetForm();
      }

      this.successMessage.set(`"${offer.name}" deleted.`);
      await this.loadOffers();
    } catch (error: unknown) {
      this.errorMessage.set(this.readError(error, 'Unable to delete the offer.'));
    } finally {
      this.saving.set(false);
    }
  }

  private fillForm(offer: ProductOffer, editingId: string | null): void {
    const known = new Set(this.products().map((product) => normalizeCode(product.product_code)));
    const codes = new Set(offer.product_codes.map((code) => normalizeCode(code)));
    const missing = offer.product_codes.filter((code) => !known.has(normalizeCode(code)));

    this.editingId.set(editingId);
    this.festival.set(null);
    this.offerType.set(offer.offer_type);
    this.name.set(offer.name);
    this.discountType.set(offer.discount_type);
    this.discountValue.set(offer.discount_value);
    this.startsAt.set(toLocalInput(new Date(offer.starts_at)));
    this.hasEnd.set(!!offer.ends_at);
    this.endsAt.set(offer.ends_at ? toLocalInput(new Date(offer.ends_at)) : '');
    this.selectedIds.set(
      new Set(
        this.products()
          .filter((product) => codes.has(normalizeCode(product.product_code)))
          .map((product) => product.id),
      ),
    );
    this.codeText.set('');
    this.codeMessage.set(missing.length ? `Not in the shop any more: ${missing.join(', ')}.` : '');
    this.clearMessages();

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.festival.set(null);
    this.offerType.set('festive');
    this.name.set(this.defaultName('festive'));
    this.discountType.set('percent');
    this.discountValue.set(10);
    this.startsAt.set(toLocalInput(new Date()));
    this.hasEnd.set(false);
    this.endsAt.set('');
    this.selectedIds.set(new Set<string>());
    this.codeText.set('');
    this.codeMessage.set('');
  }

  // ==========================================================================
  // Display helpers
  // ==========================================================================

  defaultName(type: OfferType): string {
    return type === 'custom' ? '' : (OFFER_OPTIONS.find((option) => option.value === type)?.title ?? '');
  }

  statusOf(offer: ProductOffer): OfferStatus {
    if (!offer.is_active) {
      return 'paused';
    }

    if (isOfferLive(offer)) {
      return 'live';
    }

    return new Date(offer.starts_at).getTime() > Date.now() ? 'scheduled' : 'ended';
  }

  statusLabel(offer: ProductOffer): string {
    const labels: Record<OfferStatus, string> = {
      live: 'Live',
      scheduled: 'Scheduled',
      ended: 'Ended',
      paused: 'Paused',
    };

    return labels[this.statusOf(offer)];
  }

  discountLabel(offer: Pick<ProductOffer, 'discount_type' | 'discount_value'>): string {
    return offer.discount_type === 'percent'
      ? `${offer.discount_value}% off`
      : `${offer.discount_value} off`;
  }

  formulaLabel(): string {
    const value = this.discountValue();

    if (value === null) {
      return '';
    }

    return this.discountType() === 'percent' ? `${value}% off` : `${value} off`;
  }

  codesPreview(offer: ProductOffer): string {
    const shown = offer.product_codes.slice(0, 5).join(', ');
    const more = offer.product_codes.length - 5;

    return more > 0 ? `${shown} +${more} more` : shown;
  }

  whenLabel(offer: ProductOffer): string {
    const start = this.dateTime(offer.starts_at);

    return offer.ends_at ? `${start} to ${this.dateTime(offer.ends_at)}` : `From ${start}, no end date`;
  }

  private dateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  categoryName(product: AdminProduct): string {
    const category = Array.isArray(product.category) ? product.category[0] : product.category;

    return category?.name ?? '';
  }

  /** Price the customer pays today (before any offer). */
  priceOf(product: AdminProduct): number | null {
    return sellingPrice(product as unknown as Product);
  }

  /** Price after the offer currently set in the form. */
  previewPrice(product: AdminProduct): number | null {
    const value = this.discountValue();
    const price = this.priceOf(product);

    if (price === null || value === null || !Number.isFinite(value) || value <= 0) {
      return null;
    }

    return discountedPrice(price, this.discountType(), value);
  }

  otherOffers(product: AdminProduct): string {
    return (this.liveOffersByCode().get(normalizeCode(product.product_code)) ?? [])
      .map((offer) => offer.name)
      .join(', ');
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

  private messageOf(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message ?? '');
    }

    return '';
  }

  private readError(error: unknown, fallback: string): string {
    const message = this.messageOf(error);

    if (/row-level security|permission denied|42501/i.test(message)) {
      return 'Your account is not allowed to change offers. Sign in with an admin account.';
    }

    if (/product_offers/i.test(message) && /exist|schema cache/i.test(message)) {
      this.setupNeeded.set(true);
      return 'The offers table is missing. Follow the setup steps shown on this page.';
    }

    return message || fallback;
  }
}
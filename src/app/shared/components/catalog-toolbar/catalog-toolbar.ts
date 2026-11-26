import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CatalogFilterState,
  CatalogSort,
  DEFAULT_CATALOG_FILTER,
  DISCOUNT_STEPS,
  normalizeFilterValue,
  productAvailability,
  productColors,
  productDiscount,
  productSizes
} from '../../models/catalog-filter.model';
import { Product } from '../../models/product.model';
import { CatalogFilterService } from '../../services/catalog-filter.service';

type ListKey =
  | 'availability'
  | 'subcategories'
  | 'categories'
  | 'sizes'
  | 'colors'
  | 'materials'
  | 'shapes'
  | 'constructions'
  | 'styles'
  | 'discounts';
type GroupKey = ListKey | 'price';

export interface FilterOption {
  value: string;
  label: string;
  count: number;
  swatch?: string;
}

/** One block of the sidebar (Category, Size, Colour ...), in the order it is shown. */
export interface FilterGroup {
  key: GroupKey;
  title: string;
  kind: 'list' | 'price';
  options: FilterOption[];
  /** colour dots instead of tick boxes */
  swatches?: boolean;
  /** show the words with a capital first letter ("hand tufted" -> "Hand Tufted") */
  capitalize?: boolean;
}

interface FilterChip {
  id: string;
  label: string;
  kind: 'list' | 'search' | 'price';
  list?: ListKey;
  value?: string;
}

interface PricePreset {
  label: string;
  min: number | null;
  max: number | null;
}

const COLOR_SWATCHES: Record<string, string> = {
  ivory: '#f3ecd8',
  cream: '#f1e7cf',
  beige: '#d8c7a8',
  tan: '#c19a6b',
  camel: '#c19a6b',
  brown: '#7a5636',
  chocolate: '#4b2e1e',
  grey: '#9a9a9a',
  gray: '#9a9a9a',
  charcoal: '#3f3f3f',
  silver: '#c4c4c4',
  black: '#1c1c1c',
  white: '#ffffff',
  blue: '#3b6ea5',
  navy: '#1f2f4f',
  teal: '#2f7f86',
  aqua: '#6bc1c4',
  green: '#4f7a52',
  olive: '#6b6b34',
  red: '#a8322d',
  maroon: '#6d1f2c',
  burgundy: '#6d1f2c',
  rust: '#a4502a',
  terracotta: '#c4623f',
  orange: '#d9822b',
  yellow: '#e2c04a',
  mustard: '#c9a227',
  ochre: '#c58a2b',
  gold: '#c9a24a',
  pink: '#d98ca0',
  purple: '#6e4a8e',
  multi: 'conic-gradient(#a8322d, #e2c04a, #4f7a52, #3b6ea5, #6e4a8e, #a8322d)'
};

const AVAILABILITY_LABELS: Record<string, string> = {
  customizable: 'Customizable',
  'made-to-order': 'Made to order'
};

@Component({
  selector: 'app-catalog-toolbar',
  imports: [FormsModule],
  templateUrl: './catalog-toolbar.html',
  styleUrl: './catalog-toolbar.css'
})
export class CatalogToolbar implements OnChanges {
  private readonly catalogFilter = inject(CatalogFilterService);

  @Input() filter: CatalogFilterState = {
    ...DEFAULT_CATALOG_FILTER,
    subcategories: [],
    categories: [],
    materials: [],
    styles: [],
    colors: []
  };

  @Input() categories: { id: string; name: string; slug: string }[] = [];
  @Input() materials: { id: string; name: string; slug: string }[] = [];

  /** the full (unfiltered) product list; used for the options and the counts */
  @Input() products: Product[] = [];

  @Input() resultCount = 0;
  @Input() totalCount = 0;

  @Output() filterChange =
    new EventEmitter<CatalogFilterState>();

  mobileFiltersOpen = false;

  /** the sidebar blocks, rebuilt whenever the products change */
  groups: FilterGroup[] = [];

  /** groups the visitor has closed (every group starts open) */
  private readonly closedGroups = new Set<GroupKey>();

  /** groups whose full option list is shown (otherwise only the first few) */
  private readonly expandedGroups = new Set<GroupKey>();

  /** how many options a group shows before "Show more" (colour dots are small, so more fit) */
  private limitFor(group: ListKey): number {
    return group === 'colors' ? 14 : 8;
  }

  readonly sortOptions: {
    value: CatalogSort;
    label: string;
  }[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name-az', label: 'Name: A to Z' }
  ];

  readonly pricePresets: PricePreset[] = [
    { label: 'Under ₹5,000', min: null, max: 5000 },
    { label: '₹5,000 – ₹10,000', min: 5000, max: 10000 },
    { label: '₹10,000 – ₹25,000', min: 10000, max: 25000 },
    { label: '₹25,000 & above', min: 25000, max: null }
  ];

  private presetCounts: number[] = this.pricePresets.map(() => 0);

  ngOnChanges(): void {
    this.buildOptions();
  }

  /* ---------- groups ---------- */

  isOpen(group: GroupKey): boolean {
    return !this.closedGroups.has(group);
  }

  toggleGroup(group: GroupKey): void {
    if (this.closedGroups.has(group)) {
      this.closedGroups.delete(group);
    } else {
      this.closedGroups.add(group);
    }
  }

  /** first few options, or all of them once "More" was pressed (selected ones always stay visible) */
  visibleOptions(group: ListKey, options: FilterOption[]): FilterOption[] {
    if (this.expandedGroups.has(group) || options.length <= this.limitFor(group) + 1) {
      return options;
    }

    return options.filter(
      (option, index) => index < this.limitFor(group) || this.isSelected(group, option.value)
    );
  }

  hiddenCount(group: ListKey, options: FilterOption[]): number {
    return options.length - this.visibleOptions(group, options).length;
  }

  canCollapse(group: ListKey, options: FilterOption[]): boolean {
    return this.expandedGroups.has(group) && options.length > this.limitFor(group) + 1;
  }

  toggleExpanded(group: GroupKey): void {
    if (this.expandedGroups.has(group)) {
      this.expandedGroups.delete(group);
    } else {
      this.expandedGroups.add(group);
    }
  }

  /** the template passes a plain string; this keeps it type-safe */
  asList(key: GroupKey): ListKey {
    return key as ListKey;
  }

  selectedCount(group: GroupKey): number {
    if (group === 'price') {
      return this.filter.minPrice !== null || this.filter.maxPrice !== null ? 1 : 0;
    }
    return this.listOf(group).length;
  }

  /* ---------- selecting ---------- */

  private listOf(list: ListKey): string[] {
    return this.filter[list] ?? [];
  }

  isSelected(list: ListKey, value: string): boolean {
    return this.listOf(list).includes(value);
  }

  toggle(list: ListKey, value: string): void {
    const current = this.listOf(list);
    const next = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];

    this.emit({ [list]: next } as Partial<CatalogFilterState>);
  }

  setSearch(value: string): void {
    this.emit({ search: value ?? '' });
  }

  setSort(value: CatalogSort): void {
    this.emit({ sort: value });
  }

  setPrice(which: 'min' | 'max', value: number | null): void {
    const clean = typeof value === 'number' && !Number.isNaN(value) ? value : null;
    this.emit(which === 'min' ? { minPrice: clean } : { maxPrice: clean });
  }

  isPresetActive(preset: PricePreset): boolean {
    return this.filter.minPrice === preset.min && this.filter.maxPrice === preset.max;
  }

  presetCount(index: number): number {
    return this.presetCounts[index] ?? 0;
  }

  togglePreset(preset: PricePreset): void {
    if (this.isPresetActive(preset)) {
      this.emit({ minPrice: null, maxPrice: null });
    } else {
      this.emit({ minPrice: preset.min, maxPrice: preset.max });
    }
  }

  /* ---------- price slider (the "thread" histogram) ---------- */

  priceBounds = { min: 0, max: 0 };
  readonly priceStep = 500;

  /** one bar per price band: how many rugs fall in it (height in percent) */
  histogram: { from: number; to: number; pct: number }[] = [];

  get hasSlider(): boolean {
    return this.priceBounds.max > this.priceBounds.min;
  }

  get sliderLo(): number {
    return this.clampPrice(this.filter.minPrice ?? this.priceBounds.min);
  }

  get sliderHi(): number {
    return this.clampPrice(this.filter.maxPrice ?? this.priceBounds.max);
  }

  get fillLeft(): number {
    return this.percentOf(this.sliderLo);
  }

  get fillRight(): number {
    return 100 - this.percentOf(this.sliderHi);
  }

  /** how much of the catalogue matches right now (drives the thin gold bar under the heading) */
  get matchPercent(): number {
    return this.totalCount > 0 ? Math.min(100, (this.resultCount / this.totalCount) * 100) : 100;
  }

  money(value: number): string {
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
  }

  barOn(bar: { from: number; to: number }): boolean {
    return bar.to > this.sliderLo && bar.from < this.sliderHi;
  }

  onSlide(which: 'min' | 'max', raw: string | number): void {
    const value = Number(raw);

    if (!Number.isFinite(value)) {
      return;
    }

    const { min, max } = this.priceBounds;
    let lo = this.sliderLo;
    let hi = this.sliderHi;

    if (which === 'min') {
      lo = Math.min(value, hi - this.priceStep);
    } else {
      hi = Math.max(value, lo + this.priceStep);
    }

    // a handle resting at its end means "no limit on this side"
    this.emit({
      minPrice: lo <= min ? null : lo,
      maxPrice: hi >= max ? null : hi
    });
  }

  private clampPrice(value: number): number {
    return Math.min(Math.max(value, this.priceBounds.min), this.priceBounds.max);
  }

  private percentOf(value: number): number {
    const { min, max } = this.priceBounds;
    return max > min ? ((value - min) / (max - min)) * 100 : 0;
  }

  private buildPriceHistogram(prices: number[]): void {
    if (!prices.length) {
      this.priceBounds = { min: 0, max: 0 };
      this.histogram = [];
      return;
    }

    const min = Math.floor(Math.min(...prices) / 1000) * 1000;
    let max = Math.ceil(Math.max(...prices) / 1000) * 1000;

    if (max <= min) {
      max = min + 1000;
    }

    const bands = 18;
    const width = (max - min) / bands;
    const counts = new Array<number>(bands).fill(0);

    for (const price of prices) {
      counts[Math.min(bands - 1, Math.floor((price - min) / width))] += 1;
    }

    const tallest = Math.max(...counts, 1);

    this.priceBounds = { min, max };
    this.histogram = counts.map((count, index) => ({
      from: min + index * width,
      to: min + (index + 1) * width,
      // empty bands still show a short thread so the row reads as one woven edge
      pct: count === 0 ? 5 : 12 + (count / tallest) * 88
    }));
  }

  /* ---------- chips / clearing ---------- */

  get chips(): FilterChip[] {
    const chips: FilterChip[] = [];
    const f = this.filter;

    if (f.search.trim()) {
      chips.push({ id: 'search', kind: 'search', label: `“${f.search.trim()}”` });
    }

    for (const group of this.groups) {
      if (group.kind !== 'list') {
        continue;
      }

      const list = group.key as ListKey;

      for (const value of this.listOf(list)) {
        const label = group.options.find(option => option.value === value)?.label ?? value;
        chips.push({ id: `${list}:${value}`, kind: 'list', list, value, label });
      }
    }

    if (f.minPrice !== null || f.maxPrice !== null) {
      chips.push({ id: 'price', kind: 'price', label: this.priceLabel() });
    }

    return chips;
  }

  removeChip(chip: FilterChip): void {
    if (chip.kind === 'search') {
      this.emit({ search: '' });
    } else if (chip.kind === 'price') {
      this.emit({ minPrice: null, maxPrice: null });
    } else if (chip.list && chip.value) {
      this.toggle(chip.list, chip.value);
    }
  }

  hasFilters(): boolean {
    return this.chips.length > 0;
  }

  clear(): void {
    this.emit({
      search: '',
      subcategories: [],
      categories: [],
      materials: [],
      styles: [],
      colors: [],
      availability: [],
      sizes: [],
      shapes: [],
      constructions: [],
      discounts: [],
      minPrice: null,
      maxPrice: null
    });
  }

  /* ---------- mobile drawer ---------- */

  toggleMobileFilters(): void {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  }

  closeMobileFilters(): void {
    this.mobileFiltersOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMobileFilters();
  }

  /* ---------- internals ---------- */

  private emit(change: Partial<CatalogFilterState>): void {
    this.filter = { ...this.filter, ...change };
    this.filterChange.emit({ ...this.filter });
  }

  private priceLabel(): string {
    const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
    const { minPrice, maxPrice } = this.filter;

    if (minPrice !== null && maxPrice !== null) {
      return `${money(minPrice)} – ${money(maxPrice)}`;
    }
    if (minPrice !== null) {
      return `${money(minPrice)} & above`;
    }
    return `Under ${money(maxPrice ?? 0)}`;
  }

  private buildOptions(): void {
    const products = this.products ?? [];

    const categoryCounts = new Map<string, number>();
    const subcategoryCounts = new Map<string, number>();
    const materialCounts = new Map<string, number>();
    const availabilityCounts = new Map<string, number>();
    const sizes = new Map<string, FilterOption>();
    const styles = new Map<string, FilterOption>();
    const colors = new Map<string, FilterOption>();
    const shapes = new Map<string, FilterOption>();
    const constructions = new Map<string, FilterOption>();
    const discountCounts = DISCOUNT_STEPS.map(() => 0);

    this.presetCounts = this.pricePresets.map(() => 0);
    const prices: number[] = [];

    for (const product of products) {
      const categorySlug = product.category?.slug;
      if (categorySlug) {
        categoryCounts.set(categorySlug, (categoryCounts.get(categorySlug) ?? 0) + 1);
      }

      const materialId = product.material?.id ?? product.material_id;
      if (materialId) {
        materialCounts.set(materialId, (materialCounts.get(materialId) ?? 0) + 1);
      }

      const subcategory = normalizeFilterValue(product.specifications?.subcategory);
      if (subcategory) {
        subcategoryCounts.set(subcategory, (subcategoryCounts.get(subcategory) ?? 0) + 1);
      }

      for (const item of productAvailability(product)) {
        availabilityCounts.set(item, (availabilityCounts.get(item) ?? 0) + 1);
      }

      for (const size of productSizes(product)) {
        this.countInto(sizes, size.label);
      }

      for (const color of productColors(product)) {
        this.countInto(colors, color, true);
      }

      this.countInto(styles, product.style);
      this.countInto(shapes, product.shape);
      this.countInto(constructions, product.construction);

      const discount = productDiscount(product);
      DISCOUNT_STEPS.forEach((step, index) => {
        if (discount >= step) {
          discountCounts[index] += 1;
        }
      });

      const price = this.catalogFilter.getPrice(product);
      if (price !== null) {
        if (price > 0) {
          prices.push(price);
        }

        this.pricePresets.forEach((preset, index) => {
          const aboveMin = preset.min === null || price >= preset.min;
          const belowMax = preset.max === null || price <= preset.max;
          if (aboveMin && belowMax) {
            this.presetCounts[index] += 1;
          }
        });
      }
    }

    this.buildPriceHistogram(prices);

    const categoryOptions: FilterOption[] = (this.categories ?? []).map(category => ({
      value: category.slug,
      label: category.name,
      count: categoryCounts.get(category.slug) ?? 0
    }));

    const subcategoryOptions: FilterOption[] = Array.from(subcategoryCounts.entries())
      .map(([value, count]) => {
        const product = products.find(item =>
          normalizeFilterValue(item.specifications?.subcategory) === value
        );
        return {
          value,
          label: product?.specifications?.subcategory?.toString().trim() || value,
          count
        };
      })
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    const materialOptions: FilterOption[] = (this.materials ?? []).map(material => ({
      value: material.id,
      label: material.name,
      count: materialCounts.get(material.id) ?? 0
    }));

    const availabilityOptions: FilterOption[] = Array.from(availabilityCounts.entries())
      .map(([value, count]) => ({ value, label: AVAILABILITY_LABELS[value] ?? value, count }))
      .sort((a, b) => b.count - a.count);

    const discountOptions: FilterOption[] = DISCOUNT_STEPS
      .map((step, index) => ({
        value: String(step),
        label: `${step}% & above`,
        count: discountCounts[index]
      }))
      .filter(option => option.count > 0);

    // The order follows the filter on jaipurrugs.com
    const allGroups: FilterGroup[] = [
      { key: 'availability', title: 'Availability', kind: 'list', options: availabilityOptions },
      { key: 'categories', title: 'Category', kind: 'list', options: categoryOptions },
      { key: 'subcategories', title: 'Type', kind: 'list', options: subcategoryOptions },
      { key: 'sizes', title: 'Size', kind: 'list', options: this.sortedOptions(sizes) },
      { key: 'colors', title: 'Colour', kind: 'list', options: this.sortedOptions(colors), swatches: true, capitalize: true },
      { key: 'materials', title: 'Material', kind: 'list', options: materialOptions },
      { key: 'price', title: 'Price range', kind: 'price', options: [] },
      { key: 'shapes', title: 'Shape', kind: 'list', options: this.sortedOptions(shapes), capitalize: true },
      { key: 'constructions', title: 'Weaving technique', kind: 'list', options: this.sortedOptions(constructions), capitalize: true },
      { key: 'styles', title: 'Style', kind: 'list', options: this.sortedOptions(styles), capitalize: true },
      { key: 'discounts', title: 'Discount', kind: 'list', options: discountOptions }
    ];

    // An option with 0 rugs is hidden. It comes back by itself as soon as a rug has that value.
    this.groups = allGroups
      .map(group =>
        group.kind === 'list'
          ? {
              ...group,
              options: group.options.filter(
                option => option.count > 0 || this.isSelected(group.key as ListKey, option.value)
              )
            }
          : group
      )
      .filter(group => group.kind === 'price' || group.options.length > 0);
  }

  private countInto(
    map: Map<string, FilterOption>,
    raw: string | null | undefined,
    withSwatch = false
  ): void {
    const key = normalizeFilterValue(raw);
    if (!key) {
      return;
    }

    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }

    map.set(key, {
      value: key,
      label: (raw ?? '').toString().trim(),
      count: 1,
      swatch: withSwatch ? this.swatchFor(key) : undefined
    });
  }

  private sortedOptions(map: Map<string, FilterOption>): FilterOption[] {
    return Array.from(map.values()).sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label)
    );
  }

  private swatchFor(key: string): string {
    const match = Object.keys(COLOR_SWATCHES).find(name => key.includes(name));
    return match ? COLOR_SWATCHES[match] : '#d6d3d1';
  }
}
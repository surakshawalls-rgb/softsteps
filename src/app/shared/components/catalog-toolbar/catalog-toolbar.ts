import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CatalogFilterState,
  CatalogSort,
  DEFAULT_CATALOG_FILTER,
  normalizeFilterValue
} from '../../models/catalog-filter.model';
import { Product } from '../../models/product.model';

type ListKey = 'categories' | 'materials' | 'styles' | 'colors';
type GroupKey = ListKey | 'price';

export interface FilterOption {
  value: string;
  label: string;
  count: number;
  swatch?: string;
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
  gold: '#c9a24a',
  pink: '#d98ca0',
  purple: '#6e4a8e',
  multi: 'conic-gradient(#a8322d, #e2c04a, #4f7a52, #3b6ea5, #6e4a8e, #a8322d)'
};

@Component({
  selector: 'app-catalog-toolbar',
  imports: [FormsModule],
  templateUrl: './catalog-toolbar.html',
  styleUrl: './catalog-toolbar.css'
})
export class CatalogToolbar implements OnChanges {

  @Input() filter: CatalogFilterState = {
    ...DEFAULT_CATALOG_FILTER,
    categories: [],
    materials: [],
    styles: [],
    colors: []
  };

  @Input() categories: { id: string; name: string; slug: string }[] = [];
  @Input() materials: { id: string; name: string; slug: string }[] = [];

  /** the full (unfiltered) product list; used for the Style / Colour options and the counts */
  @Input() products: Product[] = [];

  @Input() resultCount = 0;
  @Input() totalCount = 0;

  @Output() filterChange =
    new EventEmitter<CatalogFilterState>();

  mobileFiltersOpen = false;

  categoryOptions: FilterOption[] = [];
  materialOptions: FilterOption[] = [];
  styleOptions: FilterOption[] = [];
  colorOptions: FilterOption[] = [];

  /** which accordion groups are expanded */
  private readonly openGroups = new Set<GroupKey>(['categories', 'materials', 'price']);

  /** groups whose full option list is shown (otherwise only the first few) */
  private readonly expandedGroups = new Set<GroupKey>();

  readonly visibleLimit = 6;

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

  ngOnChanges(): void {
    this.buildOptions();
  }

  /* ---------- accordion ---------- */

  isOpen(group: GroupKey): boolean {
    return this.openGroups.has(group);
  }

  toggleGroup(group: GroupKey): void {
    if (this.openGroups.has(group)) {
      this.openGroups.delete(group);
    } else {
      this.openGroups.add(group);
    }
  }

  /** first few options, or all of them once "Show more" was pressed (selected ones always stay visible) */
  visibleOptions(group: ListKey, options: FilterOption[]): FilterOption[] {
    if (this.expandedGroups.has(group) || options.length <= this.visibleLimit + 1) {
      return options;
    }

    return options.filter(
      (option, index) => index < this.visibleLimit || this.isSelected(group, option.value)
    );
  }

  hiddenCount(group: ListKey, options: FilterOption[]): number {
    return options.length - this.visibleOptions(group, options).length;
  }

  canCollapse(group: ListKey, options: FilterOption[]): boolean {
    return this.expandedGroups.has(group) && options.length > this.visibleLimit + 1;
  }

  toggleExpanded(group: GroupKey): void {
    if (this.expandedGroups.has(group)) {
      this.expandedGroups.delete(group);
    } else {
      this.expandedGroups.add(group);
    }
  }

  selectedCount(group: GroupKey): number {
    if (group === 'price') {
      return this.filter.minPrice !== null || this.filter.maxPrice !== null ? 1 : 0;
    }
    return this.filter[group].length;
  }

  /* ---------- selecting ---------- */

  isSelected(list: ListKey, value: string): boolean {
    return this.filter[list].includes(value);
  }

  toggle(list: ListKey, value: string): void {
    const current = this.filter[list];
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

  togglePreset(preset: PricePreset): void {
    if (this.isPresetActive(preset)) {
      this.emit({ minPrice: null, maxPrice: null });
    } else {
      this.emit({ minPrice: preset.min, maxPrice: preset.max });
    }
  }

  /* ---------- chips / clearing ---------- */

  get chips(): FilterChip[] {
    const chips: FilterChip[] = [];
    const f = this.filter;

    if (f.search.trim()) {
      chips.push({ id: 'search', kind: 'search', label: `“${f.search.trim()}”` });
    }

    const lists: [ListKey, FilterOption[]][] = [
      ['categories', this.categoryOptions],
      ['materials', this.materialOptions],
      ['styles', this.styleOptions],
      ['colors', this.colorOptions]
    ];

    for (const [list, options] of lists) {
      for (const value of f[list]) {
        const label = options.find(option => option.value === value)?.label ?? value;
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
      categories: [],
      materials: [],
      styles: [],
      colors: [],
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
    const materialCounts = new Map<string, number>();
    const styles = new Map<string, FilterOption>();
    const colors = new Map<string, FilterOption>();

    for (const product of products) {
      const categorySlug = product.category?.slug;
      if (categorySlug) {
        categoryCounts.set(categorySlug, (categoryCounts.get(categorySlug) ?? 0) + 1);
      }

      const materialId = product.material?.id ?? product.material_id;
      if (materialId) {
        materialCounts.set(materialId, (materialCounts.get(materialId) ?? 0) + 1);
      }

      this.countInto(styles, product.style);
      this.countInto(colors, product.primary_color, true);
    }

    this.categoryOptions = (this.categories ?? []).map(category => ({
      value: category.slug,
      label: category.name,
      count: categoryCounts.get(category.slug) ?? 0
    }));

    this.materialOptions = (this.materials ?? []).map(material => ({
      value: material.id,
      label: material.name,
      count: materialCounts.get(material.id) ?? 0
    }));

    this.styleOptions = this.sortedOptions(styles);
    this.colorOptions = this.sortedOptions(colors);
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
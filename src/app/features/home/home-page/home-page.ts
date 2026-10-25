import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, inject, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../shared/models/category.model';
import { Collection } from '../../../shared/models/collection.model';
import { Product, ProductVariant } from '../../../shared/models/product.model';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
})
export class HomePage implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private disposeAnimations?: () => void;
  private destroyed = false;
  private callMessageTimer?: ReturnType<typeof setTimeout>;

  private readonly callNumberDisplay = '+91 70071 31072';

  loading = false;
  errorMessage = '';

  /** Small message shown at the bottom of the screen after clicking "Talk to our team" on a laptop. */
  callMessage = '';

  /* ---------- "Selected for you" hanging rug rail ---------- */

  /** The rug list is repeated 5 times so the rail can loop endlessly. */
  readonly railCopies = [0, 1, 2, 3, 4];

  /** Product currently open in the quick view (null = closed). */
  quickView: Product | null = null;
  quickIndex = 0;
  quickVariantIndex = 0;
  quickImageIndex = 0;

  private railTrack?: HTMLElement;
  private railFrame = 0;
  private railReady = false;
  private dragging = false;
  private dragMoved = false;
  private dragStartX = 0;
  private dragStartScroll = 0;

  /** Runs when the rail appears on the page. */
  @ViewChild('railTrack')
  set railTrackRef(ref: ElementRef<HTMLElement> | undefined) {
    this.railTrack = ref?.nativeElement;
    this.railReady = false;

    if (this.railTrack && isPlatformBrowser(this.platformId)) {
      requestAnimationFrame(() => this.initRail());
    }
  }

  /** Close the quick view with the Escape key. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeQuickView();
  }

  /** Keeps the rail looking right when the window size changes. */
  @HostListener('window:resize')
  onResize(): void {
    this.updateRail();
  }

  // ----- prices and images -----

  productImage(product: Product): string {
    const images = (product.images ?? []).filter(
      image => typeof image.image_url === 'string' && image.image_url.trim().length > 0,
    );
    const primary = images.find(image => image.is_primary === true) ?? images[0];
    return primary?.image_url?.trim() ?? '/Category%20imgs/Luxury_rugs.jpg';
  }

  /** Same price rules as the product card. */
  priceInfo(product: Product, variant?: ProductVariant): { price: number | null; sale: number | null } {
    const v = variant ?? product.variants?.[0];

    const price =
      v?.price !== undefined && v?.price !== null
        ? v.price
        : product.base_price != null && product.compare_at_price != null
          ? product.compare_at_price
          : product.base_price ?? null;

    const sale =
      v?.sale_price !== undefined && v?.sale_price !== null
        ? v.sale_price
        : product.compare_at_price != null
          ? product.base_price ?? null
          : null;

    return { price, sale };
  }

  formatPrice(value: number | null): string {
    return value === null ? '' : '₹' + value.toLocaleString('en-IN');
  }

  // ----- quick view -----

  openQuickView(product: Product, index: number): void {
    // a drag should not open the quick view
    if (this.dragMoved) {
      this.dragMoved = false;
      return;
    }

    this.quickView = product;
    this.quickIndex = index;
    this.quickVariantIndex = 0;
    this.quickImageIndex = 0;

    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeQuickView(): void {
    if (!this.quickView) {
      return;
    }

    this.quickView = null;

    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  quickViewImages(): string[] {
    const images = (this.quickView?.images ?? [])
      .filter(image => typeof image.image_url === 'string' && image.image_url.trim().length > 0)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(image => image.image_url!.trim());

    return images.length > 0 ? images : [this.quickView ? this.productImage(this.quickView) : ''];
  }

  quickViewPrice(): { price: number | null; sale: number | null } {
    if (!this.quickView) {
      return { price: null, sale: null };
    }

    return this.priceInfo(this.quickView, this.quickView.variants?.[this.quickVariantIndex]);
  }

  // ----- rail behaviour -----

  /** Previous / next rug (arrow buttons and arrow keys). */
  scrollRail(direction: number): void {
    const track = this.railTrack;

    if (!track) {
      return;
    }

    track.scrollBy({ left: direction * this.railPitch(track), behavior: 'smooth' });
  }

  /** Mouse drag (touch screens scroll natively). */
  startDrag(event: PointerEvent, track: HTMLElement): void {
    if (event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }

    this.dragging = true;
    this.dragMoved = false;
    this.dragStartX = event.clientX;
    this.dragStartScroll = track.scrollLeft;
    track.classList.add('is-dragging');
  }

  moveDrag(event: PointerEvent, track: HTMLElement): void {
    if (!this.dragging) {
      return;
    }

    const distance = event.clientX - this.dragStartX;

    if (Math.abs(distance) > 5) {
      this.dragMoved = true;
    }

    track.scrollLeft = this.dragStartScroll - distance;
  }

  endDrag(track: HTMLElement): void {
    if (!this.dragging) {
      return;
    }

    this.dragging = false;
    track.classList.remove('is-dragging');

    // allow the next real click to open the quick view
    setTimeout(() => (this.dragMoved = false), 0);
  }

  /** Called on every scroll: repaints the rail on the next frame. */
  updateRail(): void {
    if (!this.railTrack || !isPlatformBrowser(this.platformId) || this.railFrame) {
      return;
    }

    this.railFrame = requestAnimationFrame(() => {
      this.railFrame = 0;
      this.paintRail();
    });
  }

  private railPitch(track: HTMLElement): number {
    const items = track.querySelectorAll<HTMLElement>('.rug-item');
    return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : 200;
  }

  private initRail(): void {
    const track = this.railTrack;

    if (!track || this.railReady) {
      return;
    }

    this.railReady = true;

    // start in the middle copy so you can drag both ways
    const pitch = this.railPitch(track);
    const count = this.productPreview.length;
    track.style.scrollSnapType = 'none';
    track.scrollLeft = pitch * count * 2 + pitch * Math.floor((count - 1) / 2);
    this.paintRail();
    requestAnimationFrame(() => (track.style.scrollSnapType = ''));
  }

  private paintRail(): void {
    const track = this.railTrack;

    if (!track) {
      return;
    }

    const count = this.productPreview.length;
    const pitch = this.railPitch(track);
    const setWidth = pitch * count;

    // endless loop: jump by one full set of rugs (looks identical)
    if (setWidth > 0) {
      let shift = 0;

      if (track.scrollLeft < setWidth * 1.5) {
        shift = setWidth;
      } else if (track.scrollLeft > setWidth * 2.5) {
        shift = -setWidth;
      }

      if (shift !== 0) {
        track.scrollLeft += shift;
        this.dragStartScroll += shift;
      }
    }

    const rail = track.parentElement as HTMLElement;
    const sag = parseFloat(getComputedStyle(rail).getPropertyValue('--sag')) || 56;
    const box = track.getBoundingClientRect();
    const half = box.width / 2;
    const centre = box.left + half;

    track.querySelectorAll<HTMLElement>('.rug-item').forEach(item => {
      const rect = item.getBoundingClientRect();
      const d = (rect.left + rect.width / 2 - centre) / half;      // -1 (left edge) … 1 (right edge)
      const t = Math.min(1, Math.abs(d));
      const near = Math.max(0, 1 - Math.abs(d) * 4.5);              // 1 = in the middle

      item.style.setProperty('--y', `${(sag * (1 - t * t)).toFixed(1)}px`); // follows the curve of the rail
      item.style.setProperty('--near', near.toFixed(3));
      item.style.setProperty('--dir', d < 0 ? '-1' : '1');
      item.style.zIndex = String(Math.round(near * 10));
    });

    if (setWidth > 0) {
      const progress = (((track.scrollLeft % setWidth) + setWidth) % setWidth) / setWidth;
      rail.style.setProperty('--progress', progress.toFixed(3));
    }
  }

  categories: Category[] = [
    {
      id: 'cat-1',
      name: 'Modern Rugs',
      slug: 'modern-rugs',
      description: 'Contemporary rugs designed for modern interiors.',
      image_url: '/Category%20imgs/Modern_rugs.png'
    },
    {
      id: 'cat-2',
      name: 'Traditional Carpets',
      slug: 'traditional-carpets',
      description: 'Classic patterns with timeless character.',
      image_url: '/Category%20imgs/Traditional_carpets.jpg'
    },
    {
      id: 'cat-3',
      name: 'Handmade Rugs',
      slug: 'handmade-rugs',
      description: 'Crafted with care and distinctive detailing.',
      image_url: '/Home%20shop%20by%20style/Handknotted_rugs.png'
    },
    {
      id: 'cat-4',
      name: 'Luxury Carpets',
      slug: 'luxury-carpets',
      description: 'Premium carpets for refined spaces.',
      image_url: '/Category%20imgs/Luxury_rugs.jpg'
    },
    {
      id: 'cat-5',
      name: 'Outdoor Rugs',
      slug: 'outdoor-rugs',
      description: 'Durable styles made for versatile spaces.',
      image_url: '/Category%20imgs/Outdoor_rugs.png'
    },
    {
      id: 'cat-6',
      name: 'Custom Rugs',
      slug: 'custom-rugs',
      description: 'Create a rug around your space and style.',
      image_url: '/Category%20imgs/Irregular_rugs.jpg'
    }
  ];

  collections: Collection[] = [
    {
      id: 'col-1',
      name: 'Heritage Collection',
      slug: 'heritage',
      description: 'Traditional inspiration interpreted for contemporary homes.',
      image_url: '/Home%20banner%20img%209-16/3rd_img%283_4%29.png'
    },
    {
      id: 'col-2',
      name: 'Modern Living',
      slug: 'modern-living',
      description: 'Clean textures and modern patterns for everyday living.',
      image_url: '/Home%20banner%20img%209-16/2nd_img%283_4%29.png'
    },
    {
      id: 'col-3',
      name: 'Luxury Edit',
      slug: 'luxury-edit',
      description: 'Statement pieces selected for elegant interiors.',
      image_url: '/Home%20banner%20img%209-16/4th_img%283_4%29.png'
    }
  ];

  featuredProducts: Product[] = [
    {
      id: 'p-1',
      name: 'Ivory Sand Handloom Rug',
      slug: 'ivory-sand-handloom-rug',
      short_description: 'Soft neutral tones with a handcrafted character.',
      category: this.categories[2],
      material: { id: 'm-1', name: 'Wool', slug: 'wool' },
      status: 'active',
      featured: true,
      variants: [
        {
          id: 'v-1',
          price: 8499,
          sale_price: 7499,
          size: '5 x 8 ft',
          color: 'Ivory',
          stock_quantity: 10,
          is_active: true
        }
      ],
      images: [
        {
          id: 'i-1',
          image_url: '/Trending%20rugs/ss_trending1_1.jpg',
          alt_text: 'Ivory Sand Handloom Rug',
          is_primary: true,
          sort_order: 1
        }
      ]
    },
    {
      id: 'p-2',
      name: 'Terracotta Loom Carpet',
      slug: 'terracotta-loom-carpet',
      short_description: 'Warm earthy tones with a refined woven texture.',
      category: this.categories[1],
      material: { id: 'm-2', name: 'Cotton', slug: 'cotton' },
      status: 'active',
      featured: true,
      variants: [
        {
          id: 'v-2',
          price: 6999,
          size: '5 x 7 ft',
          color: 'Terracotta',
          stock_quantity: 8,
          is_active: true
        }
      ],
      images: [
        {
          id: 'i-2',
          image_url: '/Trending%20rugs/ss_trending2_1.jpg',
          alt_text: 'Terracotta Loom Carpet',
          is_primary: true,
          sort_order: 1
        }
      ]
    },
    {
      id: 'p-3',
      name: 'Moss & Stone Modern Rug',
      slug: 'moss-stone-modern-rug',
      short_description: 'Subtle modern pattern in calm natural tones.',
      category: this.categories[0],
      material: { id: 'm-3', name: 'Polyester', slug: 'polyester' },
      status: 'active',
      featured: true,
      variants: [
        {
          id: 'v-3',
          price: 5999,
          sale_price: 5299,
          size: '5 x 7 ft',
          color: 'Moss',
          stock_quantity: 12,
          is_active: true
        }
      ],
      images: [
        {
          id: 'i-3',
          image_url: '/Trending%20rugs/ss_trending3_1.jpg',
          alt_text: 'Moss and Stone Modern Rug',
          is_primary: true,
          sort_order: 1
        }
      ]
    },
    {
      id: 'p-4',
      name: 'Royal Heritage Pattern',
      slug: 'royal-heritage-pattern',
      short_description: 'Classic pattern with a rich traditional feel.',
      category: this.categories[1],
      material: { id: 'm-4', name: 'Wool Blend', slug: 'wool-blend' },
      status: 'active',
      featured: true,
      variants: [
        {
          id: 'v-4',
          price: 12999,
          sale_price: 10999,
          size: '6 x 9 ft',
          color: 'Rust',
          stock_quantity: 5,
          is_active: true
        }
      ],
      images: [
        {
          id: 'i-4',
          image_url: '/Trending%20rugs/ss_trending4_1.jpg',
          alt_text: 'Royal Heritage Pattern Carpet',
          is_primary: true,
          sort_order: 1
        }
      ]
    },
    {
      id: 'p-5',
      name: 'Natural Jute Texture',
      slug: 'natural-jute-texture',
      short_description: 'Organic texture for warm and relaxed interiors.',
      category: this.categories[4],
      material: { id: 'm-5', name: 'Jute', slug: 'jute' },
      status: 'active',
      featured: true,
      variants: [
        {
          id: 'v-5',
          price: 4599,
          size: '4 x 6 ft',
          color: 'Natural',
          stock_quantity: 15,
          is_active: true
        }
      ],
      images: [
        {
          id: 'i-5',
          image_url: '/Trending%20rugs/ss_trending5_1.jpg',
          alt_text: 'Natural Jute Texture Rug',
          is_primary: true,
          sort_order: 1
        }
      ]
    },
    {
      id: 'p-6',
      name: 'Midnight Geometric Rug',
      slug: 'midnight-geometric-rug',
      short_description: 'Bold geometric design with a contemporary finish.',
      category: this.categories[0],
      material: { id: 'm-6', name: 'Viscose Blend', slug: 'viscose-blend' },
      status: 'active',
      featured: true,
      variants: [
        {
          id: 'v-6',
          price: 9499,
          sale_price: 8499,
          size: '6 x 9 ft',
          color: 'Charcoal',
          stock_quantity: 7,
          is_active: true
        }
      ],
      images: [
        {
          id: 'i-6',
          image_url: '/Trending%20rugs/ss_trending6_1.jpg',
          alt_text: 'Midnight Geometric Rug',
          is_primary: true,
          sort_order: 1
        }
      ]
    }
  ];

  get categoryPreview(): Category[] {
    return this.categories.slice(0, 6);
  }

  get collectionPreview(): Collection[] {
    return this.collections.slice(0, 3);
  }

  get productPreview(): Product[] {
    return this.featuredProducts.slice(0, 6);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // all page animation lives in home-animations.ts (loaded only in the browser)
    void import('./home-animations')
      .then(({ initHomeAnimations }) => initHomeAnimations(this.host.nativeElement))
      .then(dispose => {
        if (this.destroyed) {
          dispose();
        } else {
          this.disposeAnimations = dispose;
        }
      })
      .catch(() => document.documentElement.classList.remove('ss-pending'));
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.disposeAnimations?.();

    if (this.callMessageTimer) {
      clearTimeout(this.callMessageTimer);
    }
  }

  scrollCarousel(track: HTMLElement, direction: number): void {
    track.scrollBy({
      left: direction * Math.max(track.clientWidth * 0.8, 280),
      behavior: 'smooth',
    });
  }

  /**
   * "Talk to our team" card.
   * - Phones / tablets: do nothing extra, the tel: link opens the dialer.
   * - Laptops / desktops: the tel: link still tries to open a calling app,
   *   and the number is also copied with a small message, in case no app exists.
   */
  async callTeam(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    if (isTouchDevice) {
      return;
    }

    let copied = false;

    try {
      await navigator.clipboard.writeText(this.callNumberDisplay);
      copied = true;
    } catch {
      copied = false;
    }

    this.callMessage = copied
      ? `Number copied: ${this.callNumberDisplay}`
      : `Call us on ${this.callNumberDisplay}`;

    if (this.callMessageTimer) {
      clearTimeout(this.callMessageTimer);
    }

    this.callMessageTimer = setTimeout(() => {
      this.callMessage = '';
    }, 3000);
  }

  retry(): void {
    window.location.reload();
  }
}
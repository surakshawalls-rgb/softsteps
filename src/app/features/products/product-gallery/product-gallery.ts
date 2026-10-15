import { DOCUMENT } from '@angular/common';
import { Component, HostListener, Input, OnDestroy, inject, signal } from '@angular/core';

interface GalleryImage {
  id?: string;
  image_url?: string | null;
  alt_text?: string | null;
  is_primary?: boolean;
  sort_order?: number | null;
}

@Component({
  selector: 'app-product-gallery',
  template: `
    @if (images.length > 0) {
      <div class="gallery" [class.single]="images.length < 2">

        <!-- Thumbnails -->
        @if (images.length > 1) {
          <div class="thumbs" aria-label="Product image thumbnails">
            @for (img of images; track $index) {
              <button
                type="button"
                class="thumb"
                [class.active]="$index === index()"
                (click)="select($index)"
                [attr.aria-label]="'Show image ' + ($index + 1) + ' of ' + images.length"
                [attr.aria-current]="$index === index() ? 'true' : null"
              >
                <img [src]="img.image_url" [alt]="img.alt_text || productName" loading="lazy" draggable="false" />
              </button>
            }
          </div>
        }

        <!-- Main image: hover to zoom, click to open full screen -->
        <div class="stage">
          <div
            class="frame"
            [class.zooming]="zoomActive()"
            role="button"
            tabindex="0"
            aria-label="Open image full screen to zoom in"
            (mouseenter)="zoomActive.set(true)"
            (mousemove)="onMove($event)"
            (mouseleave)="zoomActive.set(false)"
            (click)="openLightbox()"
            (keydown.enter)="openLightbox()"
          >
            <img
              class="main-img"
              [src]="current?.image_url"
              [alt]="current?.alt_text || productName"
              draggable="false"
            />

            <div
              class="zoom-layer"
              aria-hidden="true"
              [style.background-image]="zoomImage"
              [style.background-position]="zoomX() + '% ' + zoomY() + '%'"
            ></div>

            <span class="zoom-hint" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="21" y1="21" x2="16.5" y2="16.5"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
              Hover to zoom
            </span>

            @if (images.length > 1) {
              <span class="counter" aria-hidden="true">{{ index() + 1 }} / {{ images.length }}</span>

              <button type="button" class="arrow arrow-prev" aria-label="Previous image" (click)="prev(); $event.stopPropagation()">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button type="button" class="arrow arrow-next" aria-label="Next image" (click)="next(); $event.stopPropagation()">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Full-screen viewer -->
      @if (lightboxOpen()) {
        <div class="lightbox" role="dialog" aria-modal="true" aria-label="Enlarged product image" (click)="closeLightbox()">

          <button type="button" class="lb-close" aria-label="Close" (click)="closeLightbox(); $event.stopPropagation()">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          @if (images.length > 1) {
            <button type="button" class="lb-arrow lb-prev" aria-label="Previous image" (click)="prev(); $event.stopPropagation()">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button type="button" class="lb-arrow lb-next" aria-label="Next image" (click)="next(); $event.stopPropagation()">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          }

          <div class="lb-scroll" (click)="$event.stopPropagation()">
            <img
              class="lb-img"
              [class.zoomed]="lbZoomed()"
              [src]="current?.image_url"
              [alt]="current?.alt_text || productName"
              draggable="false"
              (click)="toggleLbZoom($event)"
            />
          </div>

          <p class="lb-caption" (click)="$event.stopPropagation()">
            {{ productName }} · {{ index() + 1 }} / {{ images.length }} ·
            {{ lbZoomed() ? 'Click to zoom out' : 'Click image to zoom in' }}
          </p>
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; }

    .gallery {
      display: grid;
      grid-template-columns: 84px minmax(0, 1fr);
      align-items: start;
      gap: 18px;
    }
    .gallery.single { grid-template-columns: minmax(0, 1fr); }

    /* ---------- thumbnails ---------- */
    .thumbs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .thumb {
      padding: 0;
      overflow: hidden;
      aspect-ratio: 4 / 5;
      border: 2px solid transparent;
      border-radius: 14px;
      background: #efe9df;
      opacity: .65;
      cursor: pointer;
      transition: opacity 200ms ease, border-color 200ms ease, transform 200ms ease;
    }
    .thumb:hover { opacity: 1; transform: translateY(-2px); }
    .thumb.active { border-color: #b98a4f; opacity: 1; }
    .thumb:focus-visible { outline: 2px solid #b98a4f; outline-offset: 2px; }
    .thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }

    /* ---------- main image ---------- */
    .stage { min-width: 0; }
    .frame {
      position: relative;
      overflow: hidden;
      aspect-ratio: 4 / 5;
      border: 1px solid #ece6dc;
      border-radius: 24px;
      background: #efe9df;
      box-shadow: 0 30px 60px -32px rgba(41, 37, 31, .5);
      cursor: zoom-in;
    }
    .frame:focus-visible { outline: 2px solid #b98a4f; outline-offset: 3px; }
    .main-img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      -webkit-user-drag: none;
      user-select: none;
    }

    /* magnifier: the same photo, enlarged, follows the mouse */
    .zoom-layer {
      position: absolute;
      inset: 0;
      background-repeat: no-repeat;
      background-size: 240%;
      opacity: 0;
      pointer-events: none;
      transition: opacity 180ms ease;
    }
    .frame.zooming .zoom-layer { opacity: 1; }
    .frame.zooming .zoom-hint { opacity: 0; }

    .zoom-hint {
      position: absolute;
      left: 16px;
      bottom: 16px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 13px;
      border-radius: 999px;
      background: rgba(255, 253, 249, .88);
      color: #29251f;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .04em;
      backdrop-filter: blur(6px);
      transition: opacity 180ms ease;
      pointer-events: none;
    }
    .counter {
      position: absolute;
      right: 16px;
      bottom: 16px;
      padding: 8px 13px;
      border-radius: 999px;
      background: rgba(34, 32, 25, .78);
      color: #fffdf9;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .06em;
      pointer-events: none;
    }

    .arrow {
      position: absolute;
      top: 50%;
      display: grid;
      width: 42px;
      height: 42px;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: rgba(255, 253, 249, .92);
      color: #29251f;
      box-shadow: 0 8px 20px rgba(41, 37, 31, .18);
      cursor: pointer;
      opacity: 0;
      transform: translateY(-50%);
      transition: opacity 200ms ease, background-color 200ms ease, color 200ms ease;
    }
    .arrow-prev { left: 14px; }
    .arrow-next { right: 14px; }
    .frame:hover .arrow, .arrow:focus-visible { opacity: 1; }
    .arrow:hover { background: #29251f; color: #fffdf9; }

    /* ---------- full-screen viewer ---------- */
    .lightbox {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 56px 16px 20px;
      background: rgba(20, 18, 14, .94);
      animation: lbFade 180ms ease;
    }
    @keyframes lbFade { from { opacity: 0; } to { opacity: 1; } }

    .lb-scroll {
      max-width: 92vw;
      max-height: calc(100vh - 130px);
      overflow: auto;
      border-radius: 14px;
      touch-action: pan-x pan-y pinch-zoom;
      scrollbar-width: thin;
    }
    .lb-img {
      display: block;
      max-width: 92vw;
      max-height: calc(100vh - 130px);
      object-fit: contain;
      cursor: zoom-in;
      -webkit-user-drag: none;
    }
    .lb-img.zoomed {
      width: 1800px;
      max-width: none;
      max-height: none;
      height: auto;
      cursor: zoom-out;
    }

    .lb-caption {
      margin: 0;
      color: rgba(255, 253, 249, .72);
      font-size: 12px;
      letter-spacing: .05em;
      text-align: center;
    }

    .lb-close, .lb-arrow {
      position: absolute;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 253, 249, .35);
      border-radius: 50%;
      background: rgba(255, 253, 249, .08);
      color: #fffdf9;
      cursor: pointer;
      transition: background-color 180ms ease, color 180ms ease;
    }
    .lb-close:hover, .lb-arrow:hover { background: #fffdf9; color: #29251f; }
    .lb-close { top: 16px; right: 16px; width: 44px; height: 44px; }
    .lb-arrow { top: 50%; width: 48px; height: 48px; transform: translateY(-50%); }
    .lb-prev { left: 18px; }
    .lb-next { right: 18px; }

    /* ---------- tablets and phones ---------- */
    @media (max-width: 700px) {
      .gallery { grid-template-columns: minmax(0, 1fr); gap: 14px; }
      .thumbs { order: 2; flex-direction: row; overflow-x: auto; padding-bottom: 4px; }
      .thumb { flex: 0 0 68px; }
      .frame { border-radius: 18px; }
      .arrow { opacity: 1; width: 38px; height: 38px; }
      .lb-arrow { width: 42px; height: 42px; }
      .lb-prev { left: 8px; }
      .lb-next { right: 8px; }
    }

    /* touch screens have no hover, so no magnifier hint */
    @media (hover: none) {
      .zoom-layer, .zoom-hint { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .lightbox { animation: none; }
      .thumb, .arrow, .zoom-layer, .zoom-hint { transition: none; }
    }
  `],
})
export class ProductGallery implements OnDestroy {
  private readonly doc = inject(DOCUMENT);

  private list: GalleryImage[] = [];

  @Input() productName = 'Soft Steps rug';

  /** Images are shown with the primary image first, then by sort order. */
  @Input() set images(value: GalleryImage[] | null | undefined) {
    this.list = (value ?? [])
      .filter(image => !!image.image_url)
      .sort((a, b) => {
        if (!!a.is_primary !== !!b.is_primary) {
          return a.is_primary ? -1 : 1;
        }
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
    this.index.set(0);
  }
  get images(): GalleryImage[] {
    return this.list;
  }

  readonly index = signal(0);
  readonly zoomActive = signal(false);
  readonly zoomX = signal(50);
  readonly zoomY = signal(50);
  readonly lightboxOpen = signal(false);
  readonly lbZoomed = signal(false);

  get current(): GalleryImage | undefined {
    return this.list[this.index()];
  }

  get zoomImage(): string {
    const url = this.current?.image_url;
    return url ? `url("${url}")` : 'none';
  }

  select(i: number): void {
    this.index.set(i);
    this.lbZoomed.set(false);
  }

  next(): void {
    if (this.list.length < 2) return;
    this.select((this.index() + 1) % this.list.length);
  }

  prev(): void {
    if (this.list.length < 2) return;
    this.select((this.index() - 1 + this.list.length) % this.list.length);
  }

  /** Moves the magnifier with the mouse. */
  onMove(event: MouseEvent): void {
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.zoomX.set(Math.min(100, Math.max(0, ((event.clientX - box.left) / box.width) * 100)));
    this.zoomY.set(Math.min(100, Math.max(0, ((event.clientY - box.top) / box.height) * 100)));
  }

  openLightbox(): void {
    this.lbZoomed.set(false);
    this.zoomActive.set(false);
    this.lightboxOpen.set(true);
    this.lockScroll(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
    this.lbZoomed.set(false);
    this.lockScroll(false);
  }

  /** Click the enlarged photo to zoom in on the spot you clicked, click again to zoom out. */
  toggleLbZoom(event: MouseEvent): void {
    const img = event.currentTarget as HTMLElement;
    const box = img.parentElement as HTMLElement;
    const rect = img.getBoundingClientRect();
    const rx = (event.clientX - rect.left) / rect.width;
    const ry = (event.clientY - rect.top) / rect.height;

    this.lbZoomed.update(value => !value);

    if (this.lbZoomed()) {
      setTimeout(() => {
        box.scrollLeft = box.scrollWidth * rx - box.clientWidth / 2;
        box.scrollTop = box.scrollHeight * ry - box.clientHeight / 2;
      });
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (!this.lightboxOpen()) return;

    if (event.key === 'Escape') this.closeLightbox();
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowLeft') this.prev();
  }

  ngOnDestroy(): void {
    this.lockScroll(false);
  }

  private lockScroll(lock: boolean): void {
    const body = this.doc?.body;
    if (body) {
      body.style.overflow = lock ? 'hidden' : '';
    }
  }
}
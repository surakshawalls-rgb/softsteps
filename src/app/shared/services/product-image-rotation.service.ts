import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ProductImage } from '../models/product.model';

interface RotationEntry {
  images: ProductImage[];
  index: number;
  visible: boolean;
  paused: boolean;
  showImage: (image: ProductImage) => void;
}

@Injectable({ providedIn: 'root' })
export class ProductImageRotationService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly entries = new Map<HTMLElement, RotationEntry>();
  private observer?: IntersectionObserver;
  private timer?: ReturnType<typeof setInterval>;
  private reducedMotion = false;

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = mediaQuery.matches;
    mediaQuery.addEventListener('change', event => {
      this.reducedMotion = event.matches;
      this.updateTimer();
    });
  }

  register(
    element: HTMLElement,
    images: ProductImage[],
    showImage: (image: ProductImage) => void,
  ): void {
    const usableImages = images.filter(image => Boolean(image.image_url));
    if (!this.isBrowser || usableImages.length < 2) {
      return;
    }

    this.ensureObserver();
    const entry: RotationEntry = {
      images: usableImages,
      index: 0,
      visible: !this.observer,
      paused: false,
      showImage,
    };
    this.entries.set(element, entry);
    this.observer?.observe(element);
    showImage(usableImages[0]);
    this.updateTimer();
  }

  pause(element: HTMLElement, paused: boolean): void {
    const entry = this.entries.get(element);
    if (!entry) {
      return;
    }
    entry.paused = paused;
    this.updateTimer();
  }

  unregister(element: HTMLElement): void {
    this.observer?.unobserve(element);
    this.entries.delete(element);
    this.updateTimer();
  }

  private ensureObserver(): void {
    if (this.observer || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer = new IntersectionObserver(entries => {
      for (const item of entries) {
        const entry = this.entries.get(item.target as HTMLElement);
        if (entry) {
          entry.visible = item.isIntersecting;
        }
      }
      this.updateTimer();
    });
  }

  private updateTimer(): void {
    const shouldRun =
      this.isBrowser &&
      !this.reducedMotion &&
      Array.from(this.entries.values()).some(entry => entry.visible && !entry.paused);

    if (shouldRun && !this.timer) {
      this.timer = setInterval(() => this.advanceVisibleImages(), 2500);
    } else if (!shouldRun && this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private advanceVisibleImages(): void {
    for (const entry of this.entries.values()) {
      if (!entry.visible || entry.paused) {
        continue;
      }
      entry.index = (entry.index + 1) % entry.images.length;
      entry.showImage(entry.images[entry.index]);
    }
  }
}

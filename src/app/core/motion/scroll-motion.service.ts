import { isPlatformBrowser } from '@angular/common';
import { Injectable, Injector, NgZone, PLATFORM_ID, afterNextRender, inject } from '@angular/core';

/**
 * ScrollMotion — site-wide, phone-first scroll animation.
 *
 * - Headings, paragraphs and images rise / zoom in as they enter the screen.
 * - Cards in grids pop in one after another; in 2-column grids (phones) they
 *   alternate from the left and right.
 * - A thin gold progress line at the top shows how far down the page you are.
 * - Buttons / cards give a small "press" feedback when tapped on touch screens.
 *
 * It never changes layout: it only animates opacity + translate + scale with the
 * Web Animations API, and every animation is removed when it finishes, so each
 * element ends exactly as your CSS defines it.
 *
 * Opt out: add  data-no-motion  to any element (its children are skipped too).
 * Skipped automatically: header, home banner slider, home rug rail, dialogs,
 * drawers, toasts, lightboxes and the /admin area.
 */

type Variant = 'text' | 'media' | 'card';

interface Target {
  variant: Variant;
  /** horizontal start offset (px) for cards in 2-column grids */
  fromX: number;
}

const TEXT_SELECTOR = 'h1,h2,h3,h4,h5,p,blockquote,figcaption';
const MEDIA_SELECTOR = 'img,video';
const GRID_CANDIDATES = 'div,ul,ol';

const SKIP_SELECTOR = [
  '[data-no-motion]',
  'app-site-header',
  '.site-header',
  '.home-hero',
  '.rug-rail-section',
  '[role="dialog"]',
  '[aria-modal="true"]',
  'dialog',
  '[class*="qv-"]',
  '[class*="toast"]',
  '[class*="drawer"]',
  '[class*="modal"]',
  '[class*="backdrop"]',
  '[class*="popup"]',
  '[class*="lightbox"]',
  'app-catalog-toolbar aside',
  '.brand',
  '[class*="logo"]',
  'button',
  'nav',
  'svg',
  'select',
].join(',');

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const STYLE = `
.ss-scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2147483000;
  height: 3px;
  pointer-events: none;
  transform: scaleX(0);
  transform-origin: 0 50%;
  background: linear-gradient(90deg, #b88746, #e6bf84);
  box-shadow: 0 0 8px rgba(184, 135, 70, 0.55);
}

html {
  -webkit-tap-highlight-color: rgba(184, 135, 70, 0.18);
}

@media (hover: none) {
  :where(button, a[href], app-product-card) {
    transition: scale 160ms ease;
  }

  :where(button, a[href], app-product-card):active {
    scale: 0.97;
  }
}
`;

@Injectable({
  providedIn: 'root',
})
export class ScrollMotion {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly zone = inject(NgZone);

  private readonly targets = new WeakMap<Element, Target>();
  private readonly animations = new Map<Element, Animation>();

  private io?: IntersectionObserver;
  private mo?: MutationObserver;
  private bar?: HTMLElement;
  private pending = new Set<Element>();
  private flushQueued = false;
  private mobile = false;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    afterNextRender(() => this.zone.runOutsideAngular(() => this.start()), {
      injector: this.injector,
    });
  }

  /* ------------------------------------------------------------------ */

  private start(): void {
    const win = window;
    const doc = document;

    if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const style = doc.createElement('style');
    style.setAttribute('data-ss-motion', '');
    style.textContent = STYLE;
    doc.head.appendChild(style);

    this.mobile =
      win.matchMedia('(hover: none)').matches || win.matchMedia('(max-width: 768px)').matches;

    this.setupProgressBar();

    if (typeof IntersectionObserver === 'undefined' || typeof Element.prototype.animate !== 'function') {
      return;
    }

    // No bottom margin: text at the very end of a page must still be able to appear.
    this.io = new IntersectionObserver(entries => this.onIntersect(entries), {
      rootMargin: '0px',
      threshold: 0,
    });

    this.queue(doc.body);

    this.mo = new MutationObserver(records => {
      for (const record of records) {
        record.addedNodes.forEach(node => {
          if (node instanceof Element) {
            this.queue(node);
          }
        });
      }
    });
    this.mo.observe(doc.body, { childList: true, subtree: true });
  }

  private setupProgressBar(): void {
    const bar = document.createElement('div');
    bar.className = 'ss-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    this.bar = bar;

    let ticking = false;

    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    };

    const request = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ */
  /* finding things to animate                                           */
  /* ------------------------------------------------------------------ */

  private queue(node: Element): void {
    this.pending.add(node);

    if (!this.flushQueued) {
      this.flushQueued = true;
      requestAnimationFrame(() => {
        this.flushQueued = false;
        const nodes = Array.from(this.pending);
        this.pending.clear();
        nodes.forEach(item => this.scan(item));
      });
    }
  }

  private scan(root: Element): void {
    if (!root.isConnected || location.pathname.startsWith('/admin')) {
      return;
    }

    if (root.closest(SKIP_SELECTOR) && root !== document.body) {
      return;
    }

    const viewportHeight = window.innerHeight;
    const found: Element[] = [];

    // 1) cards: children of grids / wrapping flex lists / app-product-card
    const containers: Element[] = [];

    if (root.matches(GRID_CANDIDATES)) {
      containers.push(root);
    }
    root.querySelectorAll(GRID_CANDIDATES).forEach(el => containers.push(el));

    for (const container of containers) {
      const count = container.children.length;
      if (count < 2 || count > 40 || container.closest(SKIP_SELECTOR)) {
        continue;
      }

      const css = getComputedStyle(container);
      const isGrid = css.display === 'grid' || css.display === 'inline-grid';
      const isWrapFlex = css.display === 'flex' && css.flexWrap === 'wrap';
      if (!isGrid && !isWrapFlex) {
        continue;
      }

      const twoColumns = isGrid && css.gridTemplateColumns.trim().split(/\s+/).length === 2;

      Array.from(container.children).forEach((child, index) => {
        if (this.targets.has(child) || child.matches(SKIP_SELECTOR)) {
          return;
        }

        // very tall blocks are layout columns, not cards: animate their content instead
        if (child.getBoundingClientRect().height > viewportHeight * 0.8) {
          return;
        }

        const offset = this.mobile ? 24 : 18;
        const fromX = twoColumns ? (index % 2 === 0 ? -offset : offset) : 0;

        this.register(child, { variant: 'card', fromX });
        found.push(child);
      });
    }

    const cardTags = root.matches('app-product-card') ? [root] : [];
    root.querySelectorAll('app-product-card').forEach(el => cardTags.push(el));
    for (const el of cardTags) {
      if (!this.targets.has(el) && !el.closest(SKIP_SELECTOR)) {
        this.register(el, { variant: 'card', fromX: 0 });
        found.push(el);
      }
    }

    // 2) text and media that are not already inside an animated card
    const loose: Element[] = [];
    if (root.matches(`${TEXT_SELECTOR},${MEDIA_SELECTOR}`)) {
      loose.push(root);
    }
    root.querySelectorAll(`${TEXT_SELECTOR},${MEDIA_SELECTOR}`).forEach(el => loose.push(el));

    for (const el of loose) {
      if (this.targets.has(el) || el.closest(SKIP_SELECTOR) || this.insideTarget(el)) {
        continue;
      }

      const isMedia = el.matches(MEDIA_SELECTOR);

      if (!isMedia && !(el.textContent ?? '').trim()) {
        continue;
      }

      this.register(el, { variant: isMedia ? 'media' : 'text', fromX: 0 });
      found.push(el);
    }

    // hand everything to the observer
    for (const el of found) {
      this.io?.observe(el);
    }
  }

  private insideTarget(el: Element): boolean {
    let parent = el.parentElement;
    let depth = 0;

    while (parent && depth < 12) {
      if (this.targets.has(parent)) {
        return true;
      }
      parent = parent.parentElement;
      depth += 1;
    }

    return false;
  }

  /** Creates the animation in a paused state: the element is held at its "before" look until it scrolls into view. */
  private register(el: Element, target: Target): void {
    if (this.animations.size > 900) {
      return;
    }

    this.targets.set(el, target);

    const k = this.mobile ? 1 : 0.75;
    const rise = (target.variant === 'text' ? 26 : target.variant === 'media' ? 34 : 42) * k;

    const from: Keyframe = {
      opacity: 0,
      translate: `${target.fromX}px ${rise}px`,
    };
    const to: Keyframe = {
      opacity: 1,
      translate: '0px 0px',
    };

    if (target.variant === 'media') {
      from['scale'] = '0.94';
      to['scale'] = '1';
    } else if (target.variant === 'card') {
      from['scale'] = '0.965';
      to['scale'] = '1';
    }

    const animation = el.animate([from, to], {
      duration: this.mobile ? 680 : 820,
      easing: EASE,
      fill: 'both',
    });
    animation.pause();
    animation.onfinish = () => {
      animation.cancel();
      this.animations.delete(el);
    };

    this.animations.set(el, animation);
  }

  /* ------------------------------------------------------------------ */
  /* playing when visible                                                */
  /* ------------------------------------------------------------------ */

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    const entering = entries
      .filter(entry => entry.isIntersecting)
      .sort(
        (a, b) =>
          a.boundingClientRect.top - b.boundingClientRect.top ||
          a.boundingClientRect.left - b.boundingClientRect.left,
      );

    const step = this.mobile ? 55 : 80;

    entering.forEach((entry, index) => {
      this.io?.unobserve(entry.target);
      const animation = this.animations.get(entry.target);

      if (animation) {
        animation.effect?.updateTiming({ delay: Math.min(index * step, 330) });
        animation.play();
      }
    });

    // elements already scrolled past (page jumped down / restored): show them without animating
    for (const entry of entries) {
      if (!entry.isIntersecting && entry.boundingClientRect.bottom < 0) {
        this.io?.unobserve(entry.target);
        this.animations.get(entry.target)?.finish();
      }
    }
  }
}
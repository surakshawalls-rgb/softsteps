import { Component, ElementRef, OnDestroy, afterNextRender, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
})
export class SiteFooter implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly pending = new Set<HTMLElement>();
  private footer?: HTMLElement;
  private frame = 0;
  private listening = false;

  private readonly onScroll = (): void => {
    if (!this.frame) {
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.reveal();
      });
    }
  };

  constructor() {
    afterNextRender(() => this.setupAnimation());
  }

  /**
   * Footer animation trigger. Marks the footer as animation-ready, then adds
   * `is-in` to the footer (gold thread) and to each part (.rg) as soon as it
   * reaches the screen. Parts that were scrolled past (fast scroll / page jump)
   * are revealed too, so nothing can stay hidden. Skipped for visitors who ask
   * for reduced motion.
   */
  private setupAnimation(): void {
    const footer = this.host.nativeElement.querySelector<HTMLElement>('.site-footer');

    if (!footer || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.footer = footer;
    footer.classList.add('anim-ready');

    footer.querySelectorAll<HTMLElement>('.rg').forEach(part => this.pending.add(part));

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll, { passive: true });
    this.listening = true;

    this.reveal();
  }

  private reveal(): void {
    const footer = this.footer;

    if (!footer) {
      return;
    }

    const viewportBottom = window.innerHeight;

    // nothing to do until the footer is close to the screen
    if (footer.getBoundingClientRect().top >= viewportBottom) {
      return;
    }

    footer.classList.add('is-in');

    this.pending.forEach(part => {
      // top above the bottom edge = on screen, or already scrolled past
      if (part.getBoundingClientRect().top < viewportBottom - 24) {
        part.classList.add('is-in');
        this.pending.delete(part);
      }
    });

    if (this.pending.size === 0) {
      this.stopListening();
    }
  }

  private stopListening(): void {
    if (this.listening) {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onScroll);
      this.listening = false;
    }

    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  ngOnDestroy(): void {
    this.stopListening();
  }
}
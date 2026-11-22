import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { Notification as NotificationService } from './core/services/notification';
import { StorefrontLayout } from './layouts/storefront/storefront-layout/storefront-layout';
import { NotificationToast } from './shared/components/notification-toast/notification-toast';

@Component({
  selector: 'app-root',
  imports: [StorefrontLayout, NotificationToast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly notifications = inject(NotificationService);

  private disposePage?: () => void;
  private navigationId = 0;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // live "new offer" popups for visitors
    this.notifications.startPublicLive();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Every time a new page opens, start at the top (instantly, no scrolling animation).
        // Pages that want to start lower (like the shop filters) scroll themselves afterwards.
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        void this.animatePage();
      });
  }

  /** Starts the motion for the page that just opened (and stops the previous page's motion). */
  private async animatePage(): Promise<void> {
    const id = ++this.navigationId;

    this.disposePage?.();
    this.disposePage = undefined;

    // the admin area has no animation
    if (this.router.url.startsWith('/admin')) {
      return;
    }

    try {
      const { initPageAnimations } = await import('./shared/animations/page-animations');

      // wait until the new page has been drawn
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      const host = document.querySelector<HTMLElement>('main > :not(router-outlet)');

      if (!host || id !== this.navigationId) {
        return;
      }

      // the home page has its own animation file; here it only gets the footer motion
      const dispose = await initPageAnimations(host, { footerOnly: host.tagName === 'APP-HOME-PAGE' });

      if (id === this.navigationId) {
        this.disposePage = dispose;
      } else {
        dispose();
      }
    } catch {
      // animation must never break the website
    }
  }
}
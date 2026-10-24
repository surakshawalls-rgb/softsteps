import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { StorefrontLayout } from './layouts/storefront/storefront-layout/storefront-layout';

@Component({
  selector: 'app-root',
  imports: [StorefrontLayout],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    // Every time a new page opens, start at the top (instantly, no scrolling animation).
    // Pages that want to start lower (like the shop filters) scroll themselves afterwards.
    if (isPlatformBrowser(this.platformId)) {
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    }
  }
}
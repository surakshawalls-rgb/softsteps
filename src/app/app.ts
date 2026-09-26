import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('heroTitle') heroTitle?: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.heroTitle) {
      return;
    }

    gsap.from(this.heroTitle.nativeElement, {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
    });
  }
}
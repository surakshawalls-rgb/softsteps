import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Auth } from '../../../core/auth/auth';

export function getSafeAdminReturnUrl(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) {
    return '/admin';
  }

  try {
    const url = new URL(value, 'https://softsteps.local');
    const decodedPath = decodeURIComponent(url.pathname);

    if (
      url.origin !== 'https://softsteps.local' ||
      decodedPath.includes('\\') ||
      !/^\/admin(?:\/|$)/.test(decodedPath)
    ) {
      return '/admin';
    }

    if (/^\/admin\/(?:login|access-denied)(?:\/|$)/.test(decodedPath)) {
      return '/admin';
    }

    if (decodedPath.split('/').some((segment) => segment === '.' || segment === '..')) {
      return '/admin';
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/admin';
  }
}

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLoginPage {
  email = '';
  password = '';
  showPassword = false;
  isSubmitting = false;
  errorMessage = '';

  /* ---------- decorative lamp (does not touch sign-in) ---------- */
  readonly lampOn = signal(false);
  /** becomes true the first time the lamp is switched on; the login card then stays visible */
  readonly cardRevealed = signal(false);
  readonly isPulling = signal(false);
  /** how far (px) the cord is pulled down */
  readonly cordPull = signal(0);

  private pullPointerId: number | null = null;
  private pullStartX = 0;
  private pullStartY = 0;
  private pullMoved = false;
  private pullTriggered = false;
  private readonly pullThreshold = 30;
  private readonly maxPull = 62;

  constructor(
    private readonly auth: Auth,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    // People who ask for reduced motion get the lamp already lit (nothing to drag).
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.lampOn.set(true);
      this.cardRevealed.set(true);
    }
  }

  onCordPointerDown(event: PointerEvent): void {
    if (this.pullPointerId !== null) {
      return;
    }

    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);

    this.pullPointerId = event.pointerId;
    this.pullStartX = event.clientX;
    this.pullStartY = event.clientY;
    this.pullMoved = false;
    this.pullTriggered = false;
    this.isPulling.set(true);
  }

  onCordPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.pullPointerId) {
      return;
    }

    const dy = Math.max(0, event.clientY - this.pullStartY);

    if (dy > 4 || Math.abs(event.clientX - this.pullStartX) > 4) {
      this.pullMoved = true;
    }

    // the cord follows the pointer, then gets stiffer the further it is pulled
    const pull = dy < 40 ? dy : Math.min(this.maxPull, 40 + (dy - 40) * 0.35);
    this.cordPull.set(pull);

    // the lamp "clicks" the moment the cord is pulled far enough
    if (!this.pullTriggered && pull >= this.pullThreshold) {
      this.pullTriggered = true;
      this.toggleLamp();
    }
  }

  onCordPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pullPointerId) {
      return;
    }

    this.pullPointerId = null;
    this.isPulling.set(false);
    this.cordPull.set(0); // springs back

    // a simple tap (no dragging) pulls the cord once as well
    if (event.type === 'pointerup' && !this.pullTriggered && !this.pullMoved) {
      this.tapPull();
    }
  }

  /** Enter / Space on the focused cord. Mouse and touch are handled by the pointer events above. */
  onCordClick(event: MouseEvent): void {
    if (event.detail === 0) {
      this.tapPull();
    }
  }

  private tapPull(): void {
    this.cordPull.set(34);
    this.toggleLamp();
    setTimeout(() => this.cordPull.set(0), 160);
  }

  private toggleLamp(): void {
    const next = !this.lampOn();
    this.lampOn.set(next);

    if (next) {
      this.cardRevealed.set(true);
    }
  }

  async signIn(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';
    const normalizedEmail = this.email.trim();

    if (!normalizedEmail || !this.password) {
      this.errorMessage = 'Enter your email address and password to continue.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      this.errorMessage = 'Enter a valid email address.';
      return;
    }

    this.isSubmitting = true;

    try {
      await this.auth.signIn(normalizedEmail, this.password);
    } catch (error) {
      this.errorMessage = this.getSignInErrorMessage(error);
      this.isSubmitting = false;
      return;
    }

    try {
      if (!(await this.auth.isAdmin())) {
        await this.router.navigate(['/admin/access-denied']);
        return;
      }

      const returnUrl = getSafeAdminReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
      await this.router.navigateByUrl(returnUrl);
    } catch {
      this.errorMessage =
        'We could not verify administrator access right now. Please try again or contact the site administrator.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private getSignInErrorMessage(error: unknown): string {
    if (error instanceof TypeError) {
      return 'Unable to connect to the sign-in service. Check your connection and try again.';
    }

    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? Number(error.status)
        : undefined;
    const errorName =
      typeof error === 'object' && error !== null && 'name' in error
        ? String(error.name)
        : '';

    if (status === 400 || status === 401 || status === 422) {
      return 'The email address or password is incorrect. Please try again.';
    }

    if (status === 0 || errorName === 'AuthRetryableFetchError') {
      return 'Unable to connect to the sign-in service. Check your connection and try again.';
    }

    return 'We could not sign you in. Please try again shortly.';
  }
}
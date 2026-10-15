import { Component } from '@angular/core';
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

  constructor(
    private readonly auth: Auth,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

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

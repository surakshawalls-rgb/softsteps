import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Auth } from '../../../core/auth/auth';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  isSigningOut = false;
  signOutError = '';

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
  ) {}

  async signOut(): Promise<void> {
    if (this.isSigningOut) {
      return;
    }

    this.isSigningOut = true;
    this.signOutError = '';

    try {
      await this.auth.signOut();
      await this.router.navigate(['/admin/login']);
    } catch {
      this.signOutError = 'Unable to sign out. Please try again.';
    } finally {
      this.isSigningOut = false;
    }
  }
}

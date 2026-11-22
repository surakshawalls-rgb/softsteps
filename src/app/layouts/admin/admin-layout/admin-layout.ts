import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Auth } from '../../../core/auth/auth';
import { PushNotificationService } from '../../../core/services/push-notification';
import { FestivalReminder } from '../../../features/admin/offers/festival-reminder';
import { NotificationBell } from '../../../shared/components/notification-bell/notification-bell';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FestivalReminder, NotificationBell],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  isSigningOut = false;
  signOutError = '';

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly push: PushNotificationService,
  ) {}

  async signOut(): Promise<void> {
    if (this.isSigningOut) {
      return;
    }

    this.isSigningOut = true;
    this.signOutError = '';

    try {
      // stop phone alerts for this account (Android app only; does nothing on the website)
      await this.push.unregisterAdminDevice();
      await this.auth.signOut();
      await this.router.navigate(['/admin/login']);
    } catch {
      this.signOutError = 'Unable to sign out. Please try again.';
    } finally {
      this.isSigningOut = false;
    }
  }
}
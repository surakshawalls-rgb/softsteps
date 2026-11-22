import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';

import { SupabaseService } from './supabase.service';

/** unsupported = normal website (no phone alerts needed there) */
export type PushStatus = 'unsupported' | 'idle' | 'enabled' | 'denied' | 'error';

type PushPlugin = typeof import('@capacitor/push-notifications').PushNotifications;

const TOKEN_STORAGE_KEY = 'ss_admin_push_token';
const CHANNEL_ID = 'admin_alerts';

/**
 * Phone alerts for the Android app (Firebase push notifications).
 * On the normal website this does nothing at all.
 */
@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly isAndroidApp: boolean;

  private listenersReady = false;
  private registering = false;
  private currentToken: string | null = null;

  readonly status = signal<PushStatus>('unsupported');
  readonly message = signal('');

  constructor() {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    this.isAndroidApp =
      isBrowser && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

    if (this.isAndroidApp) {
      this.status.set('idle');
    }
  }

  /** Asks for permission, then saves this phone so the server can send alerts to it. */
  async registerAdminDevice(): Promise<void> {
    if (!this.isAndroidApp || this.registering) {
      return;
    }

    this.registering = true;
    this.message.set('');

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      await this.addListeners(PushNotifications);

      let permission = await PushNotifications.checkPermissions();

      if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
        permission = await PushNotifications.requestPermissions();
      }

      if (permission.receive !== 'granted') {
        this.status.set('denied');
        this.message.set('Allow notifications for this app in your Android settings.');
        return;
      }

      // Android 8+ needs a "channel"; high importance = sound + pop-up.
      await PushNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'New customer requirements',
        description: 'Alerts when a customer sends a new requirement',
        importance: 5,
        visibility: 1,
        vibration: true,
      });

      await PushNotifications.register();
    } catch (error) {
      console.warn('Phone alerts could not be started:', error);
      this.status.set('error');
      this.message.set('Phone alerts could not be started. Check the Firebase setup and rebuild the app.');
    } finally {
      this.registering = false;
    }
  }

  /** Call this just BEFORE signing out, so a signed-out phone stops getting alerts. */
  async unregisterAdminDevice(): Promise<void> {
    if (!this.isAndroidApp) {
      return;
    }

    try {
      const token = this.currentToken ?? this.readStoredToken();

      if (token) {
        await this.supabase.client.rpc('unregister_admin_push_token', { p_token: token });
        this.storeToken(null);
      }
    } catch (error) {
      console.warn('Could not remove this phone from alerts:', error);
    }

    this.currentToken = null;
    this.status.set('idle');
    this.message.set('');
  }

  // ---------- internals ----------

  private async addListeners(plugin: PushPlugin): Promise<void> {
    if (this.listenersReady) {
      return;
    }

    this.listenersReady = true;

    // Firebase gives this phone a token (its "address")
    await plugin.addListener('registration', (token) => {
      void this.saveToken(token.value);
    });

    await plugin.addListener('registrationError', (error) => {
      console.warn('Push registration error:', error);
      this.status.set('error');
      this.message.set('Phone alerts could not be set up. Check google-services.json and rebuild the app.');
    });

    // The admin tapped the alert in the notification bar
    await plugin.addListener('pushNotificationActionPerformed', (action) => {
      const link = action.notification?.data?.link;
      const target = typeof link === 'string' && link.startsWith('/') ? link : '/admin';

      void this.router.navigateByUrl(target);
    });
  }

  private async saveToken(token: string): Promise<void> {
    this.currentToken = token;

    const { error } = await this.supabase.client.rpc('register_admin_push_token', {
      p_token: token,
      p_platform: 'android',
    });

    if (error) {
      console.warn('Could not save the phone token:', error);
      this.status.set('error');
      this.message.set('Could not save this phone for alerts. Run the push SQL file in Supabase.');
      return;
    }

    this.storeToken(token);
    this.status.set('enabled');
    this.message.set('');
  }

  private readStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private storeToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // storage can be blocked; this only affects cleanup on sign-out
    }
  }
}

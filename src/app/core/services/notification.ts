import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Subject, filter } from 'rxjs';

import {
  AdminNotification,
  DesktopPermission,
  ToastMessage,
  ToastOptions,
} from '../../shared/models/notification.model';
import { ProductOffer } from '../../shared/models/offer.model';
import { Auth } from '../auth/auth';
import { SupabaseService } from './supabase.service';

const SOUND_STORAGE_KEY = 'ss_admin_notification_sound';
const MAX_TOASTS_ON_SCREEN = 4;
const MAX_ADMIN_NOTIFICATIONS = 50;

/** Set to false if you do not want visitors to see "new offer is live" popups. */
const ENABLE_PUBLIC_OFFER_TOASTS = true;

/**
 * Everything about notifications in one place:
 *  1) Popup messages (toasts) for the whole website.
 *  2) Live admin notifications (bell, sound, tab badge, desktop alerts).
 *  3) Live "new offer" popups for visitors.
 */
@Injectable({
  providedIn: 'root',
})
export class Notification {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private toastCounter = 0;
  private adminChannel?: RealtimeChannel;
  private offersChannel?: RealtimeChannel;
  private adminStarting = false;
  private hasSubscribedBefore = false;
  private audioContext?: AudioContext;
  private readonly seenOfferIds = new Set<string>();

  // ---------- what the screens read ----------
  readonly toasts = signal<ToastMessage[]>([]);
  readonly adminNotifications = signal<AdminNotification[]>([]);
  readonly unreadCount = computed(
    () => this.adminNotifications().filter((item) => !item.is_read).length,
  );

  /** True once we know the signed-in person is an admin and live mode is running. */
  readonly adminActive = signal(false);
  /** True while the live connection to Supabase is working. */
  readonly adminLive = signal(false);
  /** True if the admin_notifications table has not been created yet. */
  readonly adminSetupMissing = signal(false);

  readonly soundEnabled = signal(true);
  readonly desktopPermission = signal<DesktopPermission>('unsupported');

  /** Emits every time a brand-new admin notification arrives live. */
  readonly adminInsert$ = new Subject<AdminNotification>();

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    this.soundEnabled.set(this.readSoundSetting());
    this.desktopPermission.set(this.readDesktopPermission());

    // The page title is reset on every page change, so put the "(2)" badge back.
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      if (this.adminActive()) {
        setTimeout(() => this.applyTitleBadge(), 0);
      }
    });
  }

  // ==========================================================================
  // 1) POPUP MESSAGES (use these anywhere in the website)
  // ==========================================================================

  show(message: string, options: ToastOptions = {}): number {
    const toast: ToastMessage = {
      id: ++this.toastCounter,
      type: options.type ?? 'info',
      title: options.title,
      message,
      link: options.link,
      durationMs: options.durationMs ?? 6000,
    };

    this.toasts.update((list) => [...list, toast].slice(-MAX_TOASTS_ON_SCREEN));

    if (this.isBrowser && toast.durationMs > 0) {
      setTimeout(() => this.dismiss(toast.id), toast.durationMs);
    }

    return toast.id;
  }

  success(message: string, title?: string): number {
    return this.show(message, { type: 'success', title });
  }

  error(message: string, title?: string): number {
    return this.show(message, { type: 'error', title, durationMs: 9000 });
  }

  info(message: string, title?: string): number {
    return this.show(message, { type: 'info', title });
  }

  warning(message: string, title?: string): number {
    return this.show(message, { type: 'warning', title, durationMs: 8000 });
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }

  openToast(toast: ToastMessage): void {
    this.dismiss(toast.id);

    if (toast.link) {
      void this.router.navigateByUrl(toast.link);
    }
  }

  // ==========================================================================
  // 2) LIVE ADMIN NOTIFICATIONS
  // ==========================================================================

  /** Starts live mode for the admin. Safe to call more than once. */
  async startAdminLive(): Promise<void> {
    if (!this.isBrowser || this.adminChannel || this.adminStarting) {
      return;
    }

    this.adminStarting = true;

    try {
      if (!(await this.auth.isAdmin())) {
        return;
      }

      this.adminActive.set(true);
      await this.loadAdminNotifications();

      this.hasSubscribedBefore = false;

      this.adminChannel = this.supabase.client
        .channel('ss-admin-notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
          (payload) => this.onAdminInsert(payload.new as unknown as AdminNotification),
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'admin_notifications' },
          (payload) => this.onAdminUpdate(payload.new as unknown as AdminNotification),
        )
        .subscribe((status) => this.onAdminStatus(String(status)));
    } catch (error) {
      console.warn('Live admin notifications could not be started:', error);
      this.adminActive.set(false);
    } finally {
      this.adminStarting = false;
    }
  }

  /** Stops live mode (used when the admin leaves the admin area or signs out). */
  stopAdminLive(): void {
    if (this.adminChannel) {
      void this.supabase.client.removeChannel(this.adminChannel);
      this.adminChannel = undefined;
    }

    this.adminActive.set(false);
    this.adminLive.set(false);
    this.adminNotifications.set([]);
    this.applyTitleBadge();
  }

  async loadAdminNotifications(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('admin_notifications')
      .select('id, type, title, body, link, reference_id, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(MAX_ADMIN_NOTIFICATIONS);

    if (error) {
      console.warn('Could not load admin notifications:', error);
      // 42P01 / PGRST205 = the table does not exist yet (the SQL was not run)
      this.adminSetupMissing.set(error.code === '42P01' || error.code === 'PGRST205');
      return;
    }

    this.adminSetupMissing.set(false);
    this.adminNotifications.set((data ?? []) as AdminNotification[]);
    this.applyTitleBadge();
  }

  async markAsRead(id: string): Promise<void> {
    const item = this.adminNotifications().find((entry) => entry.id === id);

    if (!item || item.is_read) {
      return;
    }

    this.patchNotification(id, { is_read: true });

    const { error } = await this.supabase.client
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.warn('Could not mark notification as read:', error);
      this.patchNotification(id, { is_read: false });
    }
  }

  async markAllAsRead(): Promise<void> {
    const before = this.adminNotifications();

    if (!before.some((item) => !item.is_read)) {
      return;
    }

    this.setAdminNotifications(before.map((item) => ({ ...item, is_read: true })));

    const { error } = await this.supabase.client
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      console.warn('Could not mark all notifications as read:', error);
      this.setAdminNotifications(before);
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled.set(enabled);

    try {
      localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'on' : 'off');
    } catch {
      // storage can be blocked; the setting then just lasts until the page closes
    }

    if (enabled) {
      this.playSound();
    }
  }

  async requestDesktopPermission(): Promise<void> {
    if (!this.isBrowser || !('Notification' in window)) {
      return;
    }

    try {
      const result = await window.Notification.requestPermission();
      this.desktopPermission.set(result);
    } catch {
      this.desktopPermission.set(this.readDesktopPermission());
    }
  }

  // ---------- admin internals ----------

  private onAdminStatus(status: string): void {
    if (status === 'SUBSCRIBED') {
      this.adminLive.set(true);

      // After a lost connection, fetch anything we missed meanwhile.
      if (this.hasSubscribedBefore) {
        void this.loadAdminNotifications();
      }

      this.hasSubscribedBefore = true;
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      this.adminLive.set(false);
    }
  }

  private onAdminInsert(item: AdminNotification): void {
    if (!item?.id || this.adminNotifications().some((entry) => entry.id === item.id)) {
      return;
    }

    this.setAdminNotifications([item, ...this.adminNotifications()].slice(0, MAX_ADMIN_NOTIFICATIONS));

    this.show(item.body ?? '', {
      type: 'info',
      title: item.title,
      link: item.link ?? undefined,
      durationMs: 9000,
    });

    this.playSound();
    this.showDesktopAlert(item);
    this.adminInsert$.next(item);
  }

  private onAdminUpdate(item: AdminNotification): void {
    if (!item?.id) {
      return;
    }

    this.patchNotification(item.id, item);
  }

  private patchNotification(id: string, changes: Partial<AdminNotification>): void {
    this.setAdminNotifications(
      this.adminNotifications().map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)),
    );
  }

  private setAdminNotifications(list: AdminNotification[]): void {
    this.adminNotifications.set(list);
    this.applyTitleBadge();
  }

  /** Shows "(2) Admin Communication Centre" in the browser tab while there are unread items. */
  private applyTitleBadge(): void {
    if (!this.isBrowser) {
      return;
    }

    const count = this.adminActive() ? this.unreadCount() : 0;
    const cleanTitle = document.title.replace(/^\(\d+\)\s*/, '');

    document.title = count > 0 ? `(${count}) ${cleanTitle}` : cleanTitle;
  }

  private playSound(): void {
    if (!this.isBrowser || !this.soundEnabled()) {
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) {
        return;
      }

      this.audioContext ??= new AudioCtx();
      const ctx = this.audioContext;

      void ctx.resume().catch(() => undefined);

      // two short, soft "ding-dong" tones
      [
        { frequency: 880, start: 0 },
        { frequency: 1175, start: 0.16 },
      ].forEach(({ frequency, start }) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const begin = ctx.currentTime + start;

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, begin);
        gain.gain.exponentialRampToValueAtTime(0.18, begin + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, begin + 0.32);

        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(begin);
        oscillator.stop(begin + 0.35);
      });
    } catch {
      // sound must never break the website
    }
  }

  /** A system notification, only when the admin is on another tab or window. */
  private showDesktopAlert(item: AdminNotification): void {
    if (
      !this.isBrowser ||
      !document.hidden ||
      !('Notification' in window) ||
      window.Notification.permission !== 'granted'
    ) {
      return;
    }

    try {
      const alert = new window.Notification(item.title, {
        body: item.body ?? '',
        tag: item.id,
      });

      alert.onclick = () => {
        window.focus();
        alert.close();

        if (item.link) {
          void this.router.navigateByUrl(item.link);
        }
      };
    } catch {
      // some phones only allow notifications through a service worker - ignore
    }
  }

  private readSoundSetting(): boolean {
    try {
      return localStorage.getItem(SOUND_STORAGE_KEY) !== 'off';
    } catch {
      return true;
    }
  }

  private readDesktopPermission(): DesktopPermission {
    return 'Notification' in window ? window.Notification.permission : 'unsupported';
  }

  // ==========================================================================
  // 3) LIVE "NEW OFFER" POPUPS FOR VISITORS
  // ==========================================================================

  startPublicLive(): void {
    if (!this.isBrowser || !ENABLE_PUBLIC_OFFER_TOASTS || this.offersChannel) {
      return;
    }

    try {
      this.offersChannel = this.supabase.client
        .channel('ss-public-offers')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'product_offers' },
          (payload) => this.onOfferCreated(payload.new as unknown as ProductOffer),
        )
        .subscribe();
    } catch (error) {
      console.warn('Live offer popups could not be started:', error);
    }
  }

  private onOfferCreated(offer: ProductOffer): void {
    // Admins create offers themselves, so they do not need the visitor popup.
    if (!offer?.id || this.seenOfferIds.has(offer.id) || this.router.url.startsWith('/admin')) {
      return;
    }

    this.seenOfferIds.add(offer.id);

    const discount =
      offer.discount_type === 'flat'
        ? `Rs. ${Number(offer.discount_value).toLocaleString('en-IN')} off`
        : `${Number(offer.discount_value)}% off`;

    this.show(`${offer.name} - ${discount}. Tap to see the offer.`, {
      type: 'success',
      title: 'New offer is live',
      link: '/shop',
      durationMs: 10000,
    });
  }
}

/** Easier-to-read name for the service (the class keeps its original name). */
export { Notification as NotificationService };
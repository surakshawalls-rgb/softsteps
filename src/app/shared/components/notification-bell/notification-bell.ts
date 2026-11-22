import { Component, ElementRef, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Notification as NotificationService } from '../../../core/services/notification';
import { AdminNotification } from '../../models/notification.model';

@Component({
  selector: 'app-notification-bell',
  imports: [],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css',
})
export class NotificationBell implements OnInit, OnDestroy {
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly items = this.notifications.adminNotifications;
  readonly unreadCount = this.notifications.unreadCount;
  readonly active = this.notifications.adminActive;
  readonly live = this.notifications.adminLive;
  readonly setupMissing = this.notifications.adminSetupMissing;
  readonly soundEnabled = this.notifications.soundEnabled;
  readonly desktopPermission = this.notifications.desktopPermission;

  readonly open = signal(false);

  ngOnInit(): void {
    void this.notifications.startAdminLive();
  }

  ngOnDestroy(): void {
    this.notifications.stopAdminLive();
  }

  toggle(): void {
    this.open.update((value) => !value);
  }

  async select(item: AdminNotification): Promise<void> {
    void this.notifications.markAsRead(item.id);
    this.open.set(false);

    if (item.link) {
      await this.router.navigateByUrl(item.link);
    }
  }

  markAllRead(): void {
    void this.notifications.markAllAsRead();
  }

  toggleSound(): void {
    this.notifications.setSoundEnabled(!this.soundEnabled());
  }

  enableDesktop(): void {
    void this.notifications.requestDesktopPermission();
  }

  timeAgo(value: string): string {
    const time = new Date(value).getTime();

    if (Number.isNaN(time)) {
      return '';
    }

    const minutes = Math.floor((Date.now() - time) / 60000);

    if (minutes < 1) {
      return 'Just now';
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    const days = Math.floor(hours / 24);

    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }
}
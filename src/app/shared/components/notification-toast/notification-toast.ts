import { Component, inject } from '@angular/core';

import { Notification as NotificationService } from '../../../core/services/notification';
import { ToastMessage } from '../../models/notification.model';

@Component({
  selector: 'app-notification-toast',
  imports: [],
  templateUrl: './notification-toast.html',
  styleUrl: './notification-toast.css',
})
export class NotificationToast {
  private readonly notifications = inject(NotificationService);

  readonly toasts = this.notifications.toasts;

  open(toast: ToastMessage): void {
    this.notifications.openToast(toast);
  }

  close(event: Event, toast: ToastMessage): void {
    event.stopPropagation();
    this.notifications.dismiss(toast.id);
  }
}
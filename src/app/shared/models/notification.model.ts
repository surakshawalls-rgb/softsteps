/** The look of a popup message (toast). */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/** One popup message shown on screen for a few seconds. */
export interface ToastMessage {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  /** If set, clicking the popup opens this page, e.g. '/admin' or '/shop'. */
  link?: string;
  /** How long it stays on screen in milliseconds. 0 = stays until closed. */
  durationMs: number;
}

/** Optional settings when showing a popup. */
export interface ToastOptions {
  type?: ToastType;
  title?: string;
  link?: string;
  durationMs?: number;
}

/** One row of the admin_notifications table (the admin bell list). */
export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export type DesktopPermission = NotificationPermission | 'unsupported';
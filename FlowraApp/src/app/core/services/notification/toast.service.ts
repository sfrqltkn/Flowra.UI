import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  /** True when the dismiss animation is running */
  dismissing: boolean;
}

const DURATIONS: Record<ToastType, number> = {
  success: 5000,
  info: 5000,
  warning: 6000,
  error: 7000,
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  // ─── Public API ────────────────────────────────────────────────────────────

  success(message: string, title?: string): void {
    this.add('success', message, title);
  }

  error(message: string, title?: string): void {
    this.add('error', message, title);
  }

  warning(message: string, title?: string): void {
    this.add('warning', message, title);
  }

  info(message: string, title?: string): void {
    this.add('info', message, title);
  }

  dismiss(id: string): void {
    // Mark as dismissing → triggers CSS fade-out animation
    this._toasts.update(list =>
      list.map(t => (t.id === id ? { ...t, dismissing: true } : t))
    );
    // Remove from list after animation completes (~400 ms)
    setTimeout(() => this.remove(id), 400);
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private add(type: ToastType, message: string, title?: string): void {
    const id = crypto.randomUUID();
    const duration = DURATIONS[type];

    const toast: ToastMessage = { id, type, title, message, duration, dismissing: false };

    this._toasts.update(list => [...list, toast]);

    // Auto-dismiss after duration
    setTimeout(() => this.dismiss(id), duration);
  }

  private remove(id: string): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}

import { Injectable, signal } from '@angular/core';

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmModalService {
  readonly state = signal<ConfirmModalOptions | null>(null);

  open(options: ConfirmModalOptions): void {
    this.state.set({ confirmText: 'Onayla', cancelText: 'İptal', type: 'danger', ...options });
  }

  confirm(): void {
    const current = this.state();
    if (current) {
      current.onConfirm();
      this.state.set(null);
    }
  }

  cancel(): void {
    const current = this.state();
    if (current?.onCancel) current.onCancel();
    this.state.set(null);
  }
}

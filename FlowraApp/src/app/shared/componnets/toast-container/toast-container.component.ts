import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/notification/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  trackById(_: number, toast: ToastMessage): string {
    return toast.id;
  }
}

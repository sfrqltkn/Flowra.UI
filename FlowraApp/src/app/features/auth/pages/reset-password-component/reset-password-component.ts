import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { CustomButtonComponent } from '../../../../shared/componnets/custom-button-component/custom-button-component';
import { BaseInputComponent } from '../../../../shared/componnets/base-input-component/base-input-component';
import { AuthLayoutComponent } from '../../../../shared/componnets/auth-layout/auth-layout-component';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ToastService } from '../../../../core/services/notification/toast.service';
import { ApiError } from '../../../../core/models/api-error.model';
import { ResetPasswordRequest } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-reset-password-component',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent, BaseInputComponent, AuthLayoutComponent, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password-component.html',
  styleUrl: './reset-password-component.scss',
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;

  isSubmitted = false;
  isInvalidLink = false;
  isInitialSetup = false;

  private userId!: number;
  private resetToken!: string;

  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const queryParams = this.route.snapshot.queryParams;

    if (!queryParams['userId'] || !queryParams['token']) {
      this.isInvalidLink = true;
      return;
    }

    this.userId = Number(queryParams['userId']);
    this.resetToken = queryParams['token'];

    if (queryParams['initialSetup'] === 'true') {
      this.isInitialSetup = true;
    }

    if (isNaN(this.userId)) {
      this.isInvalidLink = true;
      return;
    }

    this.initForm();
  }

  private initForm() {
    this.resetForm = this.fb.group({
      newPassword:        ['', { validators: [], updateOn: 'blur' }],
      confirmNewPassword: ['', { validators: [], updateOn: 'blur' }]
    });
  }

  get newPasswordControl(): FormControl {
    return this.resetForm.get('newPassword') as FormControl;
  }

  get confirmNewPasswordControl(): FormControl {
    return this.resetForm.get('confirmNewPassword') as FormControl;
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const request: ResetPasswordRequest = {
      userId: this.userId,
      resetToken: this.resetToken,
      newPassword: this.resetForm.value.newPassword,
      confirmNewPassword: this.resetForm.value.confirmNewPassword
    };

    this.authService.resetPassword(request).subscribe({
      next: () => {
        const bc = new BroadcastChannel('flowra_auth_channel');
        bc.postMessage({ type: 'PASSWORD_RESET_SUCCESS' });
        bc.close();

        this.isSubmitted = true;

        setTimeout(() => {
          if (this.isInitialSetup) {
            this.authService.logout(true); // UI state'i temizleyip login'e yollar
          } else {
            window.close(); // E-posta linkinden ayrı sekmede açıldıysa kapatmayı dener
          }
        }, 4000);
      },
      error: (err: ApiError) => {
        if (err.errors && Object.keys(err.errors).length > 0) {
          // Field-level hatalar — forma yaz
          Object.keys(err.errors).forEach(key => {
            const formKey = key.charAt(0).toLowerCase() + key.slice(1);
            const control = this.resetForm.get(formKey);
            if (control) {
              control.setErrors({ serverError: err.errors![key][0] });
            }
          });
        } else {
          // Genel hata toast — 400/404/409/422 (interceptor 401/403/5xx'i halletti)
          const isClientError = err.status >= 400 && err.status < 500
            && err.status !== 401
            && err.status !== 403;
          if (isClientError) {
            this.toastService.error(
              err.detail || 'Şifre sıfırlanırken bir hata oluştu.',
              err.title
            );
            // Şifre alanını sıfırla ki kullanıcı yeniden denesin
            this.resetForm.get('newPassword')?.reset();
            this.resetForm.get('confirmNewPassword')?.reset();
          }
        }
      }
    });
  }

  closeTab(): void {
    if (this.isInitialSetup) {
      this.authService.logout(true);
    } else {
      window.close();
    }
  }
}

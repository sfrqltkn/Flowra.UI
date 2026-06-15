import { CustomButtonComponent } from './../../../../shared/componnets/custom-button-component/custom-button-component';
import { Component, inject, OnInit } from '@angular/core';
import { ApiError } from '../../../../core/models/api-error.model';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ToastService } from '../../../../core/services/notification/toast.service';
import { BaseInputComponent } from '../../../../shared/componnets/base-input-component/base-input-component';
import { AuthLayoutComponent } from '../../../../shared/componnets/auth-layout/auth-layout-component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password-component',
  standalone: true,
  imports: [CustomButtonComponent, BaseInputComponent, AuthLayoutComponent, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password-component.html',
  styleUrl: './forgot-password-component.scss',
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;

  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  ngOnInit() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', { validators: [], updateOn: 'blur' }]
    });
  }

  get emailControl(): FormControl {
    return this.forgotPasswordForm.get('email') as FormControl;
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const emailValue = this.forgotPasswordForm.value.email;

    this.authService.forgotPassword(emailValue).subscribe({
      next: () => {
        // Başarılı: Login ekranına yönlendir (orada queryParam toast'u gösterilecek)
        this.router.navigate(['/auth/login'], { queryParams: { resetSent: 'true' } });
      },
      error: (err: ApiError) => {
        if (err.errors && Object.keys(err.errors).length > 0) {
          // Field-level hatalar — forma yaz
          Object.keys(err.errors).forEach(key => {
            const formKey = key.charAt(0).toLowerCase() + key.slice(1);
            const control = this.forgotPasswordForm.get(formKey);
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
              err.detail || 'Şifre sıfırlama isteği gönderilemedi.',
              err.title
            );
          }
        }
      }
    });
  }
}

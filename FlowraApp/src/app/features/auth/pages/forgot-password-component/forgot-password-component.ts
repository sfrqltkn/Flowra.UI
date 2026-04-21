import { CustomButtonComponent } from './../../../../shared/componnets/custom-button-component/custom-button-component';
import { Component, inject, OnInit } from '@angular/core';
import { ApiError } from '../../../../core/models/api-error.model';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthValidators } from '../../../../shared/validators/auth-validators/auth-validators';
import { AuthService } from '../../../../core/services/auth/auth.service';
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
  private router = inject(Router);

  ngOnInit() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', {
        validators: [
          Validators.required,
          AuthValidators.noWhitespace(),
          Validators.email,
          Validators.maxLength(256)
        ],
        updateOn: 'blur'
      }]
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
        // BAŞARILI: Yönlendir ve Login ekranına sinyal parametresini gönder
        this.router.navigate(['/auth/login'], { queryParams: { resetSent: 'true' } });
      },
      error: (err: ApiError) => {
        if (err.errors) {
          Object.keys(err.errors).forEach(key => {
            const formKey = key.charAt(0).toLowerCase() + key.slice(1);
            const control = this.forgotPasswordForm.get(formKey);
            if (control) {
              control.setErrors({ serverError: err.errors![key][0] });
            }
          });
        }
        else if (err.detail) {
          this.emailControl.setErrors({ serverError: err.detail });
        }
      }
    });
  }
}

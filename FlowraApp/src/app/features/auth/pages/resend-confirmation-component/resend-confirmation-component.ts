import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthLayoutComponent } from '../../../../shared/componnets/auth-layout/auth-layout-component';
import { BaseInputComponent } from '../../../../shared/componnets/base-input-component/base-input-component';
import { CustomButtonComponent } from '../../../../shared/componnets/custom-button-component/custom-button-component';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { AuthValidators } from '../../../../shared/validators/auth-validators/auth-validators';
import { ApiError } from '../../../../core/models/api-error.model';

@Component({
  selector: 'app-resend-confirmation-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AuthLayoutComponent,
    BaseInputComponent,
    CustomButtonComponent
  ],
  templateUrl: './resend-confirmation-component.html',
  styleUrl: './resend-confirmation-component.scss',
})
export class ResendConfirmationComponent implements OnInit {
  resendForm!: FormGroup;

  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.resendForm = this.fb.group({
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
    return this.resendForm.get('email') as FormControl;
  }

  onSubmit() {
    if (this.resendForm.invalid) {
      this.resendForm.markAllAsTouched();
      return;
    }

    const emailValue = this.resendForm.value.email;

    this.authService.resendConfirmationEmail(emailValue).subscribe({
      next: () => {
        // Başarılı olduğunda Login sayfasına yönlendir ve parametre ile bilgi ver
        this.router.navigate(['/auth/login'], { queryParams: { confirmationSent: 'true' } });
      },
      error: (err: ApiError) => {
        // Backend'den dönen validasyon (400) veya bulunamadı (404) hatalarını yakala
        if (err.errors) {
          Object.keys(err.errors).forEach(key => {
            const formKey = key.charAt(0).toLowerCase() + key.slice(1);
            const control = this.resendForm.get(formKey);
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

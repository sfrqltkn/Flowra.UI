import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { CustomButtonComponent } from '../../../../shared/componnets/custom-button-component/custom-button-component';
import { BaseInputComponent } from '../../../../shared/componnets/base-input-component/base-input-component';
import { AuthLayoutComponent } from '../../../../shared/componnets/auth-layout/auth-layout-component';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { AuthValidators } from '../../../../shared/validators/auth-validators/auth-validators';
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

  private userId!: number;
  private resetToken!: string;

  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef); // Güncelleme için

  ngOnInit() {
    const queryParams = this.route.snapshot.queryParams;

    // Backend'i güncellediğiniz için userId olarak arıyoruz
    if (!queryParams['userId'] || !queryParams['token']) {
      this.isInvalidLink = true;
      return;
    }

    this.userId = Number(queryParams['userId']);
    this.resetToken = queryParams['token'];

    if (isNaN(this.userId)) {
      this.isInvalidLink = true;
      return;
    }

    this.initForm();
  }

  private initForm() {
    this.resetForm = this.fb.group({
      newPassword: ['', {
        validators: [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(20),
          AuthValidators.passwordComplexity()
        ],
        updateOn: 'blur'
      }],
      confirmNewPassword: ['', {
        validators: [Validators.required],
        updateOn: 'blur'
      }]
    }, {
      validators: [AuthValidators.matchPasswords('newPassword', 'confirmNewPassword')]
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
        // 1. DİĞER SEKMEYE SİNYAL GÖNDER (Login formuna haber ver)
        const bc = new BroadcastChannel('flowra_auth_channel');
        bc.postMessage({ type: 'PASSWORD_RESET_SUCCESS' });
        bc.close();

        // 2. BU SEKMENİN GÖRSEL DURUMUNU GÜNCELLE
        this.isSubmitted = true;
        this.cdr.detectChanges();

        // 3. PENCEREYİ BELİRLİ SÜRE SONRA KAPAT
        setTimeout(() => {
          window.close();
        }, 4000);
      },
      error: (err: ApiError) => {
        if (err.errors) {
          Object.keys(err.errors).forEach(key => {
            const formKey = key.charAt(0).toLowerCase() + key.slice(1);
            const control = this.resetForm.get(formKey);
            if (control) {
              control.setErrors({ serverError: err.errors![key][0] });
            }
          });
        }
      }
    });
  }

  closeTab(): void {
    window.close();
  }
}

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
  isInitialSetup = false;

  private userId!: number;
  private resetToken!: string;

  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef); // Güncelleme için

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
      resetToken: this.resetToken, // Decode etmene gerek yok, direkt gönder
      newPassword: this.resetForm.value.newPassword,
      confirmNewPassword: this.resetForm.value.confirmNewPassword
    };

    this.authService.resetPassword(request).subscribe({
      next: () => {
        const bc = new BroadcastChannel('flowra_auth_channel');
        bc.postMessage({ type: 'PASSWORD_RESET_SUCCESS' });
        bc.close();

        this.isSubmitted = true;
        this.cdr.detectChanges();

        setTimeout(() => {
          // Eğer login ekranından yönlendirme ile gelindiyse (yeni sekme açılmadıysa) window.close() çalışmaz!
          // Bu yüzden kullanıcıyı tekrar login'e geri gönderelim.
          if (this.isInitialSetup) {
             this.authService.logout(true); // UI state'i temizleyip logine yollar
          } else {
             window.close(); // E-posta linkinden ayrı sekmede açıldıysa kapatmayı dener
          }
        }, 4000);
      },
      error: (err: ApiError) => {
        // ... (hata yakalama bloğu aynı kalacak)
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

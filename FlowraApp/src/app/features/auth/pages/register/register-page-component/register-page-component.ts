import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { Observable } from "rxjs";

import { AuthService } from "../../../../../core/services/auth/auth.service";
import { ThemeService } from "../../../../../core/services/theme/theme.service";
import { ToastService } from "../../../../../core/services/notification/toast.service";
import { ApiError } from "../../../../../core/models/api-error.model";
import { AuthLayoutComponent } from "../../../../../shared/componnets/auth-layout/auth-layout-component";
import { BaseInputComponent } from "../../../../../shared/componnets/base-input-component/base-input-component";
import { CustomButtonComponent } from "../../../../../shared/componnets/custom-button-component/custom-button-component";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AuthLayoutComponent,
    BaseInputComponent,
    CustomButtonComponent
  ],
  templateUrl: './register-page-component.html'
})
export class RegisterPageComponent implements OnInit {
  registerForm!: FormGroup;
  isDarkMode$!: Observable<boolean>;

  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  ngOnInit() {
    this.isDarkMode$ = this.themeService.isDarkMode$;

    this.registerForm = this.fb.group({
      firstName:       ['', { validators: [], updateOn: 'blur' }],
      lastName:        ['', { validators: [], updateOn: 'blur' }],
      userName:        ['', { validators: [], updateOn: 'blur' }],
      email:           ['', { validators: [], updateOn: 'blur' }],
      phoneNumber:     ['', { validators: [], updateOn: 'blur' }],
      password:        ['', { validators: [], updateOn: 'blur' }],
      confirmPassword: ['', { validators: [], updateOn: 'blur' }]
    });
  }

  // Getter Metotları (HTML'i temiz tutmak için)
  getControl(name: string): FormControl {
    return this.registerForm.get(name) as FormControl;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // confirmPassword backend'e gitmemeli, o yüzden veriden ayıklıyoruz
    const { confirmPassword, ...registerData } = this.registerForm.value;

    this.authService.register(registerData).subscribe({
      next: (response) => {
        // Backend'den Başarılı Mesajı
        this.toastService.success(response.detail || 'Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.', 'Kayıt Başarılı');
        this.router.navigate(['/auth/login'], { queryParams: { checkEmail: 'true' } });
      },
      error: (err: ApiError) => {
        if (err.errors && Object.keys(err.errors).length > 0) {
          // Field-level hatalar (400 Validation / 409 Conflict) — forma yaz
          Object.keys(err.errors).forEach(key => {
            const formKey = key.charAt(0).toLowerCase() + key.slice(1);
            const control = this.registerForm.get(formKey);
            if (control) {
              control.setErrors({ serverError: err.errors![key][0] });
            }
          });
        } else {
          // Genel hata — sadece 400/404/409/422 (interceptor 401/403/5xx'i halletti)
          const isClientError = err.status >= 400 && err.status < 500
            && err.status !== 401
            && err.status !== 403;
          if (isClientError) {
            this.toastService.error(
              err.detail || 'Kayıt sırasında bir hata oluştu.',
              err.title
            );
          }
        }
      }
    });
  }

}

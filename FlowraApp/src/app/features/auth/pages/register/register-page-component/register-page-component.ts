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
import { AuthValidators } from "../../../../../shared/validators/auth-validators/auth-validators";

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
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), AuthValidators.noWhitespace(), AuthValidators.onlyAlphabetic()]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), AuthValidators.noWhitespace(), AuthValidators.onlyAlphabetic()]],
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), AuthValidators.noWhitespace(), Validators.pattern(/^[a-zA-Z0-9_.]+$/)]],
      email: ['', [Validators.required, Validators.maxLength(256), Validators.email, AuthValidators.noWhitespace()]],
      phoneNumber: ['', [Validators.required,Validators.minLength(10), Validators.maxLength(20), Validators.pattern(/^[\d\+\-\(\)\s]+$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100), AuthValidators.noWhitespace(), AuthValidators.passwordComplexity()]],
      confirmPassword: ['', [Validators.required]]
    }, {
      // Şifre eşleştirme kuralı tüm form grubuna uygulanır
      validators: [AuthValidators.matchPasswords('password', 'confirmPassword')],
      updateOn: 'blur'
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
        this.toastService.success(response.detail || 'Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.');
        this.router.navigate(['/auth/login'], { queryParams: { checkEmail: 'true' } });
      },
      error: (err: ApiError) => {
        // Backend'den Gelen Hataları (409 Conflict veya 400 Validation) Forma Bas
        if (err.errors) {
          Object.keys(err.errors).forEach(key => {
            const formKey = key.charAt(0).toLowerCase() + key.slice(1); // Örn: UserName -> userName
            const control = this.registerForm.get(formKey);
            if (control) {
              control.setErrors({ serverError: err.errors![key][0] });
            }
          });
        }
      }
    });
  }
}

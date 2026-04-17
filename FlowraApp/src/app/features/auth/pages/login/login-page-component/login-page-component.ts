import { CommonModule } from "@angular/common";
// DİKKAT: ChangeDetectorRef eklendi
import { Component, inject, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from "@angular/core";
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";

import { AuthService } from "../../../../../core/services/auth/auth.service";
import { ThemeService } from "../../../../../core/services/theme/theme.service";
import { AuthLayoutComponent } from "../../../../../shared/componnets/auth-layout/auth-layout-component";
import { BaseInputComponent } from "../../../../../shared/componnets/base-input-component/base-input-component";
import { CustomButtonComponent } from "../../../../../shared/componnets/custom-button-component/custom-button-component";
import { AuthValidators } from "../../../../../shared/validators/auth-validators/auth-validators";
import { ApiError } from "../../../../../core/models/api-error.model";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AuthLayoutComponent,
    BaseInputComponent,
    CustomButtonComponent
  ],
  templateUrl: './login-page-component.html',
  styleUrl: './login-page-component.scss',
})
export class LoginPage implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  isDarkMode$!: Observable<boolean>;

  alertMessage: { type: 'info' | 'success', text: string } | null = null;
  private broadcastChannel!: BroadcastChannel;

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef); // EKLENDİ: Ekranı zorla güncellemek için

  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.isDarkMode$ = this.themeService.isDarkMode$;

    this.loginForm = this.fb.group({
      emailOrUsername: ['', {
        validators: [
          Validators.required,
          AuthValidators.noWhitespace(),
          Validators.minLength(3),
          Validators.maxLength(256),
          AuthValidators.userNameOrEmail()
        ],
        updateOn: 'blur'
      }],
      password: ['', {
        validators: [
          Validators.required,
          AuthValidators.noWhitespace(),
          Validators.minLength(6),
          Validators.maxLength(256)
        ],
        updateOn: 'blur'
      }]
    });

    this.checkRegistrationRedirect();
    this.setupBroadcastListener();
  }

  ngOnDestroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  }

  get emailOrUsernameControl(): FormControl {
    return this.loginForm.get('emailOrUsername') as FormControl;
  }

  get passwordControl(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  private checkRegistrationRedirect(): void {
    this.route.queryParams.subscribe(params => {
      if (params['checkEmail'] === 'true') {
        this.alertMessage = {
          type: 'info',
          text: 'Kayıt başarılı! Lütfen <b>e-posta adresinize</b> gönderilen bağlantıya tıklayarak hesabınızı doğrulayın.'
        };
      }
    });
  }

  private setupBroadcastListener(): void {
    this.broadcastChannel = new BroadcastChannel('flowra_auth_channel');

    this.broadcastChannel.onmessage = (event) => {
      this.ngZone.run(() => {
        if (event.data.type === 'EMAIL_VERIFIED') {

          this.alertMessage = {
            type: 'success',
            text: 'Doğrulama Başarılı! Şifrenizi girerek oturum açabilirsiniz.'
          };
          this.cdr.detectChanges();

          // --- YENİ EKLENEN KISIM: URL'İ SESSİZCE TEMİZLE ---
          // Kullanıcı F5 attığında eski 'checkEmail=true' durumuna dönmemesi için
          // URL'den bu parametreyi sayfa yenilenmeden siliyoruz.
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { checkEmail: null }, // Parametreyi yok et
            queryParamsHandling: 'merge',      // Diğer olası parametreleri koru (returnUrl vb.)
            replaceUrl: true                   // Tarayıcı geçmişine yeni kayıt atma (Geri tuşunu bozmamak için)
          });

        }
      });
    };
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.data?.requiresPasswordReset) {
          this.router.navigate(['/auth/change-password'], {
            queryParams: { token: response.data.resetPasswordToken }
          });
        } else {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (err: ApiError) => {
        if (err.errors) {
          Object.keys(err.errors).forEach(key => {
            const formKey = key.charAt(0).toLowerCase() + key.slice(1);
            const control = this.loginForm.get(formKey);
            if (control) {
              control.setErrors({ serverError: err.errors![key][0] });
            }
          });
        } else {
          this.passwordControl.reset();
        }
      }
    });
  }
}

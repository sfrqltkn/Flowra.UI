import { CommonModule } from "@angular/common";
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

  // UYARI TİPLERİ GENİŞLETİLDİ (warning ve error eklendi)
  alertMessage: { type: 'info' | 'success' | 'warning' | 'error', text: string } | null = null;

  // YENİDEN GÖNDERME AKIŞI İÇİN STATE'LER
  unconfirmedEmail: string | null = null;
  isResending = false;

  private broadcastChannel!: BroadcastChannel;

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

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

    this.checkIncomingParameters();
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

  private checkIncomingParameters(): void {
    this.route.queryParams.subscribe(params => {
      if (params['checkEmail'] === 'true') {
        this.alertMessage = {
          type: 'info',
          text: 'Kayıt başarılı! Lütfen <b>e-posta adresinize</b> gönderilen bağlantıya tıklayarak hesabınızı doğrulayın.'
        };
      } else if (params['resetSent'] === 'true') {
        this.alertMessage = {
          type: 'info',
          text: 'Şifre sıfırlama yönergeleri e-posta adresinize gönderildi. Lütfen <b>gelen kutunuzu</b> kontrol edin.'
        };
      }
      else if (params['confirmationSent'] === 'true') {
        this.alertMessage = {
          type: 'success',
          text: 'Yeni doğrulama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol ediniz.'
        };
      }
    });
  }

  private setupBroadcastListener(): void {
    this.broadcastChannel = new BroadcastChannel('flowra_auth_channel');

    this.broadcastChannel.onmessage = (event) => {
      this.ngZone.run(() => {
        let messageUpdated = false;

        if (event.data.type === 'EMAIL_VERIFIED') {
          this.unconfirmedEmail = null; // Doğrulandığı an butonu gizle
          this.alertMessage = {
            type: 'success',
            text: 'Doğrulama Başarılı! Şifrenizi girerek oturum açabilirsiniz.'
          };
          messageUpdated = true;
        }
        else if (event.data.type === 'PASSWORD_RESET_SUCCESS') {
          this.alertMessage = {
            type: 'success',
            text: 'Şifreniz başarıyla değiştirildi! Lütfen yeni şifreniz ile giriş yapınız.'
          };
          messageUpdated = true;
        }

        if (messageUpdated) {
          this.cdr.detectChanges();
          // URL parametrelerini sessizce temizle
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { checkEmail: null, resetSent: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        }
      });
    };
  }

  // --- YENİ: E-POSTA TEKRAR GÖNDERME METODU ---
  resendConfirmation() {
    if (!this.unconfirmedEmail) return;

    this.isResending = true;
    this.authService.resendConfirmationEmail(this.unconfirmedEmail).subscribe({
      next: () => {
        this.alertMessage = {
          type: 'success',
          text: `Yeni doğrulama bağlantısı <b>${this.unconfirmedEmail}</b> adresine gönderildi. Lütfen e-postanızı kontrol edin.`
        };
        this.unconfirmedEmail = null; // Başarılı olunca butonu kaldır
        this.isResending = false;
        this.cdr.detectChanges();
      },
      error: (err: ApiError) => {
        this.alertMessage = {
          type: 'error',
          text: err.detail || 'Doğrulama bağlantısı gönderilirken bir hata oluştu.'
        };
        this.isResending = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Yeni denemede eski hataları temizle
    this.alertMessage = null;
    this.unconfirmedEmail = null;

  this.authService.login(this.loginForm.value).subscribe({
  next: (res) => {
    const authData = res.data?.response;

    if (authData?.requiresPasswordReset) {
      this.router.navigate(['/auth/reset-password'], {
        queryParams: { token: authData.resetPasswordToken }
      });
    } else {
      const roles = authData?.roles || [];
      let targetUrl = this.route.snapshot.queryParams['returnUrl'];

      // Eğer kullanıcı Admin ise
      if (roles.includes('Admin')) {
        // Özel bir linke gitmeye çalışmıyorsa veya sadece anasayfa/dashboard'a gitmeye çalıştıysa Admin Paneline yönlendir
        if (!targetUrl || targetUrl === '/' || targetUrl === '/dashboard') {
          targetUrl = '/admin/overview';
        }
      }
      // Normal kullanıcı ise
      else {
        if (!targetUrl || targetUrl === '/') {
          targetUrl = '/dashboard';
        }
      }

      this.router.navigateByUrl(targetUrl);
    }
  },
      error: (err: ApiError) => {
        if (err.status === 422 && err.detail?.toLowerCase().includes('auth_login_emailnotconfirmed')) {
          this.unconfirmedEmail = this.loginForm.value.emailOrUsername;
          this.alertMessage = {
            type: 'warning',
            text: 'Hesabınız henüz doğrulanmamış. Güvenliğiniz için giriş yapmadan önce e-posta adresinizi doğrulamanız gerekmektedir.'
          };
          this.cdr.detectChanges();
        }
        // 2. DURUM: Backend Validasyon Hataları (400 Bad Request)
        else if (err.errors) {
          Object.keys(err.errors).forEach(key => {
            const formKey = key.charAt(0).toLowerCase() + key.slice(1);
            const control = this.loginForm.get(formKey);
            if (control) {
              control.setErrors({ serverError: err.errors![key][0] });
            }
          });
        }
        // 3. DURUM: Hatalı Şifre veya Diğer (Genel Hatalar)
        else {
          this.alertMessage = { type: 'error', text: err.detail || 'Kullanıcı adı veya şifre hatalı.' };
          this.passwordControl.reset();
        }
      }
    });
  }
}

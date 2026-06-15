import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, OnDestroy, NgZone } from "@angular/core";
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";

import { AuthService } from "../../../../../core/services/auth/auth.service";
import { ToastService } from "../../../../../core/services/notification/toast.service";
import { AuthLayoutComponent } from "../../../../../shared/componnets/auth-layout/auth-layout-component";
import { BaseInputComponent } from "../../../../../shared/componnets/base-input-component/base-input-component";
import { CustomButtonComponent } from "../../../../../shared/componnets/custom-button-component/custom-button-component";
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

  /** Holds the email/username when the account is not yet confirmed — drives the inline resend card */
  unconfirmedEmail: string | null = null;
  isResending = false;

  private broadcastChannel!: BroadcastChannel;
  private ngZone = inject(NgZone);

  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.loginForm = this.fb.group({
      emailOrUsername: ['', { validators: [], updateOn: 'blur' }],
      password: ['', { validators: [], updateOn: 'blur' }]
    });

    this.handleQueryParams();
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

  // ─── Query param bildirim toastları ────────────────────────────────────────

  private handleQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['checkEmail'] === 'true') {
        this.toastService.info(
          'Lütfen e-posta adresinize gönderilen bağlantıya tıklayarak hesabınızı doğrulayın.',
          'Kayıt Başarılı!'
        );
      } else if (params['resetSent'] === 'true') {
        this.toastService.info(
          'Şifre sıfırlama yönergeleri e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.',
          'E-posta Gönderildi'
        );
      } else if (params['confirmationSent'] === 'true') {
        this.toastService.success(
          'Yeni doğrulama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol ediniz.',
          'Bağlantı Gönderildi'
        );
      }

      // Parametreleri URL'den sessizce temizle
      if (params['checkEmail'] || params['resetSent'] || params['confirmationSent']) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { checkEmail: null, resetSent: null, confirmationSent: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
    });
  }

  // ─── BroadcastChannel (diğer sekme mesajları) ──────────────────────────────

  private setupBroadcastListener(): void {
    this.broadcastChannel = new BroadcastChannel('flowra_auth_channel');

    this.broadcastChannel.onmessage = (event) => {
      this.ngZone.run(() => {
        if (event.data.type === 'EMAIL_VERIFIED') {
          this.unconfirmedEmail = null;
          this.toastService.success(
            'Şifrenizi girerek oturum açabilirsiniz.',
            'E-posta Doğrulandı!'
          );
        } else if (event.data.type === 'PASSWORD_RESET_SUCCESS') {
          this.toastService.success(
            'Lütfen yeni şifreniz ile giriş yapınız.',
            'Şifreniz Değiştirildi!'
          );
        }
      });
    };
  }

  // ─── Resend confirmation ───────────────────────────────────────────────────

  resendConfirmation(): void {
    if (!this.unconfirmedEmail) return;

    this.isResending = true;
    const email = this.unconfirmedEmail;

    this.authService.resendConfirmationEmail(email).subscribe({
      next: () => {
        this.toastService.success(
          `Yeni doğrulama bağlantısı ${email} adresine gönderildi. Lütfen e-postanızı kontrol edin.`,
          'Bağlantı Gönderildi'
        );
        this.unconfirmedEmail = null;
        this.isResending = false;
      },
      error: (err: ApiError) => {
        this.isResending = false;
        this.handleApiError(err);
      }
    });
  }

  // ─── Login submit ──────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.unconfirmedEmail = null;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        const authData = res.data?.response;

        if (authData?.requiresPasswordReset) {
          this.router.navigate(['/auth/reset-password'], {
            queryParams: {
              userId: authData.userId,
              token: authData.resetPasswordToken,
              initialSetup: true
            }
          });
          return;
        }

        const roles = authData?.roles || [];
        let targetUrl = this.route.snapshot.queryParams['returnUrl'];

        if (roles.includes('Admin')) {
          if (!targetUrl || targetUrl === '/' || targetUrl === '/dashboard') {
            targetUrl = '/admin/overview';
          }
        } else {
          if (!targetUrl || targetUrl === '/') {
            targetUrl = '/dashboard';
          }
        }

        this.router.navigateByUrl(targetUrl);
      },
      error: (err: ApiError) => {
        // Doğrulanmamış e-posta — özel inline kart senaryosu
        if (err.status === 422 && err.detail?.toLowerCase().includes('auth_login_emailnotconfirmed')) {
          this.unconfirmedEmail = this.loginForm.value.emailOrUsername;
          return;
        }

        this.handleApiError(err);
      }
    });
  }

  // ─── Ortak hata yönetimi ───────────────────────────────────────────────────

  /**
   * 400 / 404 / 409 / 422 hatalarını field-level veya toast olarak gösterir.
   * 401 / 403 / 5xx → interceptor zaten toast gösterdi, burada sessiz kalınır.
   */
  private handleApiError(err: ApiError, form?: FormGroup): void {
    const targetForm = form ?? this.loginForm;

    if (err.errors && Object.keys(err.errors).length > 0) {
      // Field-level hatalar — ilgili form control'e yaz
      Object.keys(err.errors).forEach(key => {
        const formKey = key.charAt(0).toLowerCase() + key.slice(1);
        const control = targetForm.get(formKey);
        if (control) {
          control.setErrors({ serverError: err.errors![key][0] });
        }
      });
      return;
    }

    // Genel hata toast — sadece client-hatası statüleri (interceptor'ın toast atmadığı)
    const isClientError = err.status >= 400 && err.status < 500
      && err.status !== 401
      && err.status !== 403;

    if (isClientError) {
      this.toastService.error(
        err.detail || 'Bir hata oluştu. Lütfen tekrar deneyin.',
        err.title
      );
      this.passwordControl.reset();
    }
    // 401 / 403 / 5xx → interceptor halletti, burada sessiz
  }
}

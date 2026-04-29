import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthResultDto, LoginRequest, ResetPasswordRequest, UserState } from '../../models/auth.model';
import { ApiResponse } from '../../models/api-response.model';
import { IS_INITIAL_AUTH_CHECK } from '../../tokens/http-context.tokens';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly authUrl = `${environment.apiUrl}/auth`;

  // Sinyal (Signal) tabanlı reaktif durum yönetimi
  private readonly _currentUser = signal<UserState | null>(null);
  private readonly _isLoading = signal<boolean>(false);

  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);

  private readonly _isInitialized = signal<boolean>(false);
  public readonly isInitialized = this._isInitialized.asReadonly();

  // 1. Giriş Yapma
login(credentials: LoginRequest): Observable<ApiResponse<AuthResultDto>> {
    this._isLoading.set(true);

    return this.http.post<ApiResponse<AuthResultDto>>(`${this.authUrl}/login`, credentials, {
      // Cookie'lerin (Access/Refresh Token) tarayıcıya kaydedilmesi ve gönderilmesi için şart:
      withCredentials: true
    }).pipe(
      tap({
        next: (res) => {
          // Backend'den dönen veri hiyerarşisi: res.data.response
          const authData = res.data?.response;

          if (authData && !authData.requiresPasswordReset) {
            this._currentUser.set({
              userId: authData.userId,
              fullName: `${authData.firstName} ${authData.lastName}`.trim(),
              email: authData.email,
              roles: authData.roles || []
            });
          }
        },
        finalize: () => this._isLoading.set(false)
      })
    );
  }

  register(data: any): Observable<ApiResponse<number>> {
    this._isLoading.set(true);

    // Kayıt işleminde cookie'ye gerek yok ama standart api isteği atıyoruz
    return this.http.post<ApiResponse<number>>(`${this.authUrl}/register`, data).pipe(
      tap({
        finalize: () => this._isLoading.set(false)
      })
    );
  }

  // 2. Refresh Token İsteği (Interceptor kullanacak)
  refreshToken(): Observable<ApiResponse<AuthResultDto>> {
    return this.http.post<ApiResponse<AuthResultDto>>(`${this.authUrl}/refresh-token`, {});
  }

  fetchMe(): Observable<ApiResponse<any>> {
    this._isLoading.set(true);
    return this.http.get<ApiResponse<any>>(`${this.authUrl}/me`, {
      withCredentials: true,
      context: new HttpContext().set(IS_INITIAL_AUTH_CHECK, true)
    }).pipe(
      tap({
        next: (res) => {
          const data = res.data;

          const mappedFullName = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim();

          this._currentUser.set({
            userId: data.id || data.userId,
            fullName: mappedFullName,
            email: data.email,
            roles: data.roles || []
          });
        },
        error: () => this._currentUser.set(null),
        finalize: () => {
          this._isLoading.set(false);
          this._isInitialized.set(true);
        }
      })
    );
  }

  // 4. Çıkış Yapma
  logout(forceLocal: boolean = false): void {
    this._isLoading.set(true);

    const clearStateAndRoute = () => {
      this._currentUser.set(null);
      this._isLoading.set(false);
      this.router.navigate(['/auth/login']);
    };

    if (forceLocal) {
      clearStateAndRoute(); // Sadece UI'dan at (Örn: Refresh token da ölmüşse)
    } else {
      // Backend'deki cookie'leri de temizlet
      this.http.post<ApiResponse>(`${this.authUrl}/logout`, {}).subscribe({
        next: () => clearStateAndRoute(),
        error: () => clearStateAndRoute() // Backend hata verse bile kullanıcıyı UI'dan at
      });
    }
  }

  // POST: api/auth/confirm-email
  // URL'den aldığımız userId ve token'ı backend'e yolluyoruz
  confirmEmail(data: { userId: number; token: string }): Observable<ApiResponse<any>> {
    this._isLoading.set(true);
    return this.http.post<ApiResponse<any>>(`${this.authUrl}/confirm-email`, data).pipe(
      finalize(() => this._isLoading.set(false))
    );
  }

  // POST: api/auth/resend-confirmation-email
  resendConfirmationEmail(emailOrUsername: string): Observable<ApiResponse<any>> {
    this._isLoading.set(true);
    return this.http.post<ApiResponse<any>>(`${this.authUrl}/resend-confirmation-email`, { emailOrUsername }).pipe(
      finalize(() => this._isLoading.set(false))
    );
  }
  // POST: api/auth/forgot-password
  forgotPassword(email: string): Observable<ApiResponse<any>> {
    this._isLoading.set(true);
    return this.http.post<ApiResponse<any>>(`${this.authUrl}/forgot-password`, { email }).pipe(
      finalize(() => this._isLoading.set(false))
    );
  }


  // POST: api/auth/reset-password
  resetPassword(data: ResetPasswordRequest): Observable<ApiResponse<any>> {
    this._isLoading.set(true);
    return this.http.post<ApiResponse<any>>(`${this.authUrl}/reset-password`, data).pipe(
      finalize(() => this._isLoading.set(false))
    );
  }
}

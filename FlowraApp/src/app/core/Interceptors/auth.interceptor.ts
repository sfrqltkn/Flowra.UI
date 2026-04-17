import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';
import { environment } from '../../../environments/environment';
import { IS_INITIAL_AUTH_CHECK } from '../tokens/http-context.tokens';

// Sınıf (Class) olmadığı için State değişkenlerini dışarıda (Singleton) tanımlıyoruz
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);

  // Context bilgisini oku
  const isInitialCheck = request.context.get(IS_INITIAL_AUTH_CHECK);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Eğer hata 401 ise VE bu bir initial check DEĞİLSE refresh dene
      if (error.status === 401 && !isInitialCheck && !request.url.includes('/auth/login')) {
        return handle401Error(request, next, authService);
      }

      // Eğer initial check ise veya diğer durumlar, hatayı olduğu gibi fırlat
      return throwError(() => error);
    })
  );
};

// 401 Yakalandığında çalışacak yardımcı fonksiyon (Sessiz Yenileme ve Kuyruk)
function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null); // Diğer istekleri beklemeye al

    return authService.refreshToken().pipe(
      switchMap((res) => {
        isRefreshing = false;
        refreshTokenSubject.next(res); // Bekleyen isteklere 'tamamdır' sinyali gönder
        return next(request.clone({ withCredentials: true })); // Orijinal isteği tekrarla
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout(true); // Token tamamen ölmüş, UI'dan at
        return throwError(() => err);
      })
    );
  } else {
    // Zaten bir Refresh işlemi dönüyorsa, yeni gelen istekleri sıraya sok
    return refreshTokenSubject.pipe(
      filter(result => result !== null),
      take(1),
      switchMap(() => next(request.clone({ withCredentials: true })))
    );
  }
}

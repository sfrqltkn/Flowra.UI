import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../services/notification/toast.service';
import { ApiError } from '../models/api-error.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((errorResponse: HttpErrorResponse) => {
      let apiError: ApiError;

      if (errorResponse.error && errorResponse.error.type) {
        apiError = errorResponse.error as ApiError;
      } else {
        apiError = {
          type: 'https://flowra.com/errors/network',
          title: 'Bağlantı Hatası',
          status: errorResponse.status,
          detail: 'Sunucu ile iletişim kurulamadı. İnternet bağlantınızı kontrol edin.',
          instance: req.url
        };
      }

      if (apiError.status >= 500) {
        toastService.error(apiError.detail, 'Sistem Hatası');
      }
      else if (apiError.status === 403) {
        toastService.warning('Bu işlemi yapmaya yetkiniz bulunmuyor.', 'Erişim Reddedildi');
      }
      else if (apiError.status === 401) {
        const isSilentAuthEndpoint = req.url.includes('/auth/me') ||
                                     req.url.includes('/auth/refresh-token') ||
                                     req.url.includes('/auth/login');

        if (!isSilentAuthEndpoint) {
          toastService.warning('Oturumunuz sonlandı. Lütfen tekrar giriş yapın.', 'Güvenlik');
        }
      }

      return throwError(() => apiError);
    })
  );
};

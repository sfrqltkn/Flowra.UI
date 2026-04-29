import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';
import { environment } from '../../../environments/environment';
import { IS_INITIAL_AUTH_CHECK } from '../tokens/http-context.tokens';

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);

  const authReq = request.clone({
      withCredentials: true
  });

  const isInitialCheck = request.context.get(IS_INITIAL_AUTH_CHECK);

return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isInitialCheck && !request.url.includes('/auth/login')) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((res) => {
        isRefreshing = false;
        refreshTokenSubject.next(res);
        return next(request.clone({ withCredentials: true }));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout(true);
        return throwError(() => err);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(result => result !== null),
      take(1),
      switchMap(() => next(request.clone({ withCredentials: true })))
    );
  }
}

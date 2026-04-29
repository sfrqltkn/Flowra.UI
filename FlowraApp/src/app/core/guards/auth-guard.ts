import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';


export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated()) return true;

  return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};


export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true; // Giriş yapmamış, Login sayfasını görebilir
  }

  // Zaten giriş yapmış biri Login/Register sayfasına girmeye çalışırsa Dashboard'a geri at
  return router.createUrlTree(['/dashboard']);
};

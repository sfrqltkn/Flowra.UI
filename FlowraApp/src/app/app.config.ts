import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { AuthService } from './core/services/auth/auth.service';
import { catchError, of } from 'rxjs';
import { errorInterceptor } from './core/Interceptors/error-interceptor';
import { authInterceptor } from './core/Interceptors/auth.interceptor';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export function initializeApp(authService: AuthService) {
  return () => authService.fetchMe().pipe(
    catchError(() => of(null))
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true
    },
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    importProvidersFrom(BrowserAnimationsModule)
  ]
};

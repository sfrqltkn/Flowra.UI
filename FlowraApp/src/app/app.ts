import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './core/services/theme/theme.service';
import { AuthService } from './core/services/auth/auth.service';
import { ToastContainerComponent } from './shared/componnets/toast-container/toast-container.component';
import { ConfirmModalComponent } from './shared/componnets/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, ToastContainerComponent, ConfirmModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  private themeService = inject(ThemeService);
  isDarkMode$ = this.themeService.isDarkMode$;
  toggleTheme() {
    this.themeService.toggleTheme();
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.currentUser();
      const isAdmin = user?.roles?.includes('Admin');

      if (this.router.url === '/' || this.router.url.includes('/auth/login')) {
         this.router.navigate([isAdmin ? '/admin' : '/dashboard']);
      }
    }
  }
}

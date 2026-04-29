import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ThemeService } from '../../../../core/services/theme/theme.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout-component',
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout-component.html',
  styleUrl: './admin-layout-component.scss',
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  isDarkMode$ = this.themeService.isDarkMode$;
  userFullName = computed(() => {
    return this.authService.currentUser()?.fullName || 'Bilinmeyen Kullanıcı';
  });
  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.authService.logout();
  }
  userInitials = computed(() => {
      const name = this.userFullName();
      return name.charAt(0).toUpperCase();
  });
}

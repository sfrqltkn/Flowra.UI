import { Component, inject, signal, HostListener } from '@angular/core'; // <-- 1. Buraya HostListener ekledik
import { AuthService } from '../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <-- Sidebar linkleri için unutma

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout-component.html',
  styleUrl: './admin-layout-component.scss',
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);

  isSidebarCollapsed = signal<boolean>(false);
  isMobile = signal<boolean>(false);
  isProfileMenuOpen = signal<boolean>(false);

  currentUser = this.authService.currentUser;

  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) { // Argümanı buraya ekledik
    this.checkScreenSize();
  }

  private checkScreenSize() {
    const isCurrentlyMobile = window.innerWidth < 768;
    this.isMobile.set(isCurrentlyMobile);
    if (isCurrentlyMobile) this.isSidebarCollapsed.set(true);
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen.update(v => !v);
  }

  closeProfileMenu() {
    this.isProfileMenuOpen.set(false);
  }

  logout() {
    this.closeProfileMenu();
    this.authService.logout();
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.roles?.includes(role) ?? false;
  }
}

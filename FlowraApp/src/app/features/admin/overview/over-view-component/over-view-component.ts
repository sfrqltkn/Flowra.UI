import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../../core/services/user/user.service';
import { UserDto } from '../../../../core/models/user.model';
import { ApiError } from '../../../../core/models/api-error.model';

@Component({
  selector: 'app-over-view-component',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './over-view-component.html',
  styleUrl: './over-view-component.scss',
})
export class OverViewComponent implements OnInit {
  private userService = inject(UserService);

  dashboardStats = signal({
    totalUsers: 0,
    newUsersToday: 0,
    activeSessions: 0,
    systemStatus: 'Optimum',
    isSystemHealthy: true
  });

  // Son kullanıcılar
  recentUsers = signal<UserDto[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading.set(true);

    this.userService.getAll().subscribe({
      next: (res) => {
        const users = res.data || [];

        // Toplam kullanıcı sayısını güncelle
        this.dashboardStats.update(stats => ({
          ...stats,
          totalUsers: users.length,
          newUsersToday: Math.floor(Math.random() * 10),
          activeSessions: Math.floor(Math.random() * 50) + 10
        }));

        const sortedUsers = [...users].sort((a, b) => b.id - a.id).slice(0, 4);
        this.recentUsers.set(sortedUsers);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Veriler yüklenirken hata:', (err.error as ApiError)?.detail || err.message);
        this.dashboardStats.update(stats => ({
          ...stats,
          systemStatus: 'Bağlantı Hatası',
          isSystemHealthy: false
        }));
        this.isLoading.set(false);
      }
    });
  }

  getInitial(userName: string): string {
    return userName ? userName.charAt(0).toUpperCase() : '?';
  }
}

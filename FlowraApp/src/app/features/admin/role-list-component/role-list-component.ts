import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user/user.service';
import { RoleService } from '../../../core/services/role/role.service';
import { RoleDto } from '../../../core/models/role.model';
import { UserDto } from '../../../core/models/user.model';
import { UserRoleRequest } from '../../../core/models/userRole.model';
import { ApiError } from '../../../core/models/api-error.model';
import { AuthService } from '../../../core/services/auth/auth.service';
@Component({
  selector: 'app-role-list-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './role-list-component.html',
  styleUrl: './role-list-component.scss',
})
export class RoleListComponent implements OnInit {
  private roleService = inject(RoleService);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  roles = signal<RoleDto[]>([]);
  users = signal<UserDto[]>([]);

  isLoadingRoles = signal<boolean>(true);
  isLoadingUsers = signal<boolean>(true);

  newRoleName = signal<string>('');
  isCreatingRole = signal<boolean>(false);

  isDeleteModalOpen = signal<boolean>(false);
  deleteTargetRoleId = signal<number | null>(null);

  ngOnInit() {
    this.loadRoles();
    this.loadUsers();
  }

  loadRoles() {
    this.isLoadingRoles.set(true);
    this.roleService.getAllRoles().subscribe({
      next: (res) => {
        this.roles.set(res.data);
        this.isLoadingRoles.set(false);
      },
      error: (err) => {
        console.error('Roller yüklenirken hata:', (err.error as ApiError)?.detail || err.message);
        this.isLoadingRoles.set(false);
      }
    });
  }

  loadUsers() {
    this.isLoadingUsers.set(true);
    this.userService.getAll().subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.isLoadingUsers.set(false);
      },
      error: (err) => {
        console.error('Kullanıcılar yüklenirken hata:', (err.error as ApiError)?.detail || err.message);
        this.isLoadingUsers.set(false);
      }
    });
  }

  createRole() {
    const roleName = this.newRoleName().trim();
    if (!roleName) return;

    this.isCreatingRole.set(true);
    this.roleService.createRole(roleName).subscribe({
      next: () => {
        this.newRoleName.set('');
        this.loadRoles();
        this.isCreatingRole.set(false);
      },
      error: (err) => {
        console.error('Rol eklenemedi:', (err.error as ApiError)?.detail || err.message);
        this.isCreatingRole.set(false);
      }
    });
  }

  confirmDeleteRole(id: number) {
    this.deleteTargetRoleId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  cancelDelete() {
    this.deleteTargetRoleId.set(null);
    this.isDeleteModalOpen.set(false);
  }

  executeDeleteRole() {
    const id = this.deleteTargetRoleId();
    if (!id) return;

    this.roleService.deleteRole(id).subscribe({
      next: () => {
        this.roles.update(list => list.filter(r => r.id !== id));
        this.isDeleteModalOpen.set(false);
      },
      error: (err) => console.error('Rol silinemedi:', (err.error as ApiError)?.detail || err.message)
    });
  }

  getAvailableRoles(user: UserDto): RoleDto[] {
    const userRoleNames = user.roles?.map(r => r.toLowerCase()) || [];
    return this.roles().filter(role => !userRoleNames.includes(role.name.toLowerCase()));
  }

  assignRoleToUser(user: UserDto, selectElement: HTMLSelectElement) {
    const roleId = Number(selectElement.value);
    if (!roleId) return;

    const requestData: UserRoleRequest = { userId: user.id, roleId: roleId };

    this.roleService.addRoleToUser(requestData).subscribe({
      next: () => {
        selectElement.value = '';
        this.loadUsers(); // Tabloyu güncelle
        this.checkAndRefreshCurrentUser(user.id); // <-- EKLENDİ: Layout'u güncelle
      },
      error: (err) => {
        console.error('Rol atanamadı:', (err.error as ApiError)?.detail || err.message);
      }
    });
  }

  removeRoleFromUser(user: UserDto, roleName: string) {
    const role = this.roles().find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!role) {
      console.error('Silinmek istenen rol sistemde bulunamadı!');
      return;
    }

    const requestData: UserRoleRequest = { userId: user.id, roleId: role.id };

    this.roleService.removeRoleFromUser(requestData).subscribe({
      next: () => {
        this.loadUsers();
        this.checkAndRefreshCurrentUser(user.id);
      },
      error: (err) => console.error('Rol kaldırılamadı:', (err.error as ApiError)?.detail || err.message)
    });
  }

private checkAndRefreshCurrentUser(modifiedUserId: number) {
    const currentUser = this.authService.currentUser();

    if (currentUser && currentUser.userId == modifiedUserId) {
      console.log('Kendi yetkilerimiz değişti, yeni token alınıyor...');
      this.authService.refreshToken().subscribe({
        next: () => {
          this.authService.fetchMe().subscribe();
        },
        error: () => {
          console.warn('Oturum yenilenemedi, tekrar giriş yapılması gerekiyor.');
          this.authService.logout(true);
        }
      });
    }
  }
}

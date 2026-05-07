import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserDto } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user/user.service';
import { UserStatus } from '../../../../core/enum/user-status.enum';
import { EditUserModalComponent } from '../../../../shared/user/edit-user-modal-component/edit-user-modal-component';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { CreateUserModalComponent } from '../../../../shared/user/create-user-modal-component/create-user-modal-component';

@Component({
  selector: 'app-user-list-component',
  standalone: true,
  imports: [CommonModule,EditUserModalComponent,CreateUserModalComponent],
  templateUrl: './user-list-component.html',
  styleUrl: './user-list-component.scss',
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  users = signal<UserDto[]>([]);
  isLoading = signal<boolean>(true);
  activeTab = signal<UserStatus>(UserStatus.Active);
  isCreateModalOpen = signal<boolean>(false);

  isDeleteModalOpen = signal<boolean>(false);
  deleteTargetId = signal<number | null>(null);

  isEditModalOpen = signal<boolean>(false);
  editingUser = signal<UserDto | null>(null);

  readonly Status = UserStatus;

 filteredUsers = computed(() => {
  const allUsers = this.users();
  const currentStatus = this.activeTab();

  return allUsers.filter(u => {
    const activeState = u.isActive ?? false;

    if (currentStatus === UserStatus.Active) {
      return activeState === true;
    } else {
      return activeState === false;
    }
  });
});

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.isLoading.set(true);
    this.userService.getAll().subscribe({
      next: (res) => {
        console.log('API Yanıtı:', res.data);
        this.users.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Hata:', err);
        this.isLoading.set(false);
      }
    });
  }

  toggleTab(tab: UserStatus) { this.activeTab.set(tab); }

  openEdit(id: number) {
    const userToEdit = this.users().find(u => u.id === id);
    if (userToEdit) {
      this.editingUser.set(userToEdit);
      this.isEditModalOpen.set(true);
    }
  }
  handleEditClose(success: boolean) {
    const editedUserId = this.editingUser()?.id;

    this.isEditModalOpen.set(false);
    this.editingUser.set(null);

    if (success) {
      this.loadUsers();

      const currentUser = this.authService.currentUser();
      if (currentUser && editedUserId === currentUser.userId) {
        this.authService.fetchMe().subscribe();
      }
    }
  }

  cancelDelete() {
    this.deleteTargetId.set(null);
    this.isDeleteModalOpen.set(false);
  }

  confirmDelete(id: number) {
    this.deleteTargetId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  executeDelete() {
      const id = this.deleteTargetId();
      if (!id) return;

      this.userService.delete(id).subscribe({
        next: () => {
          this.users.update(list => list.filter(u => u.id !== id));
          this.isDeleteModalOpen.set(false);
        },
        error: (err) => console.error('Silme başarısız', err)
      });
    }
  toggleLock(id: number) { /* API çağrısı */ }

  openCreateModal() {
    this.isCreateModalOpen.set(true);
  }

  handleCreateClose(success: boolean) {
    this.isCreateModalOpen.set(false);
    if (success) {
      this.loadUsers(); // Başarılıysa listeyi yenile
    }
  }
}

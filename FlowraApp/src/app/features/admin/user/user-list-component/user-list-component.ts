import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserDto } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user/user.service';
import { UserStatus } from '../../../../core/enum/user-status.enum';
import { EditUserModalComponent } from '../../../../shared/user/edit-user-modal-component/edit-user-modal-component';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-user-list-component',
  standalone: true,
  imports: [CommonModule,EditUserModalComponent],
  templateUrl: './user-list-component.html',
  styleUrl: './user-list-component.scss',
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  users = signal<UserDto[]>([]);
  isLoading = signal<boolean>(true);
  activeTab = signal<UserStatus>(UserStatus.Active);

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
    // Düzenlenen kullanıcının ID'sini geçici bir değişkene alalım
    const editedUserId = this.editingUser()?.id;

    this.isEditModalOpen.set(false);
    this.editingUser.set(null); // Modal kapandığında veriyi temizle

    if (success) {
      this.loadUsers(); // Tabloyu yenile

      // --- KRİTİK KONTROL ---
      // Eğer düzenlediğimiz kullanıcı, şu an sisteme giriş yapmış olan ("Ben") ise:
      const currentUser = this.authService.currentUser();
      if (currentUser && editedUserId === currentUser.userId) {
        // Arka planda sessizce taze bilgileri çek.
        // fetchMe, _currentUser sinyalini güncelleyecek ve
        // AdminLayout'taki computed sinyaller anında tetiklenip UI'ı değiştirecektir.
        this.authService.fetchMe().subscribe();
      }
    }
  }

  // Silmeyi iptal et
  cancelDelete() {
    this.deleteTargetId.set(null);
    this.isDeleteModalOpen.set(false);
  }

  // Delete İşlemleri
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
}

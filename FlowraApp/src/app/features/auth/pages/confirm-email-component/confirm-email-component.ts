import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CustomButtonComponent } from '../../../../shared/componnets/custom-button-component/custom-button-component';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { AuthLayoutComponent } from '../../../../shared/componnets/auth-layout/auth-layout-component';

type VerificationState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-confirm-email-component',
  standalone: true, // Eğer standalone kullanıyorsan
  imports: [CommonModule, RouterModule, CustomButtonComponent, AuthLayoutComponent],
  templateUrl: './confirm-email-component.html',
  styleUrl: './confirm-email-component.scss',
})
export class ConfirmEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  currentState: VerificationState = 'loading';
  errorMessage: string = '';

  ngOnInit(): void {
    const userId = this.route.snapshot.queryParamMap.get('userId');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!userId || !token) {
      this.currentState = 'error';
      this.errorMessage = 'Geçersiz veya eksik doğrulama bağlantısı.';
      this.cdr.detectChanges();
      return;
    }

    // Geliştirme ortamında çok hızlı açıldığı için başlangıçta loading olduğunu garanti edelim
    this.currentState = 'loading';
    this.cdr.detectChanges();

    this.verifyEmail(parseInt(userId, 10), token);
  }

  private verifyEmail(userId: number, token: string): void {
    this.authService.confirmEmail({ userId, token }).subscribe({
      next: (response) => {

        // 1. SİNYALİ ANINDA GÖNDER (Tab 1 şimşek hızında güncellenir)
        const bc = new BroadcastChannel('flowra_auth_channel');
        bc.postMessage({
          type: 'EMAIL_VERIFIED',
          email: response?.data?.email || ''
        });
        bc.close();

        // 2. TAB 2'NİN KENDİ GÖRSEL AKIŞI (Suni gecikme sadece bu sekmede kalır)
        setTimeout(() => {
          this.currentState = 'success';
          this.cdr.detectChanges();

          // Tik ikonunu gördükten 4 saniye sonra sekmeyi kapat
          setTimeout(() => {
            window.close();
          }, 4000);

        }, 1000); // 1 saniyelik görsel loading süresi
      },
      error: (err) => {
        this.currentState = 'error';
        this.errorMessage = err.detail || 'E-posta doğrulanırken bir hata oluştu.';
        this.cdr.detectChanges();
      }
    });
  }

  closeTab(): void {
    window.close();
  }
}

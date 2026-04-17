// export const routes: Routes = [
//   { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
//   { path: 'dashboard', component: DashboardComponent },
//   { path: 'add-transaction', component: TransactionFormComponent },
//   { path: 'transactions', component: TransactionComponent },
//   { path: 'assets', component: AssetsComponent },
//   { path: 'report', component: ReportComponent }, // YENİ EKLENEN ROTA
//   { path: 'ai-advisor', component: AiAdvisorComponent },
//   { path: '**', redirectTo: '/dashboard' },
// ];


import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth-guard';

export const routes: Routes = [

  // Ana Dizin -> Boş gelirse otomatik Dashboard'a at
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // === AUTHENTICATION MODÜLÜ (Giriş Yapanlar Göremez) ===
 {
    path: 'auth',
    canActivate: [noAuthGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login/login-page-component/login-page-component').then(c => c.LoginPage)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/pages/register/register-page-component/register-page-component').then(c => c.RegisterPageComponent)
      },
      {
        path: 'confirm-email',
        loadComponent: () => import('./features/auth/pages/confirm-email-component/confirm-email-component').then(c => c.ConfirmEmailComponent)
      },
      {
        path: 'forgot-password',
        // Not: Dosya yolunu kendi klasör yapına göre (import edilen yere göre) teyit et.
        loadComponent: () => import('./features/auth/pages/forgot-password-component/forgot-password-component').then(c => c.ForgotPasswordComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard-component').then(c => c.DashboardComponent)
  },
  {
    path: 'assets', // Örnek Deep Link rotası
    canActivate: [authGuard],
    loadComponent: () => import('./features/assets-component/assets-component').then(c => c.AssetsComponent)
  },

  // 4. 404 NOT FOUND YÖNETİMİ
  // Tüm geçersiz linkler buraya düşer. Dashboard'a zorlamak yerine 404 gösterilir.
  {
    path: '**',
    // loadComponent: () => import('./core/pages/not-found/not-found.component').then(c => c.NotFoundComponent)
    // Eğer şimdilik 404 sayfan yoksa, geçici olarak dashboard'a atabilirsin:
    redirectTo: 'dashboard'
  }
];

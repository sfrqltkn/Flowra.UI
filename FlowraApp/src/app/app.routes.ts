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
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // 1. ANA YÖNLENDİRME
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // 2. KİMLİK DOĞRULAMA (Sadece Giriş Yapmamış Kullanıcılar)
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
        loadComponent: () => import('./features/auth/pages/forgot-password-component/forgot-password-component').then(c => c.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/pages/reset-password-component/reset-password-component').then(c => c.ResetPasswordComponent)
      },
      {
        path: 'resend-confirmation',
        loadComponent: () => import('./features/auth/pages/resend-confirmation-component/resend-confirmation-component').then(c => c.ResendConfirmationComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // 3. ADMİN PANELİ (Sadece Giriş Yapmış ve Admin Rolü Olanlar)
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./shared/componnets/admin-layout/admin-layout-component/admin-layout-component').then(c => c.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () => import('./features/admin/overview/over-view-component/over-view-component').then(c => c.OverViewComponent)
      },
      { path: 'users',
        loadComponent: () => import('./features/admin/user/user-list-component/user-list-component').then(c => c.UserListComponent) }
      // Buraya admin menü alt sayfalarını ekleyebilirsin (Kullanıcılar, Ayarlar vs.)
    ]
  },

  // 4. STANDART KULLANICI SAYFALARI (Sadece Giriş Yapmış Kullanıcılar)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard-component').then(c => c.DashboardComponent)
  },
  {
    path: 'assets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/assets-component/assets-component').then(c => c.AssetsComponent)
  },

  // 5. 404 NOT FOUND YÖNETİMİ
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

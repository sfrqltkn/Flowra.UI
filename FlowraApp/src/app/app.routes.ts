import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard-component';
import { TransactionFormComponent } from './features/transaction-form-component/transaction-form-component';
import { AssetsComponent } from './features/assets-component/assets-component';
import { TransactionComponent } from './features/transaction-component/transaction-component';
import { ReportComponent } from './features/report-component/report-component';
import { AiAdvisorComponent } from './features/ai-advisor/ai-advisor';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'add-transaction', component: TransactionFormComponent },
  { path: 'transactions', component: TransactionComponent },
  { path: 'assets', component: AssetsComponent },
  { path: 'report', component: ReportComponent }, // YENİ EKLENEN ROTA
  { path: 'ai-advisor', component: AiAdvisorComponent },
  { path: '**', redirectTo: '/dashboard' },
];

import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FinanceCalculatorService } from '../../core/services/finance-calculator.service';
import { RouterLink } from '@angular/router';
import { FinanceStateService } from '../../core/services/finance-state.service';

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss',
})

export class DashboardComponent {
  calculator = inject(FinanceCalculatorService);
  state = inject(FinanceStateService); // EKLENDİ

  // Ayı ileri/geri almak için yardımcı metotlar
  previousMonth() {
    const current = new Date(this.state.selectedMonth() + '-01');
    current.setMonth(current.getMonth() - 1);
    this.state.changeMonth(current.toISOString().slice(0, 7));
  }

  nextMonth() {
    const current = new Date(this.state.selectedMonth() + '-01');
    current.setMonth(current.getMonth() + 1);
    this.state.changeMonth(current.toISOString().slice(0, 7));
  }

  // Ekranda 'Nisan 2026' gibi şık göstermek için
  get displayMonthName() {
    const date = new Date(this.state.selectedMonth() + '-01');
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  }
}

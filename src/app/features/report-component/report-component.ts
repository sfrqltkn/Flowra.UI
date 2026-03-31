import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FinanceCalculatorService } from '../../core/services/finance-calculator.service';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-report-component',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './report-component.html',
  styleUrl: './report-component.scss'
})
export class ReportComponent {
  calculator = inject(FinanceCalculatorService);
  state = inject(FinanceStateService);

  // --- ZAMAN YOLCULUĞU METOTLARI ---
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

  get displayMonthName() {
    const date = new Date(this.state.selectedMonth() + '-01');
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  }
}

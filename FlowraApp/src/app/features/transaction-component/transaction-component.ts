import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { FinanceCalculatorService } from '../../core/services/finance-calculator.service';
import { RouterLink } from '@angular/router';

export interface TransactionItem {
  id?: number;
  name: string;
  displayAmount: number;
  date: Date | string;
  type: 'income' | 'expense';
  isPaid: boolean;
  isCreditCard?: boolean;
  minimumPaymentAmount?: number;
  isRecurring?: boolean;
}

@Component({
  selector: 'app-transaction-component',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './transaction-component.html',
  styleUrl: './transaction-component.scss',
})
export class TransactionComponent {
  state = inject(FinanceStateService);
  calculator = inject(FinanceCalculatorService);
  private fb = inject(FormBuilder);

  activeTab = signal<'all' | 'income' | 'expense'>('all');
  editingTx = signal<TransactionItem | null>(null);
  editForm!: FormGroup;

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

  // --- LİSTELEME VE FİLTRELEME (ARTIK AY BAZLI) ---
  allTransactions = computed<TransactionItem[]>(() => {
    const targetMonth = this.state.selectedMonth();

    // Sadece seçili aya ait VEYA geçmişten gelen tekrarlayan GELİRLERİ al
    const incomes: TransactionItem[] = this.state.incomes()
      .filter(i => {
        const itemMonth = new Date(i.date).toISOString().slice(0, 7);
        return itemMonth === targetMonth || (i.isRecurring && itemMonth < targetMonth);
      })
      .map(i => ({
        id: i.id, name: i.name, displayAmount: i.amount, date: i.date, type: 'income', isPaid: true, isRecurring: i.isRecurring
      }));

    // Sadece seçili aya ait VEYA geçmişten gelen tekrarlayan GİDERLERİ al
    const expenses: TransactionItem[] = this.state.expenses()
      .filter(e => {
        const itemMonth = new Date(e.date).toISOString().slice(0, 7);
        return itemMonth === targetMonth || (e.isRecurring && itemMonth < targetMonth);
      })
      .map(e => ({
        id: e.id, name: e.name, displayAmount: e.totalAmount, date: e.date, type: 'expense', isPaid: e.isPaid, isCreditCard: e.isCreditCard, minimumPaymentAmount: e.minimumPaymentAmount, isRecurring: e.isRecurring
      }));

    // En yeni tarih en üste (Descending Sort)
    let combined = [...incomes, ...expenses].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    if (this.activeTab() === 'income') return combined.filter(t => t.type === 'income');
    if (this.activeTab() === 'expense') return combined.filter(t => t.type === 'expense');

    return combined;
  });

  setTab(tab: 'all' | 'income' | 'expense') { this.activeTab.set(tab); }

  deleteTransaction(id: number | undefined, type: string) {
    if (!id) return;
    if (confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
      type === 'income' ? this.state.deleteIncome(id) : this.state.deleteExpense(id);
    }
  }

  togglePaidStatus(id: number | undefined, type: string) {
    if (!id) return;
    if (type === 'expense') this.state.toggleExpensePaidStatus(id);
  }

  openEditModal(tx: TransactionItem) {
    this.editingTx.set(tx);
    const dateStr = new Date(tx.date).toISOString().split('T')[0];

    this.editForm = this.fb.group({
      name: [tx.name, Validators.required],
      amount: [tx.displayAmount, [Validators.required, Validators.min(1)]],
      date: [dateStr, Validators.required],
      isRecurring: [tx.isRecurring || false],
      isCreditCard: [tx.isCreditCard || false],
      minimumPaymentAmount: [tx.minimumPaymentAmount || null]
    });
  }

  closeEditModal() {
    this.editingTx.set(null);
  }

  saveEdit() {
    if (this.editForm.invalid) return;

    const tx = this.editingTx();
    if (!tx || !tx.id) return;

    const val = this.editForm.value;

    const baseData = {
        name: val.name,
        date: new Date(val.date).toISOString(),
        isRecurring: val.isRecurring
    };

    if (tx.type === 'income') {
      this.state.updateIncome(tx.id, { ...baseData, amount: val.amount });
    } else {
      this.state.updateExpense(tx.id, {
        ...baseData,
        totalAmount: val.amount,
        isCreditCard: val.isCreditCard,
        minimumPaymentAmount: val.isCreditCard ? val.minimumPaymentAmount : undefined
      });
    }
    this.closeEditModal();
  }
}

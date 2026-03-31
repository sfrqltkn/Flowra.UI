import { inject, Injectable, signal } from '@angular/core';
import { Income, Expense, Asset, Allowance, CashRecord } from '../models/finance.models';
import { FinanceApiService } from './finance-api-service';

@Injectable({
  providedIn: 'root'
})
export class FinanceStateService {
  private api = inject(FinanceApiService);

  // --- YENİ: UYGULAMANIN ŞU AN İNCELEDİĞİ AY ---
  // Varsayılan olarak bugünün yıl ve ayını (Örn: '2026-03') alır.
  selectedMonth = signal<string>(new Date().toISOString().slice(0, 7));

  // Sinyallerimiz artık API'den dolacağı için başlangıçta boş diziler.
  cashRecords = signal<CashRecord[]>([]);
  incomes = signal<Income[]>([]);
  expenses = signal<Expense[]>([]);
  assets = signal<Asset[]>([]);
  allowances = signal<Allowance[]>([]);

  constructor() {
    this.loadAllData(); // Uygulama açılır açılmaz verileri API'den çek!
  }

  // --- YENİ: AY DEĞİŞTİRME METODU ---
  changeMonth(monthYear: string) {
    this.selectedMonth.set(monthYear);
  }

  // --- API'DEN VERİLERİ GETİR (READ) ---
  loadAllData() {
    this.api.getIncomes().subscribe(res => this.incomes.set(res));
    this.api.getExpenses().subscribe(res => this.expenses.set(res));
    this.api.getAssets().subscribe(res => this.assets.set(res));
    this.api.getCashRecords().subscribe(res => this.cashRecords.set(res));
    this.api.getAllowances().subscribe(res => this.allowances.set(res));
  }

  // --- INCOMES (GELİRLER) ---
  addIncome(income: Income) {
    this.api.createIncome(income).subscribe(() => this.loadAllData());
  }
  updateIncome(id: number, updatedData: Partial<Income>) {
    const existing = this.incomes().find(i => i.id === id);
    if (existing) this.api.updateIncome(id, { ...existing, ...updatedData }).subscribe(() => this.loadAllData());
  }
  deleteIncome(id: number) {
    this.api.deleteIncome(id).subscribe(() => this.loadAllData());
  }

  // --- EXPENSES (GİDERLER) ---
  addExpense(expense: Expense) {
    this.api.createExpense(expense).subscribe(() => this.loadAllData());
  }
  updateExpense(id: number, updatedData: Partial<Expense>) {
    const existing = this.expenses().find(e => e.id === id);
    if (existing) this.api.updateExpense(id, { ...existing, ...updatedData }).subscribe(() => this.loadAllData());
  }
  deleteExpense(id: number) {
    this.api.deleteExpense(id).subscribe(() => this.loadAllData());
  }
  toggleExpensePaidStatus(id: number) {
    const expense = this.expenses().find(e => e.id === id);
    if (expense) {
      this.api.updateExpense(id, { ...expense, isPaid: !expense.isPaid }).subscribe(() => this.loadAllData());
    }
  }

  // --- ASSETS (VARLIKLAR) ---
  addAsset(asset: Asset) {
    this.api.createAsset(asset).subscribe(() => this.loadAllData());
  }
  updateAsset(id: number, updatedData: Partial<Asset>) {
    const existing = this.assets().find(a => a.id === id);
    if (existing) this.api.updateAsset(id, { ...existing, ...updatedData }).subscribe(() => this.loadAllData());
  }
  deleteAsset(id: number) {
    this.api.deleteAsset(id).subscribe(() => this.loadAllData());
  }

  // --- CASH RECORDS (KASA DURUMU) ---
  updateCashForMonth(monthYear: string, balance: number) {
    const existing = this.cashRecords().find(r => r.monthYear === monthYear);
    if (existing && existing.id) {
      // Varsa API'de o ayı güncelle
      this.api.updateCashRecord(existing.id, { ...existing, balance }).subscribe(() => this.loadAllData());
    } else {
      // Yoksa API'de yeni ay kaydı oluştur
      this.api.createCashRecord({ monthYear, balance }).subscribe(() => this.loadAllData());
    }
  }
  deleteCashRecord(id: number) {
    this.api.deleteCashRecord(id).subscribe(() => this.loadAllData());
  }

  // --- ALLOWANCES (HARÇLIKLAR) ---
  addAllowance(allowance: Allowance) {
    this.api.createAllowance(allowance).subscribe(() => this.loadAllData());
  }
  updateAllowance(id: number, updatedData: Partial<Allowance>) {
    const existing = this.allowances().find(a => a.id === id);
    if (existing) this.api.updateAllowance(id, { ...existing, ...updatedData }).subscribe(() => this.loadAllData());
  }
  deleteAllowance(id: number) {
    this.api.deleteAllowance(id).subscribe(() => this.loadAllData());
  }
}

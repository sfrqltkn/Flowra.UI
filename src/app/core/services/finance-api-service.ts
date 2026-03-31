import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Income, Expense, Asset, CashRecord, Allowance } from '../models/finance.models';

@Injectable({
  providedIn: 'root',
})
export class FinanceApiService {
  private http = inject(HttpClient);

  private apiUrl = 'https://localhost:7124/api';

  // --- INCOMES ---
  getIncomes(): Observable<Income[]> { return this.http.get<Income[]>(`${this.apiUrl}/Incomes`); }
  createIncome(data: Income): Observable<any> { return this.http.post(`${this.apiUrl}/Incomes`, data); }
  updateIncome(id: number, data: Income): Observable<any> { return this.http.put(`${this.apiUrl}/Incomes/${id}`, data); }
  deleteIncome(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/Incomes/${id}`); }

  // --- EXPENSES ---
  getExpenses(): Observable<Expense[]> { return this.http.get<Expense[]>(`${this.apiUrl}/Expenses`); }
  createExpense(data: Expense): Observable<any> { return this.http.post(`${this.apiUrl}/Expenses`, data); }
  updateExpense(id: number, data: Expense): Observable<any> { return this.http.put(`${this.apiUrl}/Expenses/${id}`, data); }
  deleteExpense(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/Expenses/${id}`); }

  // --- ASSETS ---
  getAssets(): Observable<Asset[]> { return this.http.get<Asset[]>(`${this.apiUrl}/Assets`); }
  createAsset(data: Asset): Observable<any> { return this.http.post(`${this.apiUrl}/Assets`, data); }
  updateAsset(id: number, data: Asset): Observable<any> { return this.http.put(`${this.apiUrl}/Assets/${id}`, data); }
  deleteAsset(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/Assets/${id}`); }

  // --- CASH RECORDS ---
  getCashRecords(): Observable<CashRecord[]> { return this.http.get<CashRecord[]>(`${this.apiUrl}/CashRecords`); }
  createCashRecord(data: CashRecord): Observable<any> { return this.http.post(`${this.apiUrl}/CashRecords`, data); }
  updateCashRecord(id: number, data: CashRecord): Observable<any> { return this.http.put(`${this.apiUrl}/CashRecords/${id}`, data); }
  deleteCashRecord(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/CashRecords/${id}`); }

  // --- ALLOWANCES ---
  getAllowances(): Observable<Allowance[]> { return this.http.get<Allowance[]>(`${this.apiUrl}/Allowances`); }
  createAllowance(data: Allowance): Observable<any> { return this.http.post(`${this.apiUrl}/Allowances`, data); }
  updateAllowance(id: number, data: Allowance): Observable<any> { return this.http.put(`${this.apiUrl}/Allowances/${id}`, data); }
  deleteAllowance(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/Allowances/${id}`); }
}

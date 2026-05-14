import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Income, Expense, Asset, CashRecord, Allowance } from '../models/finance.models';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class FinanceApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  // --- ASSETS (VARLIKLAR) ---
  getAssets(): Observable<Asset[]> {
    return this.http.get<ApiResponse<Asset[]>>(`${this.apiUrl}/Assets`)
      .pipe(map(res => res.data || []));
  }
  createAsset(data: Asset): Observable<any> {
    return this.http.post(`${this.apiUrl}/Assets/create`, data);
  }
  updateAsset(id: number, data: Asset): Observable<any> {
    return this.http.put(`${this.apiUrl}/Assets/${id}/update`, { ...data, id });
  }
  deleteAsset(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Assets/${id}/delete`);
  }

  // --- CANLI PIYASA VERILERI ---
  // (Bunlarda sorun yok, backend ile eşleşiyor)
  getGoldPrices(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/FinanceData/gold`)
      .pipe(map(res => res.data || []));
  }
  getCurrencies(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/FinanceData/currencies`)
      .pipe(map(res => res.data || []));
  }
  getSilverPrice(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/FinanceData/silver`)
      .pipe(map(res => res.data || null));
  }

  // --- INCOMES (GELİRLER) ---
  getIncomes(): Observable<Income[]> {
    return this.http.get<ApiResponse<Income[]>>(`${this.apiUrl}/Incomes`)
      .pipe(map(res => res.data || []));
  }
  createIncome(data: Income): Observable<any> {
    return this.http.post(`${this.apiUrl}/Incomes/create`, data);
  }
  updateIncome(id: number, data: Income): Observable<any> {
    return this.http.put(`${this.apiUrl}/Incomes/${id}/update`, data);
  }
  deleteIncome(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Incomes/${id}/delete`);
  }

  // --- EXPENSES (GİDERLER) ---
  getExpenses(): Observable<Expense[]> {
    return this.http.get<ApiResponse<Expense[]>>(`${this.apiUrl}/Expenses`)
      .pipe(map(res => res.data || []));
  }
  createExpense(data: Expense): Observable<any> {
    return this.http.post(`${this.apiUrl}/Expenses/create`, data);
  }
  updateExpense(id: number, data: Expense): Observable<any> {
    return this.http.put(`${this.apiUrl}/Expenses/${id}/update`, data);
  }
  deleteExpense(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Expenses/${id}/delete`);
  }

  // --- CASH RECORDS (KASA) ---
  getCashRecords(): Observable<CashRecord[]> {
    return this.http.get<ApiResponse<CashRecord[]>>(`${this.apiUrl}/CashRecords`)
      .pipe(map(res => res.data || []));
  }
  createCashRecord(data: CashRecord): Observable<any> {
    return this.http.post(`${this.apiUrl}/CashRecords/create`, data);
  }
  updateCashRecord(id: number, data: CashRecord): Observable<any> {
    return this.http.put(`${this.apiUrl}/CashRecords/${id}/update`, data);
  }
  deleteCashRecord(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/CashRecords/${id}/delete`);
  }

  // --- ALLOWANCES (HARÇLIKLAR) ---
  getAllowances(): Observable<Allowance[]> {
    return this.http.get<ApiResponse<Allowance[]>>(`${this.apiUrl}/Allowances`)
      .pipe(map(res => res.data || []));
  }
  createAllowance(data: Allowance): Observable<any> {
    return this.http.post(`${this.apiUrl}/Allowances/create`, data);
  }
  updateAllowance(id: number, data: Allowance): Observable<any> {
    return this.http.put(`${this.apiUrl}/Allowances/${id}/update`, data);
  }
  deleteAllowance(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Allowances/${id}/delete`);
  }
}

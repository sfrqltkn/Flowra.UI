import { Injectable, computed, inject } from '@angular/core';
import { FinanceStateService } from './finance-state.service';

@Injectable({
  providedIn: 'root'
})
export class FinanceCalculatorService {

  private state = inject(FinanceStateService);

 private getItemsForSelectedMonth<T extends { date: Date | string, isRecurring?: boolean }>(items: T[]): T[] {

    const targetMonth = this.state.selectedMonth(); // Örn: '2026-05'
    const targetYear = parseInt(targetMonth.substring(0, 4));
    const targetMonthNum = parseInt(targetMonth.substring(5, 7)) - 1; // JS'de aylar 0'dan başlar

    const result: T[] = [];

    items.forEach(item => {
      const itemMonth = new Date(item.date).toISOString().slice(0, 7);

      // KURAL 1: İşlem tam olarak bu aya aitse, olduğu gibi al.
      if (itemMonth === targetMonth) {
        result.push({ ...item });
      }
      // KURAL 2: İşlem GEÇMİŞTE kalmış ama TEKRARLAYAN bir işlemse -> KLONLA VE BUGÜNE GETİR
      else if (itemMonth < targetMonth && item.isRecurring === true) {

        // Geçmişteki tarihi alıp, Yılını ve Ayını kullanıcının seçtiği aya ayarlıyoruz. (Gün sabit kalır)
        const projectedDate = new Date(item.date);
        projectedDate.setFullYear(targetYear, targetMonthNum);

        result.push({
          ...item,
          date: projectedDate.toISOString(), // Tarihi yeni aya güncelledik!
          isPaid: false // Geçmişte ödenmiş olsa bile, bu ayın faturası olduğu için henüz ödenmedi!
        });
      }
    });

    return result;
  }


  cashBalance = computed(() => {
    const targetMonth = this.state.selectedMonth();
    const targetRecord = this.state.cashRecords().find(r => r.monthYear === targetMonth);
    return targetRecord ? targetRecord.balance : 0;
  });

  currentMonthIncomes = computed(() => this.getItemsForSelectedMonth(this.state.incomes()));
  currentMonthExpenses = computed(() => this.getItemsForSelectedMonth(this.state.expenses()));
  currentMonthAssets = computed(() => {
    const targetMonth = this.state.selectedMonth();
    return this.state.assets().filter(a => a.monthYear === targetMonth);
  });


  totalIncome = computed(() => this.currentMonthIncomes().reduce((acc, curr) => acc + curr.amount, 0));
  totalExpenses = computed(() => this.currentMonthExpenses().reduce((acc, curr) => acc + curr.totalAmount, 0));
  totalAssetsValue = computed(() => this.currentMonthAssets().reduce((acc, curr) => acc + (curr.amount * curr.estimatedUnitValue), 0));

  totalMinimumExpenses = computed(() => {
    return this.currentMonthExpenses().reduce((acc, curr) => {
      const payment = (curr.isCreditCard && curr.minimumPaymentAmount != null)
        ? curr.minimumPaymentAmount
        : curr.totalAmount;
      return acc + payment;
    }, 0);
  });

  totalAllowances = computed(() => this.state.allowances().reduce((acc, curr) => acc + curr.amount, 0));


  // --- 3. GELİR SENARYOLARI ---
  incomeScenario1 = computed(() => {
    const cash = this.cashBalance();
    const positiveCash = cash > 0 ? cash : 0;
    return positiveCash + this.totalIncome() + this.totalAssetsValue();
  });
  incomeScenario2 = computed(() => this.totalIncome());
  incomeScenario3 = computed(() => this.totalAssetsValue());


  // --- 4. GİDER SENARYOLARI ---
  expenseScenario1 = computed(() => {
    const cash = this.cashBalance();
    const negativeCashDebt = cash < 0 ? Math.abs(cash) : 0;
    return this.totalExpenses() + this.totalAllowances() + negativeCashDebt;
  });
  expenseScenario2 = computed(() => {
    return this.totalExpenses() + this.totalAllowances();
  });
  expenseScenario3 = computed(() => {
    const cash = this.cashBalance();
    const negativeCashDebt = cash < 0 ? Math.abs(cash) : 0;
    return this.totalMinimumExpenses() + this.totalAllowances() + negativeCashDebt;
  });
  expenseScenario4 = computed(() => {
    return this.totalMinimumExpenses() + this.totalAllowances();
  });


  // --- 5. DİĞER METRİKLER VE YAKLAŞAN ÖDEMELER ---
  monthlyNetFlow = computed(() => this.totalIncome() - this.totalExpenses() - this.totalAllowances());
  endOfMonthCash = computed(() => this.cashBalance() + this.monthlyNetFlow());
  endOfMonthCashWithMinimums = computed(() => this.cashBalance() + this.totalIncome() - this.totalMinimumExpenses() - this.totalAllowances());
  netWorth = computed(() => this.endOfMonthCash() + this.totalAssetsValue());

  upcomingPayments = computed(() => {
    // 1. Zaten tarihleri klonlanmış ve bu aya ayarlanmış filtrelenmiş gider listesini alıyoruz
    const currentExpenses = this.currentMonthExpenses();

    return currentExpenses
      // 2. Sadece "Ödenmemiş" olanları alıyoruz (Tarihi geçse bile ödenmediyse bekleyendir!)
      .filter(e => !e.isPaid)
      // 3. Tarihe göre kronolojik sıralıyoruz (Ayın başındaki ödemeler en üstte)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  generateForecast(monthsAhead: number) {
    const recurringIncome = this.state.incomes().filter(i => i.isRecurring).reduce((a, c) => a + c.amount, 0);
    const recurringExpenses = this.state.expenses().filter(e => e.isRecurring).reduce((a, c) => a + c.totalAmount, 0);
    const monthlyAllowance = this.totalAllowances();

    const monthlyNet = recurringIncome - recurringExpenses - monthlyAllowance;
    const projectedBalance = this.cashBalance() + (monthlyNet * monthsAhead);

    return {
      monthsAhead,
      projectedBalance,
      isOptimistic: projectedBalance > 0
    };
  }
}

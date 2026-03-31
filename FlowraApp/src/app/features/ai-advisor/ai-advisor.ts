import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FinanceCalculatorService } from '../../core/services/finance-calculator.service';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { RouterLink } from '@angular/router';
import { Component, computed, inject, signal } from '@angular/core';


@Component({
  selector: 'app-ai-advisor',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './ai-advisor.html'
})

export class AiAdvisorComponent {
  calculator = inject(FinanceCalculatorService);
  state = inject(FinanceStateService);

  // --- SİMÜLASYON DURUMLARI (Toggles) ---
  // Bunlar açıkken AI sanki müdahale etmiş gibi hesaplamaları değiştireceğiz
  isMinimumPaymentActive = signal<boolean>(false);
  isAssetLiquidationActive = signal<boolean>(false);

  // --- AI ANALİZ DURUMU ---
  isAnalyzing = signal<boolean>(false);
  hasAnalyzed = signal<boolean>(false);

  // --- ZAMAN YOLCULUĞU METOTLARI ---
  previousMonth() {
    const current = new Date(this.state.selectedMonth() + '-01');
    current.setMonth(current.getMonth() - 1);
    this.state.changeMonth(current.toISOString().slice(0, 7));
    this.resetSimulation();
  }

  nextMonth() {
    const current = new Date(this.state.selectedMonth() + '-01');
    current.setMonth(current.getMonth() + 1);
    this.state.changeMonth(current.toISOString().slice(0, 7));
    this.resetSimulation();
  }

  get displayMonthName() {
    const date = new Date(this.state.selectedMonth() + '-01');
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  }

  // AI Analizini Başlatma Efekti
  startAnalysis() {
    this.isAnalyzing.set(true);
    // 2 saniyelik sahte bir yükleme (AI düşünüyor hissi)
    setTimeout(() => {
      this.isAnalyzing.set(false);
      this.hasAnalyzed.set(true);
    }, 2000);
  }

  resetSimulation() {
    this.hasAnalyzed.set(false);
    this.isMinimumPaymentActive.set(false);
    this.isAssetLiquidationActive.set(false);
  }

  toggleStrategy(strategy: 'minimum' | 'liquidate') {
    if (strategy === 'minimum') {
      this.isMinimumPaymentActive.set(!this.isMinimumPaymentActive());
    } else {
      this.isAssetLiquidationActive.set(!this.isAssetLiquidationActive());
    }
  }

  // --- SİMÜLE EDİLMİŞ METRİKLER (Butonlara göre değişir) ---

  // Varsayılan olarak 5000 TL'lik bir altın bozulduğunu varsayalım (Gelecekte AI belirleyecek)
  simulatedAssetGain = computed(() => this.isAssetLiquidationActive() ? 5000 : 0);

  // Eğer "Asgari Öde" aktifse, toplam giderler yerine asgari giderleri al
  simulatedTotalExpenses = computed(() => {
    return this.isMinimumPaymentActive()
      ? this.calculator.expenseScenario4() // Sadece asgariler (Kasa hariç)
      : this.calculator.expenseScenario2(); // Tüm borçlar (Kasa hariç)
  });

  // Simüle edilmiş Güncel Net Kasa
  simulatedNetCash = computed(() => {
    const baseIncome = this.calculator.totalIncome();
    const baseCash = this.calculator.cashBalance();

    return baseCash + baseIncome + this.simulatedAssetGain() - this.simulatedTotalExpenses();
  });
}

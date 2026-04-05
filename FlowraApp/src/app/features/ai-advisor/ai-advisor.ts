import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FinanceCalculatorService } from '../../core/services/finance-calculator.service';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


// C#'taki DTO'larımızla birebir aynı isimler (TypeScript standardı olan camelCase formatında)
export interface AiScenarioStep {
  stepName: string;
  amount: number;
  runningBalance: number;
  isPositive: boolean;
}

export interface AiScenario {
  id: string;
  title: string;
  description: string;
  finalBalance: number;
  isOptimistic: boolean;
  steps: AiScenarioStep[];
}

@Component({
  selector: 'app-ai-advisor',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './ai-advisor.html'
})
export class AiAdvisorComponent {
  calculator = inject(FinanceCalculatorService);
  state = inject(FinanceStateService);
  http = inject(HttpClient);

  isAnalyzing = signal<boolean>(false);
  hasAnalyzed = signal<boolean>(false);

  thinkingLogs = [
    "Google Gemini 2.5 Flash ağına bağlanılıyor...",
    "Makroekonomik veriler ve nakit akışı senkronize ediliyor...",
    "Darboğazlar tespit ediliyor...",
    "Varlık likidite senaryoları (A, B, C) simüle ediliyor...",
    "Kriz önleyici optimum stratejiler derleniyor...",
    "CFO Savaş Odası başlatılıyor..."
  ];
  currentLog = signal<string>('Bağlantı kuruluyor...');

  aiSummary = signal<string>('');
  displayedSummary = signal<string>('');
  aiScenarios = signal<AiScenario[]>([]);

  // Kullanıcının seçtiği aktif senaryo
  selectedScenarioId = signal<string>('C');

  get displayMonthName() {
    const date = new Date(this.state.selectedMonth() + '-01');
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  }

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

  startAnalysis() {
    this.isAnalyzing.set(true);
    this.hasAnalyzed.set(false);
    this.displayedSummary.set('');

    // Matrix tarzı yükleme efekti
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < this.thinkingLogs.length) {
        this.currentLog.set(this.thinkingLogs[logIndex]);
        logIndex++;
      }
    }, 600);

    const requestPayload = {
      monthYear: this.displayMonthName,
      currentCash: this.calculator.cashBalance(),
      totalIncome: this.calculator.totalIncome(),
      totalExpense: this.calculator.expenseScenario2(),
      minimumExpense: this.calculator.expenseScenario4(),
      totalAssets: this.calculator.totalAssetsValue()
    };

    // HTTPS portunun 7124 olduğundan emin ol
    this.http.post<any>(`${environment.apiUrl}/AiAdvisor/analyze`, requestPayload)
      .subscribe({
        next: (response) => {
          clearInterval(logInterval);
          this.aiSummary.set(response.summary);
          this.aiScenarios.set(response.scenarios);

          // Gelen senaryolardan sonuncusunu (Optimum C Planı) varsayılan olarak seç
          if (response.scenarios && response.scenarios.length > 0) {
            this.selectedScenarioId.set(response.scenarios[response.scenarios.length - 1].id);
          }

          this.isAnalyzing.set(false);
          this.hasAnalyzed.set(true);
          this.typeWriterEffect(response.summary);
        },
        error: (err) => {
          clearInterval(logInterval);
          console.error("Yapay Zeka API Hatası:", err);
          this.isAnalyzing.set(false);
          alert("Sistem Çöktü: Gemini sunucularına ulaşılamıyor.");
        }
      });
  }

  typeWriterEffect(text: string) {
    let i = 0;
    this.displayedSummary.set('');
    const typing = setInterval(() => {
      if (i < text.length) {
        this.displayedSummary.update(val => val + text.charAt(i));
        i++;
      } else {
        clearInterval(typing);
      }
    }, 25);
  }

  selectScenario(id: string) {
    this.selectedScenarioId.set(id);
  }

  resetSimulation() {
    this.hasAnalyzed.set(false);
    this.aiSummary.set('');
    this.displayedSummary.set('');
    this.aiScenarios.set([]);
  }

  get activeScenario(): AiScenario | undefined {
    return this.aiScenarios().find(s => s.id === this.selectedScenarioId());
  }
}

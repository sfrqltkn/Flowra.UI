import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { FinanceCalculatorService } from '../../core/services/finance-calculator.service';
import { Asset, CashRecord } from '../../core/models/finance.models';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './assets-component.html'
})
export class AssetsComponent implements OnInit {
  private fb = inject(FormBuilder);
  state = inject(FinanceStateService);
  calculator = inject(FinanceCalculatorService);

  cashForm!: FormGroup;
  assetForm!: FormGroup;
  showCashSuccess = false;

  assetTypes = [
    { value: 'Gold', label: 'Altın' },
    { value: 'Silver', label: 'Gümüş' },
    { value: 'Currency', label: 'Döviz' },
    { value: 'Other', label: 'Diğer' }
  ];

  editingCashRecordId: number | null = null;
  editCashForm!: FormGroup;

  editingAsset: Asset | null = null;
  editAssetForm!: FormGroup;

  constructor() {
    effect(() => {
      const month = this.state.selectedMonth();
      this.loadBalanceForMonth(month);

      // YENİ: Global ay değiştiğinde, varlık ekleme formundaki ayı da otomatik değiştir
      if (this.assetForm) {
        this.assetForm.patchValue({ monthYear: month }, { emitEvent: false });
      }
    });
  }

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

  ngOnInit() {
    this.cashForm = this.fb.group({ balance: [null, Validators.required] });

    // YENİ: monthYear alanı forma eklendi
    this.assetForm = this.fb.group({
      monthYear: [this.state.selectedMonth(), Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['Gold', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      estimatedUnitValue: [null, [Validators.required, Validators.min(0.01)]]
    });

    this.editCashForm = this.fb.group({ balance: [null, Validators.required] });

    // YENİ: monthYear alanı düzenleme formuna eklendi
    this.editAssetForm = this.fb.group({
      monthYear: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['Gold', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      estimatedUnitValue: [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  // --- KASA İŞLEMLERİ ---
  loadBalanceForMonth(monthYear: string) {
    if (!this.cashForm) return;
    const record = this.state.cashRecords().find(r => r.monthYear === monthYear);
    this.cashForm.patchValue({ balance: record ? record.balance : null }, { emitEvent: false });
  }

  updateCash() {
    if (this.cashForm.valid) {
      const balance = this.cashForm.value.balance;
      this.state.updateCashForMonth(this.state.selectedMonth(), balance);
      this.showCashSuccess = true;
      setTimeout(() => this.showCashSuccess = false, 2500);
    }
  }

  startCashEdit(record: CashRecord) {
    this.editingCashRecordId = record.id ?? null;
    this.editCashForm.patchValue({ balance: record.balance });
  }

  saveCashEdit(monthYear: string) {
    if (this.editCashForm.valid) {
      this.state.updateCashForMonth(monthYear, this.editCashForm.value.balance);
      this.editingCashRecordId = null;
    }
  }

  cancelCashEdit() { this.editingCashRecordId = null; }

  deleteCashRecord(id: number | undefined) {
    if (!id) return;
    if (confirm('Bu ayın kasa kaydını silmek istediğinize emin misiniz?')) {
      this.state.deleteCashRecord(id);
    }
  }

  // --- VARLIK İŞLEMLERİ ---
  addAsset() {
    if (this.assetForm.valid) {
      // Artık formu gönderirken state'i değil, formun içindeki ayı baz alıyoruz
      this.state.addAsset(this.assetForm.value);
      this.assetForm.reset({
        type: 'Gold',
        monthYear: this.state.selectedMonth() // Formu temizlerken mevcut ayı geri koy
      });
    }
  }

  deleteAsset(id: number | undefined) {
    if (!id) return;
    if (confirm('Bu varlığı silmek istediğinize emin misiniz?')) this.state.deleteAsset(id);
  }

  openEditAssetModal(asset: Asset) {
    this.editingAsset = asset;
    // YENİ: Düzenleme formuna tıklanan varlığın ayını basıyoruz
    this.editAssetForm.patchValue({
      monthYear: asset.monthYear,
      name: asset.name,
      type: asset.type,
      amount: asset.amount,
      estimatedUnitValue: asset.estimatedUnitValue
    });
  }

  closeEditAssetModal() { this.editingAsset = null; }

  saveAssetEdit() {
    if (this.editingAsset && this.editingAsset.id && this.editAssetForm.valid) {
      // Artık eski ayı korumuyoruz, kullanıcının değiştirdiği yeni ayı (form value) gönderiyoruz
      this.state.updateAsset(this.editingAsset.id, this.editAssetForm.value);
      this.closeEditAssetModal();
    }
  }
}

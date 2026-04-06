import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { FinanceCalculatorService } from '../../core/services/finance-calculator.service';
import { FinanceApiService } from '../../core/services/finance-api-service';
import { Asset, CashRecord } from '../../core/models/finance.models';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './assets-component.html'
})
export class AssetsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private financeApi = inject(FinanceApiService);
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

  // --- API Verileri ---
  goldPrices: any[] = [];
  currencyPrices: any[] = [];
  silverPrice: any = null;
  selectedAssetType: string = 'Gold';

  editingCashRecordId: number | null = null;
  editCashForm!: FormGroup;

  editingAsset: Asset | null = null;
  editAssetForm!: FormGroup;

  constructor() {
    effect(() => {
      const month = this.state.selectedMonth();
      this.loadBalanceForMonth(month);

      if (this.assetForm) {
        this.assetForm.patchValue({ monthYear: month }, { emitEvent: false });
      }
    });
  }

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

    this.assetForm = this.fb.group({
      monthYear: [this.state.selectedMonth(), Validators.required],
      name: ['', [Validators.required]],
      type: ['Gold', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      estimatedUnitValue: [null, [Validators.required, Validators.min(0.01)]]
    });

    this.editCashForm = this.fb.group({ balance: [null, Validators.required] });

    this.editAssetForm = this.fb.group({
      monthYear: ['', Validators.required],
      name: ['', [Validators.required]],
      type: ['Gold', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      estimatedUnitValue: [null, [Validators.required, Validators.min(0.01)]]
    });

    this.setupAssetFormListeners();
    this.loadGoldPrices(); // Sayfa açılışında default Altın olduğu için yükle
  }

  // --- YENİ: Form Dinleyicileri ---
  setupAssetFormListeners() {
    this.assetForm.get('type')?.valueChanges.subscribe(type => {
      this.selectedAssetType = type;
      this.assetForm.patchValue({ name: '', estimatedUnitValue: null }, { emitEvent: false });

      if (type === 'Gold' && this.goldPrices.length === 0) this.loadGoldPrices();
      if (type === 'Currency' && this.currencyPrices.length === 0) this.loadCurrencyPrices();
      if (type === 'Silver') {
        if (!this.silverPrice) {
          this.financeApi.getSilverPrice().subscribe(data => {
            this.silverPrice = data;
            this.assetForm.patchValue({ name: 'Gümüş', estimatedUnitValue: data.price });
          });
        } else {
          this.assetForm.patchValue({ name: 'Gümüş', estimatedUnitValue: this.silverPrice.price });
        }
      }
    });

    this.assetForm.get('name')?.valueChanges.subscribe(name => {
      if (!name) return;
      let price = 0;
      if (this.selectedAssetType === 'Gold') {
        price = this.goldPrices.find(x => x.name === name)?.price || 0;
      } else if (this.selectedAssetType === 'Currency') {
        price = this.currencyPrices.find(x => x.name === name)?.price || 0;
      }
      if (price > 0) this.assetForm.patchValue({ estimatedUnitValue: price });
    });
  }

  loadGoldPrices() { this.financeApi.getGoldPrices().subscribe(data => this.goldPrices = data); }
  loadCurrencyPrices() { this.financeApi.getCurrencies().subscribe(data => this.currencyPrices = data); }

  // --- KASA İŞLEMLERİ (DOKUNULMADI) ---
  loadBalanceForMonth(monthYear: string) {
    if (!this.cashForm) return;
    const record = this.state.cashRecords().find(r => r.monthYear === monthYear);
    this.cashForm.patchValue({ balance: record ? record.balance : null }, { emitEvent: false });
  }

  updateCash() {
    if (this.cashForm.valid) {
      this.state.updateCashForMonth(this.state.selectedMonth(), this.cashForm.value.balance);
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
      this.state.addAsset(this.assetForm.value);
      this.assetForm.reset({
        type: 'Gold',
        monthYear: this.state.selectedMonth()
      });
      this.selectedAssetType = 'Gold'; // Reset sonrası UI'ı da altına çek
    }
  }

  deleteAsset(id: number | undefined) {
    if (!id) return;
    if (confirm('Bu varlığı silmek istediğinize emin misiniz?')) this.state.deleteAsset(id);
  }

  openEditAssetModal(asset: Asset) {
    this.editingAsset = asset;
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
      this.state.updateAsset(this.editingAsset.id, this.editAssetForm.value);
      this.closeEditAssetModal();
    }
  }
}

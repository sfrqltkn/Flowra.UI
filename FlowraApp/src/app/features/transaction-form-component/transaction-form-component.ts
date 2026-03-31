import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { CommonModule, Location } from '@angular/common'; // LOCATION EKLENDİ

@Component({
  selector: 'app-transaction-form-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-form-component.html',
  styleUrl: './transaction-form-component.scss',
})
export class TransactionFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private state = inject(FinanceStateService);
  private location = inject(Location);

  transactionForm!: FormGroup;
  transactionType: 'income' | 'expense' = 'expense';

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.transactionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      amount: [null, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      isRecurring: [false],
      isCreditCard: [false],
      minimumPaymentAmount: [null]
    });

    this.transactionForm.get('isCreditCard')?.valueChanges.subscribe(isCC => {
      const minPaymentControl = this.transactionForm.get('minimumPaymentAmount');
      if (isCC && this.transactionType === 'expense') {
        minPaymentControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        minPaymentControl?.clearValidators();
      }
      minPaymentControl?.updateValueAndValidity();
    });
  }

  setTransactionType(type: 'income' | 'expense') {
    this.transactionType = type;
    this.transactionForm.reset({
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      isCreditCard: false
    });
  }

  goBack() {
    this.location.back();
  }

  onSubmit() {
    if (this.transactionForm.invalid) return;

    const formValue = this.transactionForm.value;

    // API UYUMU: "id: crypto..." satırı silindi. Tarih C# uyumlu hale getirildi.
    const commonData = {
      name: formValue.name,
      date: new Date(formValue.date).toISOString(),
      isRecurring: formValue.isRecurring
    };

    if (this.transactionType === 'income') {
      this.state.addIncome({
        ...commonData,
        amount: formValue.amount
      });
    } else {
      this.state.addExpense({
        ...commonData,
        totalAmount: formValue.amount,
        isCreditCard: formValue.isCreditCard,
        minimumPaymentAmount: formValue.isCreditCard ? formValue.minimumPaymentAmount : undefined,
        isPaid: false
      });
    }

    // İşlem tetiklendikten sonra sayfaya geri dön
    this.location.back();
  }
}

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const ERROR_MESSAGES: Record<string, (err: any) => string> = {
  required: () => 'Bu alan zorunludur.',
  min: (err) => `En az ${err.min} değeri girilebilir.`,
  max: (err) => `En fazla ${err.max} değeri girilebilir.`,
  serverError: (err: string) => err
};

@Component({
  selector: 'app-currency-input-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './currency-input-component.html'
})
export class CurrencyInputComponent implements OnInit, OnDestroy {
  @Input() label: string = '';
  @Input() placeholder: string = '0,00 ₺';
  @Input() control: FormControl = new FormControl();
  @Input() allowNegative: boolean = false;

  displayControl = new FormControl('');
  private destroy$ = new Subject<void>();
  private isFormatting = false;

  get isInvalid(): boolean {
    return this.control.invalid && (this.control.touched || this.control.hasError('serverError'));
  }

  get errorMessage(): string | null {
    if (!this.isInvalid || !this.control.errors) return null;

    const errorKeys = Object.keys(this.control.errors);
    for (const key of errorKeys) {
      if (ERROR_MESSAGES[key]) {
        return ERROR_MESSAGES[key](this.control.errors[key]);
      }
    }
    return 'Lütfen geçerli bir değer giriniz.';
  }

  ngOnInit() {
    // Dışarıdan gelen değeri UI'a yansıt
    this.formatAndSetDisplayValue(this.control.value);

    // Dış control'de olan dış değişiklikleri dinle
    this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      if (!this.isFormatting) {
        this.formatAndSetDisplayValue(val);
      }
    });

    // Kullanıcı yazarken canlı formatla
    this.displayControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      this.handleInput(val);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleInput(value: string | null) {
    if (this.isFormatting || value === null || value === undefined) return;
    this.isFormatting = true;

    // Sadece rakam, virgül ve eksi işaretine izin ver
    let cleanVal = value.replace(/[^0-9,-]/g, '');

    // Eksi işareti sadece en başta olabilir ve allowNegative true ise
    if (cleanVal.indexOf('-') > 0) {
      cleanVal = cleanVal.replace(/-/g, '');
    }
    if (!this.allowNegative && cleanVal.startsWith('-')) {
      cleanVal = cleanVal.replace(/-/g, '');
    }

    // Birden fazla virgül varsa ilkini tut, diğerlerini at
    const parts = cleanVal.split(',');
    if (parts.length > 2) {
      cleanVal = parts[0] + ',' + parts.slice(1).join('');
    }

    // Ondalık kısım 2 basamakla sınırla
    if (parts.length === 2 && parts[1].length > 2) {
      cleanVal = parts[0] + ',' + parts[1].substring(0, 2);
    }

    // Görüntü formatını ayarla (Örn: 12.500,75)
    let formattedDisplay = '';
    const numericParts = cleanVal.split(',');

    if (numericParts[0] !== '' && numericParts[0] !== '-') {
      // Başında sıfır varsa tek sıfıra indir (örn: 005 -> 5)
      let integerPart = numericParts[0];
      const isNegative = integerPart.startsWith('-');
      if (isNegative) integerPart = integerPart.substring(1);

      integerPart = integerPart.replace(/^0+/, '');
      if (integerPart === '') integerPart = '0';
      if (isNegative) integerPart = '-' + integerPart;

      // Binlik ayraçlarını ekle
      const integerWithDots = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      formattedDisplay = integerWithDots;
    } else {
      formattedDisplay = numericParts[0];
    }

    if (numericParts.length > 1) {
      formattedDisplay += ',' + numericParts[1];
    }

    // Sonuna sembol ekle ama kullanıcı siliyorsa sembolü force etme
    let finalDisplay = formattedDisplay;
    if (finalDisplay !== '' && finalDisplay !== '-') {
      // Kursörün zıplamasını engellemek için sembolü sadece blur anında eklemek daha iyi olabilir,
      // ama anlık isteniyorsa sona ekliyoruz
      finalDisplay = finalDisplay + ' ₺';
    }

    // Sadece görünüm değişiyorsa güncelle
    if (this.displayControl.value !== finalDisplay) {
      this.displayControl.setValue(finalDisplay, { emitEvent: false });
    }

    // Backend'e gidecek raw sayısal değeri (12500.75) kontrol et ve güncelle
    const rawValue = this.parseRawValue(cleanVal);

    if (this.control.value !== rawValue) {
      this.control.setValue(rawValue, { emitEvent: false });
      this.control.markAsDirty();
    }

    this.isFormatting = false;
  }

  onBlur() {
    this.control.markAsTouched();
    // Blur olduğunda boşsa temizle, değilse düzgün formatla
    if (!this.displayControl.value || this.displayControl.value.trim() === '₺') {
      this.isFormatting = true;
      this.displayControl.setValue('', { emitEvent: false });
      this.control.setValue(null, { emitEvent: false });
      this.isFormatting = false;
    } else {
      this.formatAndSetDisplayValue(this.control.value);
    }
  }

  private formatAndSetDisplayValue(val: number | null | undefined) {
    if (val === null || val === undefined || isNaN(val)) {
      this.displayControl.setValue('', { emitEvent: false });
      return;
    }

    const formatter = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const formatted = formatter.format(val) + ' ₺';
    this.displayControl.setValue(formatted, { emitEvent: false });
  }

  private parseRawValue(cleanString: string): number | null {
    if (!cleanString || cleanString === '-') return null;
    const standardFormat = cleanString.replace(',', '.');
    const parsed = parseFloat(standardFormat);
    return isNaN(parsed) ? null : parsed;
  }
}

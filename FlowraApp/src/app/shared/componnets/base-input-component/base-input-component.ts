import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

const ERROR_MESSAGES: Record<string, (err: any) => string> = {
  // Temel Hatalar
  required: () => 'Bu alan zorunludur.',
  email: () => 'Lütfen geçerli bir e-posta adresi giriniz.',
  pattern: () => 'Girdiğiniz değer istenen formata uymuyor.',
  invalidFormat: () => 'Geçersiz kullanıcı adı veya e-posta formatı.',

  // Uzunluk Hataları
  minlength: (err) => `En az ${err.requiredLength} karakter girmelisiniz.`,
  maxlength: (err) => `En fazla ${err.requiredLength} karakter girebilirsiniz.`,

  // Özel Form Hataları
  whitespaceOnly: () => 'Bu alan sadece boşluklardan oluşamaz.',
  notAlphabetic: () => 'Lütfen sadece harf kullanınız (rakam veya sembol girilemez).',
  passwordMismatch: () => 'Girdiğiniz şifreler birbiriyle eşleşmiyor.',

  // Şifre Zorluğu Detaylı Hata Mesajı
  weakPassword: (err) => {
    let message = 'Şifreniz şunları içermelidir: ';
    const needs = [];
    if (!err.hasUpperCase) needs.push('Büyük harf');
    if (!err.hasLowerCase) needs.push('Küçük harf');
    if (!err.hasNumeric) needs.push('Rakam');
    if (!err.hasSpecial) needs.push('Özel karakter (@, #, !, . vb.)');
    return message + needs.join(', ');
  },

  // BACKEND'DEN GELEN DİNAMİK HATALAR (YENİ EKLENDİ)
  // Backend "Kullanıcı bulunamadı" derse doğrudan bu mesajı ekrana basar.
  serverError: (err: string) => err
};

@Component({
  selector: 'app-base-input-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './base-input-component.html'
})
export class BaseInputComponent {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() icon: string = '';
  @Input() control: FormControl = new FormControl();

  // Şifre göster/gizle durumu
  showPassword = false;

  // Kontrol geçersizse ve dokunulmuşsa (veya backend'den hata basılmışsa)
  get isInvalid(): boolean {
    return this.control.invalid && (this.control.touched || this.control.hasError('serverError'));
  }

  // Input tipini dinamik hesaplayan Getter
  get currentType(): string {
    if (this.type === 'password') {
      return this.showPassword ? 'text' : 'password';
    }
    return this.type; // Password değilse (örn: email, text) olduğu gibi bırak
  }

  // Tıklama event'i
  togglePassword() {
    this.showPassword = !this.showPassword;
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
}

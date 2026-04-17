import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

export class AuthValidators {

  static userNameOrEmail(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      if (value.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : { invalidFormat: true };
      }

      const usernameRegex = /^[a-z0-9._-]+$/i;
      return usernameRegex.test(value) ? null : { invalidFormat: true };
    };
  }

  static passwordComplexity(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const hasUpperCase = /[A-Z]+/.test(value);
      const hasLowerCase = /[a-z]+/.test(value);
      const hasNumeric = /[0-9]+/.test(value);
      const hasSpecial = /[\W_]+/.test(value);

      const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial;

      // Hata detayını objenin içine gömüyoruz ki UI'da spesifik mesaj gösterebilelim
      return valid ? null : {
        weakPassword: { hasUpperCase, hasLowerCase, hasNumeric, hasSpecial }
      };
    };
  }

  static matchPasswords(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formGroup = control as FormGroup;
      const passwordControl = formGroup.get(passwordKey);
      const confirmPasswordControl = formGroup.get(confirmPasswordKey);

      if (!passwordControl || !confirmPasswordControl) return null;

      // Eğer eşleşmiyorsa hata fırlat
      if (passwordControl.value !== confirmPasswordControl.value) {
        // Hatayı confirm password alanına manuel olarak basıyoruz ki input altında görünsün
        confirmPasswordControl.setErrors({ ...confirmPasswordControl.errors, passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        // Eşleşiyorsa passwordMismatch hatasını temizle
        if (confirmPasswordControl.hasError('passwordMismatch')) {
          const errors = { ...confirmPasswordControl.errors };
          delete errors['passwordMismatch'];
          confirmPasswordControl.setErrors(Object.keys(errors).length ? errors : null);
        }
        return null;
      }
    };
  }

  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isWhitespace = (control.value || '').trim().length === 0;
      const isValid = !isWhitespace;
      return isValid ? null : { whitespaceOnly: true };
    };
  }

  static onlyAlphabetic(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      // Sadece harfler ve boşluklara izin ver (Türkçe karakterler dahil)
      const regex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/;
      return regex.test(control.value) ? null : { notAlphabetic: true };
    };
  }
}

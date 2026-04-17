import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  // İleride buraya kütüphane entegrasyonu gelecek
  success(message: string, title: string = 'Başarılı') {
    console.log(`✅ [${title}]: ${message}`);
    // toastr.success(message, title);
  }

  error(message: string, title: string = 'Hata') {
    console.error(`❌ [${title}]: ${message}`);
    // toastr.error(message, title);
  }

  warning(message: string, title: string = 'Uyarı') {
    console.warn(`⚠️ [${title}]: ${message}`);
    // toastr.warning(message, title);
  }
}

import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private isDarkMode = new BehaviorSubject<boolean>(this.getStoredTheme());
  isDarkMode$ = this.isDarkMode.asObservable();

  constructor() {
    this.updateBodyClass(this.isDarkMode.value);
  }

  toggleTheme() {
    const newTheme = !this.isDarkMode.value;
    this.isDarkMode.next(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    this.updateBodyClass(newTheme);
  }

  private getStoredTheme(): boolean {
    return localStorage.getItem('theme') === 'dark';
  }

  private updateBodyClass(isDark: boolean) {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
}

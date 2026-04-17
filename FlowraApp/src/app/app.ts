import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './core/services/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'Kurumsal Angular Projesi';

  private themeService = inject(ThemeService);
  isDarkMode$ = this.themeService.isDarkMode$;
  toggleTheme() {
    this.themeService.toggleTheme();
  }
}

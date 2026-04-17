import { Component, Input } from '@angular/core';
import { ThemeService } from '../../../core/services/theme/theme.service';
import { Observable } from 'rxjs/internal/Observable';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout-component',
  imports: [CommonModule],
  templateUrl: './auth-layout-component.html',
  styleUrl: './auth-layout-component.scss',
})
export class AuthLayoutComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() formTitle: string = '';
  @Input() maxWidth: 'md' | 'lg' | 'xl' = 'md';

  isDarkMode$: Observable<boolean>;

  constructor(private themeService: ThemeService) {
    this.isDarkMode$ = this.themeService.isDarkMode$;
  }

  ngOnInit(): void {}
}

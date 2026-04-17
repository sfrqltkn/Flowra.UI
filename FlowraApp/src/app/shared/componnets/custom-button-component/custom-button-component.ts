import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-custom-button-component',
  imports: [CommonModule],
  templateUrl: './custom-button-component.html',
  styleUrl: './custom-button-component.scss',
})
export class CustomButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() isLoading: boolean | null = false; // API isteği sırasında true olur
  @Input() disabled: boolean = false; // Form geçersizse true olur
}

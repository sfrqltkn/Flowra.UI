import { Component, EventEmitter, inject, Output, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { BaseInputComponent } from "../../../shared/componnets/base-input-component/base-input-component";
import { CustomButtonComponent } from "../../../shared/componnets/custom-button-component/custom-button-component";
import { UserService } from "../../../core/services/user/user.service";
import { ToastService } from "../../../core/services/notification/toast.service";

@Component({
  selector: 'app-create-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BaseInputComponent, CustomButtonComponent],
  templateUrl: './create-user-modal-component.html'
})
export class CreateUserModalComponent implements OnInit {
  @Output() close = new EventEmitter<boolean>();

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  createForm!: FormGroup;

  ngOnInit() {
    this.createForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]]
    });
  }

  getControl(controlName: string): FormControl {
    return this.createForm.get(controlName) as FormControl;
  }

  onSubmit() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.userService.create(this.createForm.value).subscribe({
      next: () => {
        this.toastService.success('Kullanıcı başarıyla oluşturuldu ve şifresi e-posta adresine gönderildi.');
        this.close.emit(true);
      },
      error: (err: any) => {
        const apiError = err.error || err;

        if (apiError.errors) {
          Object.keys(apiError.errors).forEach(key => {
            const formKey = key.charAt(0).toLowerCase() + key.slice(1);
            const control = this.createForm.get(formKey);
            if (control) control.setErrors({ serverError: apiError.errors[key][0] });
          });
        } else if (apiError.detail) {
           this.toastService.error(apiError.detail);
        }
      }
    });
  }
}

// src/app/shared/user/edit-user-modal-component/edit-user-modal-component.ts
import { Component, EventEmitter, inject, Input, Output, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { BaseInputComponent } from "../../../shared/componnets/base-input-component/base-input-component";
import { CustomButtonComponent } from "../../../shared/componnets/custom-button-component/custom-button-component";
import { UserService } from "../../../core/services/user/user.service";
import { ToastService } from "../../../core/services/notification/toast.service";
import { UserDto } from "../../../core/models/user.model";
import { ApiError } from "../../../core/models/api-error.model";

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BaseInputComponent, CustomButtonComponent],
  templateUrl: './edit-user-modal-component.html'
})
export class EditUserModalComponent implements OnInit {
  @Input() user!: UserDto;
  @Output() close = new EventEmitter<boolean>();

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  editForm!: FormGroup;

  ngOnInit() {
    this.editForm = this.fb.group({
      id: [this.user.id],
      firstName: [this.user.firstName, [Validators.required, Validators.minLength(3)]],
      lastName: [this.user.lastName, [Validators.required, Validators.minLength(3)]],
      userName: [this.user.userName, [Validators.required, Validators.minLength(3)]],
      email: [this.user.email, [Validators.required, Validators.email]],
      phoneNumber: [this.user.phoneNumber,[Validators.required,Validators.minLength(10), Validators.maxLength(20), Validators.pattern(/^[\d\+\-\(\)\s]+$/)]],
    });
  }

  // YENİ/DÜZELTİLMİŞ METOT: HTML tarafında bunu çağıracağız
  getControl(controlName: string): FormControl {
    return this.editForm.get(controlName) as FormControl;
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.userService.update(this.editForm.value).subscribe({
      next: () => {
        this.toastService.success('Kullanıcı başarıyla güncellendi.');
        this.close.emit(true);
      },
      error: (err: ApiError) => {
        if (err.errors) {
          Object.keys(err.errors).forEach(key => {
            const formKey = key.charAt(0).toLowerCase() + key.slice(1);
            const control = this.editForm.get(formKey);
            if (control) control.setErrors({ serverError: err.errors![key][0] });
          });
        }
      }
    });
  }
}

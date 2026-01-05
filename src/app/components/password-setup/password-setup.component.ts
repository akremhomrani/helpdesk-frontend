import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-password-setup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './password-setup.component.html',
  styleUrls: ['./password-setup.component.css']
})
export class PasswordSetupComponent implements OnInit {
  setupForm: FormGroup;
  userId: string = '';
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {
    this.setupForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'] || '';
      if (!this.userId) {
        this.errorMessage = 'No user ID provided in the URL';
      }
    });
  }

  private passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.setupForm.valid && this.userId) {
      this.loading = true;
      this.errorMessage = null;
      const newPassword = this.setupForm.get('password')?.value;
      
      this.userService.setPassword(this.userId, newPassword).subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = 'Password set successfully! Redirecting to login...';
          setTimeout(() => {
            // Redirect to root which will trigger Keycloak login
            window.location.href = '/';
          }, 2000);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error || 'Failed to set password. Please try again.';
          console.error('Error setting password:', err);
        }
      });
    }
  }
}

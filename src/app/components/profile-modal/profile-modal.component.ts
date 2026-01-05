import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface UserProfile {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface ProfileUpdateForm {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
}

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.css']
})
export class ProfileModalComponent implements OnInit {
  @Input() userProfile: UserProfile | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() update = new EventEmitter<ProfileUpdateForm>();

  showUpdateModal = false;
  updating = false;
  updateError = '';
  updateSuccess = '';
  
  updateForm: ProfileUpdateForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };

  ngOnInit() {
    if (this.userProfile) {
      this.updateForm = {
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        email: this.userProfile.email || '',
        password: ''
      };
    }
  }

  openUpdateModal() {
    this.showUpdateModal = true;
    this.updateError = '';
    this.updateSuccess = '';
    if (this.userProfile) {
      this.updateForm = {
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        email: this.userProfile.email || '',
        password: ''
      };
    }
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
    this.updateError = '';
    this.updateSuccess = '';
  }

  onClose() {
    this.close.emit();
  }

  validateForm(): boolean {
    if (!this.updateForm.firstName?.trim()) {
      this.updateError = 'First name is required';
      return false;
    }
    if (!this.updateForm.lastName?.trim()) {
      this.updateError = 'Last name is required';
      return false;
    }
    if (!this.updateForm.email?.trim()) {
      this.updateError = 'Email is required';
      return false;
    }
    return true;
  }

  onUpdate() {
    this.updateError = '';
    if (this.validateForm()) {
      this.update.emit(this.updateForm);
    }
  }

  formatRole(role: string | undefined): string {
    if (!role) return 'Not assigned';
    // Convert ADMIN to Admin, CLIENT to Client, etc.
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }
}

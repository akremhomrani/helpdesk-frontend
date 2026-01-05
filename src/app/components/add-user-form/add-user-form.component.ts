import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department.model';

@Component({
  selector: 'app-add-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user-form.component.html',
  styleUrls: ['./add-user-form.component.css']
})
export class AddUserFormComponent implements OnInit {
  @Input() user: User | null = null;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() loading = false;
  @Output() save = new EventEmitter<User>();
  @Output() cancel = new EventEmitter<void>();

  constructor(private departmentService: DepartmentService) {}

  formUser: User = this.getEmptyUser();
  error = '';
  departments: Department[] = [];
  loadingDepartments = false;

  ngOnInit() {
    if (this.user) {
      this.formUser = { ...this.user };
    }
    this.loadDepartments();
  }

  getEmptyUser(): User {
    return {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'CLIENT',
      enabled: true
    };
  }

  validateUser(): boolean {
    if (!this.formUser.firstName?.trim()) {
      this.error = 'First name is required';
      return false;
    }
    if (!this.formUser.lastName?.trim()) {
      this.error = 'Last name is required';
      return false;
    }
    if (!this.formUser.username?.trim()) {
      this.error = 'Username is required';
      return false;
    }
    if (!this.formUser.email?.trim()) {
      this.error = 'Email is required';
      return false;
    }
    if (!this.formUser.role) {
      this.error = 'Role is required';
      return false;
    }
    // Department is required for TECH_SUPPORT and DEVELOPER roles
    if (this.shouldShowDepartment() && !this.formUser.departmentId) {
      this.error = 'Department is required for Technical Support and Developer roles';
      return false;
    }
    return true;
  }

  onSubmit() {
    this.error = '';
    if (this.validateUser()) {
      this.save.emit(this.formUser);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  loadDepartments() {
    this.loadingDepartments = true;
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.loadingDepartments = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.loadingDepartments = false;
      }
    });
  }

  shouldShowDepartment(): boolean {
    return this.formUser.role === 'TECH_SUPPORT' || this.formUser.role === 'DEVELOPER';
  }

  onRoleChange() {
    // Clear department selection if role changes to one that doesn't allow departments
    if (!this.shouldShowDepartment()) {
      this.formUser.departmentId = undefined;
    }
  }
}

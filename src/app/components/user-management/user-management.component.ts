import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { AddUserFormComponent } from '../add-user-form/add-user-form.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AddUserFormComponent],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  selectedUser: User = this.getEmptyUser();
  loading = false;
  error = '';
  showDeleteModal = false;
  userToDelete: User | null = null;
  searchTerm = '';
  showFilters = false;

  constructor(
    private userService: UserService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = '';
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users. Please try again.';
        this.loading = false;
        console.error('Error loading users:', err);
      }
    });
  }

  openAddModal() {
    this.modalMode = 'add';
    this.selectedUser = this.getEmptyUser();
    this.showModal = true;
  }

  openEditModal(user: User) {
    this.modalMode = 'edit';
    this.selectedUser = { ...user };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedUser = this.getEmptyUser();
    this.error = '';
  }

  saveUser(user: User) {
    this.loading = true;

    if (this.modalMode === 'add') {
      this.userService.createUser(user).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          this.toastr.success(`User ${user.username} created successfully!`, 'Success');
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error('Failed to create user. Please try again.', 'Error');
          console.error('Error creating user:', err);
        }
      });
    } else {
      this.userService.updateUser(user.id!, user).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          this.toastr.success(`User ${user.username} updated successfully!`, 'Success');
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error('Failed to update user. Please try again.', 'Error');
          console.error('Error updating user:', err);
        }
      });
    }
  }

  openDeleteModal(user: User) {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  confirmDelete() {
    if (!this.userToDelete) return;
    
    this.loading = true;
    const username = this.userToDelete.username;
    this.userService.deleteUser(this.userToDelete.id!).subscribe({
      next: () => {
        this.loadUsers();
        this.closeDeleteModal();
        this.toastr.success(`User ${username} deleted successfully!`, 'Success');
      },
      error: (err) => {
        this.error = 'Failed to delete user. Please try again.';
        this.loading = false;
        this.toastr.error('Failed to delete user. Please try again.', 'Error');
        console.error('Error deleting user:', err);
      }
    });
  }

  getEmptyUser(): User {
    return {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'CLIENT'
    };
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  applyFilters() {
    this.filteredUsers = this.users.filter(user => {
      const searchLower = this.searchTerm.toLowerCase();
      const matchesSearch = !this.searchTerm || 
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.role?.toLowerCase().includes(searchLower) ||
        user.id?.toString().includes(searchLower);
      return matchesSearch;
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.applyFilters();
  }

  get activeFiltersCount(): number {
    return this.searchTerm ? 1 : 0;
  }

  exportToCSV() {
    const headers = ['ID', 'First Name', 'Last Name', 'Username', 'Email', 'Role'];
    const rows = this.filteredUsers.map((user, index) => [
      (index + 1).toString(),
      user.firstName,
      user.lastName,
      user.username,
      user.email,
      user.role
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.toastr.success('Users exported successfully!', 'Success');
  }
}

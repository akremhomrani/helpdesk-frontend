import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department.model';
import { AddDepartmentFormComponent } from '../add-department-form/add-department-form.component';

@Component({
  selector: 'app-department-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AddDepartmentFormComponent],
  templateUrl: './department-management.component.html',
  styleUrls: ['./department-management.component.css']
})
export class DepartmentManagementComponent implements OnInit {
  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  selectedDepartment: Department = this.getEmptyDepartment();
  loading = false;
  error = '';
  showDeleteModal = false;
  departmentToDelete: Department | null = null;
  
  // Filter properties
  searchTerm = '';
  showFilters = false;

  constructor(
    private departmentService: DepartmentService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.loading = true;
    this.error = '';
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.filteredDepartments = departments;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load departments. Please try again.';
        this.loading = false;
        console.error('Error loading departments:', err);
      }
    });
  }

  openAddModal() {
    this.modalMode = 'add';
    this.selectedDepartment = this.getEmptyDepartment();
    this.showModal = true;
  }

  openEditModal(department: Department) {
    this.modalMode = 'edit';
    this.selectedDepartment = { ...department };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedDepartment = this.getEmptyDepartment();
    this.error = '';
  }

  saveDepartment(department: Department) {
    this.loading = true;

    if (this.modalMode === 'add') {
      this.departmentService.createDepartment(department).subscribe({
        next: () => {
          this.loadDepartments();
          this.closeModal();
          this.toastr.success(`Department ${department.name} created successfully!`, 'Success');
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error('Failed to create department. Please try again.', 'Error');
          console.error('Error creating department:', err);
        }
      });
    } else {
      this.departmentService.updateDepartment(department.id!, department).subscribe({
        next: () => {
          this.loadDepartments();
          this.closeModal();
          this.toastr.success(`Department ${department.name} updated successfully!`, 'Success');
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error('Failed to update department. Please try again.', 'Error');
          console.error('Error updating department:', err);
        }
      });
    }
  }

  openDeleteModal(department: Department) {
    this.departmentToDelete = department;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.departmentToDelete = null;
  }

  confirmDelete() {
    if (!this.departmentToDelete) return;
    
    this.loading = true;
    const departmentName = this.departmentToDelete.name;
    this.departmentService.deleteDepartment(this.departmentToDelete.id!).subscribe({
      next: () => {
        this.loadDepartments();
        this.closeDeleteModal();
        this.toastr.success(`Department ${departmentName} deleted successfully!`, 'Success');
      },
      error: (err) => {
        this.error = 'Failed to delete department. Please try again.';
        this.loading = false;
        this.toastr.error('Failed to delete department. Please try again.', 'Error');
        console.error('Error deleting department:', err);
      }
    });
  }

  getEmptyDepartment(): Department {
    return {
      name: '',
      description: ''
    };
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  applyFilters() {
    this.filteredDepartments = this.departments.filter(department => {
      const searchLower = this.searchTerm.toLowerCase();
      const matchesSearch = !this.searchTerm || 
        department.name.toLowerCase().includes(searchLower) ||
        department.description?.toLowerCase().includes(searchLower) ||
        department.id?.toString().includes(searchLower);

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
}

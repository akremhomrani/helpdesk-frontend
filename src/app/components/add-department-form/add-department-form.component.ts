import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Department } from '../../models/department.model';

@Component({
  selector: 'app-add-department-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-department-form.component.html',
  styleUrls: ['./add-department-form.component.css']
})
export class AddDepartmentFormComponent implements OnInit {
  @Input() department: Department | null = null;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() loading = false;
  @Output() save = new EventEmitter<Department>();
  @Output() cancel = new EventEmitter<void>();

  formDepartment: Department = this.getEmptyDepartment();
  error = '';

  ngOnInit() {
    if (this.department) {
      this.formDepartment = { ...this.department };
    }
  }

  getEmptyDepartment(): Department {
    return {
      name: '',
      description: ''
    };
  }

  validateDepartment(): boolean {
    if (!this.formDepartment.name?.trim()) {
      this.error = 'Department name is required';
      return false;
    }
    if (!this.formDepartment.description?.trim()) {
      this.error = 'Description is required';
      return false;
    }
    return true;
  }

  onSubmit() {
    this.error = '';
    if (this.validateDepartment()) {
      this.save.emit(this.formDepartment);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}

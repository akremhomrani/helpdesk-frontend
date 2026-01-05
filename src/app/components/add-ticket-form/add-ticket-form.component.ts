import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ticket, TicketPriority, TicketType, TicketStatus, SupportLevel } from '../../models/ticket.model';
import { Department } from '../../models/department.model';
import { DepartmentService } from '../../services/department.service';

@Component({
  selector: 'app-add-ticket-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-ticket-form.component.html',
  styleUrls: ['./add-ticket-form.component.css']
})
export class AddTicketFormComponent implements OnInit {
  @Input() ticket: Ticket | null = null;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() loading = false;
  @Input() showStatusField = true;
  @Output() save = new EventEmitter<Ticket>();
  @Output() cancel = new EventEmitter<void>();

  formTicket: Ticket = this.getEmptyTicket();
  error = '';
  departments: Department[] = [];
  selectedFile: File | null = null;

  // Enum references for template
  TicketPriority = TicketPriority;
  TicketType = TicketType;
  TicketStatus = TicketStatus;

  // Enum arrays for dropdowns
  priorities = Object.values(TicketPriority);
  types = Object.values(TicketType);
  statuses = Object.values(TicketStatus);

  constructor(private departmentService: DepartmentService) {}

  ngOnInit() {
    if (this.ticket && this.mode === 'edit') {
      this.formTicket = { ...this.ticket };
    } else {
      this.formTicket = this.getEmptyTicket();
    }
    this.loadDepartments();
  }

  loadDepartments() {
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
      },
      error: (err) => {
        console.error('Error loading departments:', err);
        this.error = 'Failed to load departments';
      }
    });
  }

  getEmptyTicket(): Ticket {
    return {
      title: '',
      description: '',
      status: TicketStatus.PENDING,
      priority: '' as any, // No default - shows "Select priority"
      type: TicketType.PROBLEM,
      supportLevel: SupportLevel.FIRST_LEVEL,
      departementId: '',
      contact: '',
      email: ''
    };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  validateTicket(): boolean {
    if (!this.formTicket.title?.trim()) {
      this.error = 'Title is required';
      return false;
    }
    if (!this.formTicket.description?.trim()) {
      this.error = 'Description is required';
      return false;
    }
    if (!this.formTicket.priority) {
      this.error = 'Priority is required';
      return false;
    }
    if (!this.formTicket.departementId) {
      this.error = 'Department is required';
      return false;
    }
    // Set default type if not set
    if (!this.formTicket.type) {
      this.formTicket.type = TicketType.PROBLEM;
    }
    this.error = '';
    return true;
  }

  onSubmit() {
    if (this.validateTicket()) {
      this.save.emit(this.formTicket);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getSelectedFile(): File | null {
    return this.selectedFile;
  }
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TicketService } from '../../services/ticket.service';
import { DepartmentService } from '../../services/department.service';
import { UserService } from '../../services/user.service';
import { Ticket, TicketStatus } from '../../models/ticket.model';
import { User } from '../../models/user.model';
import { AddTicketFormComponent } from '../add-ticket-form/add-ticket-form.component';
import { TicketDetailsComponent } from '../ticket-details/ticket-details.component';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-ticket-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AddTicketFormComponent, TicketDetailsComponent],
  templateUrl: './ticket-management.component.html',
  styleUrls: ['./ticket-management.component.css']
})
export class TicketManagementComponent implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  selectedTicket: Ticket = this.getEmptyTicket();
  loading = false;
  error = '';
  showDeleteModal = false;
  ticketToDelete: Ticket | null = null;
  showStatusDropdown: { [key: number]: boolean } = {};
  dropdownPosition = { top: 0, left: 0 };
  
  // Details modal
  showDetailsModal = false;
  ticketDetails: Ticket | null = null;
  
  // Feedback modal for rejection
  showFeedbackModal = false;
  feedbackText = '';
  ticketToReject: Ticket | null = null;
  
  // Developer assignment modal for UNDER_REVIEW
  showAssignModal = false;
  ticketToAssign: Ticket | null = null;
  departmentDevelopers: User[] = [];
  selectedDeveloperId: string = '';
  loadingDevelopers = false;
  
  // Solution upload modal for RESOLVED status
  showSolutionModal = false;
  ticketToResolve: Ticket | null = null;
  solutionFile: File | null = null;
  
  // Filter properties
  searchTerm = '';
  showFilters = false;
  filterStatus = '';
  filterPriority = '';
  filterType = '';
  
  // Current user's department NAME for TECH_SUPPORT filtering
  currentUserDepartmentName: string | null = null;
  
  availableStatuses = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'AWAITING_CLIENT', label: 'Awaiting Client' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' }
  ];

  @ViewChild(AddTicketFormComponent) formComponent?: AddTicketFormComponent;

  constructor(
    private ticketService: TicketService,
    private departmentService: DepartmentService,
    private userService: UserService,
    private toastr: ToastrService,
    private authService: AuthService
  ) {}

  isClient(): boolean {
    return this.authService.hasRole('CLIENT');
  }

  // Get available statuses for a specific ticket (filters based on role and ticket state)
  getAvailableStatusesForTicket(ticket: Ticket): { value: string, label: string }[] {
    return this.availableStatuses.filter(status => {
      // DEVELOPER can only set IN_PROGRESS or RESOLVED
      if (this.isDeveloper()) {
        return status.value === 'IN_PROGRESS' || status.value === 'RESOLVED';
      }
      // CLOSED status is only available to CLIENT and only when ticket has a solution
      if (status.value === 'CLOSED') {
        return this.isClient() && ticket.hasSolution;
      }
      return true;
    });
  }

  canUpdateStatus(): boolean {
    return this.authService.hasRole('ADMIN') || this.authService.hasRole('TECH_SUPPORT') || this.authService.hasRole('DEVELOPER');
  }

  canEditTicket(): boolean {
    return this.authService.hasRole('ADMIN') || this.authService.hasRole('TECH_SUPPORT');
  }

  canEditThisTicket(ticket: Ticket): boolean {
    // DEVELOPER cannot edit tickets, only update status
    if (this.isDeveloper()) {
      return false;
    }
    // ADMIN and TECH_SUPPORT can always edit
    if (this.authService.hasRole('ADMIN') || this.authService.hasRole('TECH_SUPPORT')) {
      return true;
    }
    // Clients cannot edit tickets that are UNDER_REVIEW or beyond
    if (this.isClient() && ticket.status === 'UNDER_REVIEW') {
      return false;
    }
    return true;
  }

  ngOnInit() {
    this.initializeAndLoadTickets();
  }

  isTechSupport(): boolean {
    return this.authService.hasRole('TECH_SUPPORT') && !this.authService.hasRole('ADMIN');
  }

  isDeveloper(): boolean {
    return this.authService.hasRole('DEVELOPER') && !this.authService.hasRole('ADMIN');
  }

  initializeAndLoadTickets() {
    this.loading = true;
    this.error = '';

    // If user is TECH_SUPPORT (but not ADMIN), find their department first
    if (this.isTechSupport()) {
      const currentUserId = this.authService.getUserId();
      
      if (currentUserId) {
        // Get the department name for this user from the backend
        this.departmentService.getDepartmentNameByUserId(currentUserId).subscribe({
          next: (departmentName) => {
            this.currentUserDepartmentName = departmentName || null;
            this.fetchTickets();
          },
          error: () => {
            // User might not be in any department
            this.currentUserDepartmentName = null;
            this.fetchTickets();
          }
        });
      } else {
        this.fetchTickets();
      }
    } else {
      this.fetchTickets();
    }
  }

  fetchTickets() {
    // Clients see only their own tickets, others see all tickets
    const ticketObservable = this.isClient() 
      ? this.ticketService.getMyTickets() 
      : this.ticketService.getAllTickets();
    
    ticketObservable.subscribe({
      next: (tickets) => {
        const currentUserId = this.authService.getUserId();
        
        // Filter tickets based on user role
        if (this.isDeveloper() && currentUserId) {
          // DEVELOPER only sees tickets assigned to them
          this.tickets = tickets.filter(ticket => 
            ticket.assignedUserId === currentUserId
          );
        } else if (this.isTechSupport() && this.currentUserDepartmentName) {
          // TECH_SUPPORT sees tickets from their department
          this.tickets = tickets.filter(ticket => 
            ticket.departementName === this.currentUserDepartmentName
          );
        } else {
          this.tickets = tickets;
        }
        this.filteredTickets = this.tickets;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load tickets. Please try again.';
        this.loading = false;
        console.error('Error loading tickets:', err);
      }
    });
  }

  loadTickets() {
    this.initializeAndLoadTickets();
  }

  openAddModal() {
    this.modalMode = 'add';
    this.selectedTicket = this.getEmptyTicket();
    this.showModal = true;
  }

  openEditModal(ticket: Ticket) {
    this.modalMode = 'edit';
    this.selectedTicket = { ...ticket };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedTicket = this.getEmptyTicket();
    this.error = '';
  }

  saveTicket(ticket: Ticket) {
    this.loading = true;

    if (this.modalMode === 'add') {
      // Get the selected file from the form component
      const attachment = this.formComponent?.getSelectedFile() || undefined;

      this.ticketService.createTicket(
        ticket.title,
        ticket.description,
        ticket.type,
        ticket.departementId!,
        ticket.priority,
        attachment
      ).subscribe({
        next: () => {
          this.loadTickets();
          this.closeModal();
          this.toastr.success(`Ticket ${ticket.title} created successfully!`, 'Success');
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error('Failed to create ticket. Please try again.', 'Error');
          console.error('Error creating ticket:', err);
        }
      });
    } else {
      this.ticketService.updateTicket(
        ticket.id!,
        ticket.title,
        ticket.description,
        ticket.type,
        ticket.departementId,
        ticket.priority,
        ticket.status
      ).subscribe({
        next: () => {
          this.loadTickets();
          this.closeModal();
          this.toastr.success(`Ticket ${ticket.title} updated successfully!`, 'Success');
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error('Failed to update ticket. Please try again.', 'Error');
          console.error('Error updating ticket:', err);
        }
      });
    }
  }

  openDeleteModal(ticket: Ticket) {
    this.ticketToDelete = ticket;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.ticketToDelete = null;
  }

  confirmDelete() {
    if (!this.ticketToDelete) return;
    
    this.loading = true;
    const ticketTitle = this.ticketToDelete.title;
    this.ticketService.deleteTicket(this.ticketToDelete.id!).subscribe({
      next: () => {
        this.loadTickets();
        this.closeDeleteModal();
        this.toastr.success(`Ticket ${ticketTitle} deleted successfully!`, 'Success');
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to delete ticket. Please try again.';
        this.loading = false;
        this.toastr.error('Failed to delete ticket. Please try again.', 'Error');
        console.error('Error deleting ticket:', err);
      }
    });
  }

  openDetailsModal(ticket: Ticket) {
    this.ticketDetails = ticket;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.ticketDetails = null;
  }

  onEditFromDetails(ticket: Ticket) {
    this.closeDetailsModal();
    this.openEditModal(ticket);
  }

  getEmptyTicket(): Ticket {
    return {
      title: '',
      description: '',
      status: 'PENDING' as any,
      priority: 'MEDIUM' as any,
      type: 'REQUEST' as any,
      supportLevel: 'FIRST_LEVEL' as any
    };
  }

  getStatusClass(status: string): string {
    const statusMap: {[key: string]: string} = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'UNDER_REVIEW': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'AWAITING_CLIENT': 'bg-orange-100 text-orange-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  }

  getPriorityClass(priority: string): string {
    const priorityMap: {[key: string]: string} = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    };
    return priorityMap[priority] || 'bg-gray-100 text-gray-800';
  }

  toggleStatusDropdown(ticketId: number, buttonElement: HTMLElement) {
    // Close all other dropdowns first
    const wasOpen = this.showStatusDropdown[ticketId];
    this.showStatusDropdown = {};
    
    if (!wasOpen) {
      // Calculate position
      const rect = buttonElement.getBoundingClientRect();
      this.dropdownPosition = {
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      };
      this.showStatusDropdown[ticketId] = true;
    }
  }

  closeAllStatusDropdowns() {
    this.showStatusDropdown = {};
  }

  updateTicketStatus(ticket: Ticket, newStatus: string) {
    this.showStatusDropdown[ticket.id!] = false;
    
    if (ticket.status === newStatus) {
      return;
    }

    // CLOSED status can only be set by CLIENT when ticket has a solution
    if (newStatus === 'CLOSED') {
      if (!this.isClient()) {
        this.toastr.warning('Only the client can close a ticket', 'Warning');
        return;
      }
      if (!ticket.hasSolution) {
        this.toastr.warning('Ticket cannot be closed until a solution has been provided', 'Warning');
        return;
      }
    }

    // If status is REJECTED, show feedback modal
    if (newStatus === 'REJECTED') {
      this.ticketToReject = ticket;
      this.feedbackText = '';
      this.showFeedbackModal = true;
      return;
    }

    // If status is UNDER_REVIEW and user is TECH_SUPPORT, show developer assignment modal
    if (newStatus === 'UNDER_REVIEW' && this.isTechSupport()) {
      this.ticketToAssign = ticket;
      this.selectedDeveloperId = '';
      this.showAssignModal = true;
      this.loadDepartmentDevelopers(ticket.departementId!);
      return;
    }

    // If status is RESOLVED and user is DEVELOPER, show solution upload modal
    if (newStatus === 'RESOLVED' && this.isDeveloper()) {
      this.ticketToResolve = ticket;
      this.solutionFile = null;
      this.showSolutionModal = true;
      return;
    }

    // For other statuses, update directly
    this.ticketService.updateTicketStatus(ticket.id!, newStatus as TicketStatus).subscribe({
      next: () => {
        ticket.status = newStatus as TicketStatus;
        this.toastr.success(`Ticket status updated to ${this.getStatusLabel(newStatus)}`, 'Success');
      },
      error: (err) => {
        this.toastr.error('Failed to update ticket status', 'Error');
        console.error('Error updating ticket status:', err);
      }
    });
  }

  closeFeedbackModal() {
    this.showFeedbackModal = false;
    this.feedbackText = '';
    this.ticketToReject = null;
  }

  // Developer assignment modal methods
  loadDepartmentDevelopers(departmentId: string) {
    this.loadingDevelopers = true;
    this.departmentDevelopers = [];
    
    // Fetch all users and filter to only DEVELOPER role in the same department
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        // Filter to only show users with DEVELOPER role AND same department as the ticket
        this.departmentDevelopers = users.filter(user => 
          user.role === 'DEVELOPER' && 
          user.departmentName === this.currentUserDepartmentName
        );
        this.loadingDevelopers = false;
      },
      error: (err) => {
        console.error('Error loading developers:', err);
        this.loadingDevelopers = false;
        this.toastr.error('Failed to load developers', 'Error');
      }
    });
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.ticketToAssign = null;
    this.selectedDeveloperId = '';
    this.departmentDevelopers = [];
  }

  submitAssignment() {
    if (!this.selectedDeveloperId) {
      this.toastr.warning('Please select a developer', 'Warning');
      return;
    }

    if (!this.ticketToAssign) return;

    const selectedDeveloper = this.departmentDevelopers.find(d => d.id === this.selectedDeveloperId);
    if (!selectedDeveloper) return;

    const ticketId = this.ticketToAssign.id!;

    // First update status to UNDER_REVIEW, then assign the developer
    this.ticketService.updateTicketStatus(ticketId, TicketStatus.UNDER_REVIEW).subscribe({
      next: () => {
        // Now assign the developer using their ID
        this.ticketService.assignTicket(ticketId, selectedDeveloper.id!).subscribe({
          next: () => {
            this.ticketToAssign!.status = TicketStatus.UNDER_REVIEW;
            this.ticketToAssign!.assignedUserId = selectedDeveloper.id;
            this.ticketToAssign!.assignedUserName = `${selectedDeveloper.firstName} ${selectedDeveloper.lastName}`;
            this.toastr.success(`Ticket assigned to ${selectedDeveloper.firstName} ${selectedDeveloper.lastName}`, 'Success');
            this.closeAssignModal();
          },
          error: (err) => {
            console.error('Error assigning ticket:', err);
            this.toastr.error('Failed to assign ticket', 'Error');
          }
        });
      },
      error: (err) => {
        console.error('Error updating ticket status:', err);
        this.toastr.error('Failed to update ticket status', 'Error');
      }
    });
  }

  // Solution modal methods
  closeSolutionModal() {
    this.showSolutionModal = false;
    this.ticketToResolve = null;
    this.solutionFile = null;
  }

  onSolutionFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.solutionFile = input.files[0];
    }
  }

  submitSolution() {
    if (!this.solutionFile) {
      this.toastr.warning('Please select a solution file', 'Warning');
      return;
    }

    if (!this.ticketToResolve) return;

    const ticketId = this.ticketToResolve.id!;
    const currentStatus = this.ticketToResolve.status;

    // Backend requires ticket to be IN_PROGRESS before uploading solution
    const uploadAndResolve = () => {
      this.ticketService.uploadSolution(ticketId, this.solutionFile!).subscribe({
        next: () => {
          // Then update status to RESOLVED
          this.ticketService.updateTicketStatus(ticketId, TicketStatus.RESOLVED).subscribe({
            next: () => {
              this.ticketToResolve!.status = TicketStatus.RESOLVED;
              this.ticketToResolve!.hasSolution = true;
              this.toastr.success('Solution uploaded and ticket resolved', 'Success');
              this.closeSolutionModal();
            },
            error: (err) => {
              console.error('Error updating ticket status:', err);
              this.toastr.error('Failed to update ticket status', 'Error');
            }
          });
        },
        error: (err) => {
          console.error('Error uploading solution:', err);
          this.toastr.error('Failed to upload solution file', 'Error');
        }
      });
    };

    // If ticket is not IN_PROGRESS, update it first
    if (currentStatus !== TicketStatus.IN_PROGRESS) {
      this.ticketService.updateTicketStatus(ticketId, TicketStatus.IN_PROGRESS).subscribe({
        next: () => {
          this.ticketToResolve!.status = TicketStatus.IN_PROGRESS;
          uploadAndResolve();
        },
        error: (err) => {
          console.error('Error updating ticket to IN_PROGRESS:', err);
          this.toastr.error('Failed to update ticket status', 'Error');
        }
      });
    } else {
      uploadAndResolve();
    }
  }

  submitRejection() {
    if (!this.feedbackText.trim()) {
      this.toastr.warning('Please provide feedback for rejection', 'Warning');
      return;
    }

    if (!this.ticketToReject) return;

    const ticketId = this.ticketToReject.id!;
    
    this.ticketService.updateTicketStatus(ticketId, TicketStatus.REJECTED, this.feedbackText).subscribe({
      next: () => {
        this.ticketToReject!.status = TicketStatus.REJECTED;
        this.ticketToReject!.feedback = this.feedbackText;
        this.toastr.success('Ticket rejected with feedback', 'Success');
        this.closeFeedbackModal();
      },
      error: (err) => {
        this.toastr.error('Failed to reject ticket', 'Error');
        console.error('Error rejecting ticket:', err);
      }
    });
  }

  getStatusLabel(status: string): string {
    const statusObj = this.availableStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  applyFilters() {
    this.filteredTickets = this.tickets.filter(ticket => {
      // Search term filter
      const searchLower = this.searchTerm.toLowerCase();
      const matchesSearch = !this.searchTerm || 
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        ticket.id?.toString().includes(searchLower);

      // Status filter
      const matchesStatus = !this.filterStatus || ticket.status === this.filterStatus;

      // Priority filter
      const matchesPriority = !this.filterPriority || ticket.priority === this.filterPriority;

      // Type filter
      const matchesType = !this.filterType || ticket.type === this.filterType;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterPriority = '';
    this.filterType = '';
    this.applyFilters();
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.searchTerm) count++;
    if (this.filterStatus) count++;
    if (this.filterPriority) count++;
    if (this.filterType) count++;
    return count;
  }

  exportToCSV() {
    if (this.filteredTickets.length === 0) {
      this.toastr.warning('No tickets to export', 'Warning');
      return;
    }

    // Define CSV headers
    const headers = ['ID', 'Title', 'Description', 'Type', 'Priority', 'Status', 'Department', 'Creator', 'Assigned To', 'Created At', 'Updated At'];
    
    // Convert tickets to CSV rows
    const rows = this.filteredTickets.map(ticket => [
      ticket.id || '',
      this.escapeCSV(ticket.title),
      this.escapeCSV(ticket.description),
      ticket.type,
      ticket.priority,
      ticket.status,
      this.escapeCSV(ticket.departementName || 'N/A'),
      this.escapeCSV(ticket.creatorName || 'N/A'),
      this.escapeCSV(ticket.assignedUserName || 'N/A'),
      ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A',
      ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : 'N/A'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `tickets_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastr.success(`Exported ${this.filteredTickets.length} tickets successfully!`, 'Success');
  }

  private escapeCSV(value: string): string {
    if (!value) return '';
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket, TicketPriority, TicketStatus } from '../../models/ticket.model';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-ticket-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-details.component.html',
  styleUrls: ['./ticket-details.component.css']
})
export class TicketDetailsComponent {
  @Input() showModal = false;
  @Input() ticket: Ticket | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() editTicket = new EventEmitter<Ticket>();

  constructor(private ticketService: TicketService) {}

  closeModal(): void {
    this.close.emit();
  }

  onEditTicket(): void {
    if (this.ticket) {
      this.editTicket.emit(this.ticket);
    }
  }

  exportToCSV(): void {
    if (!this.ticket) return;

    const headers = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Type',
      'Department',
      'Creator',
      'Created At',
      'Updated At',
      'Resolved At',
      'Estimated Resolution Time',
      'Feedback',
      'Has Attachment',
      'Attachment Name'
    ];

    const data = [
      [
        this.ticket.id,
        `"${this.ticket.title?.replace(/"/g, '""') || 'N/A'}"`,
        `"${this.ticket.description?.replace(/"/g, '""') || 'No description provided'}"`,
        this.ticket.status || 'N/A',
        this.ticket.priority || 'N/A',
        this.ticket.type || 'N/A',
        `"${this.ticket.departementName?.replace(/"/g, '""') || 'N/A'}"`,
        `"${this.ticket.creatorName?.replace(/"/g, '""') || 'N/A'}"`,
        this.ticket.createdAt ? new Date(this.ticket.createdAt).toLocaleString() : 'N/A',
        this.ticket.updatedAt ? new Date(this.ticket.updatedAt).toLocaleString() : 'N/A',
        this.ticket.resolvedAt ? new Date(this.ticket.resolvedAt).toLocaleString() : 'N/A',
        this.ticket.estimatedResolutionTime ? this.ticket.estimatedResolutionTime.toString() : 'N/A',
        `"${this.ticket.feedback?.replace(/"/g, '""') || 'N/A'}"`,
        this.ticket.hasAttachment ? 'Yes' : 'No',
        `"${this.ticket.attachmentName?.replace(/"/g, '""') || 'N/A'}"`
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ticket_${this.ticket.id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getStatusColor(status?: TicketStatus): string {
    switch (status) {
      case TicketStatus.CLOSED:
        return 'bg-green-100 text-green-800 border-green-200';
      case TicketStatus.IN_PROGRESS:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case TicketStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case TicketStatus.UNDER_REVIEW:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case TicketStatus.RESOLVED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case TicketStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-200';
      case TicketStatus.AWAITING_CLIENT:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getStatusDotColor(status?: TicketStatus): string {
    switch (status) {
      case TicketStatus.CLOSED:
        return 'bg-green-500';
      case TicketStatus.IN_PROGRESS:
        return 'bg-purple-500';
      case TicketStatus.PENDING:
        return 'bg-yellow-500';
      case TicketStatus.UNDER_REVIEW:
        return 'bg-indigo-500';
      case TicketStatus.RESOLVED:
        return 'bg-gray-500';
      case TicketStatus.REJECTED:
        return 'bg-red-500';
      case TicketStatus.AWAITING_CLIENT:
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  }

  getPriorityColor(priority?: TicketPriority): string {
    switch (priority) {
      case TicketPriority.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-200';
      case TicketPriority.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case TicketPriority.MEDIUM:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case TicketPriority.LOW:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getAttachmentFileName(attachmentName: string | null | undefined): string {
    if (!attachmentName) return 'N/A';
    return attachmentName.split(/[\\/]/).pop() || 'N/A';
  }

  getSolutionFileName(solutionName: string | null | undefined): string {
    if (!solutionName) return 'N/A';
    return solutionName.split(/[\\/]/).pop() || 'N/A';
  }

  downloadAttachment(): void {
    if (!this.ticket?.id || !this.ticket.attachmentName) {
      console.error('Ticket ID or attachment name is missing');
      return;
    }

    this.ticketService.downloadAttachment(this.ticket.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.getAttachmentFileName(this.ticket!.attachmentName) || 'attachment';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading attachment:', err);
      }
    });
  }

  downloadSolution(): void {
    if (!this.ticket?.id || !this.ticket.solutionName) {
      console.error('Ticket ID or solution name is missing');
      return;
    }

    this.ticketService.downloadSolution(this.ticket.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.getSolutionFileName(this.ticket!.solutionName) || 'solution';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading solution:', err);
      }
    });
  }
}

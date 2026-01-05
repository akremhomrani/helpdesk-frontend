import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketHistory } from '../../services/ticket.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-ticket-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-history.component.html',
  styleUrls: ['./ticket-history.component.css']
})
export class TicketHistoryComponent implements OnInit {
  ticketHistories: TicketHistory[] = [];
  filteredHistories: TicketHistory[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  filterAction = '';
  filterTicket = '';
  showFilters = false;

  availableActions = [
    { value: 'Ticket created', label: 'Created' },
    { value: 'Ticket updated', label: 'Updated' },
    { value: 'Ticket assigned', label: 'Assigned' },
    { value: 'Ticket resolved', label: 'Resolved' },
    { value: 'Status changed', label: 'Status Changed' }
  ];

  constructor(
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadTicketHistory();
  }

  loadTicketHistory(): void {
    this.loading = true;
    this.error = '';

    // Simulate loading with mock data
    setTimeout(() => {
      this.ticketHistories = this.generateMockHistory();
      this.filteredHistories = [...this.ticketHistories];
      this.loading = false;
    }, 500);
  }

  private generateMockHistory(): TicketHistory[] {
    const actions = [
      'Ticket created',
      'Ticket updated',
      'Ticket assigned',
      'Status changed',
      'Ticket resolved'
    ];
    const users = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams'];
    const statuses = ['PENDING', 'IN_PROGRESS', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];
    
    const mockData: TicketHistory[] = [];
    const now = new Date();

    for (let i = 0; i < 15; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const oldStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const ticketId = (Math.floor(Math.random() * 4) + 1).toString();
      
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      date.setHours(Math.floor(Math.random() * 24));
      date.setMinutes(Math.floor(Math.random() * 60));

      mockData.push({
        id: `hist-${i + 1}`,
        ticketId: ticketId,
        userId: `user-${Math.floor(Math.random() * 4) + 1}`,
        userName: user,
        oldStatus: oldStatus,
        newStatus: newStatus,
        action: action,
        timestamp: date.toISOString(),
        comment: action === 'Status changed' ? `Status changed from ${oldStatus} to ${newStatus}` : `${action} by ${user}`
      });
    }

    return mockData.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  applyFilters(): void {
    this.filteredHistories = this.ticketHistories.filter(history => {
      const matchesSearch = !this.searchTerm || 
        history.ticketId.toString().includes(this.searchTerm.toLowerCase()) ||
        history.userName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        history.action?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesAction = !this.filterAction || history.action === this.filterAction;
      const matchesTicket = !this.filterTicket || history.ticketId.toString().includes(this.filterTicket);

      return matchesSearch && matchesAction && matchesTicket;
    });
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterAction = '';
    this.filterTicket = '';
    this.applyFilters();
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.filterAction) count++;
    if (this.filterTicket) count++;
    return count;
  }

  getActionClass(action: string): string {
    if (action.includes('created')) return 'bg-blue-100 text-blue-800';
    if (action.includes('updated')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('assigned')) return 'bg-indigo-100 text-indigo-800';
    if (action.includes('resolved')) return 'bg-green-100 text-green-800';
    if (action.includes('Status') || action.includes('changed')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  }

  getActionIcon(action: string): string {
    if (action.includes('created')) return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
    if (action.includes('updated')) return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
    if (action.includes('assigned')) return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
    if (action.includes('resolved')) return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    if (action.includes('Status') || action.includes('changed')) return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
    return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
  }

  exportToCSV(): void {
    const headers = ['Ticket ID', 'Action', 'User', 'Old Status', 'New Status', 'Comment', 'Timestamp'];
    const rows = this.filteredHistories.map(h => [
      h.ticketId,
      h.action,
      h.userName || 'System',
      h.oldStatus || '',
      h.newStatus || '',
      h.comment || '',
      new Date(h.timestamp).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.toastr.success('History exported successfully');
  }
}

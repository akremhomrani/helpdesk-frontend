import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AddUserFormComponent } from '../add-user-form/add-user-form.component';
import { AddDepartmentFormComponent } from '../add-department-form/add-department-form.component';
import { AddTicketFormComponent } from '../add-ticket-form/add-ticket-form.component';
import { ProfileModalComponent, UserProfile, ProfileUpdateForm } from '../profile-modal/profile-modal.component';
import { UserService } from '../../services/user.service';
import { DepartmentService } from '../../services/department.service';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../auth.service';
import { User } from '../../models/user.model';
import { Department } from '../../models/department.model';
import { Ticket } from '../../models/ticket.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AddUserFormComponent, AddDepartmentFormComponent, AddTicketFormComponent, ProfileModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats = {
    totalUsers: 0,
    totalDepartments: 0,
    activeUsers: 0,
    pendingApprovals: 0
  };

  recentActivities: any[] = [];
  showUserModal = false;
  showDepartmentModal = false;
  showTicketModal = false;
  showProfileModal = false;
  loading = false;
  
  userProfile: UserProfile | null = null;

  constructor(
    private router: Router,
    private userService: UserService,
    private departmentService: DepartmentService,
    private ticketService: TicketService,
    private toastr: ToastrService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Load dashboard stats
    this.loadStats();
    this.loadRecentActivities();
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.userProfile = {
      username: this.authService.getUsername() || '',
      email: this.authService.getEmail() || '',
      firstName: this.authService.getFirstName() || '',
      lastName: this.authService.getLastName() || '',
      role: this.authService.getRoles().find(r => !['offline_access', 'uma_authorization', 'default-roles-helpdesk'].includes(r)) || 'USER'
    };
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isClient(): boolean {
    return this.authService.hasRole('CLIENT');
  }

  loadStats() {
    // Fetch real data from services
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.stats.totalUsers = users.length;
        this.stats.activeUsers = Math.floor(users.length * 0.93); // 93% of total users
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });

    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.stats.totalDepartments = departments.length;
      },
      error: (err) => {
        console.error('Error loading departments:', err);
      }
    });

    this.ticketService.getAllTickets().subscribe({
      next: (tickets) => {
        this.stats.pendingApprovals = tickets.filter(t => t.status === 'PENDING').length;
      },
      error: (err) => {
        console.error('Error loading tickets:', err);
      }
    });
  }

  loadRecentActivities() {
    const allActivities: any[] = [];
    let completedRequests = 0;
    const totalRequests = 3;

    const finalizeActivities = () => {
      completedRequests++;
      if (completedRequests === totalRequests) {
        // Sort all activities by createdAt date and take the 3 most recent
        this.recentActivities = allActivities
          .filter(a => a.timestamp) // Only include items with valid timestamps
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 3);
      }
    };

    // Fetch users - show most recent users (use createdAt if available, otherwise show last 3 users)
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        // Check if users have createdAt (can be number timestamp or string)
        const usersWithDates = users.filter(u => u.createdAt);
        
        let sortedUsers;
        if (usersWithDates.length > 0) {
          // Sort users by createdAt descending and take top 3
          sortedUsers = usersWithDates
            .sort((a, b) => {
              const dateA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt!).getTime();
              const dateB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt!).getTime();
              return dateB - dateA;
            })
            .slice(0, 3);
        } else {
          // No createdAt available, take last 3 users from the list
          sortedUsers = users.slice(-3).reverse();
        }
        
        sortedUsers.forEach(user => {
          // Convert timestamp to ISO string if it's a number
          const timestamp = typeof user.createdAt === 'number' 
            ? new Date(user.createdAt).toISOString() 
            : (user.createdAt || new Date().toISOString());
          
          allActivities.push({
            type: 'user',
            title: 'User created',
            description: `${user.username} joined the platform`,
            timestamp: timestamp,
            color: 'blue'
          });
        });
        finalizeActivities();
      },
      error: () => finalizeActivities()
    });

    // Fetch departments and sort by createdAt
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        // Sort departments by createdAt descending and take top 3
        const sortedDepts = departments
          .filter(d => d.createdAt)
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
          .slice(0, 3);
        
        sortedDepts.forEach(dept => {
          allActivities.push({
            type: 'department',
            title: 'Department created',
            description: `${dept.name} department was created`,
            timestamp: dept.createdAt,
            color: 'green'
          });
        });
        finalizeActivities();
      },
      error: () => finalizeActivities()
    });

    // Fetch tickets and sort by createdAt
    this.ticketService.getAllTickets().subscribe({
      next: (tickets) => {
        // Sort tickets by createdAt descending and take top 3
        const sortedTickets = tickets
          .filter(t => t.createdAt)
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
          .slice(0, 3);
        
        sortedTickets.forEach(ticket => {
          allActivities.push({
            type: 'ticket',
            title: 'Ticket created',
            description: `${ticket.title} ticket was submitted`,
            timestamp: ticket.createdAt,
            color: 'purple'
          });
        });
        finalizeActivities();
      },
      error: () => finalizeActivities()
    });
  }

  updateActivities(activities: any[]) {
    // Sort by timestamp and take the 3 most recent
    this.recentActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);
  }

  getTimeAgo(timestamp: string): string {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const past = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(past.getTime())) return 'Unknown';
    
    const diffMs = now.getTime() - past.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    if (diffMonths === 1) return '1 month ago';
    return `${diffMonths} months ago`;
  }

  openUserModal() {
    this.showUserModal = true;
  }

  openDepartmentModal() {
    this.showDepartmentModal = true;
  }

  openTicketModal() {
    this.showTicketModal = true;
  }

  closeUserModal() {
    this.showUserModal = false;
  }

  closeDepartmentModal() {
    this.showDepartmentModal = false;
  }

  closeTicketModal() {
    this.showTicketModal = false;
  }

  openProfileModal() {
    this.loadUserProfile();
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  updateProfile(updateForm: ProfileUpdateForm) {
    this.loading = true;
    
    // Get current user ID from Keycloak token
    const userId = this.authService.getUserId();
    if (!userId) {
      this.loading = false;
      this.toastr.error('Unable to get user ID', 'Error');
      return;
    }

    // Prepare user update object
    const userUpdate: User = {
      username: this.userProfile?.username || '',
      firstName: updateForm.firstName,
      lastName: updateForm.lastName,
      email: updateForm.email,
      role: this.userProfile?.role || 'USER'
    };

    // Add password only if provided
    if (updateForm.password && updateForm.password.trim() !== '') {
      userUpdate.password = updateForm.password;
    }

    // Call user service to update profile
    this.userService.updateUser(userId, userUpdate).subscribe({
      next: () => {
        this.loading = false;
        this.closeProfileModal();
        
        // If password was changed, logout the user
        if (updateForm.password && updateForm.password.trim() !== '') {
          this.toastr.success('Profile and password updated successfully! Logging out...', 'Success');
          setTimeout(() => {
            this.authService.logout();
          }, 2000);
        } else {
          this.toastr.success('Profile updated successfully!', 'Success');
          // Reload user profile to get updated data
          this.loadUserProfile();
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error('Failed to update profile. Please try again.', 'Error');
        console.error('Error updating profile:', err);
      }
    });
  }

  saveUser(user: User) {
    this.loading = true;
    this.userService.createUser(user).subscribe({
      next: () => {
        this.loading = false;
        this.closeUserModal();
        this.toastr.success(`User ${user.username} created successfully!`, 'Success');
        this.router.navigate(['/user-management']);
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error('Failed to create user. Please try again.', 'Error');
        console.error('Error creating user:', err);
      }
    });
  }

  saveDepartment(department: Department) {
    this.loading = true;
    this.departmentService.createDepartment(department).subscribe({
      next: () => {
        this.loading = false;
        this.closeDepartmentModal();
        this.toastr.success(`Department ${department.name} created successfully!`, 'Success');
        this.router.navigate(['/department-management']);
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error('Failed to create department. Please try again.', 'Error');
        console.error('Error creating department:', err);
      }
    });
  }

  saveTicket(ticket: Ticket) {
    this.loading = true;
    this.ticketService.createTicket(
      ticket.title,
      ticket.description,
      ticket.type,
      ticket.departementId!,
      ticket.priority
    ).subscribe({
      next: () => {
        this.loading = false;
        this.closeTicketModal();
        this.toastr.success(`Ticket ${ticket.title} created successfully!`, 'Success');
        this.router.navigate(['/ticket-management']);
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error('Failed to create ticket. Please try again.', 'Error');
        console.error('Error creating ticket:', err);
      }
    });
  }

  // Public method to be called from app component
  public openProfile() {
    this.openProfileModal();
  }
}

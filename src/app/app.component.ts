import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { UserService } from './services/user.service';
import { ToastrService } from 'ngx-toastr';
import { ProfileModalComponent, UserProfile, ProfileUpdateForm } from './components/profile-modal/profile-modal.component';
import { NotificationDropdownComponent } from './components/notification-dropdown/notification-dropdown.component';
import { User } from './models/user.model';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, ProfileModalComponent, NotificationDropdownComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'helpdesk-frontend';
  isLoggedIn = false;
  username: string | undefined;
  email: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  role: string | undefined;
  
  // Menu states
  usersMenuOpen = false;
  departmentsMenuOpen = false;
  ticketsMenuOpen = false;
  
  // Profile modal
  showProfileModal = false;
  userProfile: UserProfile | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Check if we're on password setup page - don't check login status
    const isPasswordSetup = window.location.pathname.includes('/password-setup');
    
    if (isPasswordSetup) {
      this.isLoggedIn = true; // Pretend logged in to show the page content
      return;
    }
    
    this.isLoggedIn = this.authService.isLoggedIn();
    
    if (this.isLoggedIn) {
      await this.loadUserInfo();
    }
  }

  async loadUserInfo() {
    this.username = this.authService.getUsername();
    this.email = this.authService.getEmail();
    this.firstName = this.authService.getFirstName();
    this.lastName = this.authService.getLastName();
    const roles = this.authService.getRoles();
    // Get the first role that's not a default Keycloak role
    this.role = roles.find(r => !['offline_access', 'uma_authorization', 'default-roles-helpdesk'].includes(r)) || 'USER';
    this.loadUserProfile();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  loadUserProfile() {
    this.userProfile = {
      username: this.username || '',
      email: this.email || '',
      firstName: this.firstName || '',
      lastName: this.lastName || '',
      role: this.role || 'USER'
    };
  }

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }

  // Navigation methods
  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToUserManagement() {
    this.router.navigate(['/user-management']);
  }

  navigateToDepartmentManagement() {
    this.router.navigate(['/department-management']);
  }

  navigateToTicketManagement() {
    this.router.navigate(['/ticket-management']);
  }

  navigateToTicketHistory() {
    this.router.navigate(['/ticket-history']);
  }

  // Menu toggles
  toggleUsersMenu() {
    this.usersMenuOpen = !this.usersMenuOpen;
    if (this.usersMenuOpen) {
      this.departmentsMenuOpen = false;
      this.ticketsMenuOpen = false;
    }
  }

  toggleDepartmentsMenu() {
    this.departmentsMenuOpen = !this.departmentsMenuOpen;
    if (this.departmentsMenuOpen) {
      this.usersMenuOpen = false;
      this.ticketsMenuOpen = false;
    }
  }

  toggleTicketsMenu() {
    this.ticketsMenuOpen = !this.ticketsMenuOpen;
    if (this.ticketsMenuOpen) {
      this.usersMenuOpen = false;
      this.departmentsMenuOpen = false;
    }
  }

  toggleProfileModal() {
    this.loadUserProfile();
    this.showProfileModal = !this.showProfileModal;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  isPasswordSetupPage(): boolean {
    return window.location.pathname.includes('/password-setup');
  }

  updateProfile(updateForm: ProfileUpdateForm) {
    // TODO: Call user service to update profile
    // Simulate API call
    setTimeout(() => {
      if (this.userProfile) {
        this.userProfile.firstName = updateForm.firstName;
        this.userProfile.lastName = updateForm.lastName;
        this.userProfile.email = updateForm.email;
        this.firstName = updateForm.firstName;
        this.lastName = updateForm.lastName;
        this.email = updateForm.email;
      }
      this.closeProfileModal();
      console.log('Profile updated:', updateForm);
    }, 1000);
  }
}

import { Routes } from '@angular/router';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { DepartmentManagementComponent } from './components/department-management/department-management.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TicketManagementComponent } from './components/ticket-management/ticket-management.component';
import { TicketHistoryComponent } from './components/ticket-history/ticket-history.component';
import { PasswordSetupComponent } from './components/password-setup/password-setup.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'user-management', component: UserManagementComponent, canActivate: [adminGuard] },
  { path: 'department-management', component: DepartmentManagementComponent, canActivate: [adminGuard] },
  { path: 'ticket-management', component: TicketManagementComponent },
  { path: 'ticket-history', component: TicketHistoryComponent, canActivate: [adminGuard] },
  { path: 'password-setup', component: PasswordSetupComponent }
];

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  if (authService.isAdmin()) {
    return true;
  }

  // Show error message and redirect non-admin users to dashboard
  toastr.error('Access denied. Admin privileges required.', 'Unauthorized');
  router.navigate(['/dashboard']);
  return false;
};

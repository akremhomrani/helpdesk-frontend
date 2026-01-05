import { provideToastr } from 'ngx-toastr';

export const toastrConfig = provideToastr({
  timeOut: 3000,
  positionClass: 'toast-top-right',
  preventDuplicates: true,
  closeButton: true,
  progressBar: true,
  progressAnimation: 'decreasing',
  newestOnTop: true,
  tapToDismiss: true,
  maxOpened: 3,
  autoDismiss: true
});

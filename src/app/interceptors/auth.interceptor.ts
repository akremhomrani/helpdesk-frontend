import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloakService = inject(KeycloakService);

  // Skip adding token for assets, Keycloak URLs, and password setup endpoint only
  if (req.url.includes('/assets') || 
      req.url.includes('keycloak') || 
      (req.url.includes('/password') && req.method === 'POST')) {
    return next(req);
  }

  // Get token and add to request
  return from(keycloakService.getToken()).pipe(
    switchMap(token => {
      if (token) {
        const clonedRequest = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(clonedRequest);
      }
      return next(req);
    })
  );
};

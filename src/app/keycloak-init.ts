import { KeycloakService } from 'keycloak-angular';

export function initializeKeycloak(keycloak: KeycloakService) {
  return () => {
    // Check if current URL is password setup page - don't initialize Keycloak at all
    const isPasswordSetup = window.location.pathname.includes('/password-setup');
    
    if (isPasswordSetup) {
      // Skip Keycloak initialization entirely for password setup
      return Promise.resolve();
    }
    
    return keycloak.init({
      config: {
        url: 'http://localhost:9090',
        realm: 'helpdesk-realm',
        clientId: 'angular-client'
      },
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: false,
        flow: 'standard'
      },
      enableBearerInterceptor: false, // Disabled - using custom interceptor
      bearerPrefix: 'Bearer'
    });
  };
}

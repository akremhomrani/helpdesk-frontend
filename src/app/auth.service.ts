import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private keycloakService: KeycloakService) {}

  /**
   * Get user profile information
   */
  async getUserProfile(): Promise<KeycloakProfile | null> {
    try {
      if (this.keycloakService.isLoggedIn()) {
        return await this.keycloakService.loadUserProfile();
      }
      return null;
    } catch (error) {
      console.error('Error loading user profile', error);
      return null;
    }
  }

  /**
   * Get username from token
   */
  getUsername(): string | undefined {
    try {
      const keycloakInstance = this.keycloakService.getKeycloakInstance();
      return keycloakInstance.tokenParsed?.['preferred_username'] || 
             keycloakInstance.tokenParsed?.['username'] ||
             this.keycloakService.getUsername();
    } catch (error) {
      console.error('Error getting username', error);
      return undefined;
    }
  }

  /**
   * Get email from token
   */
  getEmail(): string | undefined {
    try {
      const keycloakInstance = this.keycloakService.getKeycloakInstance();
      return keycloakInstance.tokenParsed?.['email'];
    } catch (error) {
      console.error('Error getting email', error);
      return undefined;
    }
  }

  /**
   * Get first name from token
   */
  getFirstName(): string | undefined {
    try {
      const keycloakInstance = this.keycloakService.getKeycloakInstance();
      return keycloakInstance.tokenParsed?.['given_name'] || 
             keycloakInstance.tokenParsed?.['firstName'];
    } catch (error) {
      console.error('Error getting first name', error);
      return undefined;
    }
  }

  /**
   * Get last name from token
   */
  getLastName(): string | undefined {
    try {
      const keycloakInstance = this.keycloakService.getKeycloakInstance();
      return keycloakInstance.tokenParsed?.['family_name'] || 
             keycloakInstance.tokenParsed?.['lastName'];
    } catch (error) {
      console.error('Error getting last name', error);
      return undefined;
    }
  }

  /**
   * Get user roles from token (both realm and client roles)
   */
  getRoles(): string[] {
    try {
      const keycloakInstance = this.keycloakService.getKeycloakInstance();
      const roles: string[] = [];
      
      // Get realm roles
      const realmRoles = keycloakInstance.tokenParsed?.['realm_access']?.['roles'] || [];
      roles.push(...realmRoles);
      
      // Get client roles (spring-boot-app)
      const resourceAccess = keycloakInstance.tokenParsed?.['resource_access'];
      if (resourceAccess) {
        // Check all clients for roles
        Object.keys(resourceAccess).forEach(client => {
          const clientRoles = resourceAccess[client]?.['roles'] || [];
          roles.push(...clientRoles);
        });
      }
      
      return roles;
    } catch (error) {
      console.error('Error getting roles', error);
      return [];
    }
  }

  /**
   * Get user ID (sub claim) from token
   */
  getUserId(): string | undefined {
    try {
      const keycloakInstance = this.keycloakService.getKeycloakInstance();
      return keycloakInstance.tokenParsed?.['sub'];
    } catch (error) {
      console.error('Error getting user ID', error);
      return undefined;
    }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.keycloakService.isLoggedIn();
  }

  /**
   * Login user
   */
  login(): void {
    this.keycloakService.login({
      redirectUri: window.location.origin
    });
  }

  /**
   * Logout user
   */
  logout(): void {
    this.keycloakService.logout(window.location.origin);
  }

  /**
   * Get access token
   */
  async getToken(): Promise<string> {
    try {
      return await this.keycloakService.getToken();
    } catch (error) {
      console.error('Error getting token', error);
      return '';
    }
  }

  /**
   * Check if user has ADMIN role
   */
  isAdmin(): boolean {
    try {
      const roles = this.getRoles();
      return roles.includes('ADMIN');
    } catch (error) {
      console.error('Error checking admin role', error);
      return false;
    }
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    try {
      const roles = this.getRoles();
      return roles.includes(role);
    } catch (error) {
      console.error('Error checking role', error);
      return false;
    }
  }
}

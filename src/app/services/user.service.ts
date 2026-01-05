import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User, UserResponse } from '../models/user.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${API_CONFIG.baseUrl}/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: User): Observable<any> {
    return this.http.post(this.apiUrl, user, {
      responseType: 'text'
    });
  }

  updateUser(id: string, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user, {
      responseType: 'text' as 'json'
    }).pipe(
      switchMap(() => this.getUserById(id))
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      responseType: 'text' as 'json'
    }) as Observable<void>;
  }

  setPassword(userId: string, newPassword: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/${userId}/password`, 
      { newPassword }, 
      { responseType: 'text' }
    );
  }

  getUsersByDepartment(departmentId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/department/${departmentId}`);
  }
}

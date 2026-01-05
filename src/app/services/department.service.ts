import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Department } from '../models/department.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = `${API_CONFIG.baseUrl}/departments`;

  constructor(private http: HttpClient) {}

  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.apiUrl);
  }

  getDepartmentById(id: string): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/${id}`);
  }

  createDepartment(department: Department): Observable<any> {
    return this.http.post(this.apiUrl, department, {
      responseType: 'text'
    });
  }

  updateDepartment(id: string, department: Department): Observable<Department> {
    return this.http.put<Department>(`${this.apiUrl}/${id}`, department, {
      responseType: 'text' as 'json'
    }).pipe(
      switchMap(() => this.getDepartmentById(id))
    );
  }

  deleteDepartment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      responseType: 'text' as 'json'
    }) as Observable<void>;
  }

  getDepartmentNameByUserId(userId: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/user/${userId}/name`, {
      responseType: 'text'
    });
  }
}

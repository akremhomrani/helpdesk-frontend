import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Ticket, TicketStatus, TicketPriority, TicketType } from '../models/ticket.model';
import { API_CONFIG } from '../config/api.config';

export interface TicketHistory {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  oldStatus: string;
  newStatus: string;
  action: string;
  timestamp: string;
  comment: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = `${API_CONFIG.baseUrl}/tickets`;

  constructor(private http: HttpClient) {}

  getAllTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl);
  }

  getMyTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/my-tickets`);
  }

  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  createTicket(
    title: string,
    description: string,
    type: TicketType,
    departementId: string,
    priority: TicketPriority,
    attachment?: File
  ): Observable<Ticket> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('type', type);
    formData.append('departementId', departementId);
    formData.append('priority', priority);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    return this.http.post<Ticket>(this.apiUrl, formData);
  }

  updateTicket(
    id: number,
    title?: string,
    description?: string,
    type?: TicketType,
    departementId?: string,
    priority?: TicketPriority,
    status?: TicketStatus,
    attachment?: File
  ): Observable<Ticket> {
    const formData = new FormData();
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (type) formData.append('type', type);
    if (departementId) formData.append('departementId', departementId);
    if (priority) formData.append('priority', priority);
    if (status) formData.append('status', status);
    if (attachment) formData.append('attachment', attachment);

    return this.http.put<Ticket>(`${this.apiUrl}/${id}`, formData);
  }

  updateTicketStatus(id: number, status: TicketStatus, feedback?: string): Observable<Ticket> {
    let params = new HttpParams().set('status', status);
    if (feedback) {
      params = params.set('feedback', feedback);
    }

    return this.http.patch<Ticket>(`${this.apiUrl}/${id}/status`, null, { params });
  }

  assignTicket(id: number, assigneeId: string): Observable<Ticket> {
    const params = new HttpParams().set('assigneeId', assigneeId);
    return this.http.patch<Ticket>(`${this.apiUrl}/${id}/assign`, null, { params });
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      responseType: 'text' as 'json'
    }) as Observable<void>;
  }

  uploadSolution(id: number, file: File): Observable<Ticket> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Ticket>(`${this.apiUrl}/${id}/solution`, formData);
  }

  downloadAttachment(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/attachment`, {
      responseType: 'blob'
    });
  }

  downloadSolution(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/solution`, {
      responseType: 'blob'
    });
  }

}

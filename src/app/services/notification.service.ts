import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { tap, switchMap, startWith } from 'rxjs/operators';
import { Notification, NotificationCreate } from '../models/notification.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = `${API_CONFIG.baseUrl}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all notifications
   */
  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.baseUrl);
  }

  /**
   * Get notifications for a specific recipient
   */
  getNotificationsByRecipient(recipientId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/recipient/${recipientId}`);
  }

  /**
   * Get unread notifications for a specific recipient
   */
  getUnreadNotifications(recipientId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/recipient/${recipientId}/unread`);
  }

  /**
   * Get unread notification count for a specific recipient
   */
  getUnreadCount(recipientId: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/recipient/${recipientId}/unread/count`)
      .pipe(
        tap(count => this.unreadCountSubject.next(count))
      );
  }

  /**
   * Create a new notification
   */
  createNotification(notification: NotificationCreate): Observable<Notification> {
    return this.http.post<Notification>(this.baseUrl, notification);
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.baseUrl}/${notificationId}/read`, {});
  }

  /**
   * Mark all notifications as read for a recipient
   */
  markAllAsRead(recipientId: string): Observable<string> {
    return this.http.put<string>(`${this.baseUrl}/recipient/${recipientId}/read-all`, {});
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${notificationId}`);
  }

  /**
   * Start polling for unread count
   */
  startPolling(recipientId: string, intervalMs: number = 30000): Observable<number> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getUnreadCount(recipientId))
    );
  }

  /**
   * Update unread count manually
   */
  updateUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
  }
}

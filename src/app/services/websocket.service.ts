import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private connectedSubject = new BehaviorSubject<boolean>(false);

  public notification$ = this.notificationSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public connected$ = this.connectedSubject.asObservable();

  constructor() {}

  /**
   * Connect to WebSocket server
   */
  connect(userId: string): void {
    if (this.stompClient && this.stompClient.connected) {
      return;
    }

    const socket = new SockJS('http://localhost:8086/ws-notifications');
    
    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      this.connectedSubject.next(true);

      // Subscribe to user-specific notifications
      this.stompClient?.subscribe(`/topic/notifications/${userId}`, (message: IMessage) => {
        const notification: Notification = JSON.parse(message.body);
        this.notificationSubject.next(notification);
      });

      // Subscribe to unread count updates
      this.stompClient?.subscribe(`/topic/notifications/${userId}/count`, (message: IMessage) => {
        const count = parseInt(message.body);
        this.unreadCountSubject.next(count);
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('WebSocket error:', frame);
      this.connectedSubject.next(false);
    };

    this.stompClient.onWebSocketClose = (event) => {
      this.connectedSubject.next(false);
    };

    this.stompClient.activate();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.connectedSubject.next(false);
      console.log('Disconnected from WebSocket');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.stompClient?.connected || false;
  }

  /**
   * Update unread count manually
   */
  updateUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
  }
}

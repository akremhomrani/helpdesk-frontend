import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { WebSocketService } from '../../services/websocket.service';
import { Notification } from '../../models/notification.model';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.css']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  isOpen = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  loading = false;
  recipientId: string = '';
  isAdmin: boolean = false;
  private previousUnreadCount = 0;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private webSocketService: WebSocketService,
    private toastr: ToastrService,
    private router: Router,
    private elementRef: ElementRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is admin
    this.isAdmin = this.authService.hasRole('ADMIN');
    
    // Set recipientId: 'admin' for ADMIN role users, otherwise use their actual user ID
    if (this.isAdmin) {
      this.recipientId = 'admin';
    } else {
      // For non-admin users, use their actual user ID
      const userId = this.authService.getUserId();
      if (!userId) {
        console.error('Unable to get user ID');
        return;
      }
      this.recipientId = userId;
    }
    
    // Load initial notifications
    this.loadNotifications();
    
    // Load initial unread count
    this.notificationService.getUnreadCount(this.recipientId).subscribe();

    // Connect to WebSocket for real-time updates
    this.webSocketService.connect(this.recipientId);

    // Subscribe to WebSocket notifications
    const notificationSub = this.webSocketService.notification$.subscribe(
      notification => {
        if (notification) {
          // Add new notification to the list
          this.notifications.unshift(notification);
          
          // Show toast notification
          this.toastr.info(
            notification.message,
            notification.title,
            { 
              timeOut: 5000, 
              progressBar: true,
              closeButton: true 
            }
          );
        }
      }
    );
    this.subscriptions.push(notificationSub);

    // Subscribe to WebSocket unread count updates
    const unreadCountSub = this.webSocketService.unreadCount$.subscribe(
      count => {
        this.unreadCount = count;
      }
    );
    this.subscriptions.push(unreadCountSub);

    // Fallback: Subscribe to notification service unread count (for initial load)
    const fallbackSub = this.notificationService.unreadCount$.subscribe(
      count => {
        if (this.unreadCount === 0) {
          this.unreadCount = count;
        }
      }
    );
    this.subscriptions.push(fallbackSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.webSocketService.disconnect();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotificationsByRecipient(this.recipientId).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.toastr.error('Failed to load notifications');
        this.loading = false;
      }
    });
  }

  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (notification.isRead) {
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.webSocketService.updateUnreadCount(this.unreadCount);
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) {
      return;
    }

    this.notificationService.markAllAsRead(this.recipientId).subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
        this.webSocketService.updateUnreadCount(0);
        this.toastr.success('All notifications marked as read');
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
        this.toastr.error('Failed to mark all as read');
      }
    });
  }

  onNotificationClick(notification: Notification): void {
    this.markAsRead(notification);
    
    // Navigate based on notification type
    if (notification.relatedEntityType === 'TICKET' && notification.relatedEntityId) {
      this.router.navigate(['/ticket-management']);
      this.isOpen = false;
    }
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        if (!notification.isRead) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.webSocketService.updateUnreadCount(this.unreadCount);
        }
        this.toastr.success('Notification deleted');
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
        this.toastr.error('Failed to delete notification');
      }
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'TICKET_CREATED':
        return '🎫';
      case 'TICKET_UPDATED':
        return '📝';
      case 'TICKET_ASSIGNED':
        return '👤';
      case 'TICKET_RESOLVED':
        return '✅';
      case 'TICKET_CLOSED':
        return '🔒';
      case 'SYSTEM_ALERT':
        return '⚠️';
      default:
        return '🔔';
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const seconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return notificationDate.toLocaleDateString();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}

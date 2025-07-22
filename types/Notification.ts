export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'expiration' | 'shopping' | 'recipe' | 'general';
  priority: 'low' | 'normal' | 'high';
  scheduledFor: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

export interface PushNotificationData {
  itemId?: string;
  itemName?: string;
  daysUntilExpiry?: number;
  type: 'expiration' | 'shopping' | 'recipe' | 'general';
}
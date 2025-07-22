import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { AppNotification, PushNotificationData } from '@/types/Notification';
import { PantryDatabase } from '@/database/PantryDatabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_NOTIFICATION_TASK = 'background-notification';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true, 
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationServiceClass {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        // Don't throw an error, just warn. This prevents crashes in environments
        // where permissions are denied by default (e.g., web).
        console.warn('Permission not granted for notifications. Some features may be disabled.');
        return;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('expiration-alerts', {
          name: 'Expiration Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  async scheduleExpirationAlert(itemId: string, itemName: string, expiryDate: string): Promise<void> {
    try {
      const expiry = new Date(expiryDate);
      const now = new Date();
      
      // Schedule notification 1 day before expiry
      const alertDate = new Date(expiry);
      alertDate.setDate(alertDate.getDate() - 1);

      if (alertDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⚠️ Item Expiring Soon',
            body: `${itemName} expires tomorrow!`,
            data: {
              itemId,
              itemName,
              type: 'expiration',
            } as Record<string, unknown> & PushNotificationData,
          },
          trigger: {
            date: alertDate,
            type: Notifications.SchedulableTriggerInputTypes.DATE,
          },
        });
      }

      // Schedule notification on expiry day
      if (expiry > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🚨 Item Expired',
            body: `${itemName} has expired today`,
            data: {
              itemId,
              itemName,
              type: 'expiration',
            } as Record<string, unknown> & PushNotificationData,
          },
          trigger: {
            date: expiry,
            type: Notifications.SchedulableTriggerInputTypes.DATE,
          },
        });
      }
    } catch (error) {
      console.error('Failed to schedule expiration alert:', error);
    }
  }

  async cancelItemNotifications(itemId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const itemNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.itemId === itemId
      );

      for (const notification of itemNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('Failed to cancel item notifications:', error);
    }
  }

  async scheduleWeeklyReport(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Weekly Pantry Report',
          body: 'Check your pantry analytics and see how you\'re doing!',
          data: { type: 'general' } as Record<string, unknown> & PushNotificationData,
        },
        trigger: {
          weekday: 1, // Monday
          hour: 9,
          minute: 0,
          repeats: true,
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        },
      });
    } catch (error) {
      console.error('Failed to schedule weekly report:', error);
    }
  }

  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  async checkExpiringItems(): Promise<void> {
    try {
      const expiringItems = await PantryDatabase.getExpiringItems(3);
      
      if (expiringItems.length > 0) {
        await this.sendLocalNotification(
          `${expiringItems.length} items expiring soon`,
          `Check your pantry to avoid food waste!`,
          { type: 'expiration' }
        );
      }
    } catch (error) {
      console.error('Failed to check expiring items:', error);
    }
  }
}

// Background task for checking expiring items
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    const notificationService = new NotificationServiceClass();
    await notificationService.checkExpiringItems();
    return { success: true };
  } catch (error) {
    console.error('Background notification task failed:', error);
    return { success: false };
  }
});

export const NotificationService = new NotificationServiceClass();

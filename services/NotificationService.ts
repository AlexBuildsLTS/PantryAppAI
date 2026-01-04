/**
 * @module NotificationService
 * Cloud-aware notification manager for food safety alerts.
 * Orchestrates local push notifications based on real-time Supabase inventory.
 */
/**
 * @module NotificationService
 * Cloud-aware notification manager for food safety alerts.
 * Orchestrates local push notifications based on real-time Supabase inventory.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// FIXED: Added missing required properties for NotificationBehavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // Required for iOS/Android consistency
    shouldShowList: true,   // Required for the notification tray
  }),
});

class NotificationServiceClass {
  /**
   * Enterprise Pattern: Requests permissions and sets up Android channels.
   */
  async initialize() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('expiry-alerts', {
        name: 'Expiry Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22C55E',
      });
    }
    return true;
  }

  /**
   * Syncs upcoming expiration dates from Supabase to local device alerts.
   * This ensures the user is warned even if the app is closed.
   */
  async syncAlertsFromCloud(userId: string) {
    try {
      // 1. Flush existing notifications to avoid duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      // 2. Fetch items expiring in the next 72 hours
      const { data: items } = await supabase
        .from('pantry_items')
        .select('name, expiry_date')
        .eq('added_by', userId)
        .lte(
          'expiry_date',
          new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
        );

      if (!items) return;

      // 3. Schedule alerts using the device's local notification engine
      for (const item of items) {
        if (!item.expiry_date) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🥬 Food Expiration Alert',
            body: `Your "${item.name}" is expiring soon! Check your recipes to use it now.`,
          },
          trigger: {
            // Schedule for 9 AM on the day of expiry
            date: new Date(new Date(item.expiry_date).setHours(9, 0, 0, 0)),
            type: 'date',
          } as any,
        });
      }
    } catch (err) {
      console.error('[Notification Sync Error]:', err);
    }
  }
}

export const NotificationService = new NotificationServiceClass();

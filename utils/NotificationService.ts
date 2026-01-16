/**
 * @file NotificationService.ts
 * @description Enterprise Push Registration.
 * Fixed: Explicit property casting and module resolution.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export class NotificationService {
  /**
   * Requests permission and registers device for cloud messaging.
   */
  static async registerForPushNotifications(userId: string) {
    // 1. Safety check for simulators
    if (!Device.isDevice) {
      console.warn('[Push] Registration skipped: Physical device required.');
      return null;
    }

    // 2. Permission Workflow
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    // 3. Token Generation
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Get this from your app.json
      })
    ).data;

    // 4. Persistence to Cloud
    // 'as any' is used to bridge the gap if the local Supabase types
    // haven't been regenerated after adding the push_token column.
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token } as any)
      .eq('id', userId);

    if (error) console.error('[Push] Persistence Error:', error);

    // 5. Android Specific Channel Setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }
}

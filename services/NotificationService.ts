/**
 * @file NotificationService.ts
 * @description Enterprise Push Registration and Management.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export class NotificationService {
  /**
   * Registers device for push notifications and persists token to user profile.
   */
  static async registerForPushNotifications(userId: string) {
    if (!Device.isDevice) {
      console.warn('[Push] Hardware required for registration.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data;

    // Update profile with new token
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token } as any)
      .eq('id', userId);

    if (error) console.error('[Push] Persistence Error:', error.message);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
      });
    }

    return token;
  }
}
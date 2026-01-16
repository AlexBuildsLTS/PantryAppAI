/**
 * @file NotificationService.ts
 * @description Enterprise Push Notification Registration Service.
 * Handles push token registration, permissions, and device-specific setups.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { TablesUpdate } from '../types/database.types';

/**
 * Service for managing push notification registrations and configurations.
 */
export class NotificationService {
  /**
   * Expo project ID retrieved from app configuration.
   * Falls back to environment variable if not found in manifest.
   */
  private static readonly EXPO_PROJECT_ID =
    Constants.expoConfig?.extra?.eas?.projectId ||
    process.env.EXPO_PUBLIC_PROJECT_ID ||
    'your-expo-project-id'; // Replace with actual default if needed

  /**
   * Android notification channel configuration.
   */
  private static readonly ANDROID_CHANNEL_CONFIG = {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  };

  /**
   * Registers the device for push notifications.
   * Checks for existing token first to avoid unnecessary operations.
   *
   * @param userId - The user's unique identifier.
   * @returns The push token if successfully registered, null otherwise.
   * @throws Error if critical registration steps fail.
   */
  static async registerForPushNotifications(userId: string): Promise<string | null> {
    try {
      // Validate input
      if (!userId || typeof userId !== 'string') {
        console.error('[NotificationService] Invalid userId provided');
        return null;
      }

      // Check if token already exists
      const existingToken = await this.getExistingPushToken(userId);
      if (existingToken) {
        console.log('[NotificationService] Push token already registered');
        return existingToken;
      }

      // Ensure running on physical device
      if (!this.isPhysicalDevice()) {
        console.warn('[NotificationService] Registration skipped: Physical device required');
        return null;
      }

      // Request notification permissions
      const hasPermission = await this.requestNotificationPermissions();
      if (!hasPermission) {
        console.warn('[NotificationService] Push permission denied');
        return null;
      }

      // Generate and retrieve push token
      const token = await this.getPushToken();
      if (!token) {
        console.error('[NotificationService] Failed to obtain push token');
        return null;
      }

      // Persist token to database
      const saveSuccess = await this.savePushToken(userId, token);
      if (!saveSuccess) {
        console.error('[NotificationService] Failed to save push token to database');
        return null;
      }

      // Setup platform-specific configurations
      await this.setupPlatformSpecifics();

      console.log('[NotificationService] Push notification registration completed successfully');
      return token;
    } catch (error) {
      console.error('[NotificationService] Registration failed:', error);
      throw new Error(`Push notification registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks if the current device is a physical device.
   *
   * @returns True if running on a physical device.
   */
  private static isPhysicalDevice(): boolean {
    return Device.isDevice;
  }

  /**
   * Requests notification permissions from the user.
   *
   * @returns True if permissions are granted.
   */
  private static async requestNotificationPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('[NotificationService] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Retrieves the Expo push token for the device.
   *
   * @returns The push token string or null if failed.
   */
  private static async getPushToken(): Promise<string | null> {
    try {
      const { data } = await Notifications.getExpoPushTokenAsync({
        projectId: this.EXPO_PROJECT_ID,
      });
      return data;
    } catch (error) {
      console.error('[NotificationService] Error getting push token:', error);
      return null;
    }
  }

  /**
   * Saves the push token to the user's profile in the database.
   *
   * @param userId - The user's ID.
   * @param token - The push token to save.
   * @returns True if successfully saved.
   */
  private static async savePushToken(userId: string, token: string): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ push_token: token })
        .eq('id', userId);

      if (error) {
        console.error('[NotificationService] Database update error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('[NotificationService] Error saving push token:', error);
      return false;
    }
  }

  /**
   * Retrieves the existing push token for a user if available.
   *
   * @param userId - The user's ID.
   * @returns The existing push token or null.
   */
  private static async getExistingPushToken(userId: string): Promise<string | null> {
    try {
      const { data, error } = await (supabase
        .from('profiles') as any)
        .select('push_token')
        .eq('id', userId)
        .single();

      if (error || !data?.push_token) {
        return null;
      }
      return data.push_token;
    } catch (error) {
      console.error('[NotificationService] Error checking existing token:', error);
      return null;
    }
  }

  /**
   * Sets up platform-specific notification configurations.
   */
  private static async setupPlatformSpecifics(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', this.ANDROID_CHANNEL_CONFIG);
        console.log('[NotificationService] Android notification channel configured');
      } catch (error) {
        console.error('[NotificationService] Failed to set Android channel:', error);
      }
    }
    // Add iOS specific setups here if needed
  }
}


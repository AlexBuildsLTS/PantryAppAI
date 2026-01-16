/**
 * @file BiometricService.ts
 * @description Enterprise Biometric challenge orchestrator.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { Alert, Platform } from 'react-native';

export class BiometricService {
  static async authenticate(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: Platform.OS === 'ios' ? 'Unlock Pantry Pal' : 'Authenticate to continue',
        disableDeviceFallback: false,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[BiometricService] Critical Error:', error);
      return false;
    }
  }
}
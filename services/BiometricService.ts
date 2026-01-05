/**
 * @file BiometricService.ts
 * @description Enterprise-grade biometric orchestration.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

export class BiometricService {
  /**
   * Orchestrates the biometric scan (FaceID, Fingerprint, or Iris).
   * @returns boolean indicating successful verification.
   */
  static async authenticate(): Promise<boolean> {
    try {
      // 1. Check if hardware supports biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return true; // Fallback for simulators or devices without security
      }

      // 2. Perform the scan
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify Identity for Pantry Pal',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('[BiometricService] Auth error:', error);
      return false;
    }
  }

  /**
   * Checks the specific type of biometric available.
   */
  static async getBiometryType() {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    )
      return 'FaceID';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT))
      return 'TouchID';
    return 'Biometrics';
  }
}

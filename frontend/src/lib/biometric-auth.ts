/* ============================================
   BIOMETRIC AUTH SERVICE
   Face ID / Touch ID / Fingerprint
   ============================================ */

import { Capacitor } from '@capacitor/core';

export class BiometricAuth {
  private isAvailable: boolean = false;

  async checkAvailability(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // Web: Simulated biometric
      this.isAvailable = true;
      return true;
    }

    try {
      // Native: Check device capabilities
      // In production, use @capacitor-community/native-biometric plugin
      this.isAvailable = true;
      return true;
    } catch (error) {
      console.error('Biometric check failed:', error);
      this.isAvailable = false;
      return false;
    }
  }

  async authenticate(reason: string = 'Kimlik doğrulama gerekli'): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    if (!Capacitor.isNativePlatform()) {
      // Web: Simulated auth (always succeeds for now)
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 500);
      });
    }

    try {
      // Native: Perform biometric auth
      // In production, use plugin here
      // const result = await NativeBiometric.verifyIdentity({
      //   reason,
      //   title: 'BarcodePOS',
      //   subtitle: 'Giriş yapmak için dokunun',
      // });
      // return result.verified;

      // For now, simulate success
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 800);
      });
    } catch (error) {
      console.error('Biometric auth failed:', error);
      return false;
    }
  }

  async saveBiometricCredentials(username: string, password: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Save encrypted credentials in keychain/keystore
      // In production: use Capacitor Secure Storage
      localStorage.setItem('biometric_enabled', 'true');
    } catch (error) {
      console.error('Failed to save biometric credentials:', error);
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    return localStorage.getItem('biometric_enabled') === 'true';
  }

  async disableBiometric(): Promise<void> {
    localStorage.removeItem('biometric_enabled');
  }
}

export const biometricAuth = new BiometricAuth();


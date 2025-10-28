/* ============================================
   BIOMETRIC AUTH SERVICE
   Face ID / Touch ID / Fingerprint
   Simulated for now (plugin not available)
   ============================================ */

import { Capacitor } from '@capacitor/core';

export class BiometricAuth {
  private isAvailable: boolean = false;

  async checkAvailability(): Promise<boolean> {
    // Simulated - always available
    this.isAvailable = true;
    return true;
  }

  async authenticate(reason: string = 'Kimlik doğrulama gerekli'): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    // Simulated auth (always succeeds after delay)
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 800);
    });
  }

  getBiometryType(): string {
    return 'Fingerprint (Simulated)';
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


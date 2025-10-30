// Biometric auth temporarily disabled for web build

export const biometricHelper = {
  async isAvailable(): Promise<boolean> {
    return false;
  },

  async authenticate(title: string = 'Girş İstemi'): Promise<boolean> {
    return false;
  },
};


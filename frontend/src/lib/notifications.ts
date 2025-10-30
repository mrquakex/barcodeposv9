// Push notifications temporarily disabled for web build

export const notificationHelper = {
  async requestPermission(): Promise<boolean> {
    return false;
  },

  async registerListeners() {
    // No-op for web build
  },
};


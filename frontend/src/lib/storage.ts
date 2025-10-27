/**
 * Local Storage with Version Control
 * Prevents old data from breaking the app after schema changes
 */

const STORAGE_VERSION = '1.0.0';
const VERSION_KEY = 'app_storage_version';

export const storage = {
  /**
   * Get item with version check
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const version = localStorage.getItem(VERSION_KEY);
      
      // If version mismatch, clear storage
      if (version !== STORAGE_VERSION) {
        console.warn(`Storage version mismatch. Clearing old data. Old: ${version}, New: ${STORAGE_VERSION}`);
        this.clearAll();
        localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
        return defaultValue || null;
      }

      const item = localStorage.getItem(key);
      if (!item) return defaultValue || null;

      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return defaultValue || null;
    }
  },

  /**
   * Set item
   */
  setItem(key: string, value: any): void {
    try {
      // Set version on first use
      const version = localStorage.getItem(VERSION_KEY);
      if (!version) {
        localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
      }

      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
    }
  },

  /**
   * Remove item
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
    }
  },

  /**
   * Clear all storage (except version)
   */
  clearAll(): void {
    try {
      const version = localStorage.getItem(VERSION_KEY);
      localStorage.clear();
      if (version) {
        localStorage.setItem(VERSION_KEY, version);
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },
};

export default storage;


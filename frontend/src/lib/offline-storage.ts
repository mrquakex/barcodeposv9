/* ============================================
   OFFLINE STORAGE SERVICE
   LocalStorage + IndexedDB for offline functionality
   ============================================ */

interface OfflineCart {
  id: string;
  items: any[];
  total: number;
  timestamp: number;
  synced: boolean;
}

interface OfflineProduct {
  id: string;
  barcode: string;
  name: string;
  sellPrice: number;
  stock: number;
  taxRate: number;
  lastUpdated: number;
}

class OfflineStorage {
  private readonly CART_KEY = 'offline_carts';
  private readonly PRODUCTS_KEY = 'offline_products';
  private readonly LAST_SYNC_KEY = 'last_sync_time';

  // 🛒 Save cart offline
  saveCart(cart: any[]): string {
    try {
      const carts = this.getAllCarts();
      const cartId = `cart_${Date.now()}`;
      
      const offlineCart: OfflineCart = {
        id: cartId,
        items: cart,
        total: cart.reduce((sum, item) => sum + item.total, 0),
        timestamp: Date.now(),
        synced: false,
      };

      carts.push(offlineCart);
      localStorage.setItem(this.CART_KEY, JSON.stringify(carts));
      
      return cartId;
    } catch (error) {
      console.error('Failed to save offline cart:', error);
      return '';
    }
  }

  // 📦 Get all offline carts
  getAllCarts(): OfflineCart[] {
    try {
      const data = localStorage.getItem(this.CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load offline carts:', error);
      return [];
    }
  }

  // ✅ Mark cart as synced
  markCartSynced(cartId: string): void {
    try {
      const carts = this.getAllCarts();
      const updated = carts.map(cart => 
        cart.id === cartId ? { ...cart, synced: true } : cart
      );
      localStorage.setItem(this.CART_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to mark cart synced:', error);
    }
  }

  // 🗑️ Delete synced carts
  deleteSyncedCarts(): void {
    try {
      const carts = this.getAllCarts();
      const unsynced = carts.filter(cart => !cart.synced);
      localStorage.setItem(this.CART_KEY, JSON.stringify(unsynced));
    } catch (error) {
      console.error('Failed to delete synced carts:', error);
    }
  }

  // 📦 Cache products
  cacheProducts(products: OfflineProduct[]): void {
    try {
      const cachedProducts: { [key: string]: OfflineProduct } = {};
      
      products.forEach(product => {
        cachedProducts[product.barcode] = {
          ...product,
          lastUpdated: Date.now(),
        };
      });

      localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(cachedProducts));
      this.setLastSyncTime();
    } catch (error) {
      console.error('Failed to cache products:', error);
    }
  }

  // 🔍 Get product by barcode (offline)
  getProductByBarcode(barcode: string): OfflineProduct | null {
    try {
      const data = localStorage.getItem(this.PRODUCTS_KEY);
      if (!data) return null;

      const products: { [key: string]: OfflineProduct } = JSON.parse(data);
      return products[barcode] || null;
    } catch (error) {
      console.error('Failed to get offline product:', error);
      return null;
    }
  }

  // 📋 Get all cached products
  getAllProducts(): OfflineProduct[] {
    try {
      const data = localStorage.getItem(this.PRODUCTS_KEY);
      if (!data) return [];

      const products: { [key: string]: OfflineProduct } = JSON.parse(data);
      return Object.values(products);
    } catch (error) {
      console.error('Failed to get all products:', error);
      return [];
    }
  }

  // ⏰ Set last sync time
  private setLastSyncTime(): void {
    localStorage.setItem(this.LAST_SYNC_KEY, String(Date.now()));
  }

  // ⏰ Get last sync time
  getLastSyncTime(): number {
    const time = localStorage.getItem(this.LAST_SYNC_KEY);
    return time ? parseInt(time, 10) : 0;
  }

  // 📡 Check if online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // 🧹 Clear all offline data
  clearAll(): void {
    localStorage.removeItem(this.CART_KEY);
    localStorage.removeItem(this.PRODUCTS_KEY);
    localStorage.removeItem(this.LAST_SYNC_KEY);
  }
}

export const offlineStorage = new OfflineStorage();


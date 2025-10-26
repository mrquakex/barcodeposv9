import NodeCache from 'node-cache';

// In-memory cache (Redis gibi kullanılabilir)
// Production'da Redis entegrasyonu için ioredis kullanılabilir

class CacheService {
  private cache: NodeCache;
  
  constructor() {
    // 1 saat default TTL
    this.cache = new NodeCache({ 
      stdTTL: 3600,
      checkperiod: 120,
      useClones: false 
    });
  }

  /**
   * Cache'e veri ekle
   */
  set(key: string, value: any, ttl?: number): boolean {
    try {
      return this.cache.set(key, value, ttl || 3600);
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Cache'den veri oku
   */
  get<T>(key: string): T | undefined {
    try {
      return this.cache.get<T>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return undefined;
    }
  }

  /**
   * Cache'den veri sil
   */
  del(key: string): number {
    try {
      return this.cache.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
      return 0;
    }
  }

  /**
   * Belirli pattern'e uyan tüm key'leri sil
   */
  delByPattern(pattern: string): void {
    try {
      const keys = this.cache.keys();
      const matchingKeys = keys.filter(key => key.includes(pattern));
      matchingKeys.forEach(key => this.cache.del(key));
    } catch (error) {
      console.error('Cache delByPattern error:', error);
    }
  }

  /**
   * Tüm cache'i temizle
   */
  flush(): void {
    try {
      this.cache.flushAll();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  /**
   * Cache istatistikleri
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Memoization wrapper - fonksiyon sonuçlarını cache'le
   */
  async memoize<T>(
    key: string, 
    fn: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }
}

// Singleton instance
export const cacheService = new CacheService();



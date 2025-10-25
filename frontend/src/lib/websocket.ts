import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

class WebSocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * WebSocket bağlantısını başlat
   */
  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io('http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      toast.success('Real-time bağlantı kuruldu', { duration: 2000 });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      toast.error('Bağlantı hatası');
    });

    // Notification handler
    this.socket.on('notification', (data: any) => {
      const { type, title, message } = data;
      
      switch (type) {
        case 'success':
          toast.success(message, { duration: 3000 });
          break;
        case 'error':
          toast.error(message, { duration: 4000 });
          break;
        case 'warning':
          toast(message, { icon: '⚠️', duration: 4000 });
          break;
        case 'info':
          toast(message, { icon: 'ℹ️', duration: 3000 });
          break;
      }
    });

    // Register global listeners
    this.setupGlobalListeners();
  }

  /**
   * WebSocket bağlantısını kes
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Event dinleyici ekle
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Socket'e de listener ekle
    this.socket?.on(event, (data: any) => {
      this.listeners.get(event)?.forEach((cb) => cb(data));
    });
  }

  /**
   * Event dinleyiciyi kaldır
   */
  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.socket?.off(event);
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Event emit et
   */
  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  /**
   * Global event listener'ları ayarla
   */
  private setupGlobalListeners() {
    // Yeni satış bildirimi
    this.socket?.on('sale:new', (data: any) => {
      toast.success(`Yeni satış: ${data.total.toFixed(2)} ₺`, {
        duration: 3000,
        icon: '💰',
      });
    });

    // Düşük stok uyarısı
    this.socket?.on('stock:low', (data: any) => {
      toast.error(`Düşük Stok: ${data.name} (${data.stock} adet)`, {
        duration: 5000,
        icon: '📦',
      });
    });

    // Yeni sipariş bildirimi
    this.socket?.on('order:new', (data: any) => {
      toast(`Yeni Sipariş: ${data.supplier}`, {
        duration: 3000,
        icon: '🚚',
      });
    });

    // Dashboard güncellemeleri
    this.socket?.on('dashboard:update', (data: any) => {
      // Dashboard store'u güncellenebilir
      window.dispatchEvent(new CustomEvent('dashboard:update', { detail: data }));
    });
  }

  /**
   * Bağlantı durumunu kontrol et
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const websocketManager = new WebSocketManager();


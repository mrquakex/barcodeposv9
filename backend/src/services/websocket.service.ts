import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
}

class WebSocketService {
  private io: SocketIOServer | null = null;

  /**
   * WebSocket sunucusunu başlat
   */
  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
    });

    // JWT Authentication Middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`✅ Client connected: ${socket.id} (User: ${socket.userId})`);

      // User'ı kendi odasına ekle (private notifications için)
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
      }

      // Role bazlı odalara katıl
      if (socket.userRole) {
        socket.join(`role:${socket.userRole}`);
      }

      // Ping-Pong için heartbeat
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });

    console.log('🔌 WebSocket Server initialized');
  }

  /**
   * Belirli bir kullanıcıya mesaj gönder
   */
  emitToUser(userId: number, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Belirli bir role sahip kullanıcılara mesaj gönder
   */
  emitToRole(role: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`role:${role}`).emit(event, data);
  }

  /**
   * Tüm bağlı kullanıcılara mesaj gönder (broadcast)
   */
  broadcast(event: string, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  /**
   * Satış bildirimi gönder
   */
  notifySale(sale: any) {
    this.broadcast('sale:new', {
      id: sale.id,
      total: sale.total,
      timestamp: new Date(),
    });
  }

  /**
   * Düşük stok uyarısı gönder
   */
  notifyLowStock(product: any) {
    this.emitToRole('admin', 'stock:low', {
      productId: product.id,
      name: product.name,
      stock: product.stock,
      minStock: product.minStock,
    });
  }

  /**
   * Yeni sipariş bildirimi
   */
  notifyNewOrder(order: any) {
    this.emitToRole('admin', 'order:new', {
      orderId: order.id,
      supplier: order.supplier?.name,
      total: order.totalAmount,
    });
  }

  /**
   * Genel bildirim gönder
   */
  sendNotification(userId: number | 'all', notification: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }) {
    if (userId === 'all') {
      this.broadcast('notification', notification);
    } else {
      this.emitToUser(userId, 'notification', notification);
    }
  }

  /**
   * Dashboard istatistiklerini güncelle
   */
  updateDashboardStats(stats: any) {
    this.broadcast('dashboard:update', stats);
  }
}

// Singleton instance
export const websocketService = new WebSocketService();



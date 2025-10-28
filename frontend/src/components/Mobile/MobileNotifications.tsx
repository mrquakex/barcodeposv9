import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bell, TrendingUp, TrendingDown, Package, 
  AlertTriangle, Info, CheckCircle, X 
} from 'lucide-react';
import { soundEffects } from '../../lib/sound-effects';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'price_increase' | 'price_decrease' | 'low_stock' | 'info';
  title: string;
  message: string;
  productName?: string;
  currentPrice?: number;
  marketPrice?: number;
  stock?: number;
  timestamp: Date;
  read: boolean;
}

const MobileNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // MOCK DATA - Backend'den gelecek
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'price_increase',
        title: 'Fiyat Artışı Tespit Edildi',
        message: 'Ürününüzün piyasa fiyatı arttı',
        productName: 'Coca Cola 330ml',
        currentPrice: 30,
        marketPrice: 35,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 dk önce
        read: false,
      },
      {
        id: '2',
        type: 'low_stock',
        title: 'Stok Uyarısı',
        message: 'Ürün stoku kritik seviyede',
        productName: 'Fanta 330ml',
        stock: 3,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 saat önce
        read: false,
      },
      {
        id: '3',
        type: 'price_decrease',
        title: 'Fiyat Düşüşü',
        message: 'Piyasa fiyatı düştü, fiyatınızı gözden geçirin',
        productName: 'Sprite 330ml',
        currentPrice: 28,
        marketPrice: 25,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 saat önce
        read: true,
      },
      {
        id: '4',
        type: 'info',
        title: 'Sistem Bildirimi',
        message: 'Yeni özellikler eklendi! Keşfetmek için güncelleyin.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 gün önce
        read: true,
      },
    ];
    setNotifications(mockNotifications);
  }, []);

  const handleUpdatePrice = (notification: Notification) => {
    soundEffects.cashRegister();
    toast.success(`${notification.productName} fiyatı güncelleniyor...`);
    // Backend API call yapılacak
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    soundEffects.tap();
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    soundEffects.tap();
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'price_increase':
        return <TrendingUp className="w-6 h-6" />;
      case 'price_decrease':
        return <TrendingDown className="w-6 h-6" />;
      case 'low_stock':
        return <AlertTriangle className="w-6 h-6" />;
      case 'info':
        return <Info className="w-6 h-6" />;
    }
  };

  const getNotificationGradient = (type: Notification['type']) => {
    switch (type) {
      case 'price_increase':
        return 'linear-gradient(135deg, #10B981 0%, #34D399 100%)';
      case 'price_decrease':
        return 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)';
      case 'low_stock':
        return 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)';
      case 'info':
        return 'linear-gradient(135deg, #3F8EFC 0%, #74C0FC 100%)';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="mobile-app-wrapper">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
        padding: '16px',
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-lg bg-white/20"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Bildirimler</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-white/90">{unreadCount} okunmamış</p>
          )}
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Bell className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Notifications List */}
      <div className="p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Bildirim yok
            </h3>
            <p className="text-foreground-secondary">
              Henüz bildiriminiz bulunmuyor
            </p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              style={{
                background: notification.read 
                  ? 'rgba(255, 255, 255, 0.5)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '16px',
                border: notification.read 
                  ? '1px solid rgba(0, 0, 0, 0.05)' 
                  : '1px solid rgba(236, 72, 153, 0.2)',
                boxShadow: notification.read 
                  ? '0 2px 8px rgba(0, 0, 0, 0.05)' 
                  : '0 4px 16px rgba(236, 72, 153, 0.15)',
              }}
              onClick={() => !notification.read && handleMarkAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: getNotificationGradient(notification.type),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-foreground">
                      {notification.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-foreground-secondary mb-2">
                    {notification.message}
                  </p>

                  {/* Product Info */}
                  {notification.productName && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 mb-2">
                      <p className="text-sm font-medium text-foreground mb-1">
                        📦 {notification.productName}
                      </p>
                      
                      {notification.currentPrice && notification.marketPrice && (
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-foreground-secondary">Sizin Fiyat</p>
                            <p className="text-sm font-semibold text-foreground">
                              ₺{notification.currentPrice.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-foreground-secondary">Piyasa Fiyatı</p>
                            <p className="text-sm font-semibold" style={{
                              color: notification.marketPrice > notification.currentPrice ? '#10B981' : '#EF4444',
                            }}>
                              ₺{notification.marketPrice.toFixed(2)}
                              {notification.marketPrice > notification.currentPrice && ' 📈'}
                              {notification.marketPrice < notification.currentPrice && ' 📉'}
                            </p>
                          </div>
                        </div>
                      )}

                      {notification.stock !== undefined && (
                        <p className="text-sm">
                          <span className="text-foreground-secondary">Kalan Stok: </span>
                          <span className="font-semibold text-red-500">
                            {notification.stock} ⚠️
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {notification.type === 'price_increase' && notification.marketPrice && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdatePrice(notification);
                      }}
                      className="w-full py-2 px-3 rounded-lg font-medium text-white text-sm"
                      style={{
                        background: 'linear-gradient(135deg, #3F8EFC 0%, #74C0FC 100%)',
                      }}
                    >
                      Fiyatı Güncelle: ₺{notification.marketPrice.toFixed(2)}
                    </button>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-foreground-tertiary mt-2">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileNotifications;


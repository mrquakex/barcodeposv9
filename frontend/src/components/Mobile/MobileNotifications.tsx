import React, { useState, useEffect } from 'react';
import { 
  Bell, TrendingUp, TrendingDown, Package, 
  AlertTriangle, Info, CheckCircle, X, Trash2
} from 'lucide-react';
import { soundEffects } from '../../lib/sound-effects';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  useEffect(() => {
    // Mock notifications
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'price_increase',
        title: 'Fiyat Artışı',
        message: 'Ürününüzün piyasa fiyatı arttı',
        productName: 'Coca Cola 330ml',
        currentPrice: 30,
        marketPrice: 35,
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: false,
      },
      {
        id: '2',
        type: 'low_stock',
        title: 'Stok Uyarısı',
        message: 'Ürün stoku kritik seviyede',
        productName: 'Fanta 330ml',
        stock: 3,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        read: false,
      },
      {
        id: '3',
        type: 'price_decrease',
        title: 'Fiyat Düşüşü',
        message: 'Ürününüzün piyasa fiyatı düştü',
        productName: 'Sprite 330ml',
        currentPrice: 28,
        marketPrice: 25,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
        read: true,
      },
      {
        id: '4',
        type: 'info',
        title: 'Sistem Bildirimi',
        message: 'Yeni güncelleme mevcut',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        read: true,
      },
    ];
    setNotifications(mockNotifications);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    hapticFeedback();
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast.success('Bildirim silindi');
    soundEffects.tap();
    hapticFeedback();
  };

  const clearAll = () => {
    if (confirm('Tüm bildirimleri silmek istediğinize emin misiniz?')) {
      setNotifications([]);
      toast.success('Tüm bildirimler silindi');
      soundEffects.tap();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'price_increase':
        return <TrendingUp className="w-5 h-5" />;
      case 'price_decrease':
        return <TrendingDown className="w-5 h-5" />;
      case 'low_stock':
        return <Package className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'price_increase':
        return 'icon-green';
      case 'price_decrease':
        return 'icon-red';
      case 'low_stock':
        return 'icon-orange';
      case 'info':
        return 'icon-blue';
      default:
        return 'icon-gray';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="mobile-notifications-pro">
      {/* Header */}
      <div className="notifications-header-pro">
        <div className="header-title-pro">
          <Bell className="w-6 h-6" />
          <h1>Bildirimler</h1>
          {unreadCount > 0 && (
            <span className="unread-badge-pro">{unreadCount}</span>
          )}
        </div>
        {notifications.length > 0 && (
          <button onClick={clearAll} className="clear-all-btn-pro">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs-pro">
        <button
          onClick={() => {
            setFilter('all');
            soundEffects.tap();
            hapticFeedback();
          }}
          className={`filter-tab-pro ${filter === 'all' ? 'active' : ''}`}
        >
          Tümü ({notifications.length})
        </button>
        <button
          onClick={() => {
            setFilter('unread');
            soundEffects.tap();
            hapticFeedback();
          }}
          className={`filter-tab-pro ${filter === 'unread' ? 'active' : ''}`}
        >
          Okunmamış ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="notifications-list-pro">
        {filteredNotifications.length === 0 ? (
          <div className="empty-notifications-pro">
            <Bell className="w-20 h-20 text-gray-300" />
            <h3>Bildirim Yok</h3>
            <p>Henüz hiç bildiriminiz bulunmuyor</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-card-pro ${!notif.read ? 'unread' : ''}`}
              onClick={() => !notif.read && markAsRead(notif.id)}
            >
              <div className={`notif-icon-pro ${getIconColor(notif.type)}`}>
                {getIcon(notif.type)}
              </div>
              <div className="notif-content-pro">
                <div className="notif-header-flex">
                  <h4 className="notif-title-pro">{notif.title}</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="delete-notif-btn-pro"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="notif-message-pro">{notif.message}</p>
                {notif.productName && (
                  <p className="notif-product-pro">{notif.productName}</p>
                )}
                {notif.currentPrice && notif.marketPrice && (
                  <div className="notif-prices-pro">
                    <span>Mevcut: ₺{notif.currentPrice}</span>
                    <span>Piyasa: ₺{notif.marketPrice}</span>
                  </div>
                )}
                {notif.stock !== undefined && (
                  <p className="notif-stock-pro">Stok: {notif.stock} adet</p>
                )}
                <p className="notif-time-pro">{formatTime(notif.timestamp)}</p>
              </div>
              {!notif.read && <div className="unread-indicator-pro" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileNotifications;

import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, Menu, Globe, AlertCircle, X, Clock, Search } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import FluentButton from '../fluent/FluentButton';
import FluentBadge from '../fluent/FluentBadge';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

/* ============================================
   FLUENT HEADER - Command Bar Style
   Desktop & Mobile Optimized
   ============================================ */

interface StockAlert {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  severity: 'critical' | 'low';
}

interface Notification {
  id: string;
  type: 'stock' | 'system';
  title: string;
  message: string;
  time: string;
  severity: 'critical' | 'low' | 'info';
}

interface FluentHeaderProps {
  onMobileMenuClick?: () => void;
}

const FluentHeader: React.FC<FluentHeaderProps> = ({ onMobileMenuClick }) => {
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // 📊 Fetch notifications on mount and every 5 minutes
  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      
      // Fetch stock alerts
      const response = await api.get('/products?isActive=true');
      const products = response.data.products || [];
      
      const stockAlerts: StockAlert[] = products
        .filter((p: any) => p.stock <= p.minStock)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          minStock: p.minStock,
          severity: p.stock === 0 ? 'critical' as const : 'low' as const,
        }))
        .slice(0, 10); // Max 10 notifications
      
      // Convert to notifications
      const notifs: Notification[] = stockAlerts.map(alert => ({
        id: alert.id,
        type: 'stock',
        title: alert.severity === 'critical' ? '🔴 Kritik Stok!' : '⚠️ Düşük Stok',
        message: `${alert.name} - Stok: ${alert.stock} (Min: ${alert.minStock})`,
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        severity: alert.severity,
      }));
      
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowLanguageMenu(false);
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6">
      {/* Left: Mobile menu */}
      <div className="flex items-center gap-4">
        {/* 📱 Mobile Hamburger Menu Button */}
        <button 
          onClick={onMobileMenuClick}
          className="md:hidden p-2 hover:bg-background-alt rounded transition-colors"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:block">
          <p className="fluent-body text-foreground-secondary">
            {new Date().toLocaleDateString('tr-TR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="p-2 hover:bg-background-alt rounded transition-colors"
            aria-label="Change language"
          >
            <Globe className="w-5 h-5 text-foreground-secondary" />
          </button>
          
          {showLanguageMenu && (
            <div className="absolute right-0 mt-2 w-32 bg-card border border-border rounded-md fluent-depth-16 z-[9999]">
              <div className="p-1">
                <button
                  onClick={() => changeLanguage('tr')}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-background-alt rounded fluent-body-small transition-colors",
                    i18n.language === 'tr' && "bg-primary/10 text-primary"
                  )}
                >
                  🇹🇷 Türkçe
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-background-alt rounded fluent-body-small transition-colors",
                    i18n.language === 'en' && "bg-primary/10 text-primary"
                  )}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => changeLanguage('ar')}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-background-alt rounded fluent-body-small transition-colors",
                    i18n.language === 'ar' && "bg-primary/10 text-primary"
                  )}
                >
                  🇸🇦 العربية
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-background-alt rounded transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-foreground-secondary" />
          ) : (
            <Moon className="w-5 h-5 text-foreground-secondary" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-background-alt rounded transition-colors relative"
            aria-label="Bildirimler"
          >
            <Bell className="w-5 h-5 text-foreground-secondary" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-background border border-border rounded-lg shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Bildirimler</h3>
                  {notifications.length > 0 && (
                    <FluentBadge appearance="error" size="small">{notifications.length}</FluentBadge>
                  )}
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-background-alt rounded transition-colors"
                  aria-label="Kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Content */}
              <div className="overflow-y-auto max-h-[400px]">
                {isLoadingNotifications ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-foreground-secondary">Yükleniyor...</p>
                    </div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-foreground-secondary/30" />
                    <p className="text-sm font-medium text-foreground mb-1">Bildirim Yok</p>
                    <p className="text-xs text-foreground-secondary">
                      Tüm sistemler normal çalışıyor
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className="p-4 hover:bg-background-alt transition-colors cursor-pointer"
                        onClick={() => {
                          navigate('/products');
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                            notif.severity === 'critical' 
                              ? 'bg-red-100 dark:bg-red-900/20' 
                              : 'bg-orange-100 dark:bg-orange-900/20'
                          }`}>
                            <AlertCircle className={`w-4 h-4 ${
                              notif.severity === 'critical' 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-orange-600 dark:text-orange-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground mb-1">
                              {notif.title}
                            </p>
                            <p className="text-xs text-foreground-secondary">
                              {notif.message}
                            </p>
                            <p className="text-xs text-foreground-secondary/60 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {notif.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              {notifications.length > 0 && (
                <div className="sticky bottom-0 bg-background border-t border-border px-4 py-2 flex gap-2">
                  <button 
                    className="flex-1 text-xs text-primary hover:underline text-center py-1"
                    onClick={() => {
                      navigate('/products');
                      setShowNotifications(false);
                    }}
                  >
                    Tümünü Görüntüle
                  </button>
                  <button 
                    className="flex-1 text-xs text-foreground-secondary hover:text-foreground text-center py-1"
                    onClick={clearNotifications}
                  >
                    Temizle
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-background-alt rounded transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="fluent-body-small font-medium text-foreground">{user?.name}</p>
              <p className="fluent-caption text-foreground-secondary">{user?.role}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md fluent-depth-16 z-[9999]">
              <div className="p-2">
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-destructive hover:bg-destructive/10 rounded fluent-body-small transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default FluentHeader;


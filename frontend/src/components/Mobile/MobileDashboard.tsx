import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Package, PlusCircle, Users, Building2, FileText,
  BarChart3, TrendingUp, PackageSearch, ClipboardList, DollarSign, 
  Receipt, UserCog, Grid3x3, Store, Coins, Bell, User, Sun, Moon,
  ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { soundEffects } from '../../lib/sound-effects';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface MenuButton {
  icon: React.ElementType;
  title: string;
  path: string;
}

const MobileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  const handleNavigation = async (path: string) => {
    navigate(path);
    soundEffects.tap();
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  // 🎨 18 CLEAN BUTTONS - Minimalist Design
  const menuButtons: MenuButton[] = [
    { icon: ShoppingCart, title: 'Satış Yap', path: '/pos' },
    { icon: Package, title: 'Ürünler', path: '/products' },
    { icon: PlusCircle, title: 'Ürün Ekle', path: '/products/add' },
    { icon: Users, title: 'Müşteriler', path: '/customers' },
    { icon: Building2, title: 'Firmalar', path: '/suppliers' },
    { icon: FileText, title: 'Alış Faturaları', path: '/purchase-orders' },
    { icon: BarChart3, title: 'Satış Raporu', path: '/reports/sales' },
    { icon: TrendingUp, title: 'Ürünsel Rapor', path: '/reports/products' },
    { icon: PackageSearch, title: 'Grupsal Rapor', path: '/reports/groups' },
    { icon: ClipboardList, title: 'Stok Sayımı', path: '/stock-count' },
    { icon: ArrowUpCircle, title: 'Gelirler', path: '/income' },
    { icon: ArrowDownCircle, title: 'Giderler', path: '/expenses' },
    { icon: UserCog, title: 'Personeller', path: '/employees' },
    { icon: Grid3x3, title: 'Ürün Grupları', path: '/categories' },
    { icon: Store, title: 'Şubeler', path: '/branches' },
    { icon: Coins, title: 'Döviz Kurları', path: '/exchange-rates' },
    { icon: Bell, title: 'Bildirimler', path: '/notifications' },
    { icon: User, title: 'Profil', path: '/profile' },
  ];

  return (
    <div className="mobile-dashboard-clean">
      {/* Clean Header */}
      <div className="dashboard-header-clean">
        <div className="header-content">
          <div className="user-section">
            <div className="user-avatar-clean">
              <User className="w-6 h-6" />
            </div>
            <div className="user-info-clean">
              <p className="greeting-clean">{getGreeting()}</p>
              <p className="user-name-clean">{user?.name || 'Kullanıcı'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              toggleTheme();
              soundEffects.tap();
            }}
            className="theme-btn-clean"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Clock */}
        <div className="clock-clean">
          {currentTime.toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit'
          })}
        </div>

        {/* Stats */}
        <div className="stats-clean">
          <div className="stat-item-clean">
            <DollarSign className="w-4 h-4" />
            <div>
              <p className="stat-value-clean">₺24,850</p>
              <p className="stat-label-clean">Bugün</p>
            </div>
          </div>
          <div className="stat-item-clean">
            <ShoppingCart className="w-4 h-4" />
            <div>
              <p className="stat-value-clean">127</p>
              <p className="stat-label-clean">Satış</p>
            </div>
          </div>
          <div className="stat-item-clean">
            <Package className="w-4 h-4" />
            <div>
              <p className="stat-value-clean">1,245</p>
              <p className="stat-label-clean">Ürün</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Grid - Clean & Minimal */}
      <div className="menu-grid-clean">
        {menuButtons.map((button, index) => (
          <button
            key={index}
            className="menu-card-clean"
            onClick={() => handleNavigation(button.path)}
          >
            <button.icon className="w-6 h-6" />
            <p className="card-title-clean">{button.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileDashboard;

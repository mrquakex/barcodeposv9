import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Package, PlusCircle, Users, Building2, FileText,
  BarChart3, TrendingUp, PackageSearch, ClipboardList, DollarSign, 
  Receipt, UserCog, Grid3x3, Store, Coins, Bell, User, Sun, Moon,
  Sparkles, Zap, ArrowUpCircle, ArrowDownCircle
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
  gradient: string;
  color: string;
  shadowColor: string;
}

const MobileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  // 18 PREMIUM BUTTONS with unique 3D designs
  const menuButtons: MenuButton[] = [
    { 
      icon: ShoppingCart, 
      title: 'Satış Yap', 
      path: '/pos', 
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#667eea',
      shadowColor: 'rgba(102, 126, 234, 0.4)'
    },
    { 
      icon: Package, 
      title: 'Ürünler', 
      path: '/products', 
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: '#f093fb',
      shadowColor: 'rgba(240, 147, 251, 0.4)'
    },
    { 
      icon: PlusCircle, 
      title: 'Ürün Ekle', 
      path: '/products/add', 
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: '#4facfe',
      shadowColor: 'rgba(79, 172, 254, 0.4)'
    },
    { 
      icon: Users, 
      title: 'Müşteriler', 
      path: '/customers', 
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      color: '#43e97b',
      shadowColor: 'rgba(67, 233, 123, 0.4)'
    },
    { 
      icon: Building2, 
      title: 'Firmalar', 
      path: '/suppliers', 
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      color: '#fa709a',
      shadowColor: 'rgba(250, 112, 154, 0.4)'
    },
    { 
      icon: FileText, 
      title: 'Alış Faturaları', 
      path: '/purchase-orders', 
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      color: '#30cfd0',
      shadowColor: 'rgba(48, 207, 208, 0.4)'
    },
    { 
      icon: BarChart3, 
      title: 'Satış Raporu', 
      path: '/reports/sales', 
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      color: '#a8edea',
      shadowColor: 'rgba(168, 237, 234, 0.4)'
    },
    { 
      icon: TrendingUp, 
      title: 'Ürünsel Rapor', 
      path: '/reports/products', 
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      color: '#ff9a9e',
      shadowColor: 'rgba(255, 154, 158, 0.4)'
    },
    { 
      icon: PackageSearch, 
      title: 'Grupsal Rapor', 
      path: '/reports/groups', 
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      color: '#ffecd2',
      shadowColor: 'rgba(255, 236, 210, 0.4)'
    },
    { 
      icon: ClipboardList, 
      title: 'Stok Sayımı', 
      path: '/stock-count', 
      gradient: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
      color: '#ff6e7f',
      shadowColor: 'rgba(255, 110, 127, 0.4)'
    },
    { 
      icon: ArrowUpCircle, 
      title: 'Gelirler', 
      path: '/income', 
      gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
      color: '#e0c3fc',
      shadowColor: 'rgba(224, 195, 252, 0.4)'
    },
    { 
      icon: ArrowDownCircle, 
      title: 'Giderler', 
      path: '/expenses', 
      gradient: 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
      color: '#f77062',
      shadowColor: 'rgba(247, 112, 98, 0.4)'
    },
    { 
      icon: UserCog, 
      title: 'Personeller', 
      path: '/employees', 
      gradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
      color: '#c471f5',
      shadowColor: 'rgba(196, 113, 245, 0.4)'
    },
    { 
      icon: Grid3x3, 
      title: 'Ürün Grupları', 
      path: '/categories', 
      gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
      color: '#fbc2eb',
      shadowColor: 'rgba(251, 194, 235, 0.4)'
    },
    { 
      icon: Store, 
      title: 'Şubeler', 
      path: '/branches', 
      gradient: 'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
      color: '#fdcbf1',
      shadowColor: 'rgba(253, 203, 241, 0.4)'
    },
    { 
      icon: Coins, 
      title: 'Döviz Kurları', 
      path: '/exchange-rates', 
      gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
      color: '#a1c4fd',
      shadowColor: 'rgba(161, 196, 253, 0.4)'
    },
    { 
      icon: Bell, 
      title: 'Bildirimler', 
      path: '/notifications', 
      gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      color: '#d299c2',
      shadowColor: 'rgba(210, 153, 194, 0.4)'
    },
    { 
      icon: User, 
      title: 'Profil', 
      path: '/profile', 
      gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
      color: '#89f7fe',
      shadowColor: 'rgba(137, 247, 254, 0.4)'
    },
  ];

  return (
    <div className="ultra-premium-dashboard">
      {/* 🌌 ANIMATED BACKGROUND MESH */}
      <div className="dashboard-bg-mesh"></div>

      {/* ✨ PREMIUM HEADER with Glassmorphism */}
      <div className="premium-header">
        <div className="header-glass-card">
          <div className="user-avatar-3d">
            <div className="avatar-glow"></div>
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="user-info-premium">
            <h1 className="greeting-premium">{getGreeting()} ✨</h1>
            <p className="user-name-premium">{user?.name || 'Kullanıcı'}</p>
            <p className="company-badge">BarcodePOS Premium</p>
          </div>
          <button
            onClick={() => {
              toggleTheme();
              soundEffects.tap();
            }}
            className="theme-toggle-3d"
          >
            <div className="toggle-glow"></div>
            {theme === 'dark' ? (
              <Sun className="w-6 h-6 text-yellow-300" />
            ) : (
              <Moon className="w-6 h-6 text-indigo-600" />
            )}
          </button>
        </div>

        {/* 🕐 FLOATING CLOCK */}
        <div className="floating-clock">
          <div className="clock-glow"></div>
          <Sparkles className="w-4 h-4 text-white/80" />
          <span className="clock-time">
            {currentTime.toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
          <Zap className="w-4 h-4 text-yellow-300" />
        </div>

        {/* 📊 QUICK STATS (3D Floating Islands) */}
        <div className="stats-floating-islands">
          <div className="stat-island stat-island-1">
            <div className="island-glow"></div>
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <div className="stat-content">
              <p className="stat-value">₺24,850</p>
              <p className="stat-label">Bugün</p>
            </div>
          </div>
          <div className="stat-island stat-island-2">
            <div className="island-glow"></div>
            <ShoppingCart className="w-6 h-6 text-blue-400" />
            <div className="stat-content">
              <p className="stat-value">127</p>
              <p className="stat-label">Satış</p>
            </div>
          </div>
          <div className="stat-island stat-island-3">
            <div className="island-glow"></div>
            <Package className="w-6 h-6 text-purple-400" />
            <div className="stat-content">
              <p className="stat-value">1,245</p>
              <p className="stat-label">Ürün</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 PREMIUM MENU GRID (3D Glassmorphic Cards) */}
      <div className="premium-menu-grid">
        {menuButtons.map((button, index) => (
          <button
            key={index}
            className="menu-card-3d"
            onClick={() => handleNavigation(button.path)}
            style={{
              '--gradient': button.gradient,
              '--shadow-color': button.shadowColor,
              '--card-index': index,
            } as React.CSSProperties}
          >
            <div className="card-glass-layer"></div>
            <div className="card-glow-effect"></div>
            <div className="card-icon-container">
              <button.icon className="w-7 h-7 text-white" />
            </div>
            <p className="card-title">{button.title}</p>
            <div className="card-shine"></div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileDashboard;

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

  // 🎨 18 ULTRA PREMIUM BUTTONS - Luxury Color Palette
  const menuButtons: MenuButton[] = [
    { 
      icon: ShoppingCart, 
      title: 'Satış Yap', 
      path: '/pos', 
      gradient: 'linear-gradient(135deg, #6B46C1 0%, #9333EA 100%)',
      color: '#6B46C1',
      shadowColor: 'rgba(107, 70, 193, 0.5)'
    },
    { 
      icon: Package, 
      title: 'Ürünler', 
      path: '/products', 
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
      color: '#F59E0B',
      shadowColor: 'rgba(245, 158, 11, 0.5)'
    },
    { 
      icon: PlusCircle, 
      title: 'Ürün Ekle', 
      path: '/products/add', 
      gradient: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
      color: '#1E3A8A',
      shadowColor: 'rgba(30, 58, 138, 0.5)'
    },
    { 
      icon: Users, 
      title: 'Müşteriler', 
      path: '/customers', 
      gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      color: '#059669',
      shadowColor: 'rgba(5, 150, 105, 0.5)'
    },
    { 
      icon: Building2, 
      title: 'Firmalar', 
      path: '/suppliers', 
      gradient: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
      color: '#DC2626',
      shadowColor: 'rgba(220, 38, 38, 0.5)'
    },
    { 
      icon: FileText, 
      title: 'Alış Faturaları', 
      path: '/purchase-orders', 
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
      color: '#7C3AED',
      shadowColor: 'rgba(124, 58, 237, 0.5)'
    },
    { 
      icon: BarChart3, 
      title: 'Satış Raporu', 
      path: '/reports/sales', 
      gradient: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
      color: '#0891B2',
      shadowColor: 'rgba(8, 145, 178, 0.5)'
    },
    { 
      icon: TrendingUp, 
      title: 'Ürünsel Rapor', 
      path: '/reports/products', 
      gradient: 'linear-gradient(135deg, #DB2777 0%, #EC4899 100%)',
      color: '#DB2777',
      shadowColor: 'rgba(219, 39, 119, 0.5)'
    },
    { 
      icon: PackageSearch, 
      title: 'Grupsal Rapor', 
      path: '/reports/groups', 
      gradient: 'linear-gradient(135deg, #EA580C 0%, #FB923C 100%)',
      color: '#EA580C',
      shadowColor: 'rgba(234, 88, 12, 0.5)'
    },
    { 
      icon: ClipboardList, 
      title: 'Stok Sayımı', 
      path: '/stock-count', 
      gradient: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
      color: '#0D9488',
      shadowColor: 'rgba(13, 148, 136, 0.5)'
    },
    { 
      icon: ArrowUpCircle, 
      title: 'Gelirler', 
      path: '/income', 
      gradient: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
      color: '#16A34A',
      shadowColor: 'rgba(22, 163, 74, 0.5)'
    },
    { 
      icon: ArrowDownCircle, 
      title: 'Giderler', 
      path: '/expenses', 
      gradient: 'linear-gradient(135deg, #BE123C 0%, #F43F5E 100%)',
      color: '#BE123C',
      shadowColor: 'rgba(190, 18, 60, 0.5)'
    },
    { 
      icon: UserCog, 
      title: 'Personeller', 
      path: '/employees', 
      gradient: 'linear-gradient(135deg, #9333EA 0%, #C084FC 100%)',
      color: '#9333EA',
      shadowColor: 'rgba(147, 51, 234, 0.5)'
    },
    { 
      icon: Grid3x3, 
      title: 'Ürün Grupları', 
      path: '/categories', 
      gradient: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
      color: '#4F46E5',
      shadowColor: 'rgba(79, 70, 229, 0.5)'
    },
    { 
      icon: Store, 
      title: 'Şubeler', 
      path: '/branches', 
      gradient: 'linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)',
      color: '#B91C1C',
      shadowColor: 'rgba(185, 28, 28, 0.5)'
    },
    { 
      icon: Coins, 
      title: 'Döviz Kurları', 
      path: '/exchange-rates', 
      gradient: 'linear-gradient(135deg, #CA8A04 0%, #EAB308 100%)',
      color: '#CA8A04',
      shadowColor: 'rgba(202, 138, 4, 0.5)'
    },
    { 
      icon: Bell, 
      title: 'Bildirimler', 
      path: '/notifications', 
      gradient: 'linear-gradient(135deg, #C026D3 0%, #E879F9 100%)',
      color: '#C026D3',
      shadowColor: 'rgba(192, 38, 211, 0.5)'
    },
    { 
      icon: User, 
      title: 'Profil', 
      path: '/profile', 
      gradient: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
      color: '#0284C7',
      shadowColor: 'rgba(2, 132, 199, 0.5)'
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
            <p className="company-badge">BarcodePOS PRO 💎</p>
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

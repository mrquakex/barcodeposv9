import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Package, TrendingUp, Users, Settings,
  BarChart3, DollarSign, Clock, Zap, Camera, Sun, Moon
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { soundEffects } from '../../lib/sound-effects';
import { api } from '../../lib/api';

/**
 * 📱 MOBILE DASHBOARD - Apple HIG+ Design
 * Efsane ana sayfa - Tüm sayfalara erişim
 */

interface DashboardCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  gradient: string;
}

interface Stats {
  todaySales: number;
  todayOrders: number;
  lowStockCount: number;
  totalCustomers: number;
}

const MobileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const [stats, setStats] = useState<Stats>({
    todaySales: 0,
    todayOrders: 0,
    lowStockCount: 0,
    totalCustomers: 0,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadStats = async () => {
    try {
      // Simulated stats - replace with real API calls
      setStats({
        todaySales: 12450.50,
        todayOrders: 47,
        lowStockCount: 12,
        totalCustomers: 234,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const hapticFeedback = {
    light: () => navigator.vibrate && navigator.vibrate(30),
    medium: () => navigator.vibrate && navigator.vibrate(50),
  };

  const cards: DashboardCard[] = [
    {
      id: 'pos',
      title: 'Satış Yap',
      subtitle: 'Barkod tara, ödeme al',
      icon: ShoppingCart,
      path: '/pos',
      color: '#0078D4',
      gradient: 'linear-gradient(135deg, #0078D4 0%, #005FB7 100%)',
    },
    {
      id: 'products',
      title: 'Ürünler',
      subtitle: 'Stok ve fiyatlar',
      icon: Package,
      path: '/products',
      color: '#00A86B',
      gradient: 'linear-gradient(135deg, #00A86B 0%, #008A5A 100%)',
    },
    {
      id: 'sales',
      title: 'Satışlar',
      subtitle: 'Geçmiş ve raporlar',
      icon: TrendingUp,
      path: '/sales',
      color: '#FF6B00',
      gradient: 'linear-gradient(135deg, #FF6B00 0%, #E55D00 100%)',
    },
    {
      id: 'customers',
      title: 'Müşteriler',
      subtitle: 'Müşteri bilgileri',
      icon: Users,
      path: '/customers',
      color: '#8E44AD',
      gradient: 'linear-gradient(135deg, #8E44AD 0%, #7239A0 100%)',
    },
    {
      id: 'reports',
      title: 'Raporlar',
      subtitle: 'Analiz ve grafikler',
      icon: BarChart3,
      path: '/reports',
      color: '#E91E63',
      gradient: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
    },
    {
      id: 'settings',
      title: 'Ayarlar',
      subtitle: 'Uygulama tercihleri',
      icon: Settings,
      path: '/settings',
      color: '#607D8B',
      gradient: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)',
    },
  ];

  const handleCardClick = (path: string) => {
    soundEffects.tap();
    hapticFeedback.light();
    navigate(path);
  };

  const handleThemeToggle = () => {
    toggleTheme();
    soundEffects.tap();
    hapticFeedback.medium();
  };

  return (
    <div className="mobile-dashboard">
      {/* Header with greeting */}
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <div className="greeting-text">
            <h2 className="greeting-title">
              {currentTime.getHours() < 12 ? '☀️ Günaydın' :
               currentTime.getHours() < 18 ? '👋 İyi günler' : '🌙 İyi akşamlar'}
            </h2>
            <p className="greeting-subtitle">
              <Clock className="w-4 h-4 inline-block mr-1" />
              {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button className="theme-toggle-btn" onClick={handleThemeToggle}>
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card stat-primary">
          <div className="stat-icon">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Bugünkü Satış</p>
            <p className="stat-value">₺{stats.todaySales.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <Zap className="w-5 h-5" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Sipariş</p>
            <p className="stat-value">{stats.todayOrders}</p>
          </div>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="dashboard-cards">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              className="dashboard-card"
              onClick={() => handleCardClick(card.path)}
              style={{ '--card-gradient': card.gradient } as React.CSSProperties}
            >
              <div className="card-icon" style={{ background: card.gradient }}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="card-content">
                <h3 className="card-title">{card.title}</h3>
                <p className="card-subtitle">{card.subtitle}</p>
              </div>
              <div className="card-arrow">›</div>
            </button>
          );
        })}
      </div>

      {/* Quick Action FAB - Camera */}
      <button
        className="dashboard-fab"
        onClick={() => handleCardClick('/pos')}
      >
        <Camera className="w-7 h-7" />
      </button>
    </div>
  );
};

export default MobileDashboard;


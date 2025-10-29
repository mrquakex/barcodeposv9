import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Package, PlusCircle, Users, Building2, FileText,
  BarChart3, TrendingUp, PackageSearch, ClipboardList, DollarSign, 
  Receipt, UserCog, Grid3x3, Store, Coins, Bell, User, Sun, Moon,
  ArrowUpCircle, ArrowDownCircle, Activity
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { soundEffects } from '../../lib/sound-effects';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface MenuButton {
  icon: React.ElementType;
  title: string;
  path: string;
  badge?: string;
}

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  totalProducts: number;
  lowStockCount: number;
}

const MobileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayTransactions: 0,
    totalProducts: 0,
    lowStockCount: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // ⏰ Clock Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 📸 Request Camera Permission on App Start (Native Only)
  useEffect(() => {
    const requestCameraPermission = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        console.log('🔍 Checking camera permissions...');
        const permissionStatus = await BarcodeScanner.checkPermissions();
        console.log('📋 Permission status:', permissionStatus);

        if (permissionStatus.camera !== 'granted') {
          console.log('❓ Requesting camera permission...');
          const result = await BarcodeScanner.requestPermissions();
          console.log('✅ Permission result:', result);

          if (result.camera === 'granted') {
            toast.success('📸 Kamera izni verildi!', { duration: 2000 });
          } else {
            toast('⚠️ Kamera izni reddedildi. Barkod okutma çalışmayacak.', { 
              icon: '⚠️',
              duration: 3000 
            });
          }
        } else {
          console.log('✅ Camera permission already granted');
        }
      } catch (error) {
        console.error('❌ Permission request error:', error);
      }
    };

    requestCameraPermission();
  }, []);

  // 📊 Load Dashboard Stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      
      // Load products count
      const productsRes = await api.get('/products');
      const products = productsRes.data.products || [];
      const lowStock = products.filter((p: any) => p.stock < (p.minStock || 10));
      
      // Load today's sales
      const today = new Date().toISOString().split('T')[0];
      let todaySales = 0;
      let todayTransactions = 0;
      
      try {
        const salesRes = await api.get(`/sales?date=${today}`);
        const sales = salesRes.data.sales || [];
        todaySales = sales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
        todayTransactions = sales.length;
      } catch (error) {
        console.log('Sales data not available');
      }

      setStats({
        todaySales,
        todayTransactions,
        totalProducts: products.length,
        lowStockCount: lowStock.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Use cached data if available
      const cached = localStorage.getItem('cached_stats');
      if (cached) {
        setStats(JSON.parse(cached));
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

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

  // 🎨 14 ACTIVE MOBILE PAGES - Only Working Pages
  const menuButtons: MenuButton[] = [
    { icon: ShoppingCart, title: 'Satış Yap', path: '/pos' },
    { icon: Package, title: 'Ürünler', path: '/products', badge: stats.totalProducts > 0 ? stats.totalProducts.toString() : undefined },
    { icon: PlusCircle, title: 'Ürün Ekle/Güncelle', path: '/products/add' },
    { icon: Users, title: 'Müşteriler', path: '/customers' },
    { icon: Building2, title: 'Tedarikçiler', path: '/suppliers' },
    { icon: BarChart3, title: 'Satışlar', path: '/sales' },
    { icon: ArrowDownCircle, title: 'Giderler', path: '/expenses' },
    { icon: Grid3x3, title: 'Kategoriler', path: '/categories' },
    { icon: UserCog, title: 'Personel', path: '/employees' },
    { icon: Store, title: 'Şubeler', path: '/branches' },
    { icon: TrendingUp, title: 'Raporlar', path: '/reports' },
    { icon: ClipboardList, title: 'Stok Sayımı', path: '/stock-count' },
    { icon: Bell, title: 'Bildirimler', path: '/notifications', badge: stats.lowStockCount > 0 ? stats.lowStockCount.toString() : undefined },
    { icon: User, title: 'Profil & Ayarlar', path: '/settings' },
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

        {/* Stats - Enhanced */}
        <div className="stats-clean-enhanced">
          <div className="stat-card-clean">
            <div className="stat-icon-clean sales">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="stat-content-clean">
              <p className="stat-label-clean">Bugün</p>
              <p className="stat-value-clean">
                {isLoadingStats ? '...' : `₺${stats.todaySales.toFixed(2)}`}
              </p>
              <p className="stat-detail-clean">{stats.todayTransactions} işlem</p>
            </div>
          </div>

          <div className="stat-card-clean">
            <div className="stat-icon-clean products">
              <Package className="w-5 h-5" />
            </div>
            <div className="stat-content-clean">
              <p className="stat-label-clean">Ürün</p>
              <p className="stat-value-clean">
                {isLoadingStats ? '...' : stats.totalProducts}
              </p>
              {stats.lowStockCount > 0 && (
                <p className="stat-detail-clean warning">{stats.lowStockCount} düşük stok</p>
              )}
            </div>
          </div>

          <div className="stat-card-clean">
            <div className="stat-icon-clean activity">
              <Activity className="w-5 h-5" />
            </div>
            <div className="stat-content-clean">
              <p className="stat-label-clean">Durum</p>
              <p className="stat-value-clean">Aktif</p>
              <p className="stat-detail-clean">Online</p>
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
            {button.badge && (
              <span className="menu-badge-clean">{button.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileDashboard;


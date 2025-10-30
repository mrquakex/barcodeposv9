import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Package, PlusCircle, Users, Building2, FileText,
  BarChart3, TrendingUp, PackageSearch, ClipboardList, DollarSign, 
  Receipt, UserCog, Grid3x3, Store, Coins, Bell, User, Sun, Moon,
  ArrowUpCircle, ArrowDownCircle, Activity, TrendingDown, AlertTriangle,
  ChevronRight, X
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { soundEffects } from '../../lib/sound-effects';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

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
  yesterdaySales: number;
  last7DaysSales: number[];
  criticalStockProducts: any[];
  recentSales: any[];
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
    lowStockCount: 0,
    yesterdaySales: 0,
    last7DaysSales: [],
    criticalStockProducts: [],
    recentSales: [],
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showCriticalStock, setShowCriticalStock] = useState(false);

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
      const criticalStock = products.filter((p: any) => p.stock === 0).slice(0, 5);
      
      // Load today's and yesterday's sales
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let todaySales = 0;
      let todayTransactions = 0;
      let yesterdaySales = 0;
      let recentSales: any[] = [];
      
      try {
        // Today's sales
        const salesRes = await api.get(`/sales?date=${today}`);
        const sales = salesRes.data.sales || [];
        todaySales = sales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
        todayTransactions = sales.length;
        recentSales = sales.slice(0, 5);

        // Yesterday's sales
        const yesterdayRes = await api.get(`/sales?date=${yesterday}`);
        const yesterdaySalesData = yesterdayRes.data.sales || [];
        yesterdaySales = yesterdaySalesData.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
      } catch (error) {
        console.log('Sales data not available');
      }

      // Load last 7 days sales for chart
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - (6 - i) * 86400000);
        return date.toISOString().split('T')[0];
      });

      const last7DaysSales: number[] = [];
      for (const date of last7Days) {
        try {
          const res = await api.get(`/sales?date=${date}`);
          const dayTotal = (res.data.sales || []).reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
          last7DaysSales.push(dayTotal);
        } catch {
          last7DaysSales.push(0);
        }
      }

      const newStats = {
        todaySales,
        todayTransactions,
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        yesterdaySales,
        last7DaysSales,
        criticalStockProducts: criticalStock,
        recentSales,
      };

      setStats(newStats);
      
      // Cache for offline use
      localStorage.setItem('cached_stats', JSON.stringify(newStats));
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

        {/* 🆕 Comparison & Trend */}
        {!isLoadingStats && stats.yesterdaySales > 0 && (
          <div className="comparison-widget-clean">
            <div className="comparison-item">
              <p className="comparison-label">Dün</p>
              <p className="comparison-value">₺{stats.yesterdaySales.toFixed(0)}</p>
            </div>
            <div className="comparison-arrow">
              {stats.todaySales > stats.yesterdaySales ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-500" />
              ) : stats.todaySales < stats.yesterdaySales ? (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-500" />
              ) : (
                <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <div className="comparison-item">
              <p className="comparison-label">Fark</p>
              <p className={`comparison-value ${stats.todaySales > stats.yesterdaySales ? 'text-green-600 dark:text-green-500' : stats.todaySales < stats.yesterdaySales ? 'text-red-600 dark:text-red-500' : ''}`}>
                {stats.todaySales > stats.yesterdaySales ? '+' : ''}
                {(stats.todaySales - stats.yesterdaySales).toFixed(0)}
              </p>
            </div>
          </div>
        )}

        {/* 🆕 7-Day Trend Chart */}
        {!isLoadingStats && stats.last7DaysSales.length > 0 && (
          <div className="trend-chart-clean">
            <p className="trend-chart-title">Son 7 Gün</p>
            <div className="chart-container-clean">
              <Line
                data={{
                  labels: ['', '', '', '', '', '', ''],
                  datasets: [
                    {
                      data: stats.last7DaysSales,
                      borderColor: theme === 'dark' ? '#fff' : '#000',
                      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.4,
                      pointRadius: 0,
                      pointHoverRadius: 4,
                      pointBackgroundColor: theme === 'dark' ? '#fff' : '#000',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      enabled: true,
                      displayColors: false,
                      backgroundColor: theme === 'dark' ? '#1A1A1A' : '#fff',
                      titleColor: theme === 'dark' ? '#fff' : '#000',
                      bodyColor: theme === 'dark' ? '#fff' : '#000',
                      borderColor: theme === 'dark' ? '#2A2A2A' : '#E5E5E5',
                      borderWidth: 1,
                      callbacks: {
                        label: (context) => `₺${context.parsed.y.toFixed(0)}`,
                      },
                    },
                  },
                  scales: {
                    x: { display: false },
                    y: { display: false },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 🆕 Quick Widgets Row */}
      <div className="quick-widgets-clean">
        {/* Recent Sales */}
        {!isLoadingStats && stats.recentSales.length > 0 && (
          <div className="widget-card-clean">
            <div className="widget-header-clean">
              <h3 className="widget-title-clean">Son Satışlar</h3>
              <button 
                onClick={() => handleNavigation('/sales')}
                className="widget-view-all-clean"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="recent-sales-list-clean">
              {stats.recentSales.map((sale: any, index: number) => (
                <div key={index} className="sale-item-clean">
                  <div className="sale-icon-clean">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="sale-info-clean">
                    <p className="sale-number-clean">#{sale.saleNumber || `${index + 1}`}</p>
                    <p className="sale-time-clean">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Az önce'}
                    </p>
                  </div>
                  <p className="sale-amount-clean">₺{sale.total?.toFixed(0) || '0'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Stock Alert */}
        {!isLoadingStats && stats.criticalStockProducts.length > 0 && (
          <div className="widget-card-clean alert-card">
            <div className="widget-header-clean">
              <h3 className="widget-title-clean alert">
                <AlertTriangle className="w-4 h-4" />
                Kritik Stok
              </h3>
              <button
                onClick={() => {
                  setShowCriticalStock(!showCriticalStock);
                  soundEffects.tap();
                }}
                className="widget-toggle-clean"
              >
                {showCriticalStock ? <X className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            {showCriticalStock && (
              <div className="critical-stock-list-clean">
                {stats.criticalStockProducts.map((product: any, index: number) => (
                  <div key={index} className="critical-item-clean">
                    <div className="critical-icon-clean">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="critical-info-clean">
                      <p className="critical-name-clean">{product.name}</p>
                      <p className="critical-stock-clean">Stok: {product.stock}</p>
                    </div>
                    <button
                      onClick={() => handleNavigation('/products')}
                      className="critical-action-clean"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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


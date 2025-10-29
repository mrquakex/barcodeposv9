import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Banknote, ShoppingCart, Package, ArrowUp, ArrowDown, 
  AlertCircle, Star, Clock, Plus, Zap, TrendingDown, Users,
  Calendar, Activity, DollarSign
} from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentButton from '../components/fluent/FluentButton';
import { api } from '../lib/api';
import { Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  lowStockCount: number;
  revenueChange: number;
  salesChange: number;
  totalCustomers?: number;
}

interface TopProduct {
  product: any;
  totalQuantity: number;
  totalRevenue: number;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'product' | 'customer';
  title: string;
  description: string;
  time: string;
  amount?: number;
}

interface StockAlert {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  severity: 'critical' | 'low';
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    lowStockCount: 0,
    revenueChange: 0,
    salesChange: 0,
    totalCustomers: 0,
  });
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🆕 ENTERPRISE STATES
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('🔍 [DASHBOARD] Fetching data...');
      const response = await api.get('/dashboard/stats');
      const data = response.data;
      console.log('📦 [DASHBOARD] Data:', data);

      setStats({
        totalRevenue: data.monthRevenue || 0,
        totalSales: data.monthSalesCount || 0,
        totalProducts: data.totalProducts || 0,
        lowStockCount: data.lowStockProducts || 0,
        totalCustomers: data.totalCustomers || 0,
        revenueChange: 0, // TODO: Calculate from previous month
        salesChange: 0, // TODO: Calculate from previous month
      });

      // 🆕 SET TOP PRODUCTS
      if (data.topProducts) {
        setTopProducts(data.topProducts.slice(0, 5));
        console.log('⭐ [DASHBOARD] Top products:', data.topProducts.length);
      }

      // 🆕 SET STOCK ALERTS
      if (data.lowStockProducts > 0) {
        fetchStockAlerts();
      }

      // 🆕 SET RECENT ACTIVITIES
      fetchRecentActivities();

      if (data.last7DaysChart) {
        setChartData({
          labels: data.last7DaysChart.map((d: any) => d.date),
          datasets: [
            {
              label: t('dashboard.totalRevenue'),
              data: data.last7DaysChart.map((d: any) => d.revenue),
              borderColor: 'hsl(207, 100%, 41%)',
              backgroundColor: 'hsl(207, 100%, 41%, 0.1)',
              fill: true,
              tension: 0.4,
            },
          ],
        });
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 FETCH STOCK ALERTS
  const fetchStockAlerts = async () => {
    try {
      const response = await api.get('/products?isActive=true');
      const products = response.data.products || [];
      
      const alerts: StockAlert[] = products
        .filter((p: any) => p.stock <= p.minStock)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          minStock: p.minStock,
          severity: p.stock === 0 ? 'critical' : 'low',
        }))
        .slice(0, 5);
      
      setStockAlerts(alerts);
      console.log('⚠️ [DASHBOARD] Stock alerts:', alerts.length);
    } catch (error) {
      console.error('❌ [DASHBOARD] Failed to fetch stock alerts:', error);
    }
  };

  // 🆕 FETCH RECENT ACTIVITIES
  const fetchRecentActivities = async () => {
    try {
      const response = await api.get('/sales?limit=5');
      const sales = Array.isArray(response.data) ? response.data : (response.data.sales || []);
      
      const activities: RecentActivity[] = sales.slice(0, 5).map((sale: any) => ({
        id: sale.id,
        type: 'sale',
        title: `Satış #${sale.saleNumber}`,
        description: sale.customer?.name || 'Müşteri',
        time: new Date(sale.createdAt).toLocaleString('tr-TR'),
        amount: sale.total,
      }));
      
      setRecentActivities(activities);
      console.log('📋 [DASHBOARD] Recent activities:', activities.length);
    } catch (error) {
      console.error('❌ [DASHBOARD] Failed to fetch activities:', error);
    }
  };

  const kpiCards = [
    {
      title: t('dashboard.totalRevenue'),
      value: `₺${stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      change: stats.revenueChange,
      icon: Banknote,
      color: 'text-green-600',
    },
    {
      title: t('dashboard.totalSales'),
      value: stats.totalSales.toString(),
      change: stats.salesChange,
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: t('dashboard.totalProducts'),
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-purple-600',
    },
    {
      title: t('dashboard.lowStock'),
      value: stats.lowStockCount.toString(),
      icon: TrendingUp,
      color: 'text-orange-600',
      badge: stats.lowStockCount > 0 ? t('common.error') : undefined,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">{t('dashboard.loadingStats')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 fluent-mica">
      {/* 🎨 Modern Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {t('dashboard.title')}
        </h1>
        <p className="text-base text-foreground-secondary">
          {t('dashboard.recentActivity')}
        </p>
      </div>

      {/* 💎 Modern KPI Cards (Gradient Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <FluentCard 
              key={index} 
              depth="depth-4" 
              hoverable 
              className="p-6 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground-secondary mb-2">
                    {card.title}
                  </p>
                  <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
                    {card.value}
                  </h3>
                  {card.change !== undefined && (
                    <div className="flex items-center gap-1.5">
                      {card.change >= 0 ? (
                        <ArrowUp className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-destructive" />
                      )}
                      <span
                        className={`text-sm font-semibold ${
                          card.change >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {Math.abs(card.change).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {card.badge && (
                    <FluentBadge appearance="error" size="small" className="mt-2">
                      {card.badge}
                    </FluentBadge>
                  )}
                </div>
                {/* Gradient Icon Background */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
              </div>
            </FluentCard>
          );
        })}
      </div>

      {/* 🆕 ENTERPRISE GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - Chart + Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 📊 Modern Chart Card */}
          <FluentCard depth="depth-4" className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground">{t('dashboard.salesChart')}</h3>
                <p className="text-sm text-foreground-secondary mt-1">Son 7 günlük satış performansı</p>
              </div>
              <div className="px-4 py-2 bg-primary/10 rounded-lg">
                <span className="text-sm font-semibold text-primary">7 Gün</span>
              </div>
            </div>
            {chartData && (
              <div className="h-72">
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#1C1C1C',
                        bodyColor: '#5C5C5C',
                        borderColor: '#E6E6E6',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                      },
                    },
                    scales: {
                      x: { 
                        grid: { display: false },
                        ticks: { color: '#858585', font: { size: 12 } }
                      },
                      y: { 
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: '#858585', font: { size: 12 } }
                      },
                    },
                  }}
                />
              </div>
            )}
          </FluentCard>

          {/* 🆕 TOP PRODUCTS WIDGET */}
          <FluentCard depth="depth-4" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-foreground">En Çok Satanlar</h3>
              </div>
              <FluentButton 
                appearance="subtle" 
                size="small"
                onClick={() => navigate('/products')}
              >
                Tümünü Gör
              </FluentButton>
            </div>
            
            {topProducts.length === 0 ? (
              <div className="text-center py-8 text-foreground-secondary">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Henüz satış verisi yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((item, index) => (
                  <div 
                    key={item.product?.id || index}
                    className="flex items-center gap-4 p-3 bg-background-alt rounded-lg hover:bg-background-tertiary transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {item.product?.name || 'Bilinmeyen Ürün'}
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        {item.totalQuantity} adet satıldı
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ₺{item.totalRevenue?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FluentCard>

        </div>

        {/* RIGHT COLUMN - Activities + Stock Alerts */}
        <div className="space-y-6">
          
          {/* 🆕 RECENT ACTIVITIES WIDGET */}
          <FluentCard depth="depth-4" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-foreground">Son Aktiviteler</h3>
            </div>
            
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-foreground-secondary">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Henüz aktivite yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex gap-3 p-3 bg-background-alt rounded-lg hover:bg-background-tertiary transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 shrink-0">
                      <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-foreground-secondary truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-foreground-secondary mt-1">
                        {activity.time}
                      </p>
                    </div>
                    {activity.amount && (
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-green-600 dark:text-green-400 text-sm">
                          +₺{activity.amount.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </FluentCard>

          {/* 🆕 STOCK ALERTS WIDGET */}
          <FluentCard depth="depth-4" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-foreground">Stok Uyarıları</h3>
              {stockAlerts.length > 0 && (
                <FluentBadge appearance="error" size="small">
                  {stockAlerts.length}
                </FluentBadge>
              )}
            </div>
            
            {stockAlerts.length === 0 ? (
              <div className="text-center py-8 text-foreground-secondary">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tüm stoklar yeterli</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stockAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="flex items-center gap-3 p-3 bg-background-alt rounded-lg hover:bg-background-tertiary transition-colors cursor-pointer"
                    onClick={() => navigate('/products')}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                      alert.severity === 'critical' 
                        ? 'bg-red-100 dark:bg-red-900/20' 
                        : 'bg-orange-100 dark:bg-orange-900/20'
                    }`}>
                      <AlertCircle className={`w-5 h-5 ${
                        alert.severity === 'critical' 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-orange-600 dark:text-orange-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {alert.name}
                      </p>
                      <p className="text-xs text-foreground-secondary">
                        Stok: {alert.stock} / Min: {alert.minStock}
                      </p>
                    </div>
                    <FluentBadge 
                      appearance={alert.severity === 'critical' ? 'error' : 'warning'}
                      size="small"
                    >
                      {alert.severity === 'critical' ? 'KRİTİK' : 'DÜŞÜK'}
                    </FluentBadge>
                  </div>
                ))}
              </div>
            )}
            
            {stockAlerts.length > 0 && (
              <FluentButton 
                appearance="subtle" 
                size="small"
                className="w-full mt-4"
                onClick={() => navigate('/products')}
              >
                Tümünü Gör →
              </FluentButton>
            )}
          </FluentCard>

          {/* 🆕 QUICK ACTIONS */}
          <FluentCard depth="depth-4" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-foreground">Hızlı İşlemler</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <FluentButton 
                appearance="primary"
                size="small"
                icon={<ShoppingCart className="w-4 h-4" />}
                className="w-full justify-center"
                onClick={() => navigate('/pos')}
              >
                Yeni Satış
              </FluentButton>
              <FluentButton 
                appearance="primary"
                size="small"
                icon={<Plus className="w-4 h-4" />}
                className="w-full justify-center"
                onClick={() => navigate('/products/add')}
              >
                Ürün Ekle
              </FluentButton>
              <FluentButton 
                appearance="subtle"
                size="small"
                icon={<Users className="w-4 h-4" />}
                className="w-full justify-center"
                onClick={() => navigate('/customers')}
              >
                Müşteriler
              </FluentButton>
              <FluentButton 
                appearance="subtle"
                size="small"
                icon={<TrendingUp className="w-4 h-4" />}
                className="w-full justify-center"
                onClick={() => navigate('/reports')}
              >
                Raporlar
              </FluentButton>
            </div>
          </FluentCard>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;


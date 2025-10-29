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
import { Line, Bar } from 'react-chartjs-2';
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

interface CustomerAnalytics {
  newCustomers: number;
  vipCustomers: number;
  debtorCustomers: number;
  totalCustomers: number;
}

interface GoalTracking {
  currentRevenue: number;
  monthlyGoal: number;
  goalProgress: number;
  lastMonthRevenue: number;
}

interface RevenueTrendData {
  month: string;
  revenue: number;
  salesCount: number;
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
  
  // 🆕 ADVANCED ANALYTICS STATES
  const [salesHeatmap, setSalesHeatmap] = useState<number[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendData[]>([]);
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null);
  const [goalTracking, setGoalTracking] = useState<GoalTracking | null>(null);
  const [revenueTrendChart, setRevenueTrendChart] = useState<any>(null);
  const [heatmapChart, setHeatmapChart] = useState<any>(null);
  
  // 🆕 SALES ANALYTICS HUB - TAB STATE
  const [activeTab, setActiveTab] = useState<'today' | '7days' | '30days' | '6months' | 'goal'>('today');

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
        revenueChange: data.changePercentages?.revenueChange || 0,
        salesChange: data.changePercentages?.salesChange || 0,
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

      // 🆕 SET ADVANCED ANALYTICS
      if (data.salesHeatmap) {
        setSalesHeatmap(data.salesHeatmap);
        console.log('🔥 [DASHBOARD] Heatmap data loaded');
        
        // Create heatmap chart
        setHeatmapChart({
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          datasets: [
            {
              label: 'Saatlik Satış',
              data: data.salesHeatmap,
              backgroundColor: data.salesHeatmap.map((value: number) => {
                const max = Math.max(...data.salesHeatmap);
                const intensity = max > 0 ? value / max : 0;
                return `rgba(0, 120, 212, ${0.2 + intensity * 0.6})`;
              }),
              borderColor: 'hsl(207, 100%, 41%)',
              borderWidth: 1,
            },
          ],
        });
      }

      if (data.revenueTrend) {
        setRevenueTrend(data.revenueTrend);
        console.log('📈 [DASHBOARD] Revenue trend loaded');
        
        // Create revenue trend chart
        setRevenueTrendChart({
          labels: data.revenueTrend.map((d: any) => d.month),
          datasets: [
            {
              label: 'Aylık Gelir',
              data: data.revenueTrend.map((d: any) => d.revenue),
              borderColor: 'hsl(142, 76%, 36%)',
              backgroundColor: 'hsl(142, 76%, 36%, 0.1)',
              fill: true,
              tension: 0.4,
            },
          ],
        });
      }

      if (data.customerAnalytics) {
        setCustomerAnalytics(data.customerAnalytics);
        console.log('👥 [DASHBOARD] Customer analytics loaded');
      }

      if (data.goalTracking) {
        setGoalTracking(data.goalTracking);
        console.log('🎯 [DASHBOARD] Goal tracking loaded');
      }

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

      {/* 🆕 SIDEBAR WIDGETS - Activities + Stock Alerts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
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

      {/* 🆕 SALES ANALYTICS HUB - MEGA WIDGET */}
      <FluentCard depth="depth-4" className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Satış Analitiği</h2>
            <p className="text-sm text-foreground-secondary">Tüm satış verileriniz tek yerde</p>
          </div>
        </div>

        {/* 🆕 QUICK STATS - 4 KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Bu Ay Gelir</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              ₺{stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
            {stats.revenueChange !== 0 && (
              <p className={`text-xs font-medium mt-1 ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(stats.revenueChange).toFixed(1)}%
              </p>
            )}
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Toplam Satış</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalSales}</p>
            {stats.salesChange !== 0 && (
              <p className={`text-xs font-medium mt-1 ${stats.salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.salesChange >= 0 ? '↑' : '↓'} {Math.abs(stats.salesChange).toFixed(1)}%
              </p>
            )}
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Ortalama</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ₺{stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Satış başına</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">Hedef</p>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {goalTracking ? `${goalTracking.goalProgress.toFixed(0)}%` : '-%'}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              {goalTracking && goalTracking.goalProgress >= 100 ? 'Hedef aşıldı!' : 'İlerleme'}
            </p>
          </div>
        </div>

        {/* 🆕 TAB BAR */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'today'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-background-alt text-foreground-secondary hover:bg-background-tertiary'
            }`}
          >
            📅 Bugün
          </button>
          <button
            onClick={() => setActiveTab('7days')}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === '7days'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-background-alt text-foreground-secondary hover:bg-background-tertiary'
            }`}
          >
            📊 7 Gün
          </button>
          <button
            onClick={() => setActiveTab('30days')}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === '30days'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-background-alt text-foreground-secondary hover:bg-background-tertiary'
            }`}
          >
            📈 30 Gün
          </button>
          <button
            onClick={() => setActiveTab('6months')}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === '6months'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-background-alt text-foreground-secondary hover:bg-background-tertiary'
            }`}
          >
            📉 6 Ay
          </button>
          <button
            onClick={() => setActiveTab('goal')}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'goal'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-background-alt text-foreground-secondary hover:bg-background-tertiary'
            }`}
          >
            🎯 Hedef
          </button>
        </div>

        {/* 🆕 TAB CONTENT */}
        <div className="min-h-[400px]">
          
          {/* BUGÜN TAB */}
          {activeTab === 'today' && heatmapChart && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Saatlik Satış Yoğunluğu</h3>
                <FluentBadge appearance="info" size="small">Bugün</FluentBadge>
              </div>
              <div className="h-80">
                <Bar
                  data={heatmapChart}
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
                        callbacks: {
                          label: (context: any) => `₺${context.parsed.y.toFixed(2)}`,
                        },
                      },
                    },
                    scales: {
                      x: { 
                        grid: { display: false },
                        ticks: { 
                          color: '#858585', 
                          font: { size: 10 },
                          maxRotation: 45,
                          minRotation: 45,
                        }
                      },
                      y: { 
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { 
                          color: '#858585', 
                          font: { size: 12 },
                          callback: (value: any) => `₺${value}`,
                        }
                      },
                    },
                  }}
                />
              </div>
              <p className="text-center text-sm text-foreground-secondary">
                ⚡ En yoğun saat: <span className="font-semibold text-foreground">{salesHeatmap.indexOf(Math.max(...salesHeatmap))}:00</span>
              </p>
            </div>
          )}

          {/* 7 GÜN TAB */}
          {activeTab === '7days' && chartData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Son 7 Günlük Satış Trendi</h3>
                <FluentBadge appearance="success" size="small">Haftalık</FluentBadge>
              </div>
              <div className="h-80">
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
            </div>
          )}

          {/* 30 GÜN TAB */}
          {activeTab === '30days' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Bu Ay Performansı</h3>
                <FluentBadge appearance="warning" size="small">Aylık</FluentBadge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-background-alt rounded-lg">
                  <p className="text-sm text-foreground-secondary mb-2">Toplam Gelir</p>
                  <p className="text-3xl font-bold text-foreground">
                    ₺{stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                  {stats.revenueChange !== 0 && (
                    <p className={`text-sm mt-2 font-medium ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(stats.revenueChange).toFixed(1)}% geçen aya göre
                    </p>
                  )}
                </div>

                <div className="p-6 bg-background-alt rounded-lg">
                  <p className="text-sm text-foreground-secondary mb-2">Toplam Satış</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalSales}</p>
                  {stats.salesChange !== 0 && (
                    <p className={`text-sm mt-2 font-medium ${stats.salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.salesChange >= 0 ? '↑' : '↓'} {Math.abs(stats.salesChange).toFixed(1)}% geçen aya göre
                    </p>
                  )}
                </div>

                <div className="p-6 bg-background-alt rounded-lg">
                  <p className="text-sm text-foreground-secondary mb-2">Ortalama Satış</p>
                  <p className="text-3xl font-bold text-foreground">
                    ₺{stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '0.00'}
                  </p>
                  <p className="text-sm mt-2 text-foreground-secondary">Satış başına ortalama</p>
                </div>
              </div>

              {chartData && (
                <div className="h-64">
                  <Line data={chartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false } },
                      y: { grid: { color: 'rgba(0,0,0,0.05)' } },
                    },
                  }} />
                </div>
              )}
            </div>
          )}

          {/* 6 AY TAB */}
          {activeTab === '6months' && revenueTrendChart && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Son 6 Ay Gelir Trendi</h3>
                <FluentBadge appearance="success" size="small">6 Aylık</FluentBadge>
              </div>
              <div className="h-80">
                <Line
                  data={revenueTrendChart}
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
                        callbacks: {
                          label: (context: any) => `₺${context.parsed.y.toFixed(2)}`,
                        },
                      },
                    },
                    scales: {
                      x: { 
                        grid: { display: false },
                        ticks: { color: '#858585', font: { size: 12 } }
                      },
                      y: { 
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { 
                          color: '#858585', 
                          font: { size: 12 },
                          callback: (value: any) => `₺${value}`,
                        }
                      },
                    },
                  }}
                />
              </div>
              <div className="grid grid-cols-6 gap-2 mt-4">
                {revenueTrend.map((month, idx) => (
                  <div key={idx} className="text-center p-2 bg-background-alt rounded">
                    <p className="text-xs text-foreground-secondary">{month.month}</p>
                    <p className="text-sm font-semibold text-foreground">₺{(month.revenue / 1000).toFixed(1)}K</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HEDEF TAB */}
          {activeTab === 'goal' && goalTracking && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Aylık Hedef Takibi</h3>
                <FluentBadge 
                  appearance={goalTracking.goalProgress >= 100 ? 'success' : goalTracking.goalProgress >= 80 ? 'warning' : 'error'}
                  size="small"
                >
                  {goalTracking.goalProgress.toFixed(0)}%
                </FluentBadge>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-foreground-secondary font-medium">İlerleme</span>
                  <span className="font-bold text-foreground">
                    ₺{goalTracking.currentRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} / 
                    ₺{goalTracking.monthlyGoal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-background-tertiary rounded-full h-6 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 flex items-center justify-end px-3 ${
                      goalTracking.goalProgress >= 100 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : goalTracking.goalProgress >= 80 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${Math.min(goalTracking.goalProgress, 100)}%` }}
                  >
                    <span className="text-white text-xs font-bold">{goalTracking.goalProgress.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300 mb-2">Bu Ay</p>
                  <p className="text-4xl font-bold text-green-900 dark:text-green-100">
                    ₺{goalTracking.currentRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">{stats.totalSales} satış</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">Geçen Ay</p>
                  <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                    ₺{goalTracking.lastMonthRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    {stats.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(stats.revenueChange).toFixed(1)}% değişim
                  </p>
                </div>
              </div>

              {/* Goal Message */}
              <div className={`p-6 rounded-lg text-center ${
                goalTracking.goalProgress >= 100 
                  ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-500' 
                  : 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-500'
              }`}>
                <p className={`text-2xl font-bold mb-2 ${
                  goalTracking.goalProgress >= 100 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {goalTracking.goalProgress >= 100 
                    ? '🎉 Tebrikler! Hedefi aştınız!' 
                    : '💪 Hedefe Yakınız!'}
                </p>
                <p className={`text-lg ${
                  goalTracking.goalProgress >= 100 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {goalTracking.goalProgress >= 100 
                    ? `Hedefin ${((goalTracking.goalProgress - 100)).toFixed(1)}% üzerinde performans!`
                    : `Hedefe ${(goalTracking.monthlyGoal - goalTracking.currentRevenue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ kaldı!`}
                </p>
              </div>
            </div>
          )}

        </div>
      </FluentCard>

      {/* 🆕 BOTTOM ROW - Customer Analytics + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 👥 CUSTOMER ANALYTICS */}
        {customerAnalytics && (
          <FluentCard depth="depth-4" className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-foreground">Müşteri Analizi</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background-alt rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/20">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{customerAnalytics.newCustomers}</p>
                <p className="text-xs text-foreground-secondary mt-1">Yeni Müşteri</p>
                <p className="text-xs text-foreground-secondary">(30 gün)</p>
              </div>

              <div className="text-center p-4 bg-background-alt rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                  <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{customerAnalytics.vipCustomers}</p>
                <p className="text-xs text-foreground-secondary mt-1">VIP Müşteri</p>
                <p className="text-xs text-foreground-secondary">(Top 10)</p>
              </div>

              <div className="text-center p-4 bg-background-alt rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-red-100 dark:bg-red-900/20">
                  <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{customerAnalytics.debtorCustomers}</p>
                <p className="text-xs text-foreground-secondary mt-1">Borçlu</p>
                <p className="text-xs text-foreground-secondary">&nbsp;</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-foreground text-center">
                Toplam <span className="font-bold">{customerAnalytics.totalCustomers}</span> aktif müşteri
              </p>
            </div>
          </FluentCard>
        )}

        {/* ⭐ TOP PRODUCTS */}
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
    </div>
  );
};

export default Dashboard;


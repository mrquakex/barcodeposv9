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
  productId: string;
  name: string;
  quantity: number;
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
  
  // 🆕 COMMAND BAR STATES
  const [dateFilter, setDateFilter] = useState<string>('Bu Ay');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const isFirstRender = React.useRef(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 🆕 Re-fetch when date filter changes (skip ONLY first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // Skip first render
    }
    
    // Subsequent renders: always fetch when filter changes
    fetchDashboardData();
  }, [dateFilter]);

  // 🆕 SEARCH HANDLER (Debounced)
  useEffect(() => {
    if (!searchQuery) return;

    const timeoutId = setTimeout(() => {
      handleGlobalSearch(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleGlobalSearch = async (query: string) => {
    try {
      console.log('🔍 [SEARCH] Searching for:', query);
      
      // Search products
      const productsRes = await api.get('/products', {
        params: { search: query },
      });
      
      // Search customers
      const customersRes = await api.get('/customers', {
        params: { search: query },
      });
      
      // Search sales
      const salesRes = await api.get('/sales', {
        params: { search: query },
      });
      
      console.log('📦 [SEARCH] Results:', {
        products: productsRes.data.products?.length || 0,
        customers: customersRes.data.customers?.length || 0,
        sales: Array.isArray(salesRes.data) ? salesRes.data.length : (salesRes.data.sales?.length || 0),
      });

      // TODO: Show search results in a modal or redirect to search page
      // For now, we'll just log the results
      
    } catch (error) {
      console.error('❌ [SEARCH] Error:', error);
    }
  };

  // 🆕 DATE FILTER HANDLER
  const handleDateFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateFilter(e.target.value);
  };

  const fetchDashboardData = async () => {
    try {
      console.log('🔍 [DASHBOARD] Fetching data for:', dateFilter);
      const response = await api.get('/dashboard/stats', {
        params: {
          dateFilter: dateFilter,
        },
      });
      const data = response.data;
      console.log('✅ [DASHBOARD] Data loaded:', {
        revenue: data.monthRevenue,
        sales: data.monthSalesCount,
        filter: data.dateFilter,
      });

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
    <div className="min-h-screen bg-background">
      {/* 🎨 COMMAND BAR - Microsoft Fluent 2 Acrylic */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-foreground">
                {t('dashboard.title')}
              </h1>
              <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full font-medium flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                CANLI
              </span>
              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-md font-medium">
                📅 {dateFilter}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Date Picker */}
              <select 
                value={dateFilter}
                onChange={handleDateFilter}
                className="px-3 py-1.5 text-sm bg-background border border-border/50 rounded-md hover:border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option>Bu Ay</option>
                <option>Bugün</option>
                <option>Bu Hafta</option>
                <option>Geçen Ay</option>
              </select>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-64 px-3 py-1.5 pl-9 text-sm bg-background border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <TrendingUp className="absolute left-2.5 top-2 w-4 h-4 text-foreground-secondary/40" />
              </div>

              {/* Settings */}
              <button 
                onClick={() => navigate('/settings')}
                className="p-2 hover:bg-background-alt rounded-md transition-colors"
                title="Ayarlar"
              >
                <TrendingUp className="w-4 h-4 text-foreground-secondary" />
              </button>

              {/* Notifications */}
              <button 
                onClick={() => console.log('🔔 Notifications clicked')}
                className="p-2 hover:bg-background-alt rounded-md transition-colors relative"
                title="Bildirimler"
              >
                <Calendar className="w-4 h-4 text-foreground-secondary" />
                {stockAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">

      {/* 💎 HERO METRICS - 5 Interactive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Revenue */}
        <FluentCard 
          depth="depth-4" 
          hoverable
          className="p-5 border border-border/50 group cursor-pointer"
          onClick={() => navigate('/sales')}
        >
          <div className="flex items-start justify-between mb-2">
            <Banknote className="w-5 h-5 text-success/60" />
          </div>
          <p className="text-xs font-medium text-foreground-secondary uppercase tracking-wide mb-2">
            Gelir
          </p>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            ₺{stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </h3>
          {stats.revenueChange !== 0 && (
            <div className="flex items-center gap-1 mb-2">
              {stats.revenueChange >= 0 ? (
                <ArrowUp className="w-3.5 h-3.5 text-success" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className={`text-xs font-medium ${stats.revenueChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {Math.abs(stats.revenueChange).toFixed(1)}%
              </span>
            </div>
          )}
          <button className="text-xs text-primary hover:underline font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Detay →
          </button>
        </FluentCard>

        {/* Card 2: Sales */}
        <FluentCard 
          depth="depth-4" 
          hoverable
          className="p-5 border border-border/50 group cursor-pointer"
          onClick={() => navigate('/sales')}
        >
          <div className="flex items-start justify-between mb-2">
            <ShoppingCart className="w-5 h-5 text-primary/60" />
          </div>
          <p className="text-xs font-medium text-foreground-secondary uppercase tracking-wide mb-2">
            Satışlar
          </p>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {stats.totalSales}
          </h3>
          {stats.salesChange !== 0 && (
            <div className="flex items-center gap-1 mb-2">
              {stats.salesChange >= 0 ? (
                <ArrowUp className="w-3.5 h-3.5 text-success" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className={`text-xs font-medium ${stats.salesChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {Math.abs(stats.salesChange).toFixed(1)}%
              </span>
            </div>
          )}
          <button className="text-xs text-primary hover:underline font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Detay →
          </button>
        </FluentCard>

        {/* Card 3: Customers */}
        <FluentCard 
          depth="depth-4" 
          hoverable
          className="p-5 border border-border/50 group cursor-pointer"
          onClick={() => navigate('/customers')}
        >
          <div className="flex items-start justify-between mb-2">
            <Users className="w-5 h-5 text-purple-500/60" />
          </div>
          <p className="text-xs font-medium text-foreground-secondary uppercase tracking-wide mb-2">
            Müşteriler
          </p>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {stats.totalCustomers || 0}
          </h3>
          {customerAnalytics && (
            <div className="flex items-center gap-1 mb-2">
              <ArrowUp className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-medium text-success">
                +{customerAnalytics.newCustomers} yeni
                      </span>
                    </div>
                  )}
          <button className="text-xs text-primary hover:underline font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Detay →
          </button>
        </FluentCard>

        {/* Card 4: Stock */}
        <FluentCard 
          depth="depth-4" 
          hoverable
          className="p-5 border border-border/50 group cursor-pointer"
          onClick={() => navigate('/products')}
        >
          <div className="flex items-start justify-between mb-2">
            <Package className="w-5 h-5 text-orange-500/60" />
          </div>
          <p className="text-xs font-medium text-foreground-secondary uppercase tracking-wide mb-2">
            Stok
          </p>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {stats.lowStockCount}
          </h3>
          {stats.lowStockCount > 0 ? (
            <div className="flex items-center gap-1 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs font-medium text-destructive">
                Düşük stok!
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs text-success">✓ Normal</span>
            </div>
          )}
          <button className="text-xs text-primary hover:underline font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Detay →
          </button>
        </FluentCard>

        {/* Card 5: Goal */}
        <FluentCard 
          depth="depth-4" 
          hoverable
          className="p-5 border border-border/50 group cursor-pointer"
        >
          <div className="flex items-start justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500/60" />
          </div>
          <p className="text-xs font-medium text-foreground-secondary uppercase tracking-wide mb-2">
            Hedef
          </p>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {goalTracking ? `${goalTracking.goalProgress.toFixed(0)}%` : '—'}
          </h3>
          {goalTracking && (
            <div className="w-full bg-background-tertiary rounded-full h-1.5 mb-2">
              <div 
                className={`h-full rounded-full transition-all ${
                  goalTracking.goalProgress >= 100 ? 'bg-success' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(goalTracking.goalProgress, 100)}%` }}
              />
            </div>
          )}
          <button className="text-xs text-primary hover:underline font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Detay →
          </button>
        </FluentCard>
      </div>

      {/* 🚀 QUICK ACTIONS - 8 Navigation Cards */}
      <div>
        <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide mb-4">
          Hızlı Erişim
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: New Sale */}
          <FluentCard 
            depth="depth-4" 
            hoverable
            className="p-4 border border-border/50 group cursor-pointer"
            onClick={() => navigate('/pos')}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 mb-3 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-sm text-foreground mb-1">Yeni Satış</h3>
            <p className="text-xs text-foreground-secondary">Hızlı satış başlat</p>
          </FluentCard>

          {/* Card 2: Add Product */}
          <FluentCard 
            depth="depth-4" 
            hoverable
            className="p-4 border border-border/50 group cursor-pointer"
            onClick={() => navigate('/products/add')}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-sm text-foreground mb-1">Ürün Ekle</h3>
            <p className="text-xs text-foreground-secondary">Yeni ürün tanımla</p>
          </FluentCard>

          {/* Card 3: Customers */}
          <FluentCard 
            depth="depth-4" 
            hoverable
            className="p-4 border border-border/50 group cursor-pointer"
            onClick={() => navigate('/customers')}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-sm text-foreground mb-1">Müşteriler</h3>
            <p className="text-xs text-foreground-secondary">Müşteri yönetimi</p>
          </FluentCard>

          {/* Card 4: Reports */}
          <FluentCard 
            depth="depth-4" 
            hoverable
            className="p-4 border border-border/50 group cursor-pointer"
            onClick={() => navigate('/reports')}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-semibold text-sm text-foreground mb-1">Raporlar</h3>
            <p className="text-xs text-foreground-secondary">Detaylı analiz</p>
          </FluentCard>

          {/* Card 5: Stock Management */}
          <FluentCard 
            depth="depth-4" 
            hoverable
            className="p-4 border border-border/50 group cursor-pointer"
            onClick={() => navigate('/products')}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 mb-3 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-sm text-foreground mb-1">Stok Yönetimi</h3>
            <p className="text-xs text-foreground-secondary">Stok takibi</p>
          </FluentCard>

          {/* Card 6: Finance */}
          <FluentCard 
            depth="depth-4" 
            hoverable
            className="p-4 border border-border/50 group cursor-pointer"
            onClick={() => navigate('/sales')}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-600/10 mb-3 group-hover:scale-110 transition-transform">
              <Banknote className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="font-semibold text-sm text-foreground mb-1">Finans</h3>
            <p className="text-xs text-foreground-secondary">Gelir & Gider</p>
          </FluentCard>

          {/* Card 7: Settings */}
          <FluentCard 
            depth="depth-4" 
            hoverable
            className="p-4 border border-border/50 group cursor-pointer"
            onClick={() => navigate('/settings')}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500/10 to-gray-600/10 mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="font-semibold text-sm text-foreground mb-1">Ayarlar</h3>
            <p className="text-xs text-foreground-secondary">Sistem ayarları</p>
          </FluentCard>

          {/* Card 8: Analytics */}
          <FluentCard 
            depth="depth-4" 
            hoverable
            className="p-4 border border-border/50 group cursor-pointer"
            onClick={() => navigate('/reports')}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-600/10 mb-3 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
            <h3 className="font-semibold text-sm text-foreground mb-1">Trendler</h3>
            <p className="text-xs text-foreground-secondary">İstatistikler</p>
          </FluentCard>
                </div>
              </div>

      {/* 📊 INSIGHTS & ACTIVITY - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LEFT: Performance & Top Products */}
        <FluentCard depth="depth-4" className="p-6 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Bu Ay Performans</h3>
      </div>

          {/* Mini Revenue Chart */}
          {revenueTrendChart && (
            <div className="mb-6">
              <div style={{ height: '180px' }}>
                <Line data={revenueTrendChart} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    y: { display: false, grid: { display: false } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                  }
                }} />
              </div>
            </div>
          )}

          {/* Top 5 Products */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">En Çok Satanlar</h4>
            <div className="space-y-2">
              {topProducts.slice(0, 5).map((product, index) => (
                <div key={product.productId} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-foreground-secondary w-4">
                    {index + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{product.name}</p>
                    <div className="w-full bg-background-tertiary rounded-full h-1.5 mt-1">
                      <div 
                        className="h-full rounded-full bg-primary"
                        style={{ 
                          width: `${(product.quantity / topProducts[0].quantity) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    ₺{product.totalRevenue.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
            
            <FluentButton 
              appearance="subtle" 
              size="small"
              className="w-full mt-4"
              onClick={() => navigate('/reports')}
            >
              Detaylı Rapor →
            </FluentButton>
          </div>
        </FluentCard>

        {/* RIGHT: Activity Feed + Stock Alerts */}
        <FluentCard depth="depth-4" className="p-6 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-semibold text-foreground">Aktivite Akışı</h3>
            <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full font-medium">
              Canlı
            </span>
          </div>

          {recentActivities.length === 0 ? (
            <div className="text-center py-12 text-foreground-secondary">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Henüz aktivite yok</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivities.slice(0, 6).map((activity) => (
                <div 
                  key={activity.id}
                  className="flex gap-3 p-3 bg-background-alt rounded-lg hover:bg-background-tertiary transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 shrink-0">
                    <ShoppingCart className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-foreground-secondary">
                      {activity.time}
                    </p>
                  </div>
                  {activity.amount && (
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-green-600 dark:text-green-400 text-sm">
                        +₺{activity.amount.toFixed(0)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Stock Alerts Section */}
          {stockAlerts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <h4 className="text-sm font-semibold text-foreground">Stok Uyarıları</h4>
                <FluentBadge appearance="error" size="small">
                  {stockAlerts.length}
                </FluentBadge>
              </div>
              <div className="space-y-2">
                {stockAlerts.slice(0, 3).map((alert) => (
                  <div 
                    key={alert.id}
                    className="flex items-center justify-between p-2 bg-background-alt rounded-lg hover:bg-background-tertiary transition-colors cursor-pointer"
                    onClick={() => navigate('/products')}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <AlertCircle className={`w-4 h-4 shrink-0 ${
                        alert.severity === 'critical' 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-orange-600 dark:text-orange-400'
                      }`} />
                      <span className="text-sm text-foreground truncate">{alert.name}</span>
                    </div>
                    <FluentBadge 
                      appearance={alert.severity === 'critical' ? 'error' : 'warning'}
                      size="small"
                    >
                      {alert.stock}
                    </FluentBadge>
                  </div>
                ))}
              </div>
              {stockAlerts.length > 3 && (
                <FluentButton 
                  appearance="subtle" 
                  size="small"
                  className="w-full mt-3"
                  onClick={() => navigate('/products')}
                >
                  Tümünü Gör ({stockAlerts.length}) →
                </FluentButton>
              )}
          </div>
        )}
      </FluentCard>

      </div>

      {/* 💡 CONTEXTUAL INSIGHTS (Smart Suggestions) */}
      <FluentCard depth="depth-4" className="p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-500/10">
            <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Akıllı Öneriler</h3>
        </div>

        {/* Smart Suggestions List */}
        <div className="space-y-3">
          
          {/* Suggestion 1: Stock Alert */}
          {stockAlerts.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors cursor-pointer"
              onClick={() => navigate('/products')}
            >
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  {stockAlerts.length} ürün kritik stokta!
                </h4>
                <p className="text-sm text-foreground-secondary">
                  Stok eklemek için ürün sayfasına git ve sipariş ver.
                </p>
              </div>
              <button className="text-xs text-primary hover:underline font-medium shrink-0">
                İncele →
              </button>
            </div>
          )}

          {/* Suggestion 2: Goal Progress */}
          {goalTracking && goalTracking.goalProgress < 100 && goalTracking.goalProgress > 80 && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  Hedefe %{(100 - goalTracking.goalProgress).toFixed(1)} kaldı!
                </h4>
                <p className="text-sm text-foreground-secondary">
                  Bu ay çok iyi gidiyorsunuz. Devam edin, hedefinize çok yakınsınız!
                </p>
              </div>
            </div>
          )}

          {/* Suggestion 3: Inactive Customers */}
          {customerAnalytics && customerAnalytics.totalCustomers > 0 && (
            <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors cursor-pointer"
              onClick={() => navigate('/customers')}
            >
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  {customerAnalytics.newCustomers} yeni müşteri kazandınız!
                </h4>
                <p className="text-sm text-foreground-secondary">
                  Son 30 günde {customerAnalytics.newCustomers} yeni müşteri kaydedildi. Müşteri ilişkilerinizi güçlendirin.
                </p>
              </div>
              <button className="text-xs text-primary hover:underline font-medium shrink-0">
                Görüntüle →
              </button>
            </div>
          )}

          {/* Suggestion 4: Top Selling Products */}
          {topProducts.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors cursor-pointer"
              onClick={() => navigate('/reports')}
            >
              <Package className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  En çok satan ürününüz: {topProducts[0]?.name}
                </h4>
                <p className="text-sm text-foreground-secondary">
                  Bu ürün ₺{topProducts[0]?.totalRevenue.toFixed(0)} gelir sağladı. Stoğunu kontrol edin.
                </p>
              </div>
              <button className="text-xs text-primary hover:underline font-medium shrink-0">
                Rapor →
              </button>
            </div>
          )}

          {/* Empty State */}
          {stockAlerts.length === 0 && topProducts.length === 0 && !customerAnalytics && (
            <div className="text-center py-12 text-foreground-secondary">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Şu anda öneri yok</p>
              <p className="text-xs mt-1">Satış yaptıkça akıllı öneriler burada görünecek</p>
            </div>
          )}

        </div>
      </FluentCard>

      {/* Close Main Content Div */}
      </div>

      {/* Close Dashboard Container */}
    </div>
  );
};

export default Dashboard;

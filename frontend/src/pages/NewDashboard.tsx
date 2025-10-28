import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  ArrowUp, 
  ArrowDown,
  Calendar,
  Users,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  todayRevenue: number;
  todaySales: number;
  monthRevenue: number;
  monthSalesCount: number;
  totalProducts: number;
  lowStockProducts: number;
  revenueChange: number;
  salesChange: number;
  last7DaysChart: Array<{ date: string; revenue: number; sales: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
}

const NewDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        titleFont: { size: 14, weight: '600' },
        bodyFont: { size: 13 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: '#6B7280' },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { size: 12 }, color: '#6B7280' },
      },
    },
  };

  const revenueChartData = stats?.last7DaysChart
    ? {
        labels: stats.last7DaysChart.map((d) => {
          const date = new Date(d.date);
          return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        }),
        datasets: [
          {
            label: 'Gelir',
            data: stats.last7DaysChart.map((d) => d.revenue),
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      }
    : null;

  const salesChartData = stats?.last7DaysChart
    ? {
        labels: stats.last7DaysChart.map((d) => {
          const date = new Date(d.date);
          return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        }),
        datasets: [
          {
            label: 'Satış',
            data: stats.last7DaysChart.map((d) => d.sales),
            backgroundColor: '#10B981',
            borderRadius: 8,
            barThickness: 32,
          },
        ],
      }
    : null;

  if (isLoading) {
    return (
      <div className="dashboard-enterprise">
        <div className="dashboard-header">
          <div className="skeleton skeleton-title"></div>
        </div>
        <div className="kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card"></div>
          ))}
        </div>
      </div>
    );
  }

  const kpiData = [
    {
      title: 'Bugünkü Satışlar',
      value: `₺${stats?.todayRevenue?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0,00'}`,
      change: stats?.revenueChange || 0,
      subtitle: `${stats?.todaySales || 0} işlem`,
      icon: DollarSign,
      color: 'primary',
    },
    {
      title: 'Aylık Gelir',
      value: `₺${stats?.monthRevenue?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0,00'}`,
      change: stats?.salesChange || 0,
      subtitle: `${stats?.monthSalesCount || 0} satış`,
      icon: TrendingUp,
      color: 'success',
    },
    {
      title: 'Toplam Ürün',
      value: stats?.totalProducts?.toString() || '0',
      subtitle: 'Stokta',
      icon: Package,
      color: 'info',
    },
    {
      title: 'Düşük Stok',
      value: stats?.lowStockProducts?.toString() || '0',
      subtitle: 'Dikkat gerekiyor',
      icon: AlertCircle,
      color: 'warning',
    },
  ];

  return (
    <div className="dashboard-enterprise">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Hoş geldiniz! İşte bugünün özeti.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn-secondary">
            <Calendar size={18} />
            <span>Bugün</span>
          </button>
          <button className="btn-primary">Rapor İndir</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change && kpi.change > 0;
          const hasChange = kpi.change !== undefined;

          return (
            <div key={index} className={`kpi-card ${kpi.color}`}>
              <div className="kpi-card-header">
                <div className={`kpi-icon ${kpi.color}`}>
                  <Icon size={20} />
                </div>
                {hasChange && (
                  <div className={`kpi-badge ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    <span>{Math.abs(kpi.change)}%</span>
                  </div>
                )}
              </div>
              <div className="kpi-card-body">
                <p className="kpi-title">{kpi.title}</p>
                <h3 className="kpi-value">{kpi.value}</h3>
                <p className="kpi-subtitle">{kpi.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Gelir Trendi</h3>
              <p className="chart-subtitle">Son 7 gün</p>
            </div>
            <div className="time-range-tabs">
              <button className={timeRange === 'today' ? 'active' : ''} onClick={() => setTimeRange('today')}>
                Bugün
              </button>
              <button className={timeRange === 'week' ? 'active' : ''} onClick={() => setTimeRange('week')}>
                Hafta
              </button>
              <button className={timeRange === 'month' ? 'active' : ''} onClick={() => setTimeRange('month')}>
                Ay
              </button>
            </div>
          </div>
          <div className="chart-container">
            {revenueChartData && <Line data={revenueChartData} options={chartOptions} />}
          </div>
        </div>

        {/* Sales Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Satış Sayısı</h3>
              <p className="chart-subtitle">Son 7 gün</p>
            </div>
          </div>
          <div className="chart-container">
            {salesChartData && <Bar data={salesChartData} options={chartOptions} />}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-grid">
        {/* Top Products */}
        <div className="data-card">
          <div className="data-card-header">
            <h3 className="data-title">En Çok Satan Ürünler</h3>
            <button className="btn-text">Tümünü Gör</button>
          </div>
          <div className="product-list">
            {stats?.topProducts?.slice(0, 5).map((product, index) => (
              <div key={index} className="product-item">
                <div className="product-info">
                  <div className="product-avatar">{product.name.charAt(0)}</div>
                  <div>
                    <p className="product-name">{product.name}</p>
                    <p className="product-quantity">{product.quantity} adet satıldı</p>
                  </div>
                </div>
                <p className="product-revenue">₺{product.revenue.toLocaleString('tr-TR')}</p>
              </div>
            )) || (
              <p className="empty-state">Henüz satış yok</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="data-card">
          <div className="data-card-header">
            <h3 className="data-title">Son Aktiviteler</h3>
            <button className="btn-text">Tümünü Gör</button>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon success">
                <ShoppingCart size={16} />
              </div>
              <div className="activity-content">
                <p className="activity-title">Yeni satış yapıldı</p>
                <p className="activity-time">2 dakika önce</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon info">
                <Package size={16} />
              </div>
              <div className="activity-content">
                <p className="activity-title">Ürün eklendi</p>
                <p className="activity-time">15 dakika önce</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon warning">
                <AlertCircle size={16} />
              </div>
              <div className="activity-content">
                <p className="activity-title">Stok uyarısı</p>
                <p className="activity-time">1 saat önce</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;


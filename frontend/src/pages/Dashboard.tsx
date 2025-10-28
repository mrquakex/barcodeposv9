import React, { useEffect, useState } from 'react';
import { TrendingUp, Banknote, ShoppingCart, Package, ArrowUp, ArrowDown } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import { Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
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
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  lowStockCount: number;
  revenueChange: number;
  salesChange: number;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    lowStockCount: 0,
    revenueChange: 0,
    salesChange: 0,
  });
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      const data = response.data;

      setStats({
        totalRevenue: data.monthRevenue || 0,
        totalSales: data.monthSalesCount || 0,
        totalProducts: data.totalProducts || 0,
        lowStockCount: data.lowStockProducts || 0,
        revenueChange: 0, // TODO: Calculate from previous month
        salesChange: 0, // TODO: Calculate from previous month
      });

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
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
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
    </div>
  );
};

export default Dashboard;


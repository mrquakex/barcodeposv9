import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Package, ArrowUp, ArrowDown } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import { Line } from 'react-chartjs-2';
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
              label: 'Revenue',
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
      title: 'Total Revenue',
      value: `₺${stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      change: stats.revenueChange,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total Sales',
      value: stats.totalSales.toString(),
      change: stats.salesChange,
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-purple-600',
    },
    {
      title: 'Low Stock',
      value: stats.lowStockCount.toString(),
      icon: TrendingUp,
      color: 'text-orange-600',
      badge: stats.lowStockCount > 0 ? 'Alert' : undefined,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="fluent-title text-foreground">Dashboard</h1>
        <p className="fluent-body text-foreground-secondary mt-1">
          Overview of your business performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <FluentCard key={index} depth="depth-4" hoverable className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="fluent-body-small text-foreground-secondary mb-1">
                    {card.title}
                  </p>
                  <h3 className="fluent-subtitle text-foreground mb-2">{card.value}</h3>
                  {card.change !== undefined && (
                    <div className="flex items-center gap-1">
                      {card.change >= 0 ? (
                        <ArrowUp className="w-3 h-3 text-success" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-destructive" />
                      )}
                      <span
                        className={`fluent-caption ${
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
                <div className={`p-2 rounded bg-background-alt ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </FluentCard>
          );
        })}
      </div>

      {/* Chart */}
      <FluentCard depth="depth-4" className="p-6">
        <h3 className="fluent-heading text-foreground mb-4">Revenue Trend</h3>
        {chartData && (
          <div className="h-64">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'hsl(var(--fluent-color-card-bg))',
                    titleColor: 'hsl(var(--fluent-color-text-primary))',
                    bodyColor: 'hsl(var(--fluent-color-text-secondary))',
                    borderColor: 'hsl(var(--fluent-color-border-default))',
                    borderWidth: 1,
                  },
                },
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: 'hsl(var(--fluent-color-border-subtle))' } },
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


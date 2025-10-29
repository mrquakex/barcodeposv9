import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, DollarSign, ShoppingCart, Calendar, Award } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
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

interface EmployeeKPIs {
  totalSales: number;
  totalRevenue: number;
  totalItemsSold: number;
  averageSaleValue: number;
}

interface EmployeePerformance {
  rank: number;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  branchName?: string;
  kpis: EmployeeKPIs;
  salesTrend: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
}

const EmployeePerformance: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<EmployeePerformance[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePerformance | null>(null);
  const [period, setPeriod] = useState('last30days');
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalSalesAllEmployees: 0,
    totalRevenueAllEmployees: 0,
  });

  useEffect(() => {
    fetchPerformance();
  }, [period]);

  const fetchPerformance = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/employees/performance?period=${period}`);
      setLeaderboard(response.data.leaderboard || []);
      setSummary(response.data.summary || {});
      
      // Auto-select top employee
      if (response.data.leaderboard && response.data.leaderboard.length > 0) {
        setSelectedEmployee(response.data.leaderboard[0]);
      }
    } catch (error) {
      toast.error('Performans verileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-foreground-secondary">#{rank}</span>;
  };

  const getChartData = () => {
    if (!selectedEmployee || !selectedEmployee.salesTrend) return null;

    return {
      labels: selectedEmployee.salesTrend.map((t) =>
        new Date(t.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Satış Sayısı',
          data: selectedEmployee.salesTrend.map((t) => t.count),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          yAxisID: 'y',
        },
        {
          label: 'Gelir (₺)',
          data: selectedEmployee.salesTrend.map((t) => t.revenue),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          yAxisID: 'y1',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Satış Sayısı',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Gelir (₺)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 fluent-mica">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            🏆 Personel Performansı
          </h1>
          <p className="text-base text-foreground-secondary">
            Satış ekibinizin performansını takip edin
          </p>
        </div>
        <div className="flex gap-2">
          {['today', 'last7days', 'last30days', 'thismonth'].map((p) => (
            <FluentButton
              key={p}
              appearance={period === p ? 'primary' : 'subtle'}
              size="small"
              onClick={() => setPeriod(p)}
            >
              {p === 'today' && 'Bugün'}
              {p === 'last7days' && 'Son 7 Gün'}
              {p === 'last30days' && 'Son 30 Gün'}
              {p === 'thismonth' && 'Bu Ay'}
            </FluentButton>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FluentCard depth="depth-4" className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Aktif Personel</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalEmployees}</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-4" className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Toplam Gelir</p>
              <p className="text-2xl font-bold text-green-600">₺{Number(summary.totalRevenueAllEmployees).toFixed(2)}</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-4" className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Toplam Satış</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalSalesAllEmployees}</p>
            </div>
          </div>
        </FluentCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-1">
          <FluentCard depth="depth-4" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Liderlik Tablosu</h2>
            </div>

            <div className="space-y-3">
              {leaderboard.map((emp) => (
                <div
                  key={emp.userId}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedEmployee?.userId === emp.userId
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-background-alt hover:bg-background-alt/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getRankBadge(emp.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{emp.userName}</p>
                      <p className="text-xs text-foreground-secondary">{emp.branchName || 'No Branch'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">₺{Number(emp.kpis.totalRevenue).toFixed(0)}</p>
                      <p className="text-xs text-foreground-secondary">{emp.kpis.totalSales} satış</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {leaderboard.length === 0 && (
              <p className="text-center text-foreground-secondary py-8">Veri bulunamadı</p>
            )}
          </FluentCard>
        </div>

        {/* Selected Employee Details */}
        <div className="lg:col-span-2">
          {selectedEmployee ? (
            <div className="space-y-6">
              {/* Employee Info */}
              <FluentCard depth="depth-4" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {selectedEmployee.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{selectedEmployee.userName}</h3>
                      <p className="text-foreground-secondary">{selectedEmployee.userEmail}</p>
                      <FluentBadge appearance="info" size="small">
                        {selectedEmployee.userRole}
                      </FluentBadge>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-1">Sıralama</p>
                    <div className="text-4xl font-bold text-primary">{getRankBadge(selectedEmployee.rank)}</div>
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-1">Satış Sayısı</p>
                    <p className="text-2xl font-bold text-foreground">{selectedEmployee.kpis.totalSales}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-1">Toplam Gelir</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₺{Number(selectedEmployee.kpis.totalRevenue).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-1">Satılan Ürün</p>
                    <p className="text-2xl font-bold text-foreground">{selectedEmployee.kpis.totalItemsSold}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-1">Ort. Satış</p>
                    <p className="text-2xl font-bold text-primary">
                      ₺{Number(selectedEmployee.kpis.averageSaleValue).toFixed(2)}
                    </p>
                  </div>
                </div>
              </FluentCard>

              {/* Sales Trend Chart */}
              <FluentCard depth="depth-4" className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Satış Trendi</h3>
                </div>

                {selectedEmployee.salesTrend && selectedEmployee.salesTrend.length > 0 ? (
                  <Line data={getChartData()!} options={chartOptions} />
                ) : (
                  <p className="text-center text-foreground-secondary py-8">Bu dönemde satış verisi bulunamadı</p>
                )}
              </FluentCard>
            </div>
          ) : (
            <FluentCard depth="depth-4" className="p-12 text-center">
              <p className="text-foreground-secondary">Lütfen bir personel seçin</p>
            </FluentCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeePerformance;


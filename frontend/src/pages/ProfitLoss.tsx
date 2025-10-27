import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Banknote, Calendar } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';

const ProfitLoss: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ revenue: 0, expenses: 0, profit: 0, profitMargin: 0 });
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, chartRes] = await Promise.all([
        api.get('/finance/profit-loss'),
        api.get('/finance/profit-loss-chart'),
      ]);
      setStats(statsRes.data);
      setChartData({
        labels: chartRes.data.labels,
        datasets: [
          {
            label: 'Profit',
            data: chartRes.data.profit,
            borderColor: 'hsl(120, 80%, 28%)',
            backgroundColor: 'hsl(120, 80%, 28%, 0.1)',
            fill: true,
          },
          {
            label: 'Loss',
            data: chartRes.data.loss,
            borderColor: 'hsl(355, 80%, 52%)',
            backgroundColor: 'hsl(355, 80%, 52%, 0.1)',
            fill: true,
          },
        ],
      });
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">Profit & Loss</h1>
          <p className="fluent-body text-foreground-secondary mt-1">
          {t('profitLoss.financialOverview') || 'Finansal genel bakış'}
        </p>
        </div>
        <FluentButton appearance="subtle" icon={<Calendar className="w-4 h-4" />}>
          {t('profitLoss.selectPeriod') || 'Dönem Seç'}
        </FluentButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FluentCard depth="depth-4" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-5 h-5 text-success" />
            <p className="fluent-body-small text-foreground-secondary">{t('profitLoss.totalRevenue')}</p>
          </div>
          <p className="fluent-title text-success">₺{stats.revenue.toFixed(2)}</p>
        </FluentCard>

        <FluentCard depth="depth-4" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-5 h-5 text-destructive" />
            <p className="fluent-body-small text-foreground-secondary">{t('profitLoss.totalExpenses')}</p>
          </div>
          <p className="fluent-title text-destructive">₺{stats.expenses.toFixed(2)}</p>
        </FluentCard>

        <FluentCard depth="depth-4" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {stats.profit >= 0 ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
            <p className="fluent-body-small text-foreground-secondary">{t('profitLoss.netProfit')}</p>
          </div>
          <p className={`fluent-title ${stats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
            ₺{stats.profit.toFixed(2)}
          </p>
        </FluentCard>

        <FluentCard depth="depth-4" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-5 h-5 text-primary" />
            <p className="fluent-body-small text-foreground-secondary">{t('profitLoss.profitMargin')}</p>
          </div>
          <p className="fluent-title text-primary">{stats.profitMargin.toFixed(1)}%</p>
        </FluentCard>
      </div>

      {chartData && (
        <FluentCard depth="depth-4" className="p-6">
          <h3 className="fluent-heading text-foreground mb-4">{t('profitLoss.trendChart') || 'Kar/Zarar Trendi'}</h3>
          <div className="h-64">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
              }}
            />
          </div>
        </FluentCard>
      )}
    </div>
  );
};

export default ProfitLoss;


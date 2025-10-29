import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { 
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, 
  Package, Users, ShoppingCart, Calendar
} from 'lucide-react';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import toast from 'react-hot-toast';

interface Stats {
  revenue: number;
  expenses: number;
  profit: number;
  productCount: number;
  customerCount: number;
  salesCount: number;
}

const MobileReports: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    productCount: 0,
    customerCount: 0,
    salesCount: 0,
  });
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [isLoading, setIsLoading] = useState(true);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      const response = await api.get(`/reports/summary?period=${period}`);
      setStats(response.data || stats);
    } catch (error) {
      toast.error('İstatistikler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const periodLabels = {
    today: 'Bugün',
    week: 'Bu Hafta',
    month: 'Bu Ay',
  };

  return (
    <div className="mobile-reports-ultra">
      {/* Header */}
      <div className="mobile-header-ultra">
        <button onClick={() => navigate(-1)} className="back-btn-ultra">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1>Raporlar</h1>
        <div className="w-6 h-6" />
      </div>

      {/* Period Selector */}
      <div className="period-selector-ultra">
        {(['today', 'week', 'month'] as const).map((p) => (
          <button
            key={p}
            className={`period-btn-ultra ${period === p ? 'active' : ''}`}
            onClick={() => { setPeriod(p); hapticFeedback(); soundEffects.tap(); }}
          >
            <Calendar className="w-4 h-4" />
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid-ultra">
        {isLoading ? (
          <div className="loading-ultra">Yükleniyor...</div>
        ) : (
          <>
            <div className="stat-card-ultra revenue">
              <div className="stat-icon-ultra">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="stat-content-ultra">
                <span className="stat-label">Gelir</span>
                <span className="stat-value">₺{stats.revenue.toFixed(2)}</span>
              </div>
            </div>

            <div className="stat-card-ultra expense">
              <div className="stat-icon-ultra">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div className="stat-content-ultra">
                <span className="stat-label">Gider</span>
                <span className="stat-value">₺{stats.expenses.toFixed(2)}</span>
              </div>
            </div>

            <div className="stat-card-ultra profit">
              <div className="stat-icon-ultra">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="stat-content-ultra">
                <span className="stat-label">Kâr</span>
                <span className="stat-value">₺{stats.profit.toFixed(2)}</span>
              </div>
            </div>

            <div className="stat-card-ultra">
              <div className="stat-icon-ultra">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="stat-content-ultra">
                <span className="stat-label">Satış</span>
                <span className="stat-value">{stats.salesCount}</span>
              </div>
            </div>

            <div className="stat-card-ultra">
              <div className="stat-icon-ultra">
                <Package className="w-6 h-6" />
              </div>
              <div className="stat-content-ultra">
                <span className="stat-label">Ürün</span>
                <span className="stat-value">{stats.productCount}</span>
              </div>
            </div>

            <div className="stat-card-ultra">
              <div className="stat-icon-ultra">
                <Users className="w-6 h-6" />
              </div>
              <div className="stat-content-ultra">
                <span className="stat-label">Müşteri</span>
                <span className="stat-value">{stats.customerCount}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileReports;


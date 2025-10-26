import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Package, 
  ShoppingCart,
  Sparkles,
  BarChart3,
  Zap,
  Target
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../lib/utils';

interface SalesPrediction {
  date: string;
  predictedSales: number;
}

interface Anomaly {
  date: string;
  amount: number;
  severity: string;
}

interface StockAnomaly {
  productId: string;
  name: string;
  issue: string;
}

interface StockRecommendation {
  productId: string;
  name: string;
  currentStock: number;
  recommendedOrder: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface ProductRecommendation {
  productId: string;
  name: string;
  reason: string;
  score: number;
}

const AIInsights: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<SalesPrediction[]>([]);
  const [trend, setTrend] = useState<'increasing' | 'decreasing' | 'stable'>('stable');
  const [confidence, setConfidence] = useState(0);
  const [salesAnomalies, setSalesAnomalies] = useState<Anomaly[]>([]);
  const [stockAnomalies, setStockAnomalies] = useState<StockAnomaly[]>([]);
  const [stockRecommendations, setStockRecommendations] = useState<StockRecommendation[]>([]);
  const [productRecommendations, setProductRecommendations] = useState<ProductRecommendation[]>([]);

  useEffect(() => {
    fetchAllAIData();
  }, []);

  const fetchAllAIData = async () => {
    setLoading(true);
    try {
      // Satış tahminleri
      const predictionsRes = await api.get('/ai/predictions/sales?days=7');
      if (predictionsRes.data.success) {
        setPredictions(predictionsRes.data.data?.predictions || predictionsRes.data.data || []);
        setTrend(predictionsRes.data.data?.trend || 'stable');
        setConfidence(predictionsRes.data.data?.confidence || 0);
        
        // Eğer mesaj varsa göster
        if (predictionsRes.data.message) {
          toast(predictionsRes.data.message, { icon: 'ℹ️', duration: 5000 });
        }
      }

      // Anomali tespiti
      const anomaliesRes = await api.get('/ai/anomalies');
      if (anomaliesRes.data.success) {
        setSalesAnomalies(anomaliesRes.data.data?.salesAnomalies || []);
        setStockAnomalies(anomaliesRes.data.data?.stockAnomalies || []);
        
        if (anomaliesRes.data.message) {
          toast(anomaliesRes.data.message, { icon: 'ℹ️', duration: 5000 });
        }
      }

      // Stok önerileri
      const stockRes = await api.get('/ai/recommendations/stock');
      if (stockRes.data.success) {
        setStockRecommendations(stockRes.data.data || []);
        
        if (stockRes.data.message) {
          toast(stockRes.data.message, { icon: 'ℹ️', duration: 5000 });
        }
      }

      // Ürün önerileri
      const productsRes = await api.get('/ai/recommendations/products');
      if (productsRes.data.success) {
        setProductRecommendations(productsRes.data.data || []);
        
        if (productsRes.data.message) {
          toast(productsRes.data.message, { icon: 'ℹ️', duration: 5000 });
        }
      }
    } catch (error: any) {
      console.error('AI data fetch error:', error);
      toast.error(error.response?.data?.error || 'AI verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    if (trend === 'increasing') return <TrendingUp className="w-6 h-6 text-green-600" />;
    if (trend === 'decreasing') return <TrendingDown className="w-6 h-6 text-red-600" />;
    return <BarChart3 className="w-6 h-6 text-blue-600" />;
  };

  const getTrendColor = () => {
    if (trend === 'increasing') return 'from-green-600 to-emerald-700';
    if (trend === 'decreasing') return 'from-red-600 to-rose-700';
    return 'from-blue-600 to-slate-700';
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-lg font-semibold">AI analiz ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">
              Yapay Zeka İçgörüleri
            </h1>
            <p className="text-muted-foreground">AI destekli tahminler ve öneriler</p>
          </div>
        </div>
      </motion.div>

      {/* Satış Tahminleri */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-2 border-blue-400 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getTrendColor()} flex items-center justify-center`}>
                {getTrendIcon()}
              </div>
              <div>
                <div className="text-lg font-bold">7 Günlük Satış Tahmini</div>
                <div className="text-sm font-normal text-muted-foreground">
                  Trend: {trend === 'increasing' ? '📈 Yükseliş' : trend === 'decreasing' ? '📉 Düşüş' : '➡️ Stabil'} • 
                  Güven: {confidence.toFixed(1)}%
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {predictions.map((pred, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border border-blue-100 dark:border-blue-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(pred.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {formatCurrency(pred.predictedSales)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Anomaliler ve Uyarılar */}
      {(salesAnomalies.length > 0 || stockAnomalies.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-2 border-yellow-200 dark:border-yellow-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="text-lg font-bold">Tespit Edilen Anomaliler</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {salesAnomalies.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Satış Anomalileri
                  </h3>
                  <div className="space-y-2">
                    {salesAnomalies.map((anomaly, index) => (
                      <div key={index} className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {new Date(anomaly.date).toLocaleDateString('tr-TR')}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${anomaly.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                            {anomaly.severity === 'high' ? 'Yüksek' : 'Orta'} Seviye
                          </span>
                        </div>
                        <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 mt-1">
                          Olağandışı satış: {formatCurrency(anomaly.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stockAnomalies.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Stok Anomalileri
                  </h3>
                  <div className="space-y-2">
                    {stockAnomalies.map((anomaly, index) => (
                      <div key={index} className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{anomaly.name}</div>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{anomaly.issue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stok Önerileri */}
        {stockRecommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-2 border-blue-400 dark:border-blue-900 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-lg font-bold">Akıllı Stok Önerileri</div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stockRecommendations.slice(0, 5).map((rec, index) => (
                    <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border border-blue-100 dark:border-blue-900">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{rec.name}</div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityBadge(rec.priority)}`}>
                          {rec.priority === 'high' ? 'Acil' : rec.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">Mevcut: <span className="font-bold">{rec.currentStock}</span></span>
                        <span className="text-blue-700 dark:text-blue-400">Öneri: <span className="font-bold">+{rec.recommendedOrder}</span></span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Popüler Ürünler */}
        {productRecommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-2 border-purple-200 dark:border-purple-900 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-lg font-bold">En Popüler Ürünler</div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productRecommendations.map((rec, index) => (
                    <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-100 dark:border-purple-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{rec.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{rec.reason}</span>
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-400">•</span>
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-400">{rec.score} satış</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* AI Güç Göstergesi */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Card className="bg-gradient-to-r from-blue-600 to-slate-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Yapay Zeka Aktif</h3>
                <p className="text-sm text-blue-100">
                  Tüm analizler gerçek zamanlı verilerinizle çalışıyor. Tahminler ve öneriler sürekli güncelleniyor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AIInsights;


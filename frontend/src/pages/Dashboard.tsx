import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import QuickActions from '../components/Dashboard/QuickActions';
import RecentActivity from '../components/Dashboard/RecentActivity';
import { DashboardStats } from '../types';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, Package, Users, AlertCircle, AlertTriangle, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Dashboard verileri yüklenemedi</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Bugünkü Satış",
      value: formatCurrency(stats.todayRevenue),
      description: `${stats.todaySalesCount} adet satış`,
      icon: TrendingUp,
      color: "from-blue-600 to-blue-700",
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: "Aylık Satış",
      value: formatCurrency(stats.monthRevenue),
      description: `${stats.monthSalesCount} adet satış`,
      icon: DollarSign,
      color: "from-slate-700 to-slate-800",
      trend: { value: 8.2, isPositive: true },
    },
    {
      title: "Toplam Ürün",
      value: stats.totalProducts,
      description: "Aktif ürünler",
      icon: Package,
      color: "from-blue-700 to-blue-800",
    },
    {
      title: "Toplam Müşteri",
      value: stats.totalCustomers,
      description: "Kayıtlı müşteriler",
      icon: Users,
      color: "from-slate-600 to-slate-700",
    },
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-[34px] font-bold text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2 text-[15px] font-normal">Genel bakış ve istatistikler</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Low Stock Alert - Apple Minimal */}
      {stats.lowStockProducts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="group"
        >
          <Card className="bg-card apple-shadow hover:apple-shadow-md transition-all duration-200 border border-orange-200 dark:border-orange-900">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex-shrink-0 p-2.5 rounded-xl bg-orange-500/10">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-0.5">
                  Düşük Stok Uyarısı
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-orange-600 dark:text-orange-400 font-semibold">
                    {stats.lowStockProducts}
                  </span>
                  {' '}ürün stok seviyesinin altında
                </p>
              </div>
              
              <button 
                className="px-4 py-2 rounded-lg bg-orange-500/90 hover:bg-orange-500 active:bg-orange-600 text-white text-sm font-medium transition-all duration-200"
                onClick={() => navigate('/products')}
              >
                Görüntüle
              </button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Line Chart - Apple Minimal */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card apple-shadow hover:apple-shadow-md transition-all duration-200">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <span>📈</span> Son 7 Günlük Satışlar
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.last7DaysChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-800" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280" 
                    style={{ fontSize: '12px', fontWeight: 500 }} 
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    style={{ fontSize: '12px', fontWeight: 500 }} 
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #e5e7eb', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                      fontWeight: 500 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#007AFF" 
                    strokeWidth={2.5}
                    dot={{ fill: '#007AFF', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sales Count Bar Chart - Apple Minimal */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card apple-shadow hover:apple-shadow-md transition-all duration-200">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <span>📊</span> Satış Adetleri
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.last7DaysChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-800" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280" 
                    style={{ fontSize: '12px', fontWeight: 500 }} 
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    style={{ fontSize: '12px', fontWeight: 500 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #e5e7eb', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                      fontWeight: 500 
                    }} 
                  />
                  <Bar 
                    dataKey="salesCount" 
                    fill="#6B7280" 
                    radius={[8, 8, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="bg-card apple-shadow hover:apple-shadow-md transition-all duration-200">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                En Çok Satan Ürünler (Bu Ay)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {stats.topProducts.map((item, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: index * 0.05 }} 
                    className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{item.product?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.totalQuantity} adet
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-foreground">
                        {formatCurrency(item.totalRevenue || 0)}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {stats.topProducts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">Henüz satış yok</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import QuickActions from '../components/Dashboard/QuickActions';
import RecentActivity from '../components/Dashboard/RecentActivity';
import { DashboardStats } from '../types';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, Package, Users, AlertCircle, DollarSign, Brain, Sparkles } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
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
      color: "from-green-500 to-emerald-600",
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: "Aylık Satış",
      value: formatCurrency(stats.monthRevenue),
      description: `${stats.monthSalesCount} adet satış`,
      icon: DollarSign,
      color: "from-blue-500 to-cyan-600",
      trend: { value: 8.2, isPositive: true },
    },
    {
      title: "Toplam Ürün",
      value: stats.totalProducts,
      description: "Aktif ürünler",
      icon: Package,
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Toplam Müşteri",
      value: stats.totalCustomers,
      description: "Kayıtlı müşteriler",
      icon: Users,
      color: "from-orange-500 to-red-600",
    },
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Genel bakış ve istatistikler</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockProducts > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-orange-500/50 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 rounded-full bg-orange-500/20">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-sm">
                <span className="font-semibold text-orange-600 dark:text-orange-400">{stats.lowStockProducts}</span> ürün stok seviyesinin altında!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Line Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Son 7 Günlük Satışlar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.last7DaysChart}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sales Count Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Satış Adetleri</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.last7DaysChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="salesCount" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="glass">
            <CardHeader><CardTitle>En Çok Satan Ürünler (Bu Ay)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topProducts.map((item, index) => (
                  <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                    <div className="flex-1"><p className="font-medium">{item.product?.name}</p><p className="text-sm text-muted-foreground">{item.totalQuantity} adet satıldı</p></div>
                    <div className="text-right"><p className="font-semibold text-green-600">{formatCurrency(item.totalRevenue || 0)}</p></div>
                  </motion.div>
                ))}
                {stats.topProducts.length === 0 && (<p className="text-center text-muted-foreground py-4">Henüz satış yok</p>)}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>

      {/* Enterprise Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <Card className="border-2 border-blue-500/20">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              Gelişmiş Analitikler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-blue-700 dark:text-blue-400">Satış Trendi</h3>
                </div>
                <p className="text-sm text-muted-foreground">Bu ay %12 artış</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {formatCurrency(stats.monthRevenue)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-orange-700 dark:text-orange-400">Stok Durumu</h3>
                </div>
                <p className="text-sm text-muted-foreground">{stats.lowStockProducts} ürün kritik seviyede</p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-purple-700 dark:text-purple-400">Aktif Müşteriler</h3>
                </div>
                <p className="text-sm text-muted-foreground">Toplam {stats.totalCustomers} kayıtlı</p>
              </div>
            </div>

            {/* Feature Badges */}
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Gerçek Zamanlı İzleme
              </div>
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Gelişmiş Raporlama
              </div>
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium">
                📊 Modern Dashboard
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;


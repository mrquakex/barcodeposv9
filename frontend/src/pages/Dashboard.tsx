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
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2 font-semibold">Genel bakış ve istatistikler</p>
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
          <Card className="border-2 border-orange-500/50 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 shadow-lg">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="p-3 rounded-xl bg-orange-500/20 shadow-md">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-base font-semibold">
                <span className="font-black text-orange-600 dark:text-orange-400 text-lg">{stats.lowStockProducts}</span> ürün stok seviyesinin altında!
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
          <Card className="border-2 border-blue-400 dark:border-blue-900 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
              <CardTitle className="text-xl font-black text-slate-900 dark:text-white">📈 Son 7 Günlük Satışlar</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.last7DaysChart}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontWeight: 600 }} />
                  <YAxis stroke="#6b7280" style={{ fontWeight: 600 }} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: '12px', border: '2px solid #2563eb', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563eb" 
                    strokeWidth={4}
                    dot={{ fill: '#2563eb', r: 6, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
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
          <Card className="border-2 border-slate-300 dark:border-slate-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950/20 dark:to-blue-950/20 border-b-2">
              <CardTitle className="text-xl font-black text-slate-900 dark:text-white">📊 Satış Adetleri</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.last7DaysChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontWeight: 600 }} />
                  <YAxis stroke="#6b7280" style={{ fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #475569', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', fontWeight: 'bold' }} />
                  <Bar dataKey="salesCount" fill="#475569" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="border-2 border-blue-400 dark:border-blue-900 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
              <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                En Çok Satan Ürünler (Bu Ay)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {stats.topProducts.map((item, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: index * 0.1 }} 
                    className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-400 dark:border-blue-900 hover:shadow-lg transition-all hover:scale-[1.02]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-md">
                      <span className="text-white font-black text-xl">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-base text-slate-900 dark:text-white">{item.product?.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
                        📦 {item.totalQuantity} adet satıldı
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
                        {formatCurrency(item.totalRevenue || 0)}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {stats.topProducts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 font-semibold">Henüz satış yok</p>
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

      {/* Enterprise Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <Card className="border-2 border-blue-400 dark:border-blue-900 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
            <CardTitle className="flex items-center gap-3 text-xl font-black">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-md">
                <Brain className="w-6 h-6 text-white" />
              </div>
              Gelişmiş Analitikler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-400 dark:border-blue-800 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Satış Trendi</h3>
                </div>
                <p className="text-sm text-muted-foreground font-semibold mb-2">Bu ay %12 artış</p>
                <p className="text-3xl font-black text-blue-700 dark:text-blue-400">
                  {formatCurrency(stats.monthRevenue)}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-2 border-orange-200 dark:border-orange-800 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Stok Durumu</h3>
                </div>
                <p className="text-sm text-muted-foreground font-semibold mb-2">{stats.lowStockProducts} ürün kritik seviyede</p>
                <p className="text-3xl font-black text-orange-600">⚠️ Dikkat</p>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950/20 dark:to-blue-950/20 border-2 border-slate-200 dark:border-slate-800 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-6 h-6 text-slate-600" />
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Müşteriler</h3>
                </div>
                <p className="text-sm text-muted-foreground font-semibold mb-2">Kayıtlı müşteriler</p>
                <p className="text-3xl font-black text-slate-700 dark:text-slate-400">
                  {stats.totalCustomers}
                </p>
              </div>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-3 pt-4 border-t-2">
              <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-slate-700 text-white text-sm font-black flex items-center gap-2 shadow-lg">
                <Sparkles className="w-5 h-5" />
                Gerçek Zamanlı İzleme
              </div>
              <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-slate-700 to-blue-600 text-white text-sm font-black flex items-center gap-2 shadow-lg">
                <Brain className="w-5 h-5" />
                Gelişmiş Raporlama
              </div>
              <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-700 to-slate-600 text-white text-sm font-black shadow-lg">
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


import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Sale } from '../../types';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const SalesReport: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data.sales);
    } catch (error) {
      toast.error('Satış verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethodData = sales.reduce((acc: any, sale) => {
    const method = sale.paymentMethod;
    acc[method] = (acc[method] || 0) + sale.netAmount;
    return acc;
  }, {});

  const chartData = Object.keys(paymentMethodData).map(key => ({
    name: key === 'CASH' ? 'Nakit' : key === 'CREDIT_CARD' ? 'Kredi Kartı' : key,
    value: paymentMethodData[key],
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
  const totalRevenue = sales.reduce((sum, s) => sum + s.netAmount, 0);

  if (loading) return <div className="flex items-center justify-center h-full"><p>Yükleniyor...</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Satış Raporları</h1>
        <p className="text-muted-foreground mt-1">Detaylı satış analitiği</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Ödeme Yöntemlerine Göre Satışlar</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`} outerRadius={80} fill="#8884d8" dataKey="value">{chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>

        <Card><CardHeader><CardTitle>Satış Özeti</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex justify-between"><span>Toplam Satış:</span><span className="font-bold">{sales.length} adet</span></div><div className="flex justify-between"><span>Toplam Gelir:</span><span className="font-bold text-green-600">{formatCurrency(totalRevenue)}</span></div><div className="flex justify-between"><span>Ortalama Sepet:</span><span className="font-bold">{formatCurrency(sales.length > 0 ? totalRevenue / sales.length : 0)}</span></div></CardContent></Card>
      </div>
    </div>
  );
};

export default SalesReport;


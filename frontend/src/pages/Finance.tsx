import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import api from '../lib/api';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import toast from 'react-hot-toast';

const Finance: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, cashFlowRes] = await Promise.all([
        api.get('/finance/summary'),
        api.get('/finance/cash-flow'),
      ]);
      setSummary(summaryRes.data);
      setCashFlow(cashFlowRes.data.cashFlow);
    } catch (error) {
      toast.error('Finans verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><p>Yükleniyor...</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">Finans Yönetimi</h1>
        <p className="text-muted-foreground mt-2 font-semibold">Gelir, gider ve kar zarar analizi</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-2 border-green-200 dark:border-green-900 shadow-lg"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-bold">Toplam Gelir</CardTitle><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-md"><DollarSign className="h-5 w-5 text-white" /></div></CardHeader><CardContent><div className="text-3xl font-black text-green-600">{formatCurrency(summary?.totalRevenue || 0)}</div><p className="text-xs text-muted-foreground font-semibold mt-1">{summary?.salesCount || 0} satış</p></CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-2 border-red-200 dark:border-red-900 shadow-lg"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-bold">Toplam Gider</CardTitle><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-700 flex items-center justify-center shadow-md"><TrendingDown className="h-5 w-5 text-white" /></div></CardHeader><CardContent><div className="text-3xl font-black text-red-600">{formatCurrency(summary?.totalExpenses || 0)}</div><p className="text-xs text-muted-foreground font-semibold mt-1">{summary?.expensesCount || 0} gider</p></CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="border-2 border-blue-400 dark:border-blue-900 shadow-lg"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-bold">Net Kar/Zarar</CardTitle><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-md"><PiggyBank className="h-5 w-5 text-white" /></div></CardHeader><CardContent><div className={`text-3xl font-black ${(summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(summary?.netProfit || 0)}</div><p className="text-xs text-muted-foreground font-semibold mt-1">Son 30 gün</p></CardContent></Card>
        </motion.div>
      </div>

      <Card className="border-2 border-blue-400 dark:border-blue-900 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
          <CardTitle className="text-xl font-black text-slate-900 dark:text-white">📊 Nakit Akışı (Son 30 Gün)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={cashFlow}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(value) => formatCurrency(Number(value))} /><Legend /><Bar dataKey="income" fill="#10b981" name="Gelir" /><Bar dataKey="expense" fill="#ef4444" name="Gider" /></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Finance;



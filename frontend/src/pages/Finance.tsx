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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Finans Yönetimi</h1>
        <p className="text-muted-foreground mt-1">Gelir, gider ve kar zarar analizi</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="glass"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle><div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600"><DollarSign className="h-4 w-4 text-white" /></div></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalRevenue || 0)}</div><p className="text-xs text-muted-foreground">{summary?.salesCount || 0} satış</p></CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="glass"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Toplam Gider</CardTitle><div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600"><TrendingDown className="h-4 w-4 text-white" /></div></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalExpenses || 0)}</div><p className="text-xs text-muted-foreground">{summary?.expensesCount || 0} gider</p></CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="glass"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Net Kar/Zarar</CardTitle><div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600"><PiggyBank className="h-4 w-4 text-white" /></div></CardHeader><CardContent><div className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(summary?.netProfit || 0)}</div><p className="text-xs text-muted-foreground">Son 30 gün</p></CardContent></Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader><CardTitle>Nakit Akışı (Son 30 Gün)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={cashFlow}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(value) => formatCurrency(Number(value))} /><Legend /><Bar dataKey="income" fill="#10b981" name="Gelir" /><Bar dataKey="expense" fill="#ef4444" name="Gider" /></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Finance;


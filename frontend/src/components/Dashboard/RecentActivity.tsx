import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import api from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Clock } from 'lucide-react';

const RecentActivity: React.FC = () => {
  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => {
    fetchRecentSales();
  }, []);

  const fetchRecentSales = async () => {
    try {
      const response = await api.get('/dashboard/recent-sales?limit=5');
      setRecentSales(response.data.sales);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card className="glass">
      <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />Son İşlemler</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {recentSales.map((sale, index) => (
          <motion.div key={sale.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
            <div><p className="font-medium text-sm">{sale.saleNumber}</p><p className="text-xs text-muted-foreground">{sale.user?.name} • {formatDate(sale.createdAt)}</p></div>
            <span className="font-bold text-green-600">{formatCurrency(sale.netAmount)}</span>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;


import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/Card';
import { Link } from 'react-router-dom';
import { BarChart3, Package, Users, DollarSign, TrendingUp, PieChart } from 'lucide-react';

const ReportsHub: React.FC = () => {
  const reportTypes = [
    { icon: BarChart3, title: 'Satış Raporları', desc: 'Detaylı satış analitiği', path: '/reports/sales', color: 'from-blue-500 to-cyan-600' },
    { icon: Package, title: 'Ürün Raporları', desc: 'Envanter analizi', path: '/reports/products', color: 'from-purple-500 to-pink-600' },
    { icon: DollarSign, title: 'Finans Raporları', desc: 'Gelir gider analizi', path: '/reports/financial', color: 'from-green-500 to-emerald-600' },
    { icon: Users, title: 'Müşteri Raporları', desc: 'Müşteri davranış analizi', path: '/reports/customers', color: 'from-orange-500 to-red-600' },
    { icon: TrendingUp, title: 'Stok Raporları', desc: 'Stok hareket analizi', path: '/reports/stock', color: 'from-indigo-500 to-purple-600' },
    { icon: PieChart, title: 'Karlılık Raporları', desc: 'Kar zarar analizi', path: '/reports/profitability', color: 'from-pink-500 to-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Raporlar</h1>
        <p className="text-muted-foreground mt-1">Kapsamlı iş analitiği ve raporlama</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          return (
            <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -5 }}>
              <Link to={report.path}>
                <Card className="cursor-pointer hover:shadow-lg transition-all glass">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${report.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{report.title}</h3>
                    <p className="text-sm text-muted-foreground">{report.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportsHub;


import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { ShoppingCart, Package, Users, Building2, DollarSign, FileText } from 'lucide-react';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  
  const actions = [
    { icon: ShoppingCart, label: 'Yeni Satış', path: '/pos', color: 'from-blue-500 to-cyan-600' },
    { icon: Package, label: 'Ürün Ekle', path: '/products', color: 'from-blue-600 to-slate-700' },
    { icon: Users, label: 'Müşteri Ekle', path: '/customers', color: 'from-orange-500 to-red-600' },
    { icon: Building2, label: 'Tedarikçi', path: '/suppliers', color: 'from-green-500 to-emerald-600' },
    { icon: DollarSign, label: 'Gider Ekle', path: '/expenses', color: 'from-red-600 to-red-700' },
    { icon: FileText, label: 'Raporlar', path: '/reports', color: 'from-slate-600 to-slate-700' },
  ];

  return (
    <Card className="glass">
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4">Hızlı İşlemler</h3>
        <div className="grid grid-cols-3 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-center">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;



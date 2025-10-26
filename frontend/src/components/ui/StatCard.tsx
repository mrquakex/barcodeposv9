import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon: Icon, color, trend }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-lg hover:shadow-2xl transition-all bg-white dark:bg-slate-900">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</CardTitle>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{value}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{description}</p>
            {trend && (
              <span className={`text-xs font-bold ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;



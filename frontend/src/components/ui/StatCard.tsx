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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
      className="group"
    >
      <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
        {/* Modern Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300`} />
        
        {/* Glassmorphism Border Shine */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Top Accent Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6">
          <CardTitle className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {title}
          </CardTitle>
          <motion.div 
            className={`p-2.5 md:p-3 rounded-2xl bg-gradient-to-br ${color} shadow-lg group-hover:shadow-xl transition-all duration-300`}
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </motion.div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <motion.div 
            className="text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {value}
          </motion.div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400">
              {description}
            </p>
            {trend && (
              <motion.span 
                className={`text-xs md:text-sm font-bold px-2 py-1 rounded-lg ${
                  trend.isPositive 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </motion.span>
            )}
          </div>
          
          {/* Modern Progress Bar (optional visual enhancement) */}
          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full bg-gradient-to-r ${color} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: trend ? `${Math.min(trend.value * 10, 100)}%` : '60%' }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;



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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className="relative overflow-hidden shadow hover:shadow-md transition-all duration-200">
        {/* Subtle Top Accent Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${color} shadow`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-2">
          <div className="text-2xl font-semibold text-slate-900 dark:text-white">
            {value}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {description}
            </p>
            {trend && (
              <span 
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  trend.isPositive 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
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



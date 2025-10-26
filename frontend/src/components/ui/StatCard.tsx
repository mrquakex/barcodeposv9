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
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="relative overflow-hidden apple-shadow hover:apple-shadow-md transition-all duration-300 bg-white dark:bg-[#1C1C1E]">
        {/* Apple-style minimal accent (no gradient) */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-primary opacity-80`} />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="p-2 rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 pb-5">
          <div className="text-3xl font-semibold text-foreground tracking-tight">
            {value}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm font-normal text-muted-foreground">
              {description}
            </p>
            {trend && (
              <span 
                className={`text-xs font-medium px-2 py-1 rounded-md ${
                  trend.isPositive 
                    ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400' 
                    : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'
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



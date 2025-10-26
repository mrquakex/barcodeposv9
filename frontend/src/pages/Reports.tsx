import React from 'react';
import { BarChart3, TrendingUp, Package, Users, DollarSign, FileText } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';

const Reports: React.FC = () => {
  const reportTypes = [
    {
      title: 'Sales Report',
      description: 'View detailed sales analytics and trends',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Product Performance',
      description: 'Analyze best-selling products and inventory',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Customer Analytics',
      description: 'Customer behavior and loyalty insights',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Financial Report',
      description: 'Profit, loss, and expense analysis',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      title: 'Inventory Report',
      description: 'Stock levels and movements',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    },
    {
      title: 'Custom Report',
      description: 'Create custom reports with filters',
      icon: FileText,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="fluent-title text-foreground">Reports</h1>
        <p className="fluent-body text-foreground-secondary mt-1">
          Generate and view business reports
        </p>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          return (
            <FluentCard key={index} elevation="depth4" hover className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${report.bgColor}`}>
                <Icon className={`w-6 h-6 ${report.color}`} />
              </div>
              <h3 className="fluent-heading text-foreground mb-2">{report.title}</h3>
              <p className="fluent-body-small text-foreground-secondary mb-4">
                {report.description}
              </p>
              <FluentButton appearance="primary" size="small" className="w-full">
                Generate Report
              </FluentButton>
            </FluentCard>
          );
        })}
      </div>

      {/* Quick Stats */}
      <FluentCard elevation="depth4" className="p-6">
        <h3 className="fluent-heading text-foreground mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-background-alt rounded">
            <p className="fluent-caption text-foreground-secondary mb-1">Today's Sales</p>
            <p className="fluent-subtitle text-foreground">₺0.00</p>
          </div>
          <div className="p-4 bg-background-alt rounded">
            <p className="fluent-caption text-foreground-secondary mb-1">This Week</p>
            <p className="fluent-subtitle text-foreground">₺0.00</p>
          </div>
          <div className="p-4 bg-background-alt rounded">
            <p className="fluent-caption text-foreground-secondary mb-1">This Month</p>
            <p className="fluent-subtitle text-foreground">₺0.00</p>
          </div>
          <div className="p-4 bg-background-alt rounded">
            <p className="fluent-caption text-foreground-secondary mb-1">This Year</p>
            <p className="fluent-subtitle text-foreground">₺0.00</p>
          </div>
        </div>
      </FluentCard>
    </div>
  );
};

export default Reports;


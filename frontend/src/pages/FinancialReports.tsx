import React, { useState } from 'react';
import { BarChart3, Receipt, TrendingUp } from 'lucide-react';
import FluentTabs from '../components/fluent/FluentTabs';

// Import existing components
import Expenses from './Expenses';
import ProfitLoss from './ProfitLoss';

const FinancialReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profit-loss' | 'expenses'>('profit-loss');

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-7 h-7" />
          Finansal Raporlar
        </h1>
        <p className="text-sm text-foreground-secondary mt-1">
          Kar/zarar analizi ve gider takibi
        </p>
      </div>

      {/* Tabs */}
      <FluentTabs
        tabs={[
          { id: 'profit-loss', label: 'Kar/Zarar', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'expenses', label: 'Giderler', icon: <Receipt className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      />

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'profit-loss' && <ProfitLoss />}
        {activeTab === 'expenses' && <Expenses />}
      </div>
    </div>
  );
};

export default FinancialReports;


import React, { useState } from 'react';
import { Package, TrendingUp, TrendingDown, ClipboardList, ArrowRightLeft } from 'lucide-react';
import FluentTabs from '../components/fluent/FluentTabs';

// Import existing components
import StockMovements from './StockMovements';
import StockCount from './StockCount';
import StockTransfer from './StockTransfer';

const StockManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movements' | 'counts' | 'transfers'>('movements');

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Package className="w-7 h-7" />
          Stok Yönetimi
        </h1>
        <p className="text-sm text-foreground-secondary mt-1">
          Hareketler, sayımlar ve transferler
        </p>
      </div>

      {/* Tabs */}
      <FluentTabs
        tabs={[
          { id: 'movements', label: 'Stok Hareketleri', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'counts', label: 'Sayımlar', icon: <ClipboardList className="w-4 h-4" /> },
          { id: 'transfers', label: 'Transferler', icon: <ArrowRightLeft className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      />

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'movements' && <StockMovements />}
        {activeTab === 'counts' && <StockCount />}
        {activeTab === 'transfers' && <StockTransfer />}
      </div>
    </div>
  );
};

export default StockManagement;


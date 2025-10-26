import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, ArrowRightLeft } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface StockTransfer {
  id: string;
  transferNumber: string;
  status: string;
  fromBranch: { name: string };
  toBranch: { name: string };
  user: { name: string };
  createdAt: string;
  _count?: { items: number };
}

const StockTransfer: React.FC = () => {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const response = await api.get('/stock-transfers');
      setTransfers(response.data);
    } catch (error) {
      toast.error('Failed to fetch transfers');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">Stock Transfers</h1>
          <p className="fluent-body text-foreground-secondary mt-1">{transfers.length} transfers</p>
        </div>
        <FluentButton appearance="primary" icon={<Plus className="w-4 h-4" />}>
          New Transfer
        </FluentButton>
      </div>

      <div className="space-y-3">
        {transfers.map((transfer) => (
          <FluentCard key={transfer.id} depth="depth-4" hoverable className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="fluent-body font-medium text-foreground">
                    {transfer.transferNumber}
                  </h4>
                  <FluentBadge
                    appearance={
                      transfer.status === 'RECEIVED'
                        ? 'success'
                        : transfer.status === 'CANCELLED'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  >
                    {transfer.status}
                  </FluentBadge>
                </div>
                <div className="flex gap-4 text-sm text-foreground-secondary">
                  <span>
                    {transfer.fromBranch.name} → {transfer.toBranch.name}
                  </span>
                  <span>Items: {transfer._count?.items || 0}</span>
                  <span>By: {transfer.user.name}</span>
                  <span>
                    {new Date(transfer.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <FluentButton appearance="subtle" size="small" icon={<Eye className="w-4 h-4" />}>
                View
              </FluentButton>
            </div>
          </FluentCard>
        ))}
      </div>

      {transfers.length === 0 && (
        <div className="text-center py-12">
          <ArrowRightLeft className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="fluent-body text-foreground-secondary">No transfers yet</p>
        </div>
      )}
    </div>
  );
};

export default StockTransfer;


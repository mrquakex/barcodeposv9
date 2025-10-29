import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, RotateCcw } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Return {
  id: string;
  returnNumber: string;
  refundAmount: number;
  refundMethod: string;
  status: string;
  reason: string;
  sale: { saleNumber: string };
  user: { name: string };
  createdAt: string;
  _count?: { items: number };
}

const Returns: React.FC = () => {
  const { t } = useTranslation();
  const [returns, setReturns] = useState<Return[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      console.log('🔍 [RETURNS-WEB] Fetching returns...');
      const response = await api.get('/returns');
      console.log('📦 [RETURNS-WEB] Full response:', response);
      console.log('📦 [RETURNS-WEB] Response data:', response.data);
      console.log('📦 [RETURNS-WEB] response.data.returns:', response.data.returns);
      
      // Backend can return either {returns: [...]} or direct array
      const returnsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.returns || []);
      
      console.log('✅ [RETURNS-WEB] Parsed returns:', returnsData);
      console.log('✅ [RETURNS-WEB] Count:', returnsData.length);
      
      setReturns(returnsData);
    } catch (error) {
      console.error('❌ [RETURNS-WEB] Fetch error:', error);
      toast.error(t('returns.fetchError'));
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
          <h1 className="fluent-title text-foreground">{t('returns.title')}</h1>
          <p className="fluent-body text-foreground-secondary mt-1">{returns.length} returns</p>
        </div>
        <FluentButton appearance="primary" icon={<Plus className="w-4 h-4" />}>
          New Return
        </FluentButton>
      </div>

      <FluentCard depth="depth-4" className="p-4">
        <FluentInput placeholder={t('returns.searchPlaceholder') || 'İade ara...'} icon={<Search className="w-4 h-4" />} />
      </FluentCard>

      <div className="space-y-3">
        {returns.map((ret) => (
          <FluentCard key={ret.id} depth="depth-4" hoverable className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="fluent-body font-medium text-foreground">{ret.returnNumber}</h4>
                  <FluentBadge
                    appearance={
                      ret.status === 'COMPLETED'
                        ? 'success'
                        : ret.status === 'REJECTED'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  >
                    {ret.status}
                  </FluentBadge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                  <span>Sale: {ret.sale.saleNumber}</span>
                  <span>Items: {ret._count?.items || 0}</span>
                  <span>Method: {ret.refundMethod}</span>
                  <span>By: {ret.user.name}</span>
                  <span>
                    {new Date(ret.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground-tertiary mt-1 line-clamp-1">{ret.reason}</p>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <p className="fluent-heading text-destructive">-₺{ret.refundAmount.toFixed(2)}</p>
                <FluentButton appearance="subtle" size="small" icon={<Eye className="w-4 h-4" />}>
                  View
                </FluentButton>
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      {returns.length === 0 && (
        <div className="text-center py-12">
          <RotateCcw className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="fluent-body text-foreground-secondary">No returns yet</p>
        </div>
      )}
    </div>
  );
};

export default Returns;


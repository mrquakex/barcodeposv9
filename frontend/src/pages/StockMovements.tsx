import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, ArrowRightLeft, Calendar } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  product: { name: string; barcode: string };
  user?: { name: string };
  createdAt: string;
  notes?: string;
}

const StockMovements: React.FC = () => {
  const { t } = useTranslation();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const response = await api.get('/stock-movements');
      setMovements(response.data.movements || response.data || []);
    } catch (error) {
      toast.error(t('stockMovements.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'OUT':
        return <TrendingDown className="w-5 h-5 text-destructive" />;
      case 'TRANSFER':
        return <ArrowRightLeft className="w-5 h-5 text-primary" />;
      default:
        return <TrendingUp className="w-5 h-5 text-foreground-secondary" />;
    }
  };

  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      m.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.product.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">{t('stockMovements.loadingMovements')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="fluent-title text-foreground">{t('stockMovements.title')}</h1>
        <p className="fluent-body text-foreground-secondary mt-1">
          {t('stockMovements.movementsCount', { count: filteredMovements.length })}
        </p>
      </div>

      {/* Filters */}
      <FluentCard depth="depth-4" className="p-4">
        <div className="flex flex-col md:flex-row gap-2">
          <FluentInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('stockMovements.searchPlaceholder') || 'Ürün adı veya barkod ile ara...'}
            icon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <div className="flex gap-2">
            {['ALL', 'IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'].map((type) => (
              <FluentButton
                key={type}
                appearance={filterType === type ? 'primary' : 'subtle'}
                size="small"
                onClick={() => setFilterType(type)}
              >
                {type === 'ALL' ? t('common.all') : 
                 type === 'IN' ? t('stockMovements.in') : 
                 type === 'OUT' ? t('stockMovements.out') : 
                 type === 'TRANSFER' ? t('stockMovements.transfer') || 'Transfer' : 
                 t('stockMovements.adjustment')}
              </FluentButton>
            ))}
          </div>
        </div>
      </FluentCard>

      {/* Movements List */}
      <div className="space-y-3">
        {filteredMovements.map((movement) => (
          <FluentCard key={movement.id} depth="depth-4" hoverable className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Icon */}
              <div className="w-12 h-12 bg-background-alt rounded-full flex items-center justify-center shrink-0">
                {getTypeIcon(movement.type)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="fluent-body font-medium text-foreground">
                    {movement.product.name}
                  </h4>
                  <FluentBadge
                    appearance={
                      movement.type === 'IN'
                        ? 'success'
                        : movement.type === 'OUT'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  >
                    {movement.type === 'IN' ? t('stockMovements.in') :
                     movement.type === 'OUT' ? t('stockMovements.out') :
                     movement.type === 'TRANSFER' ? t('stockMovements.transfer') :
                     t('stockMovements.adjustment')}
                  </FluentBadge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                  <span>{t('products.barcode')}: {movement.product.barcode}</span>
                  <span>
                    {t('common.quantity')}: {movement.type === 'OUT' ? '-' : '+'}
                    {movement.quantity}
                  </span>
                  <span>
                    {t('products.stock')}: {movement.previousStock} → {movement.newStock}
                  </span>
                  {movement.user && <span>{t('common.by')}: {movement.user.name}</span>}
                  <span>
                    {new Date(movement.createdAt).toLocaleDateString('tr-TR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {movement.notes && (
                  <p className="text-sm text-foreground-tertiary mt-1">{t('stockMovements.notes')}: {movement.notes}</p>
                )}
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredMovements.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="fluent-body text-foreground-secondary">
            {searchTerm || filterType !== 'ALL' ? t('common.noData') : t('stockMovements.noMovementsYet') || 'Henüz hareket yok'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StockMovements;


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, X, Check, AlertCircle, Package, Search, CheckCircle,
} from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface StockCountItem {
  id: string;
  productId: string;
  systemQty: number;
  countedQty: number;
  difference: number;
  product: {
    id: string;
    barcode: string;
    name: string;
    unit: string;
    stock: number;
  };
}

interface StockCount {
  id: string;
  countNumber: string;
  type: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  user: { name: string };
  items: StockCountItem[];
}

const StockCountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stockCount, setStockCount] = useState<StockCount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState('');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [applyChanges, setApplyChanges] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStockCount();
    }
  }, [id]);

  const fetchStockCount = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/stock-counts/${id}`);
      setStockCount(response.data.count);
    } catch (error) {
      toast.error('Stok sayımı yüklenemedi');
      navigate('/stock-count');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (itemId: string, countedQty: number) => {
    if (!stockCount || !id) return;

    try {
      await api.post(`/stock-counts/${id}/update-item`, {
        itemId,
        countedQty,
      });
      toast.success('Sayım güncellendi');
      fetchStockCount();
      setEditingItemId(null);
      setEditingQty('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Güncelleme başarısız');
    }
  };

  const handleComplete = async () => {
    if (!id) return;

    try {
      await api.post(`/stock-counts/${id}/complete`, { applyChanges });
      toast.success(
        applyChanges
          ? 'Sayım tamamlandı ve stoklar güncellendi'
          : 'Sayım tamamlandı'
      );
      setShowCompleteDialog(false);
      navigate('/stock-count');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Tamamlama başarısız');
    }
  };

  const handleCancel = async () => {
    if (!id) return;

    if (!window.confirm('Stok sayımını iptal etmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await api.post(`/stock-counts/${id}/cancel`);
      toast.success('Sayım iptal edildi');
      navigate('/stock-count');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İptal başarısız');
    }
  };

  const filteredItems = stockCount?.items.filter((item) =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const stats = {
    total: stockCount?.items.length || 0,
    counted: stockCount?.items.filter(i => i.countedQty > 0).length || 0,
    withDiff: stockCount?.items.filter(i => i.difference !== 0).length || 0,
    totalDiff: stockCount?.items.reduce((sum, i) => sum + Math.abs(i.difference), 0) || 0,
  };

  const progress = stats.total > 0 ? (stats.counted / stats.total) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!stockCount) {
    return null;
  }

  const isInProgress = stockCount.status === 'IN_PROGRESS';

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FluentButton
            appearance="subtle"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/stock-count')}
          />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {stockCount.countNumber}
            </h1>
            <p className="text-sm text-foreground-secondary">
              {new Date(stockCount.startedAt).toLocaleString('tr-TR')} • {stockCount.user.name}
            </p>
          </div>
          <FluentBadge
            appearance={
              stockCount.status === 'IN_PROGRESS'
                ? 'warning'
                : stockCount.status === 'COMPLETED'
                ? 'success'
                : 'error'
            }
          >
            {stockCount.status === 'IN_PROGRESS'
              ? 'Devam Ediyor'
              : stockCount.status === 'COMPLETED'
              ? 'Tamamlandı'
              : 'İptal Edildi'}
          </FluentBadge>
        </div>
        {isInProgress && (
          <div className="flex gap-2">
            <FluentButton
              appearance="subtle"
              icon={<X className="w-4 h-4" />}
              onClick={handleCancel}
            >
              İptal
            </FluentButton>
            <FluentButton
              appearance="primary"
              icon={<Check className="w-4 h-4" />}
              onClick={() => setShowCompleteDialog(true)}
            >
              Tamamla
            </FluentButton>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Toplam Ürün</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Sayılan</p>
          <p className="text-2xl font-bold text-primary">{stats.counted}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Fark Olan</p>
          <p className="text-2xl font-bold text-warning">{stats.withDiff}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Toplam Fark</p>
          <p className="text-2xl font-bold text-error">{stats.totalDiff}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">İlerleme</p>
          <p className="text-2xl font-bold text-success">{progress.toFixed(0)}%</p>
        </FluentCard>
      </div>

      {/* Progress Bar */}
      {isInProgress && (
        <div className="w-full bg-background-alt rounded-full h-2">
          <div
            className="bg-success h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Search */}
      <FluentCard depth="depth-4" className="p-4">
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Ürün ara (isim veya barkod)..."
          icon={<Search className="w-4 h-4" />}
        />
      </FluentCard>

      {/* Items Table */}
      <FluentCard depth="depth-4" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-alt border-b border-border">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-foreground-secondary">Barkod</th>
                <th className="text-left p-3 text-xs font-medium text-foreground-secondary">Ürün Adı</th>
                <th className="text-right p-3 text-xs font-medium text-foreground-secondary">Sistem</th>
                <th className="text-right p-3 text-xs font-medium text-foreground-secondary">Sayılan</th>
                <th className="text-right p-3 text-xs font-medium text-foreground-secondary">Fark</th>
                <th className="text-right p-3 text-xs font-medium text-foreground-secondary">Birim</th>
                {isInProgress && (
                  <th className="text-right p-3 text-xs font-medium text-foreground-secondary">İşlem</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={isInProgress ? 7 : 6} className="p-8 text-center text-foreground-secondary">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Ürün bulunamadı</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-background-alt transition-colors">
                    <td className="p-3 text-sm text-foreground">{item.product.barcode}</td>
                    <td className="p-3 text-sm font-medium text-foreground">{item.product.name}</td>
                    <td className="p-3 text-sm text-right text-foreground">{item.systemQty}</td>
                    <td className="p-3 text-sm text-right">
                      {editingItemId === item.id ? (
                        <input
                          type="number"
                          value={editingQty}
                          onChange={(e) => setEditingQty(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateItem(item.id, parseFloat(editingQty));
                            } else if (e.key === 'Escape') {
                              setEditingItemId(null);
                              setEditingQty('');
                            }
                          }}
                          className="w-20 px-2 py-1 text-right border border-primary rounded bg-background"
                          autoFocus
                        />
                      ) : (
                        <span className={item.countedQty > 0 ? 'font-semibold text-success' : ''}>
                          {item.countedQty}
                        </span>
                      )}
                    </td>
                    <td className={`p-3 text-sm text-right font-semibold ${
                      item.difference > 0 ? 'text-success' :
                      item.difference < 0 ? 'text-error' : 'text-foreground-secondary'
                    }`}>
                      {item.difference > 0 && '+'}
                      {item.difference}
                    </td>
                    <td className="p-3 text-sm text-right text-foreground-secondary">{item.product.unit}</td>
                    {isInProgress && (
                      <td className="p-3 text-right">
                        {editingItemId === item.id ? (
                          <div className="flex justify-end gap-1">
                            <FluentButton
                              size="small"
                              appearance="primary"
                              icon={<Check className="w-3 h-3" />}
                              onClick={() => handleUpdateItem(item.id, parseFloat(editingQty))}
                            />
                            <FluentButton
                              size="small"
                              appearance="subtle"
                              icon={<X className="w-3 h-3" />}
                              onClick={() => {
                                setEditingItemId(null);
                                setEditingQty('');
                              }}
                            />
                          </div>
                        ) : (
                          <FluentButton
                            size="small"
                            appearance="subtle"
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditingQty(item.countedQty.toString());
                            }}
                          >
                            Sayım Gir
                          </FluentButton>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FluentCard>

      {/* Complete Dialog */}
      <FluentDialog
        open={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        title="Stok Sayımını Tamamla"
        size="medium"
      >
        <div className="space-y-4">
          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-info mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Özet</p>
                <ul className="text-sm text-foreground-secondary space-y-1">
                  <li>Toplam {stats.total} ürün sayıldı</li>
                  <li>{stats.withDiff} üründe fark tespit edildi</li>
                  <li>Toplam {stats.totalDiff} adet fark var</li>
                </ul>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={applyChanges}
              onChange={(e) => setApplyChanges(e.target.checked)}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Farkları stoka uygula</p>
              <p className="text-xs text-foreground-secondary">
                Tespit edilen farklar sistem stoklarına işlenecek ve stok hareketleri oluşturulacak
              </p>
            </div>
          </label>

          <div className="flex gap-2 justify-end pt-4">
            <FluentButton
              appearance="subtle"
              onClick={() => setShowCompleteDialog(false)}
            >
              İptal
            </FluentButton>
            <FluentButton
              appearance="primary"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={handleComplete}
            >
              Tamamla
            </FluentButton>
          </div>
        </div>
      </FluentDialog>
    </div>
  );
};

export default StockCountDetail;


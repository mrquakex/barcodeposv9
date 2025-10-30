import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, RotateCcw, Trash2, CheckCircle, X } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentDialog from '../components/fluent/FluentDialog';
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
  sale: { id: string; saleNumber: string };
  user: { name: string };
  createdAt: string;
  completedAt?: string;
  items: Array<{
    id: string;
    product: { name: string; barcode: string };
    quantity: number;
    price: number;
    total: number;
  }>;
}

const Returns: React.FC = () => {
  const { t } = useTranslation();
  const [returns, setReturns] = useState<Return[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create form
  const [sales, setSales] = useState<any[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<Array<{ productId: string; quantity: number; price: number }>>([]);
  const [returnReason, setReturnReason] = useState('Müşteri talebi');
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const response = await api.get('/returns');
      setReturns(Array.isArray(response.data) ? response.data : (response.data.returns || []));
    } catch (error) {
      toast.error('İadeler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data.sales || []);
    } catch (error) {
      toast.error('Satışlar yüklenemedi');
    }
  };

  const handleOpenCreateDialog = () => {
    fetchSales();
    setShowCreateDialog(true);
  };

  const handleSaleSelect = async (saleId: string) => {
    setSelectedSaleId(saleId);
    
    if (!saleId) {
      setSelectedSale(null);
      setReturnItems([]);
      return;
    }

    try {
      const response = await api.get(`/sales/${saleId}`);
      const sale = response.data.sale;
      setSelectedSale(sale);
      
      // Pre-populate with all sale items
      setReturnItems(
        sale.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice,
        }))
      );
    } catch (error) {
      toast.error('Satış detayı yüklenemedi');
    }
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    const updated = [...returnItems];
    updated[index].quantity = quantity;
    setReturnItems(updated);
  };

  const handleCreateReturn = async () => {
    if (!selectedSaleId) {
      toast.error('Lütfen bir satış seçin');
      return;
    }

    const validItems = returnItems.filter(item => item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Lütfen iade edilecek ürünleri seçin');
      return;
    }

    try {
      await api.post('/returns', {
        saleId: selectedSaleId,
        items: validItems,
        reason: returnReason,
        refundMethod,
        notes,
      });

      toast.success('İade oluşturuldu!');
      fetchReturns();
      setShowCreateDialog(false);
      setSelectedSaleId('');
      setSelectedSale(null);
      setReturnItems([]);
      setReturnReason('Müşteri talebi');
      setRefundMethod('CASH');
      setNotes('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İade oluşturulamadı');
    }
  };

  const handleViewDetail = async (returnId: string) => {
    try {
      const response = await api.get(`/returns/${returnId}`);
      setSelectedReturn(response.data.return);
      setShowDetailDialog(true);
    } catch (error) {
      toast.error('İade detayı yüklenemedi');
    }
  };

  const handleCompleteReturn = async (returnId: string) => {
    if (!confirm('Bu iade tamamlanacak ve ürünler stoka eklenecek. Onaylıyor musunuz?')) return;

    try {
      await api.post(`/returns/${returnId}/complete`);
      toast.success('İade tamamlandı ve ürünler stoka eklendi!');
      fetchReturns();
      if (showDetailDialog) setShowDetailDialog(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İade tamamlanamadı');
    }
  };

  const handleUpdateStatus = async (returnId: string, status: string) => {
    try {
      await api.put(`/returns/${returnId}/status`, { status });
      toast.success('Durum güncellendi');
      fetchReturns();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Durum güncellenemedi');
    }
  };

  const handleDeleteReturn = async (returnId: string) => {
    if (!confirm('Bu iadeyi silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/returns/${returnId}`);
      toast.success('İade silindi');
      fetchReturns();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İade silinemedi');
    }
  };

  const filteredReturns = returns.filter(
    (ret) =>
      ret.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="p-4 md:p-8 space-y-8 fluent-mica">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            🔄 İadeler
          </h1>
          <p className="text-base text-foreground-secondary">
            Satış iadelerini yönetin ve stok güncelleyin
          </p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreateDialog}
        >
          Yeni İade
        </FluentButton>
      </div>

      {/* Search */}
      <FluentCard depth="depth-4" className="p-4">
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="İade veya satış numarası ara..."
          icon={<Search className="w-4 h-4" />}
        />
      </FluentCard>

      {/* Returns List */}
      <div className="space-y-3">
        {filteredReturns.map((ret) => (
          <FluentCard key={ret.id} depth="depth-4" hoverable className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground">{ret.returnNumber}</h4>
                  <FluentBadge
                    appearance={
                      ret.status === 'COMPLETED'
                        ? 'success'
                        : ret.status === 'APPROVED'
                        ? 'info'
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
                  <span>Satış: {ret.sale.saleNumber}</span>
                  <span>Sebep: {ret.reason}</span>
                  <span>İşlem Yapan: {ret.user.name}</span>
                  <span>{new Date(ret.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <p className="text-2xl font-bold text-destructive">-₺{Number(ret.refundAmount).toFixed(2)}</p>
                <div className="flex gap-2">
                  <FluentButton
                    appearance="subtle"
                    size="small"
                    icon={<Eye className="w-3 h-3" />}
                    onClick={() => handleViewDetail(ret.id)}
                  >
                    Detay
                  </FluentButton>
                  {(ret.status === 'PENDING' || ret.status === 'APPROVED') && (
                    <FluentButton
                      appearance="primary"
                      size="small"
                      icon={<CheckCircle className="w-3 h-3" />}
                      onClick={() => handleCompleteReturn(ret.id)}
                    >
                      Tamamla
                    </FluentButton>
                  )}
                  {ret.status !== 'COMPLETED' && (
                    <FluentButton
                      appearance="subtle"
                      size="small"
                      icon={<Trash2 className="w-3 h-3" />}
                      onClick={() => handleDeleteReturn(ret.id)}
                    >
                      Sil
                </FluentButton>
                  )}
                </div>
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredReturns.length === 0 && (
        <div className="text-center py-12">
          <RotateCcw className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="text-foreground-secondary">Henüz iade yok</p>
        </div>
      )}

      {/* Create Return Dialog */}
      <FluentDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Yeni İade"
        size="large"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Satış Seçin *
            </label>
            <select
              value={selectedSaleId}
              onChange={(e) => handleSaleSelect(e.target.value)}
              className="w-full h-10 px-3 bg-input border border-border rounded text-foreground"
            >
              <option value="">Satış seçin...</option>
              {sales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {sale.saleNumber} - ₺{Number(sale.total).toFixed(2)} ({new Date(sale.createdAt).toLocaleDateString('tr-TR')})
                </option>
              ))}
            </select>
          </div>

          {selectedSale && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-2">
                    İade Sebebi *
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full h-10 px-3 bg-input border border-border rounded text-foreground"
                  >
                    <option>Müşteri talebi</option>
                    <option>Ürün hasarlı</option>
                    <option>Yanlış ürün</option>
                    <option>Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-2">
                    İade Yöntemi *
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="w-full h-10 px-3 bg-input border border-border rounded text-foreground"
                  >
                    <option value="CASH">Nakit</option>
                    <option value="CARD">Kart</option>
                    <option value="CREDIT">Cari Hesap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                  İade Edilecek Ürünler *
                </label>
                <div className="space-y-2">
                  {selectedSale.items.map((saleItem: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-background-alt rounded">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{saleItem.product.name}</p>
                        <p className="text-xs text-foreground-secondary">
                          Satış Miktarı: {saleItem.quantity} | Birim Fiyat: ₺{Number(saleItem.unitPrice).toFixed(2)}
                        </p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={saleItem.quantity}
                        value={returnItems[index]?.quantity || 0}
                        onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value) || 0)}
                        className="w-24 h-10 px-3 bg-input border border-border rounded text-foreground"
                        placeholder="Miktar"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                  Notlar
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-20 px-3 py-2 bg-input border border-border rounded text-foreground resize-none"
                  placeholder="İade notları..."
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4 border-t border-border">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={() => setShowCreateDialog(false)}
            >
              İptal
            </FluentButton>
            <FluentButton
              appearance="primary"
              className="flex-1"
              onClick={handleCreateReturn}
              disabled={!selectedSaleId}
            >
              İade Oluştur
            </FluentButton>
          </div>
        </div>
      </FluentDialog>

      {/* Detail Dialog */}
      <FluentDialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title="İade Detayı"
        size="large"
      >
        {selectedReturn && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground-secondary">İade No</p>
                <p className="font-medium text-foreground">{selectedReturn.returnNumber}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Durum</p>
                <FluentBadge
                  appearance={
                    selectedReturn.status === 'COMPLETED' ? 'success' :
                    selectedReturn.status === 'APPROVED' ? 'info' :
                    selectedReturn.status === 'REJECTED' ? 'error' : 'warning'
                  }
                >
                  {selectedReturn.status}
                </FluentBadge>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Satış No</p>
                <p className="font-medium text-foreground">{selectedReturn.sale.saleNumber}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">İade Sebebi</p>
                <p className="font-medium text-foreground">{selectedReturn.reason}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">İşlem Tarihi</p>
                <p className="font-medium text-foreground">
                  {new Date(selectedReturn.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
              {selectedReturn.completedAt && (
                <div>
                  <p className="text-sm text-foreground-secondary">Tamamlanma Tarihi</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedReturn.completedAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">İade Edilen Ürünler</h4>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full">
                  <thead className="bg-background-alt">
                    <tr>
                      <th className="text-left py-2 px-3 text-sm font-medium text-foreground-secondary">Ürün</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Miktar</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Birim</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReturn.items.map((item: any) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="py-2 px-3">
                          <p className="font-medium text-foreground">{item.product.name}</p>
                          <p className="text-xs text-foreground-secondary">{item.product.barcode}</p>
                        </td>
                        <td className="py-2 px-3 text-right text-foreground">{item.quantity}</td>
                        <td className="py-2 px-3 text-right text-foreground">₺{Number(item.price).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-medium text-foreground">
                          ₺{Number(item.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between">
                    <span className="font-bold text-foreground">İade Tutarı:</span>
                    <span className="text-xl font-bold text-destructive">
                      -₺{Number(selectedReturn.refundAmount).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground-secondary text-right mt-1">
                    Yöntem: {selectedReturn.refundMethod}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <FluentButton
                appearance="subtle"
                className="flex-1"
                onClick={() => setShowDetailDialog(false)}
              >
                Kapat
              </FluentButton>
              {(selectedReturn.status === 'PENDING' || selectedReturn.status === 'APPROVED') && (
                <FluentButton
                  appearance="primary"
                  className="flex-1"
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleCompleteReturn(selectedReturn.id);
                  }}
                >
                  Tamamla
                </FluentButton>
              )}
            </div>
          </div>
        )}
      </FluentDialog>
    </div>
  );
};

export default Returns;

import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, FileText, Download, Send, Trash2, AlertCircle } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentDialog from '../components/fluent/FluentDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  customer: { name: string; email: string; phone: string; address?: string };
  sale: { 
    saleNumber: string; 
    items: Array<{
      product: { name: string; barcode: string };
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
  };
  createdAt: string;
  sentAt?: string;
  eInvoiceData?: string;
}

const Invoices: React.FC = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create invoice form
  const [availableSales, setAvailableSales] = useState<any[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [invoiceType, setInvoiceType] = useState('E_INVOICE');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data.invoices || []);
    } catch (error) {
      toast.error('Faturalar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSales = async () => {
    try {
      // Get all sales
      const response = await api.get('/sales');
      const allSales = response.data.sales || [];

      // Filter sales that have a customer and don't have an invoice yet
      const existingInvoiceSaleIds = invoices.map(inv => inv.sale?.saleNumber);
      const available = allSales.filter(
        (sale: any) => 
          sale.customerId && 
          !existingInvoiceSaleIds.includes(sale.saleNumber)
      );

      setAvailableSales(available);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      toast.error('Satışlar yüklenemedi');
    }
  };

  const handleOpenCreateDialog = () => {
    fetchAvailableSales();
    setShowCreateDialog(true);
  };

  const handleCreateInvoice = async () => {
    if (!selectedSaleId) {
      toast.error('Lütfen bir satış seçin');
      return;
    }

    try {
      const response = await api.post('/invoices', {
        saleId: selectedSaleId,
        type: invoiceType,
      });

      toast.success('Fatura oluşturuldu!');
      fetchInvoices();
      setShowCreateDialog(false);
      setSelectedSaleId('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Fatura oluşturulamadı');
    }
  };

  const handleViewDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailDialog(true);
  };

  const handleSendToGIB = async (invoiceId: string) => {
    try {
      const response = await api.post(`/invoices/${invoiceId}/send-to-gib`);
      toast.success(response.data.message);
      if (response.data.warning) {
        toast(response.data.warning, { icon: '⚠️', duration: 5000 });
      }
      fetchInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Fatura gönderilemedi');
    }
  };

  const handleUpdateStatus = async (invoiceId: string, status: string) => {
    try {
      await api.put(`/invoices/${invoiceId}/status`, { status });
      toast.success('Durum güncellendi');
      fetchInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Durum güncellenemedi');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Bu faturayı silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/invoices/${invoiceId}`);
      toast.success('Fatura silindi');
      fetchInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Fatura silinemedi');
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            📄 E-Fatura
          </h1>
          <p className="text-base text-foreground-secondary">
            Elektronik fatura oluşturun ve GİB'e gönderin
          </p>
        </div>
        <FluentButton 
          appearance="primary" 
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreateDialog}
        >
          Yeni Fatura
        </FluentButton>
      </div>

      {/* Info Banner */}
      <FluentCard depth="depth-4" className="p-4 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">GİB Entegrasyonu</p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Gerçek GİB entegrasyonu için bir e-fatura sağlayıcısı (Logo, Foriba, Uyumsoft) gereklidir. 
              Şu anda test modunda çalışıyorsunuz.
            </p>
          </div>
        </div>
      </FluentCard>

      {/* Search */}
      <FluentCard depth="depth-4" className="p-4">
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Fatura ara..."
          icon={<Search className="w-4 h-4" />}
        />
      </FluentCard>

      {/* Invoices List */}
      <div className="space-y-3">
        {filteredInvoices.map((invoice) => (
          <FluentCard key={invoice.id} depth="depth-4" hoverable className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground">
                    {invoice.invoiceNumber}
                  </h4>
                  <FluentBadge appearance="info" size="small">
                    {invoice.type}
                  </FluentBadge>
                  <FluentBadge
                    appearance={
                      invoice.status === 'APPROVED'
                        ? 'success'
                        : invoice.status === 'SENT'
                        ? 'info'
                        : invoice.status === 'REJECTED' || invoice.status === 'CANCELLED'
                        ? 'error'
                        : 'default'
                    }
                    size="small"
                  >
                    {invoice.status}
                  </FluentBadge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                  <span>Müşteri: {invoice.customer.name}</span>
                  <span>Satış: {invoice.sale.saleNumber}</span>
                  <span>
                    {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <p className="text-2xl font-bold text-foreground">₺{Number(invoice.total).toFixed(2)}</p>
                <div className="flex gap-2">
                  <FluentButton
                    appearance="subtle"
                    size="small"
                    icon={<Eye className="w-3 h-3" />}
                    onClick={() => handleViewDetail(invoice)}
                  >
                    Detay
                  </FluentButton>
                  {invoice.status === 'DRAFT' && (
                    <>
                      <FluentButton
                        appearance="primary"
                        size="small"
                        icon={<Send className="w-3 h-3" />}
                        onClick={() => handleSendToGIB(invoice.id)}
                      >
                        GİB'e Gönder
                      </FluentButton>
                      <FluentButton
                        appearance="subtle"
                        size="small"
                        icon={<Trash2 className="w-3 h-3" />}
                        onClick={() => handleDeleteInvoice(invoice.id)}
                      >
                        Sil
                      </FluentButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="text-foreground-secondary">Henüz fatura yok</p>
        </div>
      )}

      {/* Create Invoice Dialog */}
      <FluentDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Yeni Fatura Oluştur"
        size="medium"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Satış Seçin
            </label>
            <select
              value={selectedSaleId}
              onChange={(e) => setSelectedSaleId(e.target.value)}
              className="w-full h-10 px-3 bg-input border border-border rounded text-foreground"
            >
              <option value="">Satış seçin...</option>
              {availableSales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {sale.saleNumber} - {sale.customer?.name} - ₺{Number(sale.total).toFixed(2)}
                </option>
              ))}
            </select>
            {availableSales.length === 0 && (
              <p className="text-xs text-foreground-secondary mt-1">
                Faturası olmayan ve müşterisi olan satış bulunamadı
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Fatura Tipi
            </label>
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value)}
              className="w-full h-10 px-3 bg-input border border-border rounded text-foreground"
            >
              <option value="E_INVOICE">E-Fatura</option>
              <option value="E_ARCHIVE">E-Arşiv</option>
              <option value="STANDARD">Standart Fatura</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
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
              onClick={handleCreateInvoice}
              disabled={!selectedSaleId}
            >
              Oluştur
            </FluentButton>
          </div>
        </div>
      </FluentDialog>

      {/* Invoice Detail Dialog */}
      <FluentDialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title="Fatura Detayı"
        size="large"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground-secondary">Fatura No</p>
                <p className="font-medium text-foreground">{selectedInvoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Durum</p>
                <FluentBadge
                  appearance={
                    selectedInvoice.status === 'APPROVED' ? 'success' :
                    selectedInvoice.status === 'SENT' ? 'info' :
                    selectedInvoice.status === 'REJECTED' ? 'error' : 'default'
                  }
                >
                  {selectedInvoice.status}
                </FluentBadge>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Oluşturma Tarihi</p>
                <p className="font-medium text-foreground">
                  {new Date(selectedInvoice.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
              {selectedInvoice.sentAt && (
                <div>
                  <p className="text-sm text-foreground-secondary">Gönderim Tarihi</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedInvoice.sentAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">Müşteri Bilgileri</h4>
              <div className="p-4 bg-background-alt rounded">
                <p className="font-medium text-foreground">{selectedInvoice.customer.name}</p>
                <p className="text-sm text-foreground-secondary">{selectedInvoice.customer.email}</p>
                <p className="text-sm text-foreground-secondary">{selectedInvoice.customer.phone}</p>
                {selectedInvoice.customer.address && (
                  <p className="text-sm text-foreground-secondary mt-1">{selectedInvoice.customer.address}</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">Ürünler</h4>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full">
                  <thead className="bg-background-alt">
                    <tr>
                      <th className="text-left py-2 px-3 text-sm font-medium text-foreground-secondary">Ürün</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Miktar</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Birim Fiyat</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.sale.items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="py-2 px-3">
                          <p className="font-medium text-foreground">{item.product.name}</p>
                          <p className="text-xs text-foreground-secondary">{item.product.barcode}</p>
                        </td>
                        <td className="py-2 px-3 text-right text-foreground">{item.quantity}</td>
                        <td className="py-2 px-3 text-right text-foreground">
                          ₺{Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-foreground">
                          ₺{Number(item.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Ara Toplam:</span>
                    <span className="font-medium text-foreground">
                      ₺{Number(selectedInvoice.subtotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">KDV:</span>
                    <span className="font-medium text-foreground">
                      ₺{Number(selectedInvoice.taxAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-bold text-foreground">Toplam:</span>
                    <span className="text-xl font-bold text-primary">
                      ₺{Number(selectedInvoice.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <FluentButton
                appearance="subtle"
                className="flex-1"
                onClick={() => setShowDetailDialog(false)}
              >
                Kapat
              </FluentButton>
              {selectedInvoice.status === 'DRAFT' && (
                <FluentButton
                  appearance="primary"
                  className="flex-1"
                  icon={<Send className="w-4 h-4" />}
                  onClick={() => {
                    handleSendToGIB(selectedInvoice.id);
                    setShowDetailDialog(false);
                  }}
                >
                  GİB'e Gönder
                </FluentButton>
              )}
            </div>
          </div>
        )}
      </FluentDialog>
    </div>
  );
};

export default Invoices;

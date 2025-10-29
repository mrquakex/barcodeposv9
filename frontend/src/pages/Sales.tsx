import React, { useState, useEffect } from 'react';
import { Search, FileText, Printer, Eye, Calendar, RotateCcw } from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Sale {
  id: string;
  saleNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
  customer?: { name: string };
  user: { name: string };
  createdAt: string;
  _count?: { items: number };
}

const Sales: React.FC = () => {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      console.log('🔍 [SALES-WEB] Fetching sales...');
      const response = await api.get('/sales');
      console.log('📦 [SALES-WEB] Full response:', response);
      console.log('📦 [SALES-WEB] Response data:', response.data);
      console.log('📦 [SALES-WEB] response.data.sales:', response.data.sales);
      
      // Backend can return either {sales: [...]} or direct array
      const salesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.sales || []);
      
      console.log('✅ [SALES-WEB] Parsed sales:', salesData);
      console.log('✅ [SALES-WEB] Count:', salesData.length);
      
      setSales(salesData);
    } catch (error) {
      console.error('❌ [SALES-WEB] Fetch error:', error);
      toast.error(t('sales.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async (saleId: string) => {
    try {
      const response = await api.get(`/sales/${saleId}/receipt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${saleId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error(t('sales.printError'));
    }
  };

  const handleRefund = async (sale: Sale) => {
    if (!window.confirm(`${sale.saleNumber} numaralı satış için tam iade yapmak istediğinizden emin misiniz?`)) {
      return;
    }

    setIsProcessingRefund(true);
    try {
      // Get sale details with items
      const response = await api.get(`/sales/${sale.id}`);
      const saleDetails = response.data;

      // Prepare refund items (all items, full quantity)
      const refundItems = saleDetails.items.map((item: any) => ({
        saleItemId: item.id,
        quantity: item.quantity,
      }));

      // Process refund
      await api.post('/sales/return', {
        saleId: sale.id,
        items: refundItems,
      });

      toast.success('İade işlemi başarıyla tamamlandı!');
      fetchSales(); // Refresh sales list
    } catch (error: any) {
      console.error('Refund error:', error);
      toast.error(error.response?.data?.error || 'İade işlemi başarısız');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const filteredSales = sales.filter(
    (s) =>
      s.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">{t('sales.loadingSales')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 fluent-mica">
      {/* 🎨 Modern Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('sales.title')}</h1>
          <p className="text-base text-foreground-secondary">
            {t('sales.salesCount', { count: filteredSales.length })}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <FluentCard depth="depth-4" className="p-4">
        <div className="flex flex-col md:flex-row gap-2">
          <FluentInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('sales.searchPlaceholder') || 'Satış no veya müşteri adı ile ara...'}
            icon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <FluentButton appearance="subtle" icon={<Calendar className="w-4 h-4" />}>
            {t('sales.filterByDate')}
          </FluentButton>
        </div>
      </FluentCard>

      {/* Sales List */}
      <div className="space-y-3">
        {filteredSales.map((sale) => (
          <FluentCard key={sale.id} depth="depth-4" hoverable className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Icon */}
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="fluent-body font-medium text-foreground">
                    {sale.saleNumber}
                  </h4>
                  <FluentBadge
                    appearance={
                      sale.status === 'COMPLETED'
                        ? 'success'
                        : sale.status === 'VOIDED'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  >
                    {sale.status}
                  </FluentBadge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                  <span>
                    {new Date(sale.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {sale.customer && <span>{t('pos.customer')}: {sale.customer.name}</span>}
                  <span>{t('sales.cashier') || 'Kasiyer'}: {sale.user.name}</span>
                  <span>{t('sales.items')}: {sale._count?.items || 0}</span>
                  <span>{t('pos.paymentMethod')}: {sale.paymentMethod}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="flex flex-col md:items-end gap-2">
                <div className="text-right">
                  <p className="fluent-caption text-foreground-secondary">Total</p>
                  <p className="fluent-heading text-foreground">
                    ₺{sale.total.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <FluentButton
                    appearance="subtle"
                    size="small"
                    icon={<Eye className="w-3 h-3" />}
                  >
                    View
                  </FluentButton>
                  <FluentButton
                    appearance="subtle"
                    size="small"
                    icon={<Printer className="w-3 h-3" />}
                    onClick={() => handlePrint(sale.id)}
                  >
                    {t('common.print')}
                  </FluentButton>
                  <FluentButton
                    appearance="subtle"
                    size="small"
                    icon={<RotateCcw className="w-3 h-3" />}
                    onClick={() => handleRefund(sale)}
                    disabled={isProcessingRefund}
                  >
                    İade Et
                  </FluentButton>
                </div>
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="fluent-body text-foreground-secondary">
            {searchTerm ? t('common.noData') : t('sales.noSalesYet') || 'Henüz satış yok'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Sales;


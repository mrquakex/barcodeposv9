import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, CreditCard, Package, Printer, RotateCcw } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface SaleDetail {
  id: string;
  saleNumber: string;
  total: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  paymentMethod: string;
  createdAt: string;
  user: { name: string };
  customer?: { name: string; email?: string; phone?: string };
  items: Array<{
    id: string;
    product: { name: string; barcode: string };
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
    total: number;
  }>;
}

const SalesDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSaleDetail();
    }
  }, [id]);

  const fetchSaleDetail = async () => {
    try {
      const response = await api.get(`/sales/${id}`);
      setSale(response.data.sale);
    } catch (error) {
      toast.error('Satış detayı yüklenemedi');
      navigate('/sales');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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

  if (!sale) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-foreground-secondary">Satış bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 fluent-mica print:p-8 print:bg-white">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <FluentButton
          appearance="subtle"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/sales')}
        >
          Geri
        </FluentButton>
        <div className="flex gap-2">
          <FluentButton
            appearance="subtle"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Yazdır
          </FluentButton>
          <FluentButton
            appearance="subtle"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={() => navigate(`/returns?saleId=${sale.id}`)}
          >
            İade Oluştur
          </FluentButton>
        </div>
      </div>

      {/* Sale Header */}
      <FluentCard depth="depth-4" className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Satış #{sale.saleNumber}
            </h1>
            <p className="text-foreground-secondary">
              {new Date(sale.createdAt).toLocaleString('tr-TR')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-foreground-secondary mb-1">Toplam Tutar</p>
            <p className="text-4xl font-bold text-primary">
              ₺{Number(sale.total).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-foreground-secondary">Satış Yapan</p>
              <p className="font-medium text-foreground">{sale.user.name}</p>
            </div>
          </div>

          {sale.customer && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Müşteri</p>
                <p className="font-medium text-foreground">{sale.customer.name}</p>
                {sale.customer.phone && (
                  <p className="text-xs text-foreground-secondary">{sale.customer.phone}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-foreground-secondary">Ödeme Yöntemi</p>
              <p className="font-medium text-foreground">{sale.paymentMethod}</p>
            </div>
          </div>
        </div>
      </FluentCard>

      {/* Items */}
      <FluentCard depth="depth-4" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Ürünler</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr>
                <th className="text-left py-3 px-2 text-sm font-medium text-foreground-secondary">Ürün</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-foreground-secondary">Miktar</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-foreground-secondary">Birim Fiyat</th>
                {sale.items.some(i => i.discount && i.discount > 0) && (
                  <th className="text-right py-3 px-2 text-sm font-medium text-foreground-secondary">İndirim</th>
                )}
                {sale.items.some(i => i.taxRate && i.taxRate > 0) && (
                  <th className="text-right py-3 px-2 text-sm font-medium text-foreground-secondary">KDV</th>
                )}
                <th className="text-right py-3 px-2 text-sm font-medium text-foreground-secondary">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 px-2">
                    <p className="font-medium text-foreground">{item.product.name}</p>
                    <p className="text-xs text-foreground-secondary">{item.product.barcode}</p>
                  </td>
                  <td className="py-3 px-2 text-right text-foreground">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-2 text-right text-foreground">
                    ₺{Number(item.unitPrice).toFixed(2)}
                  </td>
                  {sale.items.some(i => i.discount && i.discount > 0) && (
                    <td className="py-3 px-2 text-right text-orange-600">
                      {item.discount ? `-₺${Number(item.discount).toFixed(2)}` : '-'}
                    </td>
                  )}
                  {sale.items.some(i => i.taxRate && i.taxRate > 0) && (
                    <td className="py-3 px-2 text-right text-foreground-secondary">
                      {item.taxRate ? `%${item.taxRate}` : '-'}
                    </td>
                  )}
                  <td className="py-3 px-2 text-right font-medium text-foreground">
                    ₺{Number(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-6 pt-6 border-t-2 border-border">
          <div className="w-full md:w-80 space-y-2">
            {sale.subtotal && (
              <div className="flex justify-between text-foreground-secondary">
                <span>Ara Toplam:</span>
                <span>₺{Number(sale.subtotal).toFixed(2)}</span>
              </div>
            )}
            {sale.discountAmount && sale.discountAmount > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>İndirim:</span>
                <span>-₺{Number(sale.discountAmount).toFixed(2)}</span>
              </div>
            )}
            {sale.taxAmount && sale.taxAmount > 0 && (
              <div className="flex justify-between text-foreground-secondary">
                <span>KDV:</span>
                <span>₺{Number(sale.taxAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-bold text-primary pt-2 border-t border-border">
              <span>Toplam:</span>
              <span>₺{Number(sale.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </FluentCard>

      {/* Timeline */}
      <FluentCard depth="depth-4" className="p-6 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Zaman Çizelgesi</h2>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Satış Oluşturuldu</p>
              <p className="text-sm text-foreground-secondary">
                {new Date(sale.createdAt).toLocaleString('tr-TR')}
              </p>
              <p className="text-sm text-foreground-secondary mt-1">
                {sale.user.name} tarafından {sale.items.length} ürün satıldı
              </p>
            </div>
          </div>

          <div className="flex gap-4 opacity-50">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Ödeme Alındı</p>
              <p className="text-sm text-foreground-secondary">
                {new Date(sale.createdAt).toLocaleString('tr-TR')}
              </p>
              <p className="text-sm text-foreground-secondary mt-1">
                {sale.paymentMethod} ile ₺{Number(sale.total).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </FluentCard>
    </div>
  );
};

export default SalesDetail;


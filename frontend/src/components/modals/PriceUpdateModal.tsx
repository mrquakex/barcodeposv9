import React, { useState } from 'react';
import { X, DollarSign, Save } from 'lucide-react';
import FluentButton from '../fluent/FluentButton';
import toast from 'react-hot-toast';

interface PriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: {
    id: string;
    name: string;
    barcode: string;
    buyPrice: number;
    sellPrice: number;
    taxRate: number;
  };
}

const PriceUpdateModal: React.FC<PriceUpdateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product
}) => {
  const [buyPrice, setBuyPrice] = useState(product.buyPrice);
  const [sellPrice, setSellPrice] = useState(product.sellPrice);
  const [taxRate, setTaxRate] = useState(product.taxRate);
  const [loading, setLoading] = useState(false);

  const profitMargin = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice * 100) : 0;
  const profit = sellPrice - buyPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sellPrice <= 0) {
      toast.error('Satış fiyatı 0\'dan büyük olmalıdır');
      return;
    }

    setLoading(true);
    try {
      const { default: api } = await import('../../lib/api');
      
      await api.put(`/products/${product.id}`, {
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        taxRate: Number(taxRate)
      });

      toast.success('✅ Fiyatlar güncellendi');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Price update error:', error);
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Fiyat Güncelle
              </h2>
              <p className="text-sm text-foreground-secondary">
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Buy Price */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Alış Fiyatı (₺)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary">
                ₺
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 bg-card border border-border rounded-lg text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Sell Price */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Satış Fiyatı (₺) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary">
                ₺
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={sellPrice}
                onChange={(e) => setSellPrice(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 bg-card border border-border rounded-lg text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Tax Rate */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              KDV Oranı (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary">
                %
              </span>
            </div>
          </div>

          {/* Profit Summary */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
              Kar Özeti
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800 dark:text-blue-400">Kar Marjı:</span>
                <span className={`text-sm font-semibold ${
                  profitMargin > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {profitMargin.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800 dark:text-blue-400">Birim Kar:</span>
                <span className={`text-sm font-semibold ${
                  profit > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {profit.toFixed(2)} ₺
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-blue-300 dark:border-blue-700">
                <span className="text-sm text-blue-800 dark:text-blue-400">KDV Dahil Fiyat:</span>
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  {(sellPrice * (1 + taxRate / 100)).toFixed(2)} ₺
                </span>
              </div>
            </div>
          </div>

          {/* Quick Margin Buttons */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Hızlı Kar Marjı
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, 50].map(margin => (
                <button
                  key={margin}
                  type="button"
                  onClick={() => setSellPrice(buyPrice * (1 + margin / 100))}
                  className="px-3 py-2 text-sm bg-card-hover border border-border rounded-lg hover:bg-surface-secondary transition-colors text-foreground font-medium"
                >
                  %{margin}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <FluentButton
              appearance="subtle"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              İptal
            </FluentButton>
            <FluentButton
              appearance="primary"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSubmit}
              loading={loading}
              className="flex-1"
            >
              Güncelle
            </FluentButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriceUpdateModal;


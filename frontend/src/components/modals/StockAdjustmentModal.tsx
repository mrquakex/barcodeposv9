import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Save } from 'lucide-react';
import FluentButton from '../fluent/FluentButton';
import toast from 'react-hot-toast';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: {
    id: string;
    name: string;
    barcode: string;
    stock: number;
    unit: string;
  };
  type: 'increase' | 'decrease';
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
  type
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isIncrease = type === 'increase';
  const newStock = isIncrease ? product.stock + quantity : product.stock - quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      toast.error('Miktar 0\'dan büyük olmalıdır');
      return;
    }

    if (!isIncrease && quantity > product.stock) {
      toast.error('Çıkış miktarı mevcut stoktan fazla olamaz');
      return;
    }

    setLoading(true);
    try {
      const { default: api } = await import('../../lib/api');
      
      await api.post('/stock-movements', {
        productId: product.id,
        type: isIncrease ? 'IN' : 'OUT',
        quantity: Number(quantity),
        notes: notes || null
      });

      toast.success(
        isIncrease
          ? `✅ ${quantity} ${product.unit} stok eklendi`
          : `✅ ${quantity} ${product.unit} stok çıkışı yapıldı`
      );

      onSuccess();
      onClose();
      setQuantity(1);
      setNotes('');
    } catch (error: any) {
      console.error('Stock adjustment error:', error);
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
        <div className={`flex items-center justify-between p-6 border-b border-border ${
          isIncrease ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isIncrease ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              {isIncrease ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                isIncrease ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
                {isIncrease ? 'Stok Girişi' : 'Stok Çıkışı'}
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
          {/* Current Stock */}
          <div className="p-4 bg-card-hover rounded-xl border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Mevcut Stok</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {product.stock} {product.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-foreground-secondary">Yeni Stok</p>
                <p className={`text-2xl font-bold mt-1 ${
                  newStock < 0 ? 'text-red-600' :
                  isIncrease ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {newStock} {product.unit}
                </p>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Miktar <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 bg-card-hover border border-border rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <span className="text-xl font-bold text-foreground">−</span>
              </button>
              
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="flex-1 px-4 py-3 bg-card border border-border rounded-lg text-foreground text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 bg-card-hover border border-border rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <span className="text-xl font-bold text-foreground">+</span>
              </button>
            </div>

            {/* Quick Amounts */}
            <div className="flex items-center gap-2 mt-3">
              {[10, 50, 100, 500].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setQuantity(amount)}
                  className="px-3 py-1.5 text-sm bg-card-hover border border-border rounded-lg hover:bg-surface-secondary transition-colors text-foreground"
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Açıklama
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder={isIncrease ? 'Tedarikçi, fatura no, vb.' : 'Satış, fire, vb.'}
            />
          </div>

          {/* Warning */}
          {!isIncrease && quantity > product.stock && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                ⚠️ Çıkış miktarı mevcut stoktan ({product.stock} {product.unit}) fazla olamaz!
              </p>
            </div>
          )}

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
              disabled={!isIncrease && quantity > product.stock}
            >
              {isIncrease ? 'Stok Ekle' : 'Stok Çıkar'}
            </FluentButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;


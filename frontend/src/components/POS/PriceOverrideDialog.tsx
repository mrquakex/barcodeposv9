import React, { useState, useEffect } from 'react';
import FluentDialog from '../fluent/FluentDialog';
import FluentInput from '../fluent/FluentInput';
import FluentButton from '../fluent/FluentButton';
import { Edit3, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

/* ============================================
   PRICE OVERRIDE DIALOG
   Microsoft Fluent Design System
   Enterprise POS Feature - Admin Only
   ============================================ */

interface PriceOverrideDialogProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  currentPrice: number;
  onConfirm: (newPrice: number, reason: string) => void;
}

const PriceOverrideDialog: React.FC<PriceOverrideDialogProps> = ({
  open,
  onClose,
  productName,
  currentPrice,
  onConfirm,
}) => {
  const [newPrice, setNewPrice] = useState<string>('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setNewPrice(currentPrice.toFixed(2));
      setReason('');
    }
  }, [open, currentPrice]);

  const handleConfirm = () => {
    const price = parseFloat(newPrice);
    
    if (isNaN(price) || price < 0) {
      toast.error('Lütfen geçerli bir fiyat girin');
      return;
    }

    if (price === currentPrice) {
      toast.error('Yeni fiyat mevcut fiyatla aynı');
      return;
    }

    if (!reason.trim()) {
      toast.error('Lütfen fiyat değişikliği nedeni girin');
      return;
    }

    onConfirm(price, reason.trim());
    onClose();
  };

  const priceDifference = parseFloat(newPrice) - currentPrice;
  const priceChangePercent = currentPrice > 0 
    ? ((priceDifference / currentPrice) * 100).toFixed(1)
    : '0';

  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="Fiyat Değiştir"
      size="small"
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="flex items-start gap-2 p-3 bg-warning/10 border-2 border-warning/30 rounded-md">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="fluent-body-small font-semibold text-warning mb-1">
              Dikkat! Yönetici İzni Gerekli
            </p>
            <p className="fluent-caption text-foreground-secondary">
              Fiyat değişiklikleri kayıt altına alınır ve denetlenir.
            </p>
          </div>
        </div>

        {/* Product Info */}
        <div>
          <p className="fluent-caption font-medium text-foreground-secondary mb-1">
            Ürün
          </p>
          <p className="fluent-body font-semibold text-foreground">
            {productName}
          </p>
        </div>

        {/* Current Price */}
        <div>
          <p className="fluent-caption font-medium text-foreground-secondary mb-1">
            Mevcut Fiyat
          </p>
          <p className="fluent-title-2 font-bold text-foreground">
            ₺{currentPrice.toFixed(2)}
          </p>
        </div>

        {/* New Price Input */}
        <div>
          <label className="fluent-caption font-medium text-foreground block mb-1.5">
            Yeni Fiyat <span className="text-destructive">*</span>
          </label>
          <FluentInput
            type="text"
            inputMode="decimal"
            value={newPrice}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setNewPrice(value);
              }
            }}
            placeholder="0.00"
            className="w-full"
            autoFocus
          />
        </div>

        {/* Price Change Preview */}
        {newPrice && !isNaN(parseFloat(newPrice)) && (
          <div className={`p-3 rounded border-2 ${
            priceDifference > 0 
              ? 'bg-warning/10 border-warning/30' 
              : priceDifference < 0 
              ? 'bg-success/10 border-success/30' 
              : 'bg-background-alt border-border'
          }`}>
            <p className="fluent-caption font-medium text-foreground-secondary mb-1">
              Fiyat Değişimi
            </p>
            <div className="flex items-center justify-between">
              <span className="fluent-body font-semibold text-foreground">
                {priceDifference > 0 ? '+' : ''}₺{Math.abs(priceDifference).toFixed(2)}
              </span>
              <span className={`fluent-body-small font-bold ${
                priceDifference > 0 ? 'text-warning' : priceDifference < 0 ? 'text-success' : 'text-foreground-secondary'
              }`}>
                ({priceDifference > 0 ? '+' : ''}{priceChangePercent}%)
              </span>
            </div>
          </div>
        )}

        {/* Reason Input */}
        <div>
          <label className="fluent-caption font-medium text-foreground block mb-1.5">
            Değişiklik Nedeni <span className="text-destructive">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Örn: Müşteri sadakat indirimi, Hasar, Kampanya..."
            className="w-full px-3 py-2 bg-background border-2 border-border rounded-md fluent-body text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-border">
          <FluentButton
            appearance="subtle"
            className="flex-1"
            onClick={onClose}
          >
            İptal
          </FluentButton>
          <FluentButton
            appearance="primary"
            className="flex-1"
            onClick={handleConfirm}
            disabled={!newPrice || !reason.trim() || isNaN(parseFloat(newPrice))}
            icon={<Edit3 className="w-4 h-4" />}
          >
            Onayla
          </FluentButton>
        </div>
      </div>
    </FluentDialog>
  );
};

export default PriceOverrideDialog;

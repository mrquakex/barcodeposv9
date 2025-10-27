import React, { useState } from 'react';
import FluentDialog from '../fluent/FluentDialog';
import FluentInput from '../fluent/FluentInput';
import FluentButton from '../fluent/FluentButton';
import { Percent, DollarSign, Tag } from 'lucide-react';

/* ============================================
   DISCOUNT DIALOG
   Microsoft Fluent Design System
   ============================================ */

export interface DiscountData {
  type: 'percentage' | 'fixed' | 'campaign';
  value: number;
  campaignCode?: string;
  description?: string;
}

interface DiscountDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (discount: DiscountData) => void;
  currentTotal: number;
}

const DiscountDialog: React.FC<DiscountDialogProps> = ({ 
  open, 
  onClose, 
  onApply,
  currentTotal 
}) => {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'campaign'>('percentage');
  const [value, setValue] = useState<string>('');
  const [campaignCode, setCampaignCode] = useState<string>('');

  const calculateDiscount = () => {
    const numValue = parseFloat(value) || 0;
    if (discountType === 'percentage') {
      return (currentTotal * numValue) / 100;
    }
    return numValue;
  };

  const handleApply = () => {
    const numValue = parseFloat(value) || 0;
    
    if (numValue <= 0 && discountType !== 'campaign') {
      return;
    }

    if (discountType === 'percentage' && numValue > 100) {
      return;
    }

    if (discountType === 'fixed' && numValue > currentTotal) {
      return;
    }

    onApply({
      type: discountType,
      value: numValue,
      campaignCode: discountType === 'campaign' ? campaignCode : undefined,
      description: discountType === 'campaign' 
        ? `Kampanya: ${campaignCode}` 
        : discountType === 'percentage'
        ? `%${numValue} indirim`
        : `₺${numValue} indirim`
    });

    // Reset
    setValue('');
    setCampaignCode('');
    onClose();
  };

  const discountAmount = calculateDiscount();
  const finalTotal = currentTotal - discountAmount;

  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="💸 İndirim Ekle"
      size="medium"
    >
      <div className="space-y-4">
        {/* Discount Type Selection */}
        <div>
          <label className="fluent-body-small font-medium text-foreground block mb-2">
            İndirim Türü
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setDiscountType('percentage')}
              className={`p-3 rounded border-2 transition-all flex flex-col items-center gap-2 ${
                discountType === 'percentage'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-background-alt'
              }`}
            >
              <Percent className="w-5 h-5" />
              <span className="fluent-body-small font-medium">Yüzde</span>
            </button>

            <button
              onClick={() => setDiscountType('fixed')}
              className={`p-3 rounded border-2 transition-all flex flex-col items-center gap-2 ${
                discountType === 'fixed'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-background-alt'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span className="fluent-body-small font-medium">Tutar</span>
            </button>

            <button
              onClick={() => setDiscountType('campaign')}
              className={`p-3 rounded border-2 transition-all flex flex-col items-center gap-2 ${
                discountType === 'campaign'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-background-alt'
              }`}
            >
              <Tag className="w-5 h-5" />
              <span className="fluent-body-small font-medium">Kampanya</span>
            </button>
          </div>
        </div>

        {/* Value Input */}
        {discountType !== 'campaign' && (
          <div>
            <label className="fluent-body-small font-medium text-foreground block mb-2">
              {discountType === 'percentage' ? 'İndirim Yüzdesi (%)' : 'İndirim Tutarı (₺)'}
            </label>
            <FluentInput
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={discountType === 'percentage' ? '10' : '50.00'}
              autoFocus
            />
          </div>
        )}

        {/* Campaign Code */}
        {discountType === 'campaign' && (
          <div>
            <label className="fluent-body-small font-medium text-foreground block mb-2">
              Kampanya Kodu
            </label>
            <FluentInput
              value={campaignCode}
              onChange={(e) => setCampaignCode(e.target.value)}
              placeholder="KAMPANYA2025"
              autoFocus
            />
          </div>
        )}

        {/* Preview */}
        <div className="p-3 bg-background-alt rounded border border-border space-y-2">
          <div className="flex justify-between fluent-body-small text-foreground">
            <span>Ara Toplam:</span>
            <span>₺{currentTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between fluent-body-small text-destructive font-semibold">
            <span>İndirim:</span>
            <span>-₺{discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between fluent-body font-bold text-foreground pt-2 border-t border-border">
            <span>Yeni Toplam:</span>
            <span className="text-success">₺{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
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
            onClick={handleApply}
            disabled={
              (discountType !== 'campaign' && (!value || parseFloat(value) <= 0)) ||
              (discountType === 'campaign' && !campaignCode.trim())
            }
          >
            İndirimi Uygula
          </FluentButton>
        </div>
      </div>
    </FluentDialog>
  );
};

export default DiscountDialog;

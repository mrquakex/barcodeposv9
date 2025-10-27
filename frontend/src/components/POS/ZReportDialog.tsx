import React from 'react';
import FluentDialog from '../fluent/FluentDialog';
import FluentButton from '../fluent/FluentButton';
import { Printer, Download } from 'lucide-react';
import { cn } from '../../lib/utils';

/* ============================================
   Z REPORT DIALOG
   Microsoft Fluent Design System
   Enterprise POS Feature - End of Shift Report
   ============================================ */

interface ZReportDialogProps {
  open: boolean;
  onClose: () => void;
  shift: any | null;
}

const ZReportDialog: React.FC<ZReportDialogProps> = ({ open, onClose, shift }) => {
  if (!shift) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Export as JSON (in production, could be PDF or Excel)
    const dataStr = JSON.stringify(shift, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `z-report-${shift.id}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <FluentDialog open={open} onClose={onClose} title="Z Raporu" size="large">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto fluent-scrollbar">
        {/* Report Header */}
        <div className="text-center pb-4 border-b-2 border-border">
          <h2 className="fluent-title-1 font-bold text-foreground mb-1">Z RAPORU</h2>
          <p className="fluent-body text-foreground-secondary">
            Vardiya No: #{shift.id.slice(0, 8)}
          </p>
          <p className="fluent-caption text-foreground-secondary">
            {new Date(shift.startTime).toLocaleString('tr-TR')} -{' '}
            {shift.endTime ? new Date(shift.endTime).toLocaleString('tr-TR') : 'Devam Ediyor'}
          </p>
        </div>

        {/* Cash Register Section */}
        <div className="space-y-2">
          <h3 className="fluent-body-large font-semibold text-foreground border-b border-border pb-1">
            KASA BİLGİLERİ
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between p-2 bg-background-alt rounded">
              <span className="fluent-body-small text-foreground-secondary">Açılış Kasası:</span>
              <span className="fluent-body-small font-medium text-foreground">
                ₺{shift.openingCash.toFixed(2)}
              </span>
            </div>
            {shift.closingCash !== undefined && (
              <div className="flex justify-between p-2 bg-background-alt rounded">
                <span className="fluent-body-small text-foreground-secondary">Kapanış Kasası:</span>
                <span className="fluent-body-small font-medium text-foreground">
                  ₺{shift.closingCash.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sales Section */}
        <div className="space-y-2">
          <h3 className="fluent-body-large font-semibold text-foreground border-b border-border pb-1">
            SATIŞ ÖZETİ
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between p-2 bg-background-alt rounded">
              <span className="fluent-body-small text-foreground-secondary">Toplam Satış Adedi:</span>
              <span className="fluent-body-small font-bold text-primary">
                {shift.salesCount || 0}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-background-alt rounded">
              <span className="fluent-body-small text-foreground-secondary">Nakit Satışlar:</span>
              <span className="fluent-body-small font-medium text-success">
                ₺{(shift.cashSales || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-background-alt rounded">
              <span className="fluent-body-small text-foreground-secondary">Kart Satışlar:</span>
              <span className="fluent-body-small font-medium text-success">
                ₺{(shift.cardSales || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-background-alt rounded">
              <span className="fluent-body-small text-foreground-secondary">Veresiye Satışlar:</span>
              <span className="fluent-body-small font-medium text-warning">
                ₺{(shift.creditSales || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Discounts & Returns */}
        <div className="space-y-2">
          <h3 className="fluent-body-large font-semibold text-foreground border-b border-border pb-1">
            İNDİRİM VE İADELER
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between p-2 bg-background-alt rounded">
              <span className="fluent-body-small text-foreground-secondary">
                Toplam İndirim Tutarı:
              </span>
              <span className="fluent-body-small font-medium text-warning">
                -₺{(shift.totalDiscount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-background-alt rounded">
              <span className="fluent-body-small text-foreground-secondary">İade Adedi:</span>
              <span className="fluent-body-small font-medium text-destructive">
                {shift.returnCount || 0}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-background-alt rounded">
              <span className="fluent-body-small text-foreground-secondary">İade Tutarı:</span>
              <span className="fluent-body-small font-medium text-destructive">
                -₺{(shift.refunds || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="pt-3 border-t-2 border-border space-y-2">
          <div className="flex justify-between p-3 bg-primary/10 border-2 border-primary/30 rounded-lg">
            <span className="fluent-body-large font-bold text-foreground">TOPLAM HASILAT:</span>
            <span className="fluent-title-2 font-bold text-primary">
              ₺{(shift.totalSales || 0).toFixed(2)}
            </span>
          </div>

          {shift.closingCash !== undefined && (
            <div
              className={cn(
                'flex justify-between p-3 border-2 rounded-lg',
                Math.abs(
                  shift.closingCash -
                    (shift.openingCash + (shift.cashSales || 0) - (shift.refunds || 0))
                ) > 0.01
                  ? 'bg-warning/10 border-warning/30'
                  : 'bg-success/10 border-success/30'
              )}
            >
              <span className="fluent-body font-semibold text-foreground">Kasa Farkı:</span>
              <span
                className={cn(
                  'fluent-body-large font-bold',
                  Math.abs(
                    shift.closingCash -
                      (shift.openingCash + (shift.cashSales || 0) - (shift.refunds || 0))
                  ) > 0.01
                    ? 'text-warning'
                    : 'text-success'
                )}
              >
                {(
                  shift.closingCash -
                  (shift.openingCash + (shift.cashSales || 0) - (shift.refunds || 0))
                ).toFixed(2)}{' '}
                ₺
              </span>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="pt-3 border-t border-border">
          <p className="fluent-caption text-center text-foreground-secondary">
            Rapor Tarihi: {new Date().toLocaleString('tr-TR')}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <FluentButton
          appearance="default"
          onClick={handlePrint}
          icon={<Printer className="w-4 h-4" />}
          className="flex-1"
        >
          Yazdır
        </FluentButton>
        <FluentButton
          appearance="default"
          onClick={handleExport}
          icon={<Download className="w-4 h-4" />}
          className="flex-1"
        >
          Dışa Aktar
        </FluentButton>
        <FluentButton appearance="subtle" onClick={onClose} className="flex-1">
          Kapat
        </FluentButton>
      </div>
    </FluentDialog>
  );
};

export default ZReportDialog;

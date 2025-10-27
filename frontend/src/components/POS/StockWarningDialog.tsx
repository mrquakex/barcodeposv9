import React from 'react';
import FluentDialog from '../fluent/FluentDialog';
import FluentButton from '../fluent/FluentButton';
import { AlertTriangle } from 'lucide-react';

/* ============================================
   STOCK WARNING DIALOG
   Microsoft Fluent Design System
   ============================================ */

interface StockWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onAddAnyway: () => void;
  productName: string;
  currentStock: number;
}

const StockWarningDialog: React.FC<StockWarningDialogProps> = ({
  open,
  onClose,
  onAddAnyway,
  productName,
  currentStock,
}) => {
  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="⚠️ Stok Uyarısı"
      size="small"
    >
      <div className="space-y-4">
        {/* Warning Icon & Message */}
        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="fluent-body font-semibold text-foreground mb-1">
              {productName}
            </p>
            <p className="fluent-body-small text-foreground-secondary">
              {currentStock <= 0 ? (
                <>Stokta <span className="text-destructive font-semibold">yok</span></>
              ) : (
                <>Sadece <span className="text-warning font-semibold">{currentStock} adet</span> kaldı</>
              )}
            </p>
          </div>
        </div>

        {/* Message */}
        <p className="fluent-body text-foreground text-center">
          {currentStock <= 0
            ? 'Bu ürün stokta yok. Yine de sepete eklemek istiyor musunuz?'
            : 'Stok azaldı. Yine de sepete eklemek istiyor musunuz?'}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
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
            onClick={() => {
              onAddAnyway();
              onClose();
            }}
          >
            Yine de Ekle
          </FluentButton>
        </div>
      </div>
    </FluentDialog>
  );
};

export default StockWarningDialog;


import FluentDialog from '../fluent/FluentDialog';
import FluentButton from '../fluent/FluentButton';
import { AlertTriangle } from 'lucide-react';

/* ============================================
   STOCK WARNING DIALOG
   Microsoft Fluent Design System
   ============================================ */

interface StockWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onAddAnyway: () => void;
  productName: string;
  currentStock: number;
}

const StockWarningDialog: React.FC<StockWarningDialogProps> = ({
  open,
  onClose,
  onAddAnyway,
  productName,
  currentStock,
}) => {
  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="⚠️ Stok Uyarısı"
      size="small"
    >
      <div className="space-y-4">
        {/* Warning Icon & Message */}
        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="fluent-body font-semibold text-foreground mb-1">
              {productName}
            </p>
            <p className="fluent-body-small text-foreground-secondary">
              {currentStock <= 0 ? (
                <>Stokta <span className="text-destructive font-semibold">yok</span></>
              ) : (
                <>Sadece <span className="text-warning font-semibold">{currentStock} adet</span> kaldı</>
              )}
            </p>
          </div>
        </div>

        {/* Message */}
        <p className="fluent-body text-foreground text-center">
          {currentStock <= 0
            ? 'Bu ürün stokta yok. Yine de sepete eklemek istiyor musunuz?'
            : 'Stok azaldı. Yine de sepete eklemek istiyor musunuz?'}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
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
            onClick={() => {
              onAddAnyway();
              onClose();
            }}
          >
            Yine de Ekle
          </FluentButton>
        </div>
      </div>
    </FluentDialog>
  );
};

export default StockWarningDialog;


import FluentDialog from '../fluent/FluentDialog';
import FluentButton from '../fluent/FluentButton';
import { AlertTriangle } from 'lucide-react';

/* ============================================
   STOCK WARNING DIALOG
   Microsoft Fluent Design System
   ============================================ */

interface StockWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onAddAnyway: () => void;
  productName: string;
  currentStock: number;
}

const StockWarningDialog: React.FC<StockWarningDialogProps> = ({
  open,
  onClose,
  onAddAnyway,
  productName,
  currentStock,
}) => {
  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="⚠️ Stok Uyarısı"
      size="small"
    >
      <div className="space-y-4">
        {/* Warning Icon & Message */}
        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="fluent-body font-semibold text-foreground mb-1">
              {productName}
            </p>
            <p className="fluent-body-small text-foreground-secondary">
              {currentStock <= 0 ? (
                <>Stokta <span className="text-destructive font-semibold">yok</span></>
              ) : (
                <>Sadece <span className="text-warning font-semibold">{currentStock} adet</span> kaldı</>
              )}
            </p>
          </div>
        </div>

        {/* Message */}
        <p className="fluent-body text-foreground text-center">
          {currentStock <= 0
            ? 'Bu ürün stokta yok. Yine de sepete eklemek istiyor musunuz?'
            : 'Stok azaldı. Yine de sepete eklemek istiyor musunuz?'}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
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
            onClick={() => {
              onAddAnyway();
              onClose();
            }}
          >
            Yine de Ekle
          </FluentButton>
        </div>
      </div>
    </FluentDialog>
  );
};

export default StockWarningDialog;




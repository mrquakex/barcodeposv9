import React from 'react';
import FluentDialog from '../fluent/FluentDialog';
import FluentButton from '../fluent/FluentButton';
import { Pause, Play, Trash2, User, Package, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

/* ============================================
   HOLD SALES DIALOG
   Microsoft Fluent Design System
   Enterprise POS Feature
   ============================================ */

interface CartItem {
  id: string;
  barcode: string;
  name: string;
  sellPrice: number;
  quantity: number;
  total: number;
  taxRate: number;
}

interface Customer {
  id: string;
  name: string;
}

interface HeldSale {
  id: string;
  channelName: string;
  cart: CartItem[];
  customer: Customer | null;
  total: number;
  timestamp: Date;
}

interface HoldSalesDialogProps {
  open: boolean;
  onClose: () => void;
  heldSales: HeldSale[];
  onRestore: (sale: HeldSale) => void;
  onDelete: (saleId: string) => void;
}

const HoldSalesDialog: React.FC<HoldSalesDialogProps> = ({
  open,
  onClose,
  heldSales,
  onRestore,
  onDelete,
}) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dakika önce`;
    return 'Az önce';
  };

  const handleRestore = (sale: HeldSale) => {
    onRestore(sale);
    onClose();
    toast.success(`${sale.channelName} geri yüklendi`);
  };

  const handleDelete = (saleId: string) => {
    if (confirm('Bu park edilmiş satışı silmek istediğinize emin misiniz?')) {
      onDelete(saleId);
      toast.success('Park edilmiş satış silindi');
    }
  };

  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="Park Edilmiş Satışlar"
      size="large"
    >
      {heldSales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Pause className="w-16 h-16 text-foreground-tertiary mb-4" />
          <p className="fluent-title-3 text-foreground mb-2">
            Henüz park edilmiş satış yok
          </p>
          <p className="fluent-body text-foreground-secondary">
            Satışları geçici olarak durdurmak için <kbd className="px-2 py-1 bg-background-alt border border-border rounded text-xs">F4</kbd> veya <kbd className="px-2 py-1 bg-background-alt border border-border rounded text-xs">Ctrl+H</kbd> tuşlarını kullanabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto fluent-scrollbar">
          <p className="fluent-caption text-foreground-secondary">
            {heldSales.length} adet park edilmiş satış bulundu
          </p>

          {heldSales.map((sale) => (
            <div
              key={sale.id}
              className={cn(
                'p-4 border-2 border-border rounded-lg bg-background',
                'hover:border-primary hover:bg-background-alt transition-all'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="fluent-body-large font-semibold text-foreground mb-1">
                    {sale.channelName}
                  </h3>
                  <div className="flex items-center gap-3 fluent-caption text-foreground-secondary">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatTime(sale.timestamp)}</span>
                    </div>
                    {sale.customer && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{sale.customer.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span>{sale.cart.length} ürün</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="fluent-title-2 font-bold text-primary">
                    ₺{sale.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Items Preview */}
              <div className="mb-3 p-2 bg-background-alt rounded border border-border">
                <p className="fluent-caption font-medium text-foreground-secondary mb-1">
                  Ürünler:
                </p>
                <div className="space-y-0.5">
                  {sale.cart.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="fluent-caption text-foreground flex justify-between"
                    >
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">₺{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                  {sale.cart.length > 3 && (
                    <p className="fluent-caption text-foreground-secondary italic">
                      ... ve {sale.cart.length - 3} ürün daha
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <FluentButton
                  appearance="primary"
                  onClick={() => handleRestore(sale)}
                  icon={<Play className="w-4 h-4" />}
                  className="flex-1"
                >
                  Geri Yükle
                </FluentButton>
                <FluentButton
                  appearance="subtle"
                  onClick={() => handleDelete(sale.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                  className="!text-destructive !hover:bg-destructive/10"
                >
                  Sil
                </FluentButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <FluentButton appearance="subtle" onClick={onClose} className="w-full">
          Kapat
        </FluentButton>
      </div>
    </FluentDialog>
  );
};

export default HoldSalesDialog;


import FluentDialog from '../fluent/FluentDialog';
import FluentButton from '../fluent/FluentButton';
import { Pause, Play, Trash2, User, Package, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

/* ============================================
   HOLD SALES DIALOG
   Microsoft Fluent Design System
   Enterprise POS Feature
   ============================================ */

interface CartItem {
  id: string;
  barcode: string;
  name: string;
  sellPrice: number;
  quantity: number;
  total: number;
  taxRate: number;
}

interface Customer {
  id: string;
  name: string;
}

interface HeldSale {
  id: string;
  channelName: string;
  cart: CartItem[];
  customer: Customer | null;
  total: number;
  timestamp: Date;
}

interface HoldSalesDialogProps {
  open: boolean;
  onClose: () => void;
  heldSales: HeldSale[];
  onRestore: (sale: HeldSale) => void;
  onDelete: (saleId: string) => void;
}

const HoldSalesDialog: React.FC<HoldSalesDialogProps> = ({
  open,
  onClose,
  heldSales,
  onRestore,
  onDelete,
}) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dakika önce`;
    return 'Az önce';
  };

  const handleRestore = (sale: HeldSale) => {
    onRestore(sale);
    onClose();
    toast.success(`${sale.channelName} geri yüklendi`);
  };

  const handleDelete = (saleId: string) => {
    if (confirm('Bu park edilmiş satışı silmek istediğinize emin misiniz?')) {
      onDelete(saleId);
      toast.success('Park edilmiş satış silindi');
    }
  };

  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="Park Edilmiş Satışlar"
      size="large"
    >
      {heldSales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Pause className="w-16 h-16 text-foreground-tertiary mb-4" />
          <p className="fluent-title-3 text-foreground mb-2">
            Henüz park edilmiş satış yok
          </p>
          <p className="fluent-body text-foreground-secondary">
            Satışları geçici olarak durdurmak için <kbd className="px-2 py-1 bg-background-alt border border-border rounded text-xs">F4</kbd> veya <kbd className="px-2 py-1 bg-background-alt border border-border rounded text-xs">Ctrl+H</kbd> tuşlarını kullanabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto fluent-scrollbar">
          <p className="fluent-caption text-foreground-secondary">
            {heldSales.length} adet park edilmiş satış bulundu
          </p>

          {heldSales.map((sale) => (
            <div
              key={sale.id}
              className={cn(
                'p-4 border-2 border-border rounded-lg bg-background',
                'hover:border-primary hover:bg-background-alt transition-all'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="fluent-body-large font-semibold text-foreground mb-1">
                    {sale.channelName}
                  </h3>
                  <div className="flex items-center gap-3 fluent-caption text-foreground-secondary">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatTime(sale.timestamp)}</span>
                    </div>
                    {sale.customer && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{sale.customer.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span>{sale.cart.length} ürün</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="fluent-title-2 font-bold text-primary">
                    ₺{sale.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Items Preview */}
              <div className="mb-3 p-2 bg-background-alt rounded border border-border">
                <p className="fluent-caption font-medium text-foreground-secondary mb-1">
                  Ürünler:
                </p>
                <div className="space-y-0.5">
                  {sale.cart.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="fluent-caption text-foreground flex justify-between"
                    >
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">₺{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                  {sale.cart.length > 3 && (
                    <p className="fluent-caption text-foreground-secondary italic">
                      ... ve {sale.cart.length - 3} ürün daha
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <FluentButton
                  appearance="primary"
                  onClick={() => handleRestore(sale)}
                  icon={<Play className="w-4 h-4" />}
                  className="flex-1"
                >
                  Geri Yükle
                </FluentButton>
                <FluentButton
                  appearance="subtle"
                  onClick={() => handleDelete(sale.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                  className="!text-destructive !hover:bg-destructive/10"
                >
                  Sil
                </FluentButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <FluentButton appearance="subtle" onClick={onClose} className="w-full">
          Kapat
        </FluentButton>
      </div>
    </FluentDialog>
  );
};

export default HoldSalesDialog;


import FluentDialog from '../fluent/FluentDialog';
import FluentButton from '../fluent/FluentButton';
import { Pause, Play, Trash2, User, Package, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

/* ============================================
   HOLD SALES DIALOG
   Microsoft Fluent Design System
   Enterprise POS Feature
   ============================================ */

interface CartItem {
  id: string;
  barcode: string;
  name: string;
  sellPrice: number;
  quantity: number;
  total: number;
  taxRate: number;
}

interface Customer {
  id: string;
  name: string;
}

interface HeldSale {
  id: string;
  channelName: string;
  cart: CartItem[];
  customer: Customer | null;
  total: number;
  timestamp: Date;
}

interface HoldSalesDialogProps {
  open: boolean;
  onClose: () => void;
  heldSales: HeldSale[];
  onRestore: (sale: HeldSale) => void;
  onDelete: (saleId: string) => void;
}

const HoldSalesDialog: React.FC<HoldSalesDialogProps> = ({
  open,
  onClose,
  heldSales,
  onRestore,
  onDelete,
}) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dakika önce`;
    return 'Az önce';
  };

  const handleRestore = (sale: HeldSale) => {
    onRestore(sale);
    onClose();
    toast.success(`${sale.channelName} geri yüklendi`);
  };

  const handleDelete = (saleId: string) => {
    if (confirm('Bu park edilmiş satışı silmek istediğinize emin misiniz?')) {
      onDelete(saleId);
      toast.success('Park edilmiş satış silindi');
    }
  };

  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="Park Edilmiş Satışlar"
      size="large"
    >
      {heldSales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Pause className="w-16 h-16 text-foreground-tertiary mb-4" />
          <p className="fluent-title-3 text-foreground mb-2">
            Henüz park edilmiş satış yok
          </p>
          <p className="fluent-body text-foreground-secondary">
            Satışları geçici olarak durdurmak için <kbd className="px-2 py-1 bg-background-alt border border-border rounded text-xs">F4</kbd> veya <kbd className="px-2 py-1 bg-background-alt border border-border rounded text-xs">Ctrl+H</kbd> tuşlarını kullanabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto fluent-scrollbar">
          <p className="fluent-caption text-foreground-secondary">
            {heldSales.length} adet park edilmiş satış bulundu
          </p>

          {heldSales.map((sale) => (
            <div
              key={sale.id}
              className={cn(
                'p-4 border-2 border-border rounded-lg bg-background',
                'hover:border-primary hover:bg-background-alt transition-all'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="fluent-body-large font-semibold text-foreground mb-1">
                    {sale.channelName}
                  </h3>
                  <div className="flex items-center gap-3 fluent-caption text-foreground-secondary">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatTime(sale.timestamp)}</span>
                    </div>
                    {sale.customer && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{sale.customer.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span>{sale.cart.length} ürün</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="fluent-title-2 font-bold text-primary">
                    ₺{sale.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Items Preview */}
              <div className="mb-3 p-2 bg-background-alt rounded border border-border">
                <p className="fluent-caption font-medium text-foreground-secondary mb-1">
                  Ürünler:
                </p>
                <div className="space-y-0.5">
                  {sale.cart.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="fluent-caption text-foreground flex justify-between"
                    >
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">₺{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                  {sale.cart.length > 3 && (
                    <p className="fluent-caption text-foreground-secondary italic">
                      ... ve {sale.cart.length - 3} ürün daha
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <FluentButton
                  appearance="primary"
                  onClick={() => handleRestore(sale)}
                  icon={<Play className="w-4 h-4" />}
                  className="flex-1"
                >
                  Geri Yükle
                </FluentButton>
                <FluentButton
                  appearance="subtle"
                  onClick={() => handleDelete(sale.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                  className="!text-destructive !hover:bg-destructive/10"
                >
                  Sil
                </FluentButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <FluentButton appearance="subtle" onClick={onClose} className="w-full">
          Kapat
        </FluentButton>
      </div>
    </FluentDialog>
  );
};

export default HoldSalesDialog;




import React, { useState } from 'react';
import FluentDialog from '../fluent/FluentDialog';
import FluentButton from '../fluent/FluentButton';
import FluentInput from '../fluent/FluentInput';
import { Clock, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

/* ============================================
   SHIFT MANAGEMENT DIALOG
   Microsoft Fluent Design System
   Enterprise POS Feature
   ============================================ */

interface ShiftManagementDialogProps {
  open: boolean;
  onClose: () => void;
  currentShift: any | null;
  onStartShift: (openingCash: number) => void;
  onEndShift: (closingCash: number) => void;
  onViewReport: () => void;
}

const ShiftManagementDialog: React.FC<ShiftManagementDialogProps> = ({
  open,
  onClose,
  currentShift,
  onStartShift,
  onEndShift,
  onViewReport,
}) => {
  const [openingCash, setOpeningCash] = useState<string>('');
  const [closingCash, setClosingCash] = useState<string>('');
  const [view, setView] = useState<'main' | 'start' | 'end'>('main');

  const handleStartShift = () => {
    const amount = parseFloat(openingCash);
    if (isNaN(amount) || amount < 0) {
      toast.error('Lütfen geçerli bir açılış tutarı girin');
      return;
    }
    onStartShift(amount);
    setOpeningCash('');
    setView('main');
    onClose();
  };

  const handleEndShift = () => {
    const amount = parseFloat(closingCash);
    if (isNaN(amount) || amount < 0) {
      toast.error('Lütfen geçerli bir kapanış tutarı girin');
      return;
    }
    onEndShift(amount);
    setClosingCash('');
    setView('main');
    onClose();
  };

  const formatDuration = (startTime: Date) => {
    const diff = new Date().getTime() - new Date(startTime).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}s ${minutes}dk`;
  };

  return (
    <FluentDialog
      open={open}
      onClose={() => {
        setView('main');
        onClose();
      }}
      title="Vardiya Yönetimi"
      size="medium"
    >
      {view === 'main' && (
        <div className="space-y-4">
          {/* Current Shift Info */}
          {currentShift ? (
            <div className="p-4 bg-success/10 border-2 border-success/30 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="fluent-body-large font-semibold text-success">
                    Vardiya Aktif
                  </span>
                </div>
                <span className="fluent-caption text-foreground-secondary">
                  {formatDuration(currentShift.startTime)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="fluent-caption text-foreground-secondary mb-1">
                    Başlangıç Saati
                  </p>
                  <p className="fluent-body font-medium text-foreground">
                    {new Date(currentShift.startTime).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="fluent-caption text-foreground-secondary mb-1">
                    Açılış Kasası
                  </p>
                  <p className="fluent-body font-bold text-foreground">
                    ₺{currentShift.openingCash.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="fluent-caption text-foreground-secondary mb-1">
                    Toplam Satış
                  </p>
                  <p className="fluent-body font-bold text-primary">
                    {currentShift.salesCount || 0} adet
                  </p>
                </div>
                <div>
                  <p className="fluent-caption text-foreground-secondary mb-1">
                    Toplam Hasılat
                  </p>
                  <p className="fluent-body font-bold text-success">
                    ₺{(currentShift.totalSales || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-background-alt border-2 border-border rounded-lg text-center">
              <Clock className="w-12 h-12 text-foreground-tertiary mx-auto mb-2" />
              <p className="fluent-body font-medium text-foreground mb-1">
                Aktif Vardiya Yok
              </p>
              <p className="fluent-caption text-foreground-secondary">
                Satış yapmak için önce vardiya başlatın
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 gap-2">
            {!currentShift ? (
              <FluentButton
                appearance="primary"
                onClick={() => setView('start')}
                icon={<Clock className="w-4 h-4" />}
                className="w-full"
              >
                Vardiya Başlat
              </FluentButton>
            ) : (
              <>
                <FluentButton
                  appearance="default"
                  onClick={() => setView('end')}
                  icon={<DollarSign className="w-4 h-4" />}
                  className="w-full"
                >
                  Vardiya Kapat ve Kasa Say
                </FluentButton>
                <FluentButton
                  appearance="subtle"
                  onClick={onViewReport}
                  icon={<FileText className="w-4 h-4" />}
                  className="w-full"
                >
                  Z Raporu Görüntüle
                </FluentButton>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'start' && (
        <div className="space-y-4">
          <div className="p-3 bg-primary/10 border-2 border-primary/30 rounded-md">
            <p className="fluent-body-small text-foreground">
              Vardiya başlatmak için kasadaki açılış tutarını girin.
            </p>
          </div>

          <div>
            <label className="fluent-caption font-medium text-foreground block mb-1.5">
              Açılış Kasası (₺) <span className="text-destructive">*</span>
            </label>
            <FluentInput
              type="text"
              inputMode="decimal"
              value={openingCash}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setOpeningCash(value);
                }
              }}
              placeholder="0.00"
              className="w-full"
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-border">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={() => setView('main')}
            >
              Geri
            </FluentButton>
            <FluentButton
              appearance="primary"
              className="flex-1"
              onClick={handleStartShift}
              disabled={!openingCash || isNaN(parseFloat(openingCash))}
            >
              Vardiyayı Başlat
            </FluentButton>
          </div>
        </div>
      )}

      {view === 'end' && currentShift && (
        <div className="space-y-4">
          <div className="p-3 bg-warning/10 border-2 border-warning/30 rounded-md">
            <p className="fluent-body-small text-foreground">
              Vardiyayı kapatmak için kasadaki mevcut tutarı sayın ve girin.
            </p>
          </div>

          {/* Shift Summary */}
          <div className="p-3 bg-background-alt rounded-md space-y-2">
            <div className="flex justify-between fluent-caption">
              <span className="text-foreground-secondary">Açılış Kasası:</span>
              <span className="text-foreground font-medium">
                ₺{currentShift.openingCash.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between fluent-caption">
              <span className="text-foreground-secondary">Nakit Satışlar:</span>
              <span className="text-success font-medium">
                +₺{(currentShift.cashSales || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between fluent-caption">
              <span className="text-foreground-secondary">İadeler:</span>
              <span className="text-destructive font-medium">
                -₺{(currentShift.refunds || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between fluent-body font-bold pt-2 border-t border-border">
              <span className="text-foreground">Beklenen Tutar:</span>
              <span className="text-primary">
                ₺{(
                  currentShift.openingCash +
                  (currentShift.cashSales || 0) -
                  (currentShift.refunds || 0)
                ).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="fluent-caption font-medium text-foreground block mb-1.5">
              Kasadaki Gerçek Tutar (₺) <span className="text-destructive">*</span>
            </label>
            <FluentInput
              type="text"
              inputMode="decimal"
              value={closingCash}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setClosingCash(value);
                }
              }}
              placeholder="0.00"
              className="w-full"
              autoFocus
            />
          </div>

          {/* Difference Alert */}
          {closingCash && !isNaN(parseFloat(closingCash)) && (
            <div
              className={cn(
                'p-3 rounded-md border-2',
                Math.abs(
                  parseFloat(closingCash) -
                    (currentShift.openingCash +
                      (currentShift.cashSales || 0) -
                      (currentShift.refunds || 0))
                ) > 0.01
                  ? 'bg-warning/10 border-warning/30'
                  : 'bg-success/10 border-success/30'
              )}
            >
              <p className="fluent-caption font-medium text-foreground">
                Fark:{' '}
                {(
                  parseFloat(closingCash) -
                  (currentShift.openingCash +
                    (currentShift.cashSales || 0) -
                    (currentShift.refunds || 0))
                ).toFixed(2)}{' '}
                ₺
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-border">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={() => setView('main')}
            >
              Geri
            </FluentButton>
            <FluentButton
              appearance="primary"
              className="flex-1"
              onClick={handleEndShift}
              disabled={!closingCash || isNaN(parseFloat(closingCash))}
            >
              Vardiyayı Kapat
            </FluentButton>
          </div>
        </div>
      )}
    </FluentDialog>
  );
};

export default ShiftManagementDialog;


import FluentDialog from '../fluent/FluentDialog';
import FluentButton from '../fluent/FluentButton';
import FluentInput from '../fluent/FluentInput';
import { Clock, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

/* ============================================
   SHIFT MANAGEMENT DIALOG
   Microsoft Fluent Design System
   Enterprise POS Feature
   ============================================ */

interface ShiftManagementDialogProps {
  open: boolean;
  onClose: () => void;
  currentShift: any | null;
  onStartShift: (openingCash: number) => void;
  onEndShift: (closingCash: number) => void;
  onViewReport: () => void;
}

const ShiftManagementDialog: React.FC<ShiftManagementDialogProps> = ({
  open,
  onClose,
  currentShift,
  onStartShift,
  onEndShift,
  onViewReport,
}) => {
  const [openingCash, setOpeningCash] = useState<string>('');
  const [closingCash, setClosingCash] = useState<string>('');
  const [view, setView] = useState<'main' | 'start' | 'end'>('main');

  const handleStartShift = () => {
    const amount = parseFloat(openingCash);
    if (isNaN(amount) || amount < 0) {
      toast.error('Lütfen geçerli bir açılış tutarı girin');
      return;
    }
    onStartShift(amount);
    setOpeningCash('');
    setView('main');
    onClose();
  };

  const handleEndShift = () => {
    const amount = parseFloat(closingCash);
    if (isNaN(amount) || amount < 0) {
      toast.error('Lütfen geçerli bir kapanış tutarı girin');
      return;
    }
    onEndShift(amount);
    setClosingCash('');
    setView('main');
    onClose();
  };

  const formatDuration = (startTime: Date) => {
    const diff = new Date().getTime() - new Date(startTime).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}s ${minutes}dk`;
  };

  return (
    <FluentDialog
      open={open}
      onClose={() => {
        setView('main');
        onClose();
      }}
      title="Vardiya Yönetimi"
      size="medium"
    >
      {view === 'main' && (
        <div className="space-y-4">
          {/* Current Shift Info */}
          {currentShift ? (
            <div className="p-4 bg-success/10 border-2 border-success/30 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="fluent-body-large font-semibold text-success">
                    Vardiya Aktif
                  </span>
                </div>
                <span className="fluent-caption text-foreground-secondary">
                  {formatDuration(currentShift.startTime)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="fluent-caption text-foreground-secondary mb-1">
                    Başlangıç Saati
                  </p>
                  <p className="fluent-body font-medium text-foreground">
                    {new Date(currentShift.startTime).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="fluent-caption text-foreground-secondary mb-1">
                    Açılış Kasası
                  </p>
                  <p className="fluent-body font-bold text-foreground">
                    ₺{currentShift.openingCash.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="fluent-caption text-foreground-secondary mb-1">
                    Toplam Satış
                  </p>
                  <p className="fluent-body font-bold text-primary">
                    {currentShift.salesCount || 0} adet
                  </p>
                </div>
                <div>
                  <p className="fluent-caption text-foreground-secondary mb-1">
                    Toplam Hasılat
                  </p>
                  <p className="fluent-body font-bold text-success">
                    ₺{(currentShift.totalSales || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-background-alt border-2 border-border rounded-lg text-center">
              <Clock className="w-12 h-12 text-foreground-tertiary mx-auto mb-2" />
              <p className="fluent-body font-medium text-foreground mb-1">
                Aktif Vardiya Yok
              </p>
              <p className="fluent-caption text-foreground-secondary">
                Satış yapmak için önce vardiya başlatın
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 gap-2">
            {!currentShift ? (
              <FluentButton
                appearance="primary"
                onClick={() => setView('start')}
                icon={<Clock className="w-4 h-4" />}
                className="w-full"
              >
                Vardiya Başlat
              </FluentButton>
            ) : (
              <>
                <FluentButton
                  appearance="default"
                  onClick={() => setView('end')}
                  icon={<DollarSign className="w-4 h-4" />}
                  className="w-full"
                >
                  Vardiya Kapat ve Kasa Say
                </FluentButton>
                <FluentButton
                  appearance="subtle"
                  onClick={onViewReport}
                  icon={<FileText className="w-4 h-4" />}
                  className="w-full"
                >
                  Z Raporu Görüntüle
                </FluentButton>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'start' && (
        <div className="space-y-4">
          <div className="p-3 bg-primary/10 border-2 border-primary/30 rounded-md">
            <p className="fluent-body-small text-foreground">
              Vardiya başlatmak için kasadaki açılış tutarını girin.
            </p>
          </div>

          <div>
            <label className="fluent-caption font-medium text-foreground block mb-1.5">
              Açılış Kasası (₺) <span className="text-destructive">*</span>
            </label>
            <FluentInput
              type="text"
              inputMode="decimal"
              value={openingCash}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setOpeningCash(value);
                }
              }}
              placeholder="0.00"
              className="w-full"
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-border">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={() => setView('main')}
            >
              Geri
            </FluentButton>
            <FluentButton
              appearance="primary"
              className="flex-1"
              onClick={handleStartShift}
              disabled={!openingCash || isNaN(parseFloat(openingCash))}
            >
              Vardiyayı Başlat
            </FluentButton>
          </div>
        </div>
      )}

      {view === 'end' && currentShift && (
        <div className="space-y-4">
          <div className="p-3 bg-warning/10 border-2 border-warning/30 rounded-md">
            <p className="fluent-body-small text-foreground">
              Vardiyayı kapatmak için kasadaki mevcut tutarı sayın ve girin.
            </p>
          </div>

          {/* Shift Summary */}
          <div className="p-3 bg-background-alt rounded-md space-y-2">
            <div className="flex justify-between fluent-caption">
              <span className="text-foreground-secondary">Açılış Kasası:</span>
              <span className="text-foreground font-medium">
                ₺{currentShift.openingCash.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between fluent-caption">
              <span className="text-foreground-secondary">Nakit Satışlar:</span>
              <span className="text-success font-medium">
                +₺{(currentShift.cashSales || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between fluent-caption">
              <span className="text-foreground-secondary">İadeler:</span>
              <span className="text-destructive font-medium">
                -₺{(currentShift.refunds || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between fluent-body font-bold pt-2 border-t border-border">
              <span className="text-foreground">Beklenen Tutar:</span>
              <span className="text-primary">
                ₺{(
                  currentShift.openingCash +
                  (currentShift.cashSales || 0) -
                  (currentShift.refunds || 0)
                ).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="fluent-caption font-medium text-foreground block mb-1.5">
              Kasadaki Gerçek Tutar (₺) <span className="text-destructive">*</span>
            </label>
            <FluentInput
              type="text"
              inputMode="decimal"
              value={closingCash}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setClosingCash(value);
                }
              }}
              placeholder="0.00"
              className="w-full"
              autoFocus
            />
          </div>

          {/* Difference Alert */}
          {closingCash && !isNaN(parseFloat(closingCash)) && (
            <div
              className={cn(
                'p-3 rounded-md border-2',
                Math.abs(
                  parseFloat(closingCash) -
                    (currentShift.openingCash +
                      (currentShift.cashSales || 0) -
                      (currentShift.refunds || 0))
                ) > 0.01
                  ? 'bg-warning/10 border-warning/30'
                  : 'bg-success/10 border-success/30'
              )}
            >
              <p className="fluent-caption font-medium text-foreground">
                Fark:{' '}
                {(
                  parseFloat(closingCash) -
                  (currentShift.openingCash +
                    (currentShift.cashSales || 0) -
                    (currentShift.refunds || 0))
                ).toFixed(2)}{' '}
                ₺
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-border">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={() => setView('main')}
            >
              Geri
            </FluentButton>
            <FluentButton
              appearance="primary"
              className="flex-1"
              onClick={handleEndShift}
              disabled={!closingCash || isNaN(parseFloat(closingCash))}
            >
              Vardiyayı Kapat
            </FluentButton>
          </div>
        </div>
      )}
    </FluentDialog>
  );
};

export default ShiftManagementDialog;


import FluentDialog from '../fluent/FluentDialog';
import FluentButton from '../fluent/FluentButton';
import FluentInput from '../fluent/FluentInput';
import { Clock, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

/* ============================================
   SHIFT MANAGEMENT DIALOG
   Microsoft Fluent Design System
   Enterprise POS Feature
   ============================================ */

interface ShiftManagementDialogProps {
  open: boolean;
  onClose: () => void;
  currentShift: any | null;
  onStartShift: (openingCash: number) => void;
  onEndShift: (closingCash: number) => void;
  onViewReport: () => void;
}

const ShiftManagementDialog: React.FC<ShiftManagementDialogProps> = ({
  open,
  onClose,
  currentShift,
  onStartShift,
  onEndShift,
  onViewReport,
}) => {
  const [openingCash, setOpeningCash] = useState<string>('');
  const [closingCash, setClosingCash] = useState<string>('');
  const [view, setView] = useState<'main' | 'start' | 'end'>('main');

  const handleStartShift = () => {
    const amount = parseFloat(openingCash);
    if (isNaN(amount) || amount < 0) {
      toast.error('Lütfen geçerli bir açılış tutarı girin');
      return;
    }
    onStartShift(amount);
    setOpeningCash('');
    setView('main');
    onClose();
  };

  const handleEndShift = () => {
    const amount = parseFloat(closingCash);
    if (isNaN(amount) || amount < 0) {
      toast.error('Lütfen geçerli bir kapanış tutarı girin');
      return;
    }
    onEndShift(amount);
    setClosingCash('');
    setView('main');
    onClose();
  };

  const formatDuration = (startTime: Date) => {
    const diff = new Date().getTime() - new Date(startTime).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}s ${minutes}dk`;
  };

  return (
    <FluentDialog
      open={open}
      onClose={() => {
        setView('main');
        onClose();
      }}
      title="Vardiya Yönetimi"
      size="medium"
    >
      {view === 'main' && (
        <div className="space-y-4">
          {/* Current Shift Info */}
          {currentShift ? (
            <div className="p-4 bg-success/10 border-2 border-success/30 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="fluent-body-large font-semibold text-success">
                    Vardiya Aktif
                  </span>
                </div>
                <span className="fluent-caption text-foreground-secondary">
                  {formatDuration(currentShift.startTime)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="fluent-caption text-foreground-secondary mb-1">
                    Başlangıç Saati
                  </p>
                  <p className="fluent-body font-medium text-foreground">
                    {new Date(currentShift.startTime).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="fluent-caption text-foreground-secondary mb-1">
                    Açılış Kasası
                  </p>
                  <p className="fluent-body font-bold text-foreground">
                    ₺{currentShift.openingCash.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="fluent-caption text-foreground-secondary mb-1">
                    Toplam Satış
                  </p>
                  <p className="fluent-body font-bold text-primary">
                    {currentShift.salesCount || 0} adet
                  </p>
                </div>
                <div>
                  <p className="fluent-caption text-foreground-secondary mb-1">
                    Toplam Hasılat
                  </p>
                  <p className="fluent-body font-bold text-success">
                    ₺{(currentShift.totalSales || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-background-alt border-2 border-border rounded-lg text-center">
              <Clock className="w-12 h-12 text-foreground-tertiary mx-auto mb-2" />
              <p className="fluent-body font-medium text-foreground mb-1">
                Aktif Vardiya Yok
              </p>
              <p className="fluent-caption text-foreground-secondary">
                Satış yapmak için önce vardiya başlatın
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 gap-2">
            {!currentShift ? (
              <FluentButton
                appearance="primary"
                onClick={() => setView('start')}
                icon={<Clock className="w-4 h-4" />}
                className="w-full"
              >
                Vardiya Başlat
              </FluentButton>
            ) : (
              <>
                <FluentButton
                  appearance="default"
                  onClick={() => setView('end')}
                  icon={<DollarSign className="w-4 h-4" />}
                  className="w-full"
                >
                  Vardiya Kapat ve Kasa Say
                </FluentButton>
                <FluentButton
                  appearance="subtle"
                  onClick={onViewReport}
                  icon={<FileText className="w-4 h-4" />}
                  className="w-full"
                >
                  Z Raporu Görüntüle
                </FluentButton>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'start' && (
        <div className="space-y-4">
          <div className="p-3 bg-primary/10 border-2 border-primary/30 rounded-md">
            <p className="fluent-body-small text-foreground">
              Vardiya başlatmak için kasadaki açılış tutarını girin.
            </p>
          </div>

          <div>
            <label className="fluent-caption font-medium text-foreground block mb-1.5">
              Açılış Kasası (₺) <span className="text-destructive">*</span>
            </label>
            <FluentInput
              type="text"
              inputMode="decimal"
              value={openingCash}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setOpeningCash(value);
                }
              }}
              placeholder="0.00"
              className="w-full"
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-border">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={() => setView('main')}
            >
              Geri
            </FluentButton>
            <FluentButton
              appearance="primary"
              className="flex-1"
              onClick={handleStartShift}
              disabled={!openingCash || isNaN(parseFloat(openingCash))}
            >
              Vardiyayı Başlat
            </FluentButton>
          </div>
        </div>
      )}

      {view === 'end' && currentShift && (
        <div className="space-y-4">
          <div className="p-3 bg-warning/10 border-2 border-warning/30 rounded-md">
            <p className="fluent-body-small text-foreground">
              Vardiyayı kapatmak için kasadaki mevcut tutarı sayın ve girin.
            </p>
          </div>

          {/* Shift Summary */}
          <div className="p-3 bg-background-alt rounded-md space-y-2">
            <div className="flex justify-between fluent-caption">
              <span className="text-foreground-secondary">Açılış Kasası:</span>
              <span className="text-foreground font-medium">
                ₺{currentShift.openingCash.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between fluent-caption">
              <span className="text-foreground-secondary">Nakit Satışlar:</span>
              <span className="text-success font-medium">
                +₺{(currentShift.cashSales || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between fluent-caption">
              <span className="text-foreground-secondary">İadeler:</span>
              <span className="text-destructive font-medium">
                -₺{(currentShift.refunds || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between fluent-body font-bold pt-2 border-t border-border">
              <span className="text-foreground">Beklenen Tutar:</span>
              <span className="text-primary">
                ₺{(
                  currentShift.openingCash +
                  (currentShift.cashSales || 0) -
                  (currentShift.refunds || 0)
                ).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="fluent-caption font-medium text-foreground block mb-1.5">
              Kasadaki Gerçek Tutar (₺) <span className="text-destructive">*</span>
            </label>
            <FluentInput
              type="text"
              inputMode="decimal"
              value={closingCash}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setClosingCash(value);
                }
              }}
              placeholder="0.00"
              className="w-full"
              autoFocus
            />
          </div>

          {/* Difference Alert */}
          {closingCash && !isNaN(parseFloat(closingCash)) && (
            <div
              className={cn(
                'p-3 rounded-md border-2',
                Math.abs(
                  parseFloat(closingCash) -
                    (currentShift.openingCash +
                      (currentShift.cashSales || 0) -
                      (currentShift.refunds || 0))
                ) > 0.01
                  ? 'bg-warning/10 border-warning/30'
                  : 'bg-success/10 border-success/30'
              )}
            >
              <p className="fluent-caption font-medium text-foreground">
                Fark:{' '}
                {(
                  parseFloat(closingCash) -
                  (currentShift.openingCash +
                    (currentShift.cashSales || 0) -
                    (currentShift.refunds || 0))
                ).toFixed(2)}{' '}
                ₺
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-border">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={() => setView('main')}
            >
              Geri
            </FluentButton>
            <FluentButton
              appearance="primary"
              className="flex-1"
              onClick={handleEndShift}
              disabled={!closingCash || isNaN(parseFloat(closingCash))}
            >
              Vardiyayı Kapat
            </FluentButton>
          </div>
        </div>
      )}
    </FluentDialog>
  );
};

export default ShiftManagementDialog;




import React, { useState, useEffect } from 'react';
import { Plus, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentDialog from '../components/fluent/FluentDialog';
import FluentInput from '../components/fluent/FluentInput';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Shift {
  id: string;
  shiftNumber: string;
  startTime: string;
  endTime?: string;
  startCash: number;
  endCash?: number;
  expectedCash?: number;
  actualCash?: number;
  difference?: number;
  status: string;
  user: { name: string };
  _count?: { sales: number };
}

const Shifts: React.FC = () => {
  const { t } = useTranslation();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [startCash, setStartCash] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await api.get('/shifts');
      setShifts(response.data.shifts || response.data || []);
    } catch (error) {
      toast.error(t('shifts.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/shifts', { startCash });
      toast.success(t('shifts.startShift'));
      fetchShifts();
      setShowDialog(false);
      setStartCash(0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('shifts.fetchError'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  const activeShift = shifts.find((s) => s.status === 'OPEN');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">{t('shifts.title')}</h1>
          <p className="fluent-body text-foreground-secondary mt-1">{t('shifts.shiftsCount', { count: shifts.length })}</p>
        </div>
        {!activeShift && (
          <FluentButton
            appearance="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowDialog(true)}
          >
            {t('shifts.startShift')}
          </FluentButton>
        )}
      </div>

      {activeShift && (
        <FluentCard depth="depth-8" className="p-6 bg-gradient-to-br from-success/10 to-success/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-success" />
              </div>
              <div>
                <h4 className="fluent-heading text-foreground">{activeShift.shiftNumber}</h4>
                <p className="fluent-body-small text-foreground-secondary">{t('shifts.activeShift') || 'Aktif Vardiya'}</p>
              </div>
            </div>
            <FluentBadge appearance="success">{t('shifts.open') || 'AÇIK'}</FluentBadge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="fluent-caption text-foreground-secondary">{t('shifts.startTime')}</p>
              <p className="fluent-body text-foreground">
                {new Date(activeShift.startTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="fluent-caption text-foreground-secondary">{t('shifts.openingCash')}</p>
              <p className="fluent-body text-foreground">₺{activeShift.startCash.toFixed(2)}</p>
            </div>
            <div>
              <p className="fluent-caption text-foreground-secondary">{t('nav.sales')}</p>
              <p className="fluent-body text-foreground">{activeShift._count?.sales || 0}</p>
            </div>
            <div>
              <p className="fluent-caption text-foreground-secondary">Cashier</p>
              <p className="fluent-body text-foreground">{activeShift.user.name}</p>
            </div>
          </div>
          <FluentButton appearance="subtle" className="mt-4">
            Close Shift
          </FluentButton>
        </FluentCard>
      )}

      <FluentCard depth="depth-4" className="p-6">
        <h3 className="fluent-heading text-foreground mb-4">{t('shifts.shiftHistory') || 'Vardiya Geçmişi'}</h3>
        <div className="space-y-3">
          {shifts
            .filter((s) => s.status === 'CLOSED')
            .map((shift) => (
              <div key={shift.id} className="flex items-center gap-4 p-3 bg-background-alt rounded">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="fluent-body font-medium text-foreground">{shift.shiftNumber}</p>
                    <FluentBadge
                      appearance={shift.difference === 0 ? 'success' : 'warning'}
                      size="small"
                    >
                      {shift.status}
                    </FluentBadge>
                  </div>
                  <div className="flex gap-4 text-sm text-foreground-secondary">
                    <span>By: {shift.user.name}</span>
                    <span>Sales: {shift._count?.sales || 0}</span>
                    <span>
                      {new Date(shift.startTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="fluent-body-small text-foreground-secondary">Expected / Actual</p>
                  <p className="fluent-body text-foreground">
                    ₺{shift.expectedCash?.toFixed(2)} / ₺{shift.actualCash?.toFixed(2)}
                  </p>
                  {shift.difference !== 0 && (
                    <p
                      className={`fluent-caption ${
                        (shift.difference || 0) > 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      Diff: ₺{shift.difference?.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </FluentCard>

      <FluentDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={t('shifts.startShift')}
        size="small"
      >
        <form onSubmit={handleStartShift} className="space-y-4">
          <FluentInput
            label={t('shifts.openingCash')}
            type="number"
            step="0.01"
            value={startCash}
            onChange={(e) => setStartCash(parseFloat(e.target.value))}
            icon={<DollarSign className="w-4 h-4" />}
            required
          />
          <p className="fluent-caption text-foreground-secondary">
            Enter the initial cash amount in the register
          </p>
          <div className="flex gap-2 pt-4">
            <FluentButton appearance="subtle" className="flex-1" onClick={() => setShowDialog(false)}>
              Cancel
            </FluentButton>
            <FluentButton type="submit" appearance="primary" className="flex-1">
              Start
            </FluentButton>
          </div>
        </form>
      </FluentDialog>
    </div>
  );
};

export default Shifts;


import React, { useState, useEffect } from 'react';
import {
  Wallet, Plus, Minus, Clock, CheckCircle, XCircle, Calendar,
  TrendingUp, TrendingDown, DollarSign, Receipt, AlertCircle,
} from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentDialog from '../components/fluent/FluentDialog';
import FluentInput from '../components/fluent/FluentInput';
import FluentTabs from '../components/fluent/FluentTabs';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface CashTransaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  note: string;
  user: { name: string };
  createdAt: string;
}

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
  sales?: any[];
  cashTransactions?: CashTransaction[];
}

const CashManagement: React.FC = () => {
  const { t } = useTranslation();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [showStartShiftDialog, setShowStartShiftDialog] = useState(false);
  const [showEndShiftDialog, setShowEndShiftDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN');
  
  // Forms
  const [startCashAmount, setStartCashAmount] = useState('0');
  const [endShiftForm, setEndShiftForm] = useState({ actualCash: '0', notes: '' });
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    category: '',
    note: '',
  });

  // Active tab
  const [activeTab, setActiveTab] = useState<'active' | 'transactions' | 'history'>('active');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [activeRes, shiftsRes, balanceRes] = await Promise.all([
        api.get('/shifts/active'),
        api.get('/shifts'),
        api.get('/cash-transactions/balance'),
      ]);

      setActiveShift(activeRes.data.activeShift);
      setShifts(shiftsRes.data.shifts || []);
      setCurrentBalance(balanceRes.data.balance || 0);

      if (activeRes.data.activeShift) {
        const transRes = await api.get(`/cash-transactions?shiftId=${activeRes.data.activeShift.id}`);
        setTransactions(transRes.data.transactions || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Veriler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/shifts/start', { startCash: parseFloat(startCashAmount) });
      toast.success('Vardiya başarıyla başlatıldı');
      setShowStartShiftDialog(false);
      setStartCashAmount('0');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Vardiya başlatılamadı');
    }
  };

  const handleEndShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    try {
      await api.post(`/shifts/${activeShift.id}/end`, {
        actualCash: parseFloat(endShiftForm.actualCash),
        notes: endShiftForm.notes,
      });
      toast.success('Vardiya başarıyla kapatıldı');
      setShowEndShiftDialog(false);
      setEndShiftForm({ actualCash: '0', notes: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Vardiya kapatılamadı');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) {
      toast.error('Önce bir vardiya başlatmalısınız');
      return;
    }

    try {
      await api.post('/cash-transactions', {
        shiftId: activeShift.id,
        type: transactionType,
        amount: parseFloat(transactionForm.amount),
        category: transactionForm.category || 'OTHER',
        note: transactionForm.note,
      });
      toast.success('İşlem başarıyla eklendi');
      setShowTransactionDialog(false);
      setTransactionForm({ amount: '', category: '', note: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İşlem eklenemedi');
    }
  };

  const openTransactionDialog = (type: 'IN' | 'OUT') => {
    setTransactionType(type);
    setTransactionForm({ amount: '', category: '', note: '' });
    setShowTransactionDialog(true);
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Wallet className="w-7 h-7" />
            Kasa Yönetimi
          </h1>
          <p className="text-sm text-foreground-secondary mt-1">
            Vardiya ve nakit takibi
          </p>
        </div>
        {!activeShift && (
          <FluentButton
            appearance="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowStartShiftDialog(true)}
          >
            Vardiya Başlat
          </FluentButton>
        )}
      </div>

      {/* Active Shift Card */}
      {activeShift && (
        <FluentCard depth="depth-8" className="p-6 bg-gradient-to-br from-success/10 to-success/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Aktif Vardiya: {activeShift.shiftNumber}
                </h2>
                <p className="text-sm text-foreground-secondary">
                  {new Date(activeShift.startTime).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
            <FluentButton
              appearance="primary"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={() => {
                setEndShiftForm({ actualCash: currentBalance.toString(), notes: '' });
                setShowEndShiftDialog(true);
              }}
            >
              Vardiyayı Kapat
            </FluentButton>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-xs text-foreground-secondary mb-1">Başlangıç Kasası</p>
              <p className="text-2xl font-bold text-foreground">₺{activeShift.startCash.toFixed(2)}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-xs text-foreground-secondary mb-1">Mevcut Bakiye</p>
              <p className="text-2xl font-bold text-success">₺{currentBalance.toFixed(2)}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-xs text-foreground-secondary mb-1">Satış Sayısı</p>
              <p className="text-2xl font-bold text-foreground">{activeShift._count?.sales || 0}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-xs text-foreground-secondary mb-1">Süre</p>
              <p className="text-2xl font-bold text-foreground">
                {Math.floor((new Date().getTime() - new Date(activeShift.startTime).getTime()) / (1000 * 60 * 60))}sa
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <FluentButton
              appearance="subtle"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => openTransactionDialog('IN')}
            >
              Giriş Ekle
            </FluentButton>
            <FluentButton
              appearance="subtle"
              icon={<Minus className="w-4 h-4" />}
              onClick={() => openTransactionDialog('OUT')}
            >
              Çıkış Ekle
            </FluentButton>
          </div>
        </FluentCard>
      )}

      {/* No Active Shift */}
      {!activeShift && (
        <FluentCard depth="depth-4" className="p-8 text-center">
          <Wallet className="w-16 h-16 mx-auto text-foreground-secondary mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aktif Vardiya Yok</h3>
          <p className="text-sm text-foreground-secondary mb-4">
            Kasa işlemlerini başlatmak için önce bir vardiya başlatın
          </p>
          <FluentButton
            appearance="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowStartShiftDialog(true)}
          >
            Vardiya Başlat
          </FluentButton>
        </FluentCard>
      )}

      {/* Tabs */}
      <FluentTabs
        tabs={[
          { id: 'transactions', label: 'Nakit İşlemleri', icon: <Receipt className="w-4 h-4" /> },
          { id: 'history', label: 'Vardiya Geçmişi', icon: <Calendar className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      />

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <FluentCard depth="depth-4" className="p-6 text-center">
              <Receipt className="w-12 h-12 mx-auto text-foreground-secondary mb-2" />
              <p className="text-sm text-foreground-secondary">Henüz işlem yok</p>
            </FluentCard>
          ) : (
            transactions.map((transaction) => (
              <FluentCard key={transaction.id} depth="depth-4" hoverable className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'IN'
                          ? 'bg-success/10'
                          : 'bg-error/10'
                      }`}
                    >
                      {transaction.type === 'IN' ? (
                        <TrendingUp className="w-5 h-5 text-success" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-error" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{transaction.note}</p>
                      <p className="text-xs text-foreground-secondary">
                        {new Date(transaction.createdAt).toLocaleString('tr-TR')} • {transaction.user.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.type === 'IN' ? 'text-success' : 'text-error'
                      }`}
                    >
                      {transaction.type === 'IN' ? '+' : '-'}₺{transaction.amount.toFixed(2)}
                    </p>
                    <FluentBadge size="small" appearance="default">
                      {transaction.category}
                    </FluentBadge>
                  </div>
                </div>
              </FluentCard>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {shifts.length === 0 ? (
            <FluentCard depth="depth-4" className="p-6 text-center">
              <Calendar className="w-12 h-12 mx-auto text-foreground-secondary mb-2" />
              <p className="text-sm text-foreground-secondary">Henüz vardiya yok</p>
            </FluentCard>
          ) : (
            shifts.map((shift) => (
              <FluentCard key={shift.id} depth="depth-4" hoverable className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{shift.shiftNumber}</p>
                      <p className="text-xs text-foreground-secondary">
                        {new Date(shift.startTime).toLocaleDateString('tr-TR')} • {shift.user.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-foreground-secondary">Başlangıç</p>
                      <p className="text-sm font-semibold text-foreground">₺{shift.startCash.toFixed(2)}</p>
                    </div>
                    {shift.status === 'CLOSED' && (
                      <>
                        <div className="text-right">
                          <p className="text-xs text-foreground-secondary">Bitiş</p>
                          <p className="text-sm font-semibold text-foreground">₺{shift.actualCash?.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-foreground-secondary">Fark</p>
                          <p
                            className={`text-sm font-semibold ${
                              (shift.difference || 0) >= 0 ? 'text-success' : 'text-error'
                            }`}
                          >
                            {(shift.difference || 0) >= 0 ? '+' : ''}₺{shift.difference?.toFixed(2)}
                          </p>
                        </div>
                      </>
                    )}
                    <FluentBadge
                      appearance={shift.status === 'OPEN' ? 'success' : 'default'}
                      size="small"
                    >
                      {shift.status === 'OPEN' ? 'Açık' : 'Kapalı'}
                    </FluentBadge>
                  </div>
                </div>
              </FluentCard>
            ))
          )}
        </div>
      )}

      {/* Start Shift Dialog */}
      <FluentDialog
        open={showStartShiftDialog}
        onClose={() => setShowStartShiftDialog(false)}
        title="Vardiya Başlat"
        size="medium"
      >
        <form onSubmit={handleStartShift} className="space-y-4">
          <FluentInput
            label="Başlangıç Kasa Tutarı (₺)"
            type="number"
            step="0.01"
            value={startCashAmount}
            onChange={(e) => setStartCashAmount(e.target.value)}
            placeholder="0.00"
            required
            icon={<DollarSign className="w-4 h-4" />}
          />
          <div className="flex gap-2 justify-end">
            <FluentButton
              appearance="subtle"
              onClick={() => setShowStartShiftDialog(false)}
              type="button"
            >
              İptal
            </FluentButton>
            <FluentButton appearance="primary" type="submit">
              Başlat
            </FluentButton>
          </div>
        </form>
      </FluentDialog>

      {/* End Shift Dialog */}
      <FluentDialog
        open={showEndShiftDialog}
        onClose={() => setShowEndShiftDialog(false)}
        title="Vardiya Kapat"
        size="medium"
      >
        <form onSubmit={handleEndShift} className="space-y-4">
          {activeShift && (
            <div className="bg-info/10 border border-info/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-info" />
                <p className="text-sm font-medium text-foreground">Beklenen Kasa</p>
              </div>
              <p className="text-2xl font-bold text-info">₺{currentBalance.toFixed(2)}</p>
            </div>
          )}
          <FluentInput
            label="Gerçek Kasa Tutarı (₺)"
            type="number"
            step="0.01"
            value={endShiftForm.actualCash}
            onChange={(e) => setEndShiftForm({ ...endShiftForm, actualCash: e.target.value })}
            placeholder="0.00"
            required
            icon={<DollarSign className="w-4 h-4" />}
          />
          <FluentInput
            label="Notlar"
            value={endShiftForm.notes}
            onChange={(e) => setEndShiftForm({ ...endShiftForm, notes: e.target.value })}
            placeholder="Opsiyonel notlar..."
          />
          <div className="flex gap-2 justify-end">
            <FluentButton
              appearance="subtle"
              onClick={() => setShowEndShiftDialog(false)}
              type="button"
            >
              İptal
            </FluentButton>
            <FluentButton appearance="primary" type="submit">
              Kapat
            </FluentButton>
          </div>
        </form>
      </FluentDialog>

      {/* Add Transaction Dialog */}
      <FluentDialog
        open={showTransactionDialog}
        onClose={() => setShowTransactionDialog(false)}
        title={transactionType === 'IN' ? 'Nakit Girişi' : 'Nakit Çıkışı'}
        size="medium"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <FluentInput
            label="Tutar (₺)"
            type="number"
            step="0.01"
            value={transactionForm.amount}
            onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
            placeholder="0.00"
            required
            icon={<DollarSign className="w-4 h-4" />}
          />
          <FluentInput
            label="Kategori"
            value={transactionForm.category}
            onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
            placeholder="Örn: Banka yatırma, Gider ödeme"
          />
          <FluentInput
            label="Açıklama"
            value={transactionForm.note}
            onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
            placeholder="İşlem açıklaması"
            required
          />
          <div className="flex gap-2 justify-end">
            <FluentButton
              appearance="subtle"
              onClick={() => setShowTransactionDialog(false)}
              type="button"
            >
              İptal
            </FluentButton>
            <FluentButton appearance="primary" type="submit">
              Ekle
            </FluentButton>
          </div>
        </form>
      </FluentDialog>
    </div>
  );
};

export default CashManagement;


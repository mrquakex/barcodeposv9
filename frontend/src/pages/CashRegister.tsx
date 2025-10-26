import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, Minus, Calendar, DollarSign, TrendingUp, TrendingDown, Eye, EyeOff, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Breadcrumbs from '../components/Breadcrumbs';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

/* ============================================
   CASH REGISTER PAGE (Apple Wallet Style)
   iOS Wallet Card Design
   ============================================ */

interface CashTransaction {
  id: string;
  type: 'in' | 'out';
  amount: number;
  note: string;
  createdAt: string;
}

interface CashRegister {
  id: string;
  name: string;
  balance: number;
  isOpen: boolean;
  openedAt?: string;
  closedAt?: string;
}

const CashRegisterPage: React.FC = () => {
  const [registers, setRegisters] = useState<CashRegister[]>([
    {
      id: '1',
      name: 'Ana Kasa',
      balance: 15430.50,
      isOpen: true,
      openedAt: '2025-10-26T08:00:00Z',
    },
    {
      id: '2',
      name: 'Yedek Kasa',
      balance: 5200.00,
      isOpen: false,
      closedAt: '2025-10-25T18:30:00Z',
    },
  ]);

  const [transactions, setTransactions] = useState<CashTransaction[]>([
    {
      id: '1',
      type: 'in',
      amount: 1500,
      note: 'Satış',
      createdAt: '2025-10-26T10:30:00Z',
    },
    {
      id: '2',
      type: 'out',
      amount: 500,
      note: 'Kira',
      createdAt: '2025-10-26T11:15:00Z',
    },
  ]);

  const [showBalances, setShowBalances] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const totalBalance = registers.reduce((sum, r) => sum + r.balance, 0);
  const openRegisters = registers.filter(r => r.isOpen).length;

  const handleAddTransaction = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    if (!note.trim()) {
      toast.error('Not alanı gereklidir');
      return;
    }

    const newTransaction: CashTransaction = {
      id: Date.now().toString(),
      type: modalType,
      amount: parseFloat(amount),
      note: note,
      createdAt: new Date().toISOString(),
    };

    setTransactions([newTransaction, ...transactions]);
    
    // Update register balance (for the first open register)
    const openRegister = registers.find(r => r.isOpen);
    if (openRegister) {
      setRegisters(
        registers.map(r =>
          r.id === openRegister.id
            ? {
                ...r,
                balance:
                  modalType === 'in'
                    ? r.balance + parseFloat(amount)
                    : r.balance - parseFloat(amount),
              }
            : r
        )
      );
    }

    toast.success(modalType === 'in' ? 'Para girişi eklendi' : 'Para çıkışı eklendi');
    setShowModal(false);
    setAmount('');
    setNote('');
  };

  const openModal = (type: 'in' | 'out') => {
    setModalType(type);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-bold text-foreground tracking-tight">
            Kasa Yönetimi
          </h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            Kasalarınızı ve nakit akışınızı yönetin
          </p>
        </div>

        <Button
          variant="plain"
          size="icon"
          onClick={() => setShowBalances(!showBalances)}
        >
          {showBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="Toplam Bakiye"
          value={showBalances ? formatCurrency(totalBalance) : '•••••'}
          description="Tüm kasalar"
          icon={Wallet}
          color="from-blue-600 to-blue-700"
        />
        <StatCard
          title="Açık Kasa"
          value={openRegisters.toString()}
          description="Aktif kasalar"
          icon={CheckCircle2}
          color="from-green-600 to-green-700"
        />
        <StatCard
          title="Bugün Giriş"
          value={formatCurrency(1500)}
          description="Toplam gelen"
          icon={TrendingUp}
          color="from-green-600 to-green-700"
        />
        <StatCard
          title="Bugün Çıkış"
          value={formatCurrency(500)}
          description="Toplam giden"
          icon={TrendingDown}
          color="from-red-600 to-red-700"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Registers Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Registers */}
          <Card>
            <CardHeader>
              <CardTitle>Kasalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {registers.map((register) => (
                  <motion.div
                    key={register.id}
                    whileHover={{ scale: 1.005 }}
                    className={`p-5 rounded-[16px] transition-all border-2 ${
                      register.isOpen
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-[12px] ${
                          register.isOpen ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <Wallet className={`w-6 h-6 ${
                            register.isOpen ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <p className="text-[17px] font-semibold text-foreground">
                            {register.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {register.isOpen ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                <p className="text-[11px] text-green-600 font-medium uppercase">
                                  Açık
                                </p>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <p className="text-[11px] text-muted-foreground font-medium uppercase">
                                  Kapalı
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[24px] font-bold text-foreground">
                          {showBalances ? formatCurrency(register.balance) : '•••••'}
                        </p>
                        {register.openedAt && register.isOpen && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {new Date(register.openedAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Son İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-[10px] hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-[8px] ${
                          transaction.type === 'in'
                            ? 'bg-green-500/10'
                            : 'bg-red-500/10'
                        }`}>
                          {transaction.type === 'in' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-[15px] font-medium text-foreground">
                            {transaction.note}
                          </p>
                          <p className="text-[13px] text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleString('tr-TR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <p className={`text-[17px] font-semibold ${
                        transaction.type === 'in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'in' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Wallet}
                  title="Henüz İşlem Yok"
                  description="Kasa işlemleri burada görünecek."
                  actionLabel="Para Girişi Ekle"
                  onAction={() => openModal('in')}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions Section */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="filled"
                size="default"
                className="w-full"
                onClick={() => openModal('in')}
              >
                <Plus className="w-4 h-4" />
                Para Girişi
              </Button>
              <Button
                variant="destructive"
                size="default"
                className="w-full"
                onClick={() => openModal('out')}
              >
                <Minus className="w-4 h-4" />
                Para Çıkışı
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-[16px] border border-border apple-shadow-xl w-full max-w-md"
          >
            <div className="p-6">
              <h3 className="text-[20px] font-semibold text-foreground mb-4">
                {modalType === 'in' ? 'Para Girişi' : 'Para Çıkışı'}
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Tutar *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="note">Not *</Label>
                  <Input
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="İşlem açıklaması"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="filled"
                    size="default"
                    className="flex-1"
                    onClick={handleAddTransaction}
                  >
                    Kaydet
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    className="flex-1"
                    onClick={() => setShowModal(false)}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CashRegisterPage;


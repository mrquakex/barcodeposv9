import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Minus, DollarSign } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentDialog from '../components/fluent/FluentDialog';
import FluentInput from '../components/fluent/FluentInput';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface CashTransaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  note: string;
  user: { name: string };
  createdAt: string;
}

const CashRegister: React.FC = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'IN' | 'OUT'>('IN');
  const [formData, setFormData] = useState({ amount: 0, category: '', note: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        api.get('/cash-register/balance'),
        api.get('/cash-register/transactions'),
      ]);
      setBalance(balanceRes.data.balance);
      setTransactions(transactionsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/cash-register/transactions', { ...formData, type: dialogType });
      toast.success('Transaction added');
      fetchData();
      setShowDialog(false);
      setFormData({ amount: 0, category: '', note: '' });
    } catch (error) {
      toast.error('Failed to add transaction');
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="fluent-title text-foreground">Cash Register</h1>
        <p className="fluent-body text-foreground-secondary mt-1">Manage cash transactions</p>
      </div>

      <FluentCard depth="depth-8" className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="fluent-body text-foreground-secondary">Current Balance</p>
            <p className="text-4xl font-semibold text-primary">₺{balance.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <FluentButton
            appearance="primary"
            className="flex-1"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setDialogType('IN');
              setShowDialog(true);
            }}
          >
            Cash In
          </FluentButton>
          <FluentButton
            appearance="subtle"
            className="flex-1"
            icon={<Minus className="w-4 h-4" />}
            onClick={() => {
              setDialogType('OUT');
              setShowDialog(true);
            }}
          >
            Cash Out
          </FluentButton>
        </div>
      </FluentCard>

      <FluentCard depth="depth-4" className="p-6">
        <h3 className="fluent-heading text-foreground mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center gap-4 p-3 bg-background-alt rounded">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'IN' ? 'bg-success/10' : 'bg-destructive/10'
                }`}
              >
                {transaction.type === 'IN' ? (
                  <Plus className={`w-5 h-5 text-success`} />
                ) : (
                  <Minus className={`w-5 h-5 text-destructive`} />
                )}
              </div>
              <div className="flex-1">
                <p className="fluent-body font-medium text-foreground">{transaction.category}</p>
                <p className="fluent-caption text-foreground-secondary">{transaction.note}</p>
                <p className="fluent-caption text-foreground-tertiary">
                  By {transaction.user.name} •{' '}
                  {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <p
                className={`fluent-body font-semibold ${
                  transaction.type === 'IN' ? 'text-success' : 'text-destructive'
                }`}
              >
                {transaction.type === 'IN' ? '+' : '-'}₺{transaction.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </FluentCard>

      <FluentDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={dialogType === 'IN' ? 'Cash In' : 'Cash Out'}
        size="small"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FluentInput
            label="Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            icon={<DollarSign className="w-4 h-4" />}
            required
          />
          <FluentInput
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Sales, Expense, Bank Deposit"
            required
          />
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">Note</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>
          <div className="flex gap-2 pt-4">
            <FluentButton appearance="subtle" className="flex-1" onClick={() => setShowDialog(false)}>
              Cancel
            </FluentButton>
            <FluentButton type="submit" appearance="primary" className="flex-1">
              Confirm
            </FluentButton>
          </div>
        </form>
      </FluentDialog>
    </div>
  );
};

export default CashRegister;


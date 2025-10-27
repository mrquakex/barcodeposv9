import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Receipt } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentDialog from '../components/fluent/FluentDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Expense {
  id: string;
  amount: number;
  description: string;
  paymentMethod: string;
  category: { name: string };
  expenseDate: string;
  user: { name: string };
}

const Expenses: React.FC = () => {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: 0,
    description: '',
    paymentMethod: 'CASH',
  });

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data.expenses || []);
    } catch (error) {
      toast.error(t('expenses.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/expenses/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
        toast.success(t('expenses.expenseCreated'));
      fetchExpenses();
      setShowDialog(false);
      setFormData({ categoryId: '', amount: 0, description: '', paymentMethod: 'CASH' });
    } catch (error) {
      toast.error('Failed to create expense');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">{t('expenses.title')}</h1>
          <p className="fluent-body text-foreground-secondary mt-1">{t('expenses.expensesCount', { count: expenses.length })}</p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDialog(true)}
        >
          {t('expenses.addExpense')}
        </FluentButton>
      </div>

      <FluentCard depth="depth-4" className="p-4">
        <FluentInput placeholder={t('expenses.searchPlaceholder') || 'Gider ara...'} icon={<Search className="w-4 h-4" />} />
      </FluentCard>

      <div className="space-y-3">
        {expenses.map((expense) => (
          <FluentCard key={expense.id} depth="depth-4" hoverable className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                <Receipt className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h4 className="fluent-body font-medium text-foreground mb-1">
                  {expense.description}
                </h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                  <span>{t('products.category')}: {expense.category.name}</span>
                  <span>{t('pos.paymentMethod')}: {expense.paymentMethod}</span>
                  <span>{t('common.by') || 'Kullanıcı'}: {expense.user.name}</span>
                  <span>
                    {new Date(expense.expenseDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <p className="fluent-heading text-destructive">-₺{expense.amount.toFixed(2)}</p>
            </div>
          </FluentCard>
        ))}
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="fluent-body text-foreground-secondary">No expenses yet</p>
        </div>
      )}

      <FluentDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="Add Expense"
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full h-10 px-3 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <FluentInput
            label="Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            required
          />
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full h-10 px-3 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="CASH">{t('pos.cash')}</option>
              <option value="CARD">{t('pos.card')}</option>
              <option value="BANK_TRANSFER">{t('expenses.bankTransfer') || 'Banka Havalesi'}</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <FluentButton appearance="subtle" className="flex-1" onClick={() => setShowDialog(false)}>
              Cancel
            </FluentButton>
            <FluentButton type="submit" appearance="primary" className="flex-1">
              Create
            </FluentButton>
          </div>
        </form>
      </FluentDialog>
    </div>
  );
};

export default Expenses;


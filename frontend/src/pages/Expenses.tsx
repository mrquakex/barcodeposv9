import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Expense, ExpenseCategory } from '../types';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ categoryId: '', amount: '', description: '', paymentMethod: 'CASH', expenseDate: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data.expenses);
    } catch (error) {
      toast.error('Giderler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/expenses/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      toast.success('Gider kaydedildi!');
      fetchExpenses();
      setShowForm(false);
      setFormData({ categoryId: '', amount: '', description: '', paymentMethod: 'CASH', expenseDate: new Date().toISOString().split('T')[0] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Hata oluştu');
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) return <div className="flex items-center justify-center h-full"><p>Yükleniyor...</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Giderler</h1>
          <p className="text-muted-foreground mt-1">Toplam: {formatCurrency(totalExpenses)}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2"><Plus className="w-4 h-4" />Yeni Gider</Button>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card>
            <CardHeader><CardTitle>Yeni Gider Ekle</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div><Label>Kategori *</Label><select required className="w-full h-10 px-3 rounded-md border bg-background" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}><option value="">Seçin</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><Label>Tutar *</Label><Input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
                <div><Label>Açıklama *</Label><Input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                <div><Label>Tarih</Label><Input type="date" value={formData.expenseDate} onChange={e => setFormData({...formData, expenseDate: e.target.value})} /></div>
                <div className="md:col-span-2 flex gap-2"><Button type="submit">Kaydet</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>İptal</Button></div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Tarih</TableHead><TableHead>Kategori</TableHead><TableHead>Açıklama</TableHead><TableHead>Tutar</TableHead><TableHead>Kullanıcı</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell className="text-sm">{formatDate(expense.expenseDate)}</TableCell>
                  <TableCell><span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs">{expense.category?.name}</span></TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell className="font-semibold text-red-600">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>{expense.user?.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;



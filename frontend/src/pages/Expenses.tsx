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
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">Giderler</h1>
          <p className="text-muted-foreground mt-2 font-semibold">Toplam: {formatCurrency(totalExpenses)} • {expenses.length} gider</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="h-12 px-6 text-base font-bold bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-500 hover:to-slate-600 shadow-lg gap-2"><Plus className="w-5 h-5" />Yeni Gider</Button>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card className="border-2 border-blue-200 dark:border-blue-900 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
              <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-blue-600" />
                Yeni Gider Ekle
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div><Label className="font-semibold">Kategori *</Label><select required className="w-full h-11 px-3 rounded-md border-2 bg-background" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}><option value="">Seçin</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><Label className="font-semibold">Tutar *</Label><Input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="h-11" /></div>
                <div><Label>Açıklama *</Label><Input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                <div><Label>Tarih</Label><Input type="date" value={formData.expenseDate} onChange={e => setFormData({...formData, expenseDate: e.target.value})} /></div>
                <div className="md:col-span-2 flex gap-3 pt-4 border-t-2">
                  <Button type="submit" className="h-12 px-6 font-bold bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-500 hover:to-slate-600 shadow-lg">Kaydet</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-12 px-6 font-semibold">İptal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card className="border-2 border-blue-200 dark:border-blue-900 shadow-xl">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
                <TableHead className="font-black text-slate-900 dark:text-white">Tarih</TableHead>
                <TableHead className="font-black text-slate-900 dark:text-white">Kategori</TableHead>
                <TableHead className="font-black text-slate-900 dark:text-white">Açıklama</TableHead>
                <TableHead className="font-black text-slate-900 dark:text-white">Tutar</TableHead>
                <TableHead className="font-black text-slate-900 dark:text-white">Kullanıcı</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map(expense => (
                <TableRow key={expense.id} className="hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-colors">
                  <TableCell className="font-semibold">{formatDate(expense.expenseDate)}</TableCell>
                  <TableCell><span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-sm font-bold">{expense.category?.name}</span></TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell><span className="font-black text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-1 rounded-lg">{formatCurrency(expense.amount)}</span></TableCell>
                  <TableCell className="font-medium">{expense.user?.name}</TableCell>
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



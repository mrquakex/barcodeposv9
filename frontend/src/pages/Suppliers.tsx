import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Supplier } from '../types';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', contactPerson: '', taxNumber: '', paymentTerms: '' });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.suppliers);
    } catch (error) {
      toast.error('Tedarikçiler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, formData);
        toast.success('Tedarikçi güncellendi!');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Tedarikçi eklendi!');
      }
      fetchSuppliers();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Hata oluştu');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
      taxNumber: supplier.taxNumber || '',
      paymentTerms: supplier.paymentTerms || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', address: '', contactPerson: '', taxNumber: '', paymentTerms: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Tedarikçi silindi!');
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Silinemedi');
    }
  };

  const filteredSuppliers = searchQuery
    ? suppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email?.includes(searchQuery))
    : suppliers;

  if (loading) return <div className="flex items-center justify-center h-full"><p>Yükleniyor...</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">Tedarikçiler</h1>
          <p className="text-muted-foreground mt-2 font-semibold">Tedarikçi yönetimi • {suppliers.length} tedarikçi</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="h-12 px-6 text-base font-bold bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-500 hover:to-slate-600 shadow-lg gap-2"><Plus className="w-5 h-5" />Yeni Tedarikçi</Button>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card className="border-2 border-blue-400 dark:border-blue-900 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
              <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                {editingId ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi Ekle'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div><Label className="font-semibold">Firma Adı *</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11" /></div>
                <div><Label className="font-semibold">Yetkili</Label><Input value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="h-11" /></div>
                <div><Label className="font-semibold">Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-11" /></div>
                <div><Label className="font-semibold">Telefon</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-11" /></div>
                <div><Label className="font-semibold">Adres</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-11" /></div>
                <div><Label className="font-semibold">Vergi No</Label><Input value={formData.taxNumber} onChange={e => setFormData({...formData, taxNumber: e.target.value})} className="h-11" /></div>
                <div className="md:col-span-2 flex gap-3 pt-4 border-t-2">
                  <Button type="submit" className="h-12 px-6 font-bold bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-500 hover:to-slate-600 shadow-lg">{editingId ? 'Güncelle' : 'Kaydet'}</Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="h-12 px-6 font-semibold">İptal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card className="border-2 border-blue-400 dark:border-blue-900 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
              <Input placeholder="🔍 Tedarikçi ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-14 h-14 text-base border-2 border-slate-300 focus:border-blue-600 dark:border-slate-700" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
                <TableHead className="font-medium text-slate-900 dark:text-white">Firma</TableHead>
                <TableHead className="font-medium text-slate-900 dark:text-white">Yetkili</TableHead>
                <TableHead className="font-medium text-slate-900 dark:text-white">İletişim</TableHead>
                <TableHead className="font-medium text-slate-900 dark:text-white">Bakiye</TableHead>
                <TableHead className="font-medium text-slate-900 dark:text-white">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map(supplier => (
                <TableRow key={supplier.id} className="hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-colors">
                  <TableCell className="font-bold text-slate-900 dark:text-white">{supplier.name}</TableCell>
                  <TableCell className="font-medium">{supplier.contactPerson || '-'}</TableCell>
                  <TableCell><div className="text-sm font-medium">{supplier.email}</div><div className="text-xs text-muted-foreground font-semibold">{supplier.phone}</div></TableCell>
                  <TableCell>
                    <span className={supplier.balance > 0 ? 'text-red-600 font-black bg-red-50 dark:bg-red-950/20 px-3 py-1 rounded-lg' : 'text-green-600 font-black bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-lg'}>
                      {formatCurrency(supplier.balance)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)} className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20"><Edit className="w-5 h-5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)} className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"><Trash2 className="w-5 h-5 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Suppliers;



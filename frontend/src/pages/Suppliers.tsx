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
      await api.post('/suppliers', formData);
      toast.success('Tedarikçi eklendi!');
      fetchSuppliers();
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', address: '', contactPerson: '', taxNumber: '', paymentTerms: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Hata oluştu');
    }
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Tedarikçiler</h1>
          <p className="text-muted-foreground mt-1">Tedarikçi yönetimi • {suppliers.length} tedarikçi</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2"><Plus className="w-4 h-4" />Yeni Tedarikçi</Button>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card>
            <CardHeader><CardTitle>Yeni Tedarikçi Ekle</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div><Label>Firma Adı *</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><Label>Yetkili</Label><Input value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} /></div>
                <div><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div><Label>Telefon</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                <div><Label>Adres</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                <div><Label>Vergi No</Label><Input value={formData.taxNumber} onChange={e => setFormData({...formData, taxNumber: e.target.value})} /></div>
                <div className="md:col-span-2 flex gap-2"><Button type="submit">Kaydet</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>İptal</Button></div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input placeholder="Tedarikçi ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1" />
          </div>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Firma</TableHead><TableHead>Yetkili</TableHead><TableHead>İletişim</TableHead><TableHead>Bakiye</TableHead><TableHead>İşlemler</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contactPerson || '-'}</TableCell>
                  <TableCell><div className="text-sm">{supplier.email}</div><div className="text-xs text-muted-foreground">{supplier.phone}</div></TableCell>
                  <TableCell><span className={supplier.balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>{formatCurrency(supplier.balance)}</span></TableCell>
                  <TableCell><div className="flex gap-2"><Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div></TableCell>
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


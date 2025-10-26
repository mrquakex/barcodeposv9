import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Customer } from '../types';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Search, Edit, Trash2, Users, X, Eye, TrendingUp, ShoppingCart, DollarSign, CreditCard, Calendar, Phone, Mail, MapPin, FileText, Receipt, CheckCircle2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../components/ui/StatCard';

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  discountAmount?: number;
  netAmount: number;
  paymentMethod: string;
  createdAt: string;
  items?: Array<{
    quantity: number;
    price: number;
    product: { name: string };
  }>;
}

interface CustomerDetail extends Customer {
  totalSpent?: number;
  totalSales?: number;
  sales?: Sale[];
}

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtAction, setDebtAction] = useState<'add' | 'pay'>('add');
  const [debtAmount, setDebtAmount] = useState<string>('');
  const [debtNote, setDebtNote] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers);
    } catch (error) {
      toast.error('Müşteriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const viewCustomerDetail = async (customerId: string) => {
    try {
      const response = await api.get(`/customers/${customerId}`);
      const customer = response.data.customer;

      // Müşterinin satışlarını getir
      const salesResponse = await api.get(`/sales?customerId=${customerId}`);
      const sales = salesResponse.data.sales || [];

      // İstatistikleri hesapla
      const totalSpent = sales.reduce((sum: number, sale: Sale) => sum + sale.netAmount, 0);
      const totalSales = sales.length;

      setSelectedCustomer({
        ...customer,
        totalSpent,
        totalSales,
        sales: sales.slice(0, 10), // Son 10 satış
      });

      setShowDetailModal(true);
    } catch (error) {
      toast.error('Müşteri detayları yüklenemedi');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, formData);
        toast.success('Müşteri güncellendi!');
      } else {
        await api.post('/customers', formData);
        toast.success('Müşteri eklendi!');
      }
      fetchCustomers();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      taxNumber: customer.taxNumber || '',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;

    try {
      await api.delete(`/customers/${id}`);
      toast.success('Müşteri silindi!');
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Müşteri silinemedi');
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      taxNumber: '',
      notes: '',
    });
  };

  const openDebtModal = (action: 'add' | 'pay') => {
    setDebtAction(action);
    setDebtAmount('');
    setDebtNote('');
    setShowDebtModal(true);
  };

  const handleDebtTransaction = async () => {
    if (!selectedCustomer) return;
    
    const amount = parseFloat(debtAmount);
    if (!amount || amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    if (debtAction === 'pay' && amount > selectedCustomer.debt) {
      toast.error('Ödeme tutarı borçtan fazla olamaz');
      return;
    }

    try {
      const newDebt = debtAction === 'add' 
        ? selectedCustomer.debt + amount 
        : selectedCustomer.debt - amount;

      await api.put(`/customers/${selectedCustomer.id}`, {
        debt: newDebt,
      });

      toast.success(
        debtAction === 'add' 
          ? `✓ ${formatCurrency(amount)} borç eklendi` 
          : `✓ ${formatCurrency(amount)} borç ödendi`
      );

      // Müşteri detaylarını yenile
      await viewCustomerDetail(selectedCustomer.id);
      
      // Müşteri listesini yenile
      fetchCustomers();

      setShowDebtModal(false);
      setDebtAmount('');
      setDebtNote('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    }
  };

  const filteredCustomers = searchQuery
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone?.includes(searchQuery)
      )
    : customers;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
            Müşteriler
          </h1>
          <p className="text-muted-foreground mt-2 font-semibold">Müşteri kayıtlarınızı yönetin • {customers.length} müşteri</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="h-12 px-6 text-base font-bold bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-500 hover:to-slate-600 shadow-lg">
          <Plus className="w-5 h-5 mr-2" />
          Yeni Müşteri
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Müşteri"
          value={customers.length.toString()}
          description="Aktif müşteriler"
          icon={Users}
          color="from-blue-600 to-blue-700"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Toplam Borç"
          value={formatCurrency(customers.reduce((sum, c) => sum + c.debt, 0))}
          description="Ödenmemiş borçlar"
          icon={CreditCard}
          color="from-red-600 to-orange-700"
          trend={{ value: 5.2, isPositive: false }}
        />
        <StatCard
          title="Ort. Harcama"
          value={formatCurrency(
            customers.length > 0
              ? customers.reduce((sum, c) => sum + (c.credit || 0), 0) / customers.length
              : 0
          )}
          description="Müşteri başına"
          icon={ShoppingCart}
          color="from-green-600 to-emerald-700"
          trend={{ value: 8.7, isPositive: true }}
        />
        <StatCard
          title="Aktif Müşteri"
          value={customers.filter(c => c.isActive).length.toString()}
          description="Bu ay alışveriş yaptı"
          icon={CheckCircle2}
          color="from-purple-600 to-purple-700"
          trend={{ value: 15.3, isPositive: true }}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-blue-400 dark:border-blue-900"
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-slate-700 px-6 py-5 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-7 h-7" />
                {editingId ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
              </h2>
              <Button variant="ghost" size="icon" onClick={resetForm} className="text-white hover:bg-white/20">
                <X className="w-6 h-6" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Ad Soyad / Firma Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Müşteri adı"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0555 123 4567"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Müşteri adresi"
                  />
                </div>

                <div>
                  <Label htmlFor="taxNumber">Vergi No / TC No</Label>
                  <Input
                    id="taxNumber"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="12345678901"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notlar</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background min-h-[80px]"
                  placeholder="Müşteri notları (opsiyonel)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t-2">
                <Button type="button" variant="outline" onClick={resetForm} className="h-12 px-6 font-semibold">
                  İptal
                </Button>
                <Button type="submit" className="h-12 px-6 font-bold bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-500 hover:to-slate-600 shadow-lg">
                  {editingId ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <Card className="border-2 border-blue-400 dark:border-blue-900 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
              <Input
                type="text"
                placeholder="🔍 Müşteri adı, email veya telefon ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 h-14 text-base border-2 border-slate-300 focus:border-blue-600 dark:border-slate-700"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
                <TableHead className="font-semibold text-slate-900 dark:text-white">Ad Soyad</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-white">Email</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-white">Telefon</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-white">Borç</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-white">Alacak</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-white">Kayıt Tarihi</TableHead>
                <TableHead className="text-right font-semibold text-slate-900 dark:text-white">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Müşteri bulunamadı</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-colors">
                    <TableCell 
                      className="font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-600" />
                        {customer.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{customer.email || '-'}</TableCell>
                    <TableCell className="font-medium">{customer.phone || '-'}</TableCell>
                    <TableCell>
                      {customer.debt > 0 ? (
                        <span className="text-red-600 font-black bg-red-50 dark:bg-red-950/20 px-3 py-1 rounded-lg">
                          {formatCurrency(customer.debt)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.credit > 0 ? (
                        <span className="text-green-600 font-black bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-lg">
                          {formatCurrency(customer.credit)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-semibold">
                      {formatDate(customer.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(customer)}
                          className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20"
                        >
                          <Edit className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id)}
                          className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="w-5 h-5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-blue-700 to-slate-700 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                  <Users className="w-8 h-8" />
                  {selectedCustomer.name}
                </h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowDetailModal(false)} 
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <StatCard
                    title="Toplam Satış"
                    value={selectedCustomer.totalSales || 0}
                    description="İşlem sayısı"
                    icon={ShoppingCart}
                    color="from-blue-600 to-blue-700"
                  />
                  <StatCard
                    title="Toplam Harcama"
                    value={formatCurrency(selectedCustomer.totalSpent || 0)}
                    description="Toplam tutar"
                    icon={DollarSign}
                    color="from-slate-600 to-slate-700"
                  />
                  <StatCard
                    title="Borç"
                    value={formatCurrency(selectedCustomer.debt)}
                    description="Bakiye durumu"
                    icon={TrendingUp}
                    color={selectedCustomer.debt > 0 ? "from-red-600 to-red-700" : "from-green-600 to-green-700"}
                  />
                  <StatCard
                    title="Alacak"
                    value={formatCurrency(selectedCustomer.credit)}
                    description="Hesapta kalan"
                    icon={CreditCard}
                    color="from-blue-500 to-slate-600"
                  />
                </div>

                {/* Debt Management */}
                {selectedCustomer.debt > 0 && (
                  <Card className="border-2 border-red-200 dark:border-red-900 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Mevcut Borç</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedCustomer.debt)}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => openDebtModal('pay')}
                            className="h-11 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg"
                          >
                            <DollarSign className="w-5 h-5 mr-2" />
                            Borç Öde
                          </Button>
                          <Button
                            onClick={() => openDebtModal('add')}
                            className="h-11 px-6 bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600 text-white font-bold shadow-lg"
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Borç Ekle
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedCustomer.debt === 0 && (
                  <Card className="border-2 border-blue-400 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Borç Durumu</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">Temiz Hesap</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => openDebtModal('add')}
                          className="h-11 px-6 bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600 text-white font-bold shadow-lg"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Borç Ekle
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Customer Info */}
                <Card className="border-2 border-blue-400 dark:border-blue-900">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Müşteri Bilgileri
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-400 dark:border-blue-900">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold">Email</p>
                            <p className="font-bold text-slate-900 dark:text-white">{selectedCustomer.email}</p>
                          </div>
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-400 dark:border-blue-900">
                          <Phone className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold">Telefon</p>
                            <p className="font-bold text-slate-900 dark:text-white">{selectedCustomer.phone}</p>
                          </div>
                        </div>
                      )}
                      {selectedCustomer.address && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-400 dark:border-blue-900">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold">Adres</p>
                            <p className="font-bold text-slate-900 dark:text-white">{selectedCustomer.address}</p>
                          </div>
                        </div>
                      )}
                      {selectedCustomer.taxNumber && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-400 dark:border-blue-900">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold">Vergi/TC No</p>
                            <p className="font-bold text-slate-900 dark:text-white">{selectedCustomer.taxNumber}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-400 dark:border-blue-900">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">Kayıt Tarihi</p>
                          <p className="font-bold text-slate-900 dark:text-white">{formatDate(selectedCustomer.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    {selectedCustomer.notes && (
                      <div className="mt-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-900">
                        <p className="text-sm font-bold text-orange-800 dark:text-orange-400 mb-1">Notlar</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{selectedCustomer.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sales History */}
                <Card className="border-2 border-slate-300 dark:border-slate-800">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950/20 dark:to-blue-950/20 border-b-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-blue-600" />
                      Satış Geçmişi ({selectedCustomer.sales?.length || 0})
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {selectedCustomer.sales && selectedCustomer.sales.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCustomer.sales.map((sale) => (
                          <div key={sale.id} className="space-y-2">
                            <div
                              onClick={() => setExpandedSaleId(expandedSaleId === sale.id ? null : sale.id)}
                              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950/20 dark:to-blue-950/20 border-2 border-slate-300 dark:border-slate-800 hover:shadow-lg transition-all cursor-pointer hover:border-blue-400"
                            >
                              <div className="flex-1">
                                <p className="font-bold text-sm text-slate-900 dark:text-white">{sale.saleNumber}</p>
                                <p className="text-xs text-muted-foreground font-semibold">
                                  {formatDate(sale.createdAt)} • {sale.items?.length || 0} ürün
                                </p>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <p className="font-bold text-blue-700 dark:text-blue-400">
                                    {formatCurrency(sale.netAmount)}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-semibold">
                                    {sale.paymentMethod === 'CASH' ? 'Nakit' : 
                                     sale.paymentMethod === 'CARD' ? 'Kart' : 
                                     sale.paymentMethod === 'TRANSFER' ? 'Havale' : 'Veresiye'}
                                  </p>
                                </div>
                                <Eye className={`w-5 h-5 ${expandedSaleId === sale.id ? 'text-blue-600' : 'text-slate-400'}`} />
                              </div>
                            </div>

                            {/* Expanded Product List */}
                            <AnimatePresence>
                              {expandedSaleId === sale.id && sale.items && sale.items.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="ml-4 p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-blue-400 dark:border-blue-900 space-y-2">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                      <Package className="w-4 h-4 text-blue-600" />
                                      Satın Alınan Ürünler
                                    </p>
                                    {sale.items.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border border-slate-300 dark:border-slate-700"
                                      >
                                        <div className="flex-1">
                                          <p className="font-bold text-sm text-slate-900 dark:text-white">{item.product.name}</p>
                                          <p className="text-xs text-muted-foreground font-mono">
                                            {item.quantity} adet × {formatCurrency(item.price)}
                                          </p>
                                        </div>
                                        <p className="font-bold text-blue-700 dark:text-blue-400">
                                          {formatCurrency(item.quantity * item.price)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                        <p className="text-slate-500 dark:text-slate-400 font-semibold">
                          Henüz satış kaydı bulunmuyor
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEdit(selectedCustomer);
                    }}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600 text-white font-black"
                  >
                    <Edit className="w-5 h-5 mr-2" />
                    Müşteriyi Düzenle
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleDelete(selectedCustomer.id);
                    }}
                    className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Müşteriyi Sil
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Debt Transaction Modal */}
      <AnimatePresence>
        {showDebtModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md"
            >
              <div className={`px-6 py-5 flex items-center justify-between rounded-t-3xl ${
                debtAction === 'add' 
                  ? 'bg-gradient-to-r from-blue-700 to-slate-700' 
                  : 'bg-gradient-to-r from-green-600 to-green-700'
              }`}>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  {debtAction === 'add' ? (
                    <>
                      <Plus className="w-6 h-6" />
                      Borç Ekle
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-6 h-6" />
                      Borç Öde
                    </>
                  )}
                </h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowDebtModal(false)} 
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-400 dark:border-blue-900">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Müşteri</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</p>
                  <p className="text-sm font-semibold text-red-600 mt-2">
                    Mevcut Borç: {formatCurrency(selectedCustomer.debt)}
                  </p>
                </div>

                {/* Amount Input */}
                <div>
                  <Label className="text-sm font-semibold mb-2">
                    {debtAction === 'add' ? 'Eklenecek Borç Tutarı' : 'Ödenecek Tutar'}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-14 text-2xl font-bold text-center border-2 border-slate-300 focus:border-blue-600 dark:border-slate-700"
                    autoFocus
                  />
                  {debtAction === 'pay' && selectedCustomer.debt > 0 && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDebtAmount((selectedCustomer.debt / 2).toFixed(2))}
                        className="flex-1 font-bold"
                      >
                        Yarısını Öde
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDebtAmount(selectedCustomer.debt.toFixed(2))}
                        className="flex-1 font-bold"
                      >
                        Tamamını Öde
                      </Button>
                    </div>
                  )}
                </div>

                {/* Note Input */}
                <div>
                  <Label className="text-sm font-semibold mb-2">Not (Opsiyonel)</Label>
                  <textarea
                    value={debtNote}
                    onChange={(e) => setDebtNote(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-xl bg-background border-slate-300 focus:border-blue-600 dark:border-slate-700 min-h-[80px]"
                    placeholder="İşlemle ilgili not ekleyebilirsiniz..."
                  />
                </div>

                {/* Summary */}
                <div className={`p-4 rounded-xl border-2 ${
                  debtAction === 'add'
                    ? 'bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-blue-400 dark:border-blue-900'
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900'
                }`}>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Mevcut Borç:</span>
                      <span className="font-bold">{formatCurrency(selectedCustomer.debt)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>{debtAction === 'add' ? 'Eklenecek:' : 'Ödenecek:'}</span>
                      <span className={`font-bold ${debtAction === 'add' ? 'text-blue-700 dark:text-blue-400' : 'text-green-600'}`}>
                        {debtAction === 'add' ? '+' : '-'}{formatCurrency(parseFloat(debtAmount) || 0)}
                      </span>
                    </div>
                    <div className="h-px bg-slate-300 dark:bg-slate-700"></div>
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Yeni Borç:</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(
                          debtAction === 'add'
                            ? selectedCustomer.debt + (parseFloat(debtAmount) || 0)
                            : Math.max(0, selectedCustomer.debt - (parseFloat(debtAmount) || 0))
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDebtModal(false)}
                    className="flex-1 h-11 font-semibold"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleDebtTransaction}
                    disabled={!debtAmount || parseFloat(debtAmount) <= 0}
                    className={`flex-1 h-11 font-bold text-white shadow-lg ${
                      debtAction === 'add'
                        ? 'bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600'
                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                    }`}
                  >
                    {debtAction === 'add' ? 'Borç Ekle' : 'Ödeme Al'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;

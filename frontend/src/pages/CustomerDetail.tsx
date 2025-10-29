import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, DollarSign, TrendingUp, ShoppingCart, Award,
  Plus, CreditCard, FileText, Calendar, User, Package, Edit, X, Check,
} from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentDialog from '../components/fluent/FluentDialog';
import FluentInput from '../components/fluent/FluentInput';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface CustomerDetail {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  debt: number;
  loyaltyPoints: number;
  totalSpent: number;
  createdAt: string;
  sales: any[];
  debts: any[];
  transactions: any[];
  notes: any[];
  documents: any[];
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'genel' | 'finansal' | 'satislar' | 'islemler' | 'analizler' | 'notlar'>('genel');
  
  // Modals
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Debt Form
  const [debtForm, setDebtForm] = useState({
    amount: '',
    description: '',
    dueDate: '',
  });

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    notes: '',
  });

  // Note Form
  const [noteForm, setNoteForm] = useState({
    note: '',
    isPinned: false,
  });

  useEffect(() => {
    if (id) {
      fetchCustomerDetail();
    }
  }, [id]);

  const fetchCustomerDetail = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/customers/${id}/detail`);
      setCustomer(response.data.customer);
    } catch (error) {
      toast.error('Müşteri detayı yüklenemedi');
      navigate('/customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDebt = async () => {
    if (!debtForm.amount || parseFloat(debtForm.amount) <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    try {
      await api.post(`/customers/${id}/debt`, {
        amount: parseFloat(debtForm.amount),
        description: debtForm.description,
        dueDate: debtForm.dueDate || null,
      });

      toast.success('Borç eklendi');
      setShowDebtModal(false);
      setDebtForm({ amount: '', description: '', dueDate: '' });
      fetchCustomerDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Borç eklenemedi');
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    if (customer && parseFloat(paymentForm.amount) > customer.debt) {
      toast.error('Ödeme tutarı borçtan fazla olamaz');
      return;
    }

    try {
      await api.post(`/customers/${id}/payment`, {
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes,
      });

      toast.success('Ödeme alındı');
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', paymentMethod: 'CASH', notes: '' });
      fetchCustomerDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ödeme alınamadı');
    }
  };

  const handleAddNote = async () => {
    if (!noteForm.note.trim()) {
      toast.error('Not boş olamaz');
      return;
    }

    try {
      await api.post(`/customers/${id}/notes`, noteForm);

      toast.success('Not eklendi');
      setShowNoteModal(false);
      setNoteForm({ note: '', isPinned: false });
      fetchCustomerDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Not eklenemedi');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/customers/${id}/notes/${noteId}`);
      toast.success('Not silindi');
      fetchCustomerDetail();
    } catch (error) {
      toast.error('Not silinemedi');
    }
  };

  const getSegmentBadge = () => {
    if (!customer) return null;

    // Basit RFM skoru hesapla
    const rfmScore = customer.totalSpent > 5000 ? 'Şampiyon' :
                     customer.totalSpent > 2000 ? 'Sadık' :
                     customer.totalSpent > 500 ? 'Potansiyel' : 'Yeni';

    const appearance = rfmScore === 'Şampiyon' ? 'success' :
                       rfmScore === 'Sadık' ? 'info' :
                       rfmScore === 'Potansiyel' ? 'warning' : 'default';

    return (
      <FluentBadge appearance={appearance} size="small">
        {rfmScore === 'Şampiyon' && '🏆 '}{rfmScore} Müşteri
      </FluentBadge>
    );
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

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-foreground-secondary">Müşteri bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 fluent-mica">
      {/* Header */}
      <div className="flex items-center justify-between">
        <FluentButton
          appearance="subtle"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/customers')}
        >
          Müşterilere Dön
        </FluentButton>
        <div className="flex gap-2">
          <FluentButton appearance="subtle" icon={<Edit className="w-4 h-4" />}>
            Düzenle
          </FluentButton>
        </div>
      </div>

      {/* Profile Section */}
      <FluentCard depth="depth-4" className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar & Info */}
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
                {getSegmentBadge()}
              </div>
              <div className="space-y-1 text-sm text-foreground-secondary">
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{customer.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="w-4 h-4" />
                  <span>Kayıt: {new Date(customer.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
            <p className="text-sm text-foreground-secondary mb-1">💰 Toplam Harcama</p>
            <p className="text-2xl font-bold text-green-600">₺{Number(customer.totalSpent).toFixed(2)}</p>
            <p className="text-xs text-foreground-secondary mt-1">{customer.sales.length} satış</p>
          </div>

          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            <p className="text-sm text-foreground-secondary mb-1">💳 Ödeme Yapılmış</p>
            <p className="text-2xl font-bold text-blue-600">
              ₺{Number(customer.totalSpent - customer.debt).toFixed(2)}
            </p>
            <p className="text-xs text-foreground-secondary mt-1">Nakit akışı</p>
          </div>

          <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <p className="text-sm text-foreground-secondary mb-1">⚠️ Borç Kalan</p>
            <p className="text-2xl font-bold text-red-600">₺{Number(customer.debt).toFixed(2)}</p>
            <p className="text-xs text-foreground-secondary mt-1">
              {customer.debts.filter((d: any) => d.status !== 'PAID').length} açık borç
            </p>
          </div>

          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
            <p className="text-sm text-foreground-secondary mb-1">⭐ Puan</p>
            <p className="text-2xl font-bold text-purple-600">{customer.loyaltyPoints}</p>
            <p className="text-xs text-foreground-secondary mt-1">Sadakat puanı</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
          <FluentButton
            appearance="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowDebtModal(true)}
          >
            Borç Ekle
          </FluentButton>
          <FluentButton
            appearance="primary"
            icon={<CreditCard className="w-4 h-4" />}
            onClick={() => setShowPaymentModal(true)}
          >
            Ödeme Al
          </FluentButton>
          <FluentButton
            appearance="subtle"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => setShowNoteModal(true)}
          >
            Not Ekle
          </FluentButton>
        </div>
      </FluentCard>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {[
          { key: 'genel', label: '📋 Genel Bilgiler' },
          { key: 'finansal', label: '💰 Finansal' },
          { key: 'satislar', label: '📦 Satışlar' },
          { key: 'islemler', label: '🔄 İşlem Geçmişi' },
          { key: 'analizler', label: '📊 Analizler' },
          { key: 'notlar', label: '📝 Notlar' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'text-primary border-b-2 border-primary'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* Genel Bilgiler Tab */}
        {activeTab === 'genel' && (
          <FluentCard depth="depth-4" className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Genel Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-foreground-secondary mb-1">İsim</p>
                <p className="font-medium text-foreground">{customer.name}</p>
              </div>
              {customer.email && (
                <div>
                  <p className="text-sm text-foreground-secondary mb-1">E-posta</p>
                  <p className="font-medium text-foreground">{customer.email}</p>
                </div>
              )}
              {customer.phone && (
                <div>
                  <p className="text-sm text-foreground-secondary mb-1">Telefon</p>
                  <p className="font-medium text-foreground">{customer.phone}</p>
                </div>
              )}
              {customer.address && (
                <div className="md:col-span-2">
                  <p className="text-sm text-foreground-secondary mb-1">Adres</p>
                  <p className="font-medium text-foreground">{customer.address}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-foreground-secondary mb-1">Kayıt Tarihi</p>
                <p className="font-medium text-foreground">
                  {new Date(customer.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </FluentCard>
        )}

        {/* Finansal Tab */}
        {activeTab === 'finansal' && (
          <div className="space-y-4">
            <FluentCard depth="depth-4" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Açık Borçlar</h3>
                <FluentButton
                  appearance="subtle"
                  size="small"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={() => setShowDebtModal(true)}
                >
                  Borç Ekle
                </FluentButton>
              </div>

              {customer.debts.filter((d: any) => d.status !== 'PAID').length === 0 ? (
                <p className="text-center text-foreground-secondary py-8">Açık borç yok</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left py-2 px-3 text-sm font-medium text-foreground-secondary">Tarih</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-foreground-secondary">Açıklama</th>
                        <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Tutar</th>
                        <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Ödenen</th>
                        <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Kalan</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-foreground-secondary">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.debts
                        .filter((d: any) => d.status !== 'PAID')
                        .map((debt: any) => (
                          <tr key={debt.id} className="border-b border-border/50">
                            <td className="py-2 px-3 text-sm text-foreground">
                              {new Date(debt.createdAt).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="py-2 px-3 text-sm text-foreground">{debt.description || '-'}</td>
                            <td className="py-2 px-3 text-sm text-right text-foreground">
                              ₺{Number(debt.amount).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-sm text-right text-green-600">
                              ₺{Number(debt.paidAmount).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-sm text-right text-red-600 font-medium">
                              ₺{Number(debt.amount - debt.paidAmount).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <FluentBadge
                                appearance={
                                  debt.status === 'OPEN' ? 'error' :
                                  debt.status === 'PARTIAL' ? 'warning' : 'success'
                                }
                                size="small"
                              >
                                {debt.status === 'OPEN' ? 'Açık' :
                                 debt.status === 'PARTIAL' ? 'Kısmi Ödendi' : 'Ödendi'}
                              </FluentBadge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </FluentCard>

            <FluentCard depth="depth-4" className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Tüm Borçlar</h3>
              {customer.debts.length === 0 ? (
                <p className="text-center text-foreground-secondary py-8">Borç kaydı yok</p>
              ) : (
                <div className="space-y-2">
                  {customer.debts.map((debt: any) => (
                    <div key={debt.id} className="p-3 bg-background-alt rounded flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">₺{Number(debt.amount).toFixed(2)}</p>
                        <p className="text-xs text-foreground-secondary">
                          {new Date(debt.createdAt).toLocaleDateString('tr-TR')} - {debt.user?.name}
                        </p>
                        {debt.description && (
                          <p className="text-xs text-foreground-secondary mt-1">{debt.description}</p>
                        )}
                      </div>
                      <FluentBadge
                        appearance={debt.status === 'PAID' ? 'success' : 'error'}
                        size="small"
                      >
                        {debt.status === 'PAID' ? '✓ Ödendi' : 'Açık'}
                      </FluentBadge>
                    </div>
                  ))}
                </div>
              )}
            </FluentCard>
          </div>
        )}

        {/* Satışlar Tab */}
        {activeTab === 'satislar' && (
          <FluentCard depth="depth-4" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Satış Geçmişi</h3>
              <p className="text-sm text-foreground-secondary">
                Toplam {customer.sales.length} satış
              </p>
            </div>

            {customer.sales.length === 0 ? (
              <p className="text-center text-foreground-secondary py-8">Henüz satış yok</p>
            ) : (
              <div className="space-y-3">
                {customer.sales.slice(0, 10).map((sale: any) => (
                  <div key={sale.id} className="p-4 bg-background-alt rounded hover:bg-background-alt/70 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">{sale.saleNumber}</p>
                        <p className="text-xs text-foreground-secondary">
                          {new Date(sale.createdAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-primary">₺{Number(sale.total).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                      <Package className="w-3 h-3" />
                      <span>{sale.items?.length || 0} ürün</span>
                      <span>•</span>
                      <span>{sale.paymentMethod}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FluentCard>
        )}

        {/* İşlem Geçmişi Tab */}
        {activeTab === 'islemler' && (
          <FluentCard depth="depth-4" className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">İşlem Geçmişi</h3>

            {customer.transactions.length === 0 ? (
              <p className="text-center text-foreground-secondary py-8">İşlem geçmişi yok</p>
            ) : (
              <div className="space-y-3">
                {customer.transactions.map((transaction: any) => (
                  <div key={transaction.id} className="p-4 bg-background-alt rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'SALE' ? 'bg-green-100 dark:bg-green-900/20' :
                          transaction.type === 'PAYMENT' ? 'bg-blue-100 dark:bg-blue-900/20' :
                          transaction.type === 'DEBT' ? 'bg-red-100 dark:bg-red-900/20' :
                          'bg-gray-100 dark:bg-gray-900/20'
                        }`}>
                          {transaction.type === 'SALE' && <ShoppingCart className="w-5 h-5 text-green-600" />}
                          {transaction.type === 'PAYMENT' && <CreditCard className="w-5 h-5 text-blue-600" />}
                          {transaction.type === 'DEBT' && <DollarSign className="w-5 h-5 text-red-600" />}
                          {transaction.type === 'REFUND' && <TrendingUp className="w-5 h-5 text-gray-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {transaction.type === 'SALE' && '🛒 Satış'}
                            {transaction.type === 'PAYMENT' && '💳 Ödeme'}
                            {transaction.type === 'DEBT' && '⚠️ Borç'}
                            {transaction.type === 'REFUND' && '🔄 İade'}
                          </p>
                          <p className="text-sm text-foreground-secondary mt-1">
                            {transaction.description || '-'}
                          </p>
                          <p className="text-xs text-foreground-secondary mt-1">
                            {new Date(transaction.createdAt).toLocaleString('tr-TR')}
                            {transaction.user && ` • ${transaction.user.name}`}
                          </p>
                        </div>
                      </div>
                      <p className={`text-lg font-bold ${
                        transaction.type === 'PAYMENT' || transaction.type === 'REFUND'
                          ? 'text-green-600'
                          : transaction.type === 'DEBT'
                          ? 'text-red-600'
                          : 'text-primary'
                      }`}>
                        {transaction.type === 'PAYMENT' || transaction.type === 'REFUND' ? '-' : '+'}
                        ₺{Math.abs(Number(transaction.amount)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FluentCard>
        )}

        {/* Analizler Tab */}
        {activeTab === 'analizler' && (
          <FluentCard depth="depth-4" className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Müşteri Analizi</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <p className="text-sm text-foreground-secondary mb-2">Alışveriş Sıklığı</p>
                <p className="text-3xl font-bold text-blue-600">{customer.sales.length}</p>
                <p className="text-xs text-foreground-secondary mt-2">Toplam satış</p>
              </div>

              <div className="text-center p-6 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <p className="text-sm text-foreground-secondary mb-2">Ortalama Sepet</p>
                <p className="text-3xl font-bold text-green-600">
                  ₺{customer.sales.length > 0 ? (customer.totalSpent / customer.sales.length).toFixed(0) : '0'}
                </p>
                <p className="text-xs text-foreground-secondary mt-2">Her alışverişte</p>
              </div>

              <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                <p className="text-sm text-foreground-secondary mb-2">Toplam Ürün</p>
                <p className="text-3xl font-bold text-purple-600">
                  {customer.sales.reduce((sum: number, sale: any) => 
                    sum + (sale.items?.length || 0), 0
                  )}
                </p>
                <p className="text-xs text-foreground-secondary mt-2">Satın alındı</p>
              </div>
            </div>

            <div className="mt-6 p-6 bg-background-alt rounded-lg">
              <h4 className="font-semibold text-foreground mb-3">Müşteri Segmenti</h4>
              <div className="flex items-center gap-3">
                {getSegmentBadge()}
                <p className="text-sm text-foreground-secondary">
                  {customer.totalSpent > 5000 && 'En değerli müşterilerimizden biri! Yüksek harcama ve sadakat gösteriyor.'}
                  {customer.totalSpent > 2000 && customer.totalSpent <= 5000 && 'Sadık müşteri. Düzenli alışveriş yapıyor.'}
                  {customer.totalSpent > 500 && customer.totalSpent <= 2000 && 'Potansiyel müşteri. Gelişim gösterebilir.'}
                  {customer.totalSpent <= 500 && 'Yeni müşteri. İlk alışverişlerini yaptı.'}
                </p>
              </div>
            </div>
          </FluentCard>
        )}

        {/* Notlar Tab */}
        {activeTab === 'notlar' && (
          <FluentCard depth="depth-4" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Müşteri Notları</h3>
              <FluentButton
                appearance="subtle"
                size="small"
                icon={<Plus className="w-3 h-3" />}
                onClick={() => setShowNoteModal(true)}
              >
                Not Ekle
              </FluentButton>
            </div>

            {customer.notes.length === 0 ? (
              <p className="text-center text-foreground-secondary py-8">Henüz not yok</p>
            ) : (
              <div className="space-y-3">
                {customer.notes.map((note: any) => (
                  <div key={note.id} className="p-4 bg-background-alt rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {note.isPinned && (
                          <FluentBadge appearance="info" size="small" className="mb-2">
                            📌 Sabitlenmiş
                          </FluentBadge>
                        )}
                        <p className="text-foreground">{note.note}</p>
                        <p className="text-xs text-foreground-secondary mt-2">
                          {new Date(note.createdAt).toLocaleString('tr-TR')}
                          {note.user && ` • ${note.user.name}`}
                        </p>
                      </div>
                      <FluentButton
                        appearance="subtle"
                        size="small"
                        icon={<X className="w-3 h-3" />}
                        onClick={() => handleDeleteNote(note.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FluentCard>
        )}
      </div>

      {/* Borç Ekle Modal */}
      <FluentDialog
        open={showDebtModal}
        onClose={() => setShowDebtModal(false)}
        title="Borç Ekle"
        size="medium"
      >
        <div className="space-y-4">
          <FluentInput
            label="Tutar (₺) *"
            type="number"
            step="0.01"
            min="0"
            value={debtForm.amount}
            onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
            placeholder="0.00"
          />

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Açıklama
            </label>
            <textarea
              value={debtForm.description}
              onChange={(e) => setDebtForm({ ...debtForm, description: e.target.value })}
              className="w-full h-20 px-3 py-2 bg-input border border-border rounded text-foreground resize-none"
              placeholder="Borç açıklaması..."
            />
          </div>

          <FluentInput
            label="Vade Tarihi"
            type="date"
            value={debtForm.dueDate}
            onChange={(e) => setDebtForm({ ...debtForm, dueDate: e.target.value })}
          />

          <div className="flex gap-2 pt-4">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={() => setShowDebtModal(false)}
            >
              İptal
            </FluentButton>
            <FluentButton
              appearance="primary"
              className="flex-1"
              icon={<Check className="w-4 h-4" />}
              onClick={handleAddDebt}
            >
              Borç Ekle
            </FluentButton>
          </div>
        </div>
      </FluentDialog>

      {/* Ödeme Al Modal */}
      <FluentDialog
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`Ödeme Al (Borç: ₺${Number(customer.debt).toFixed(2)})`}
        size="medium"
      >
        <div className="space-y-4">
          <div>
            <FluentInput
              label="Ödeme Tutarı (₺) *"
              type="number"
              step="0.01"
              min="0"
              max={customer.debt}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder="0.00"
            />
            <FluentButton
              appearance="subtle"
              size="small"
              className="mt-2"
              onClick={() => setPaymentForm({ ...paymentForm, amount: customer.debt.toString() })}
            >
              Tam Ödeme (₺{Number(customer.debt).toFixed(2)})
            </FluentButton>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Ödeme Yöntemi *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'CASH', label: '💵 Nakit' },
                { value: 'CARD', label: '💳 Kart' },
                { value: 'BANK_TRANSFER', label: '🏦 Havale' },
              ].map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: method.value })}
                  className={`p-3 rounded border transition-colors ${
                    paymentForm.paymentMethod === method.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background hover:bg-background-alt text-foreground'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Not
            </label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full h-20 px-3 py-2 bg-input border border-border rounded text-foreground resize-none"
              placeholder="Ödeme notu..."
            />
          </div>

          {paymentForm.amount && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Kalan Borç: ₺{Math.max(0, customer.debt - parseFloat(paymentForm.amount)).toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={() => setShowPaymentModal(false)}
            >
              İptal
            </FluentButton>
            <FluentButton
              appearance="primary"
              className="flex-1"
              icon={<Check className="w-4 h-4" />}
              onClick={handleAddPayment}
            >
              Ödeme Al
            </FluentButton>
          </div>
        </div>
      </FluentDialog>

      {/* Not Ekle Modal */}
      <FluentDialog
        open={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Not Ekle"
        size="medium"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Not *
            </label>
            <textarea
              value={noteForm.note}
              onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
              className="w-full h-32 px-3 py-2 bg-input border border-border rounded text-foreground resize-none"
              placeholder="Müşteri notu..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={noteForm.isPinned}
              onChange={(e) => setNoteForm({ ...noteForm, isPinned: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm text-foreground">📌 Sabitle (üstte göster)</span>
          </label>

          <div className="flex gap-2 pt-4">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={() => setShowNoteModal(false)}
            >
              İptal
            </FluentButton>
            <FluentButton
              appearance="primary"
              className="flex-1"
              icon={<Check className="w-4 h-4" />}
              onClick={handleAddNote}
            >
              Not Ekle
            </FluentButton>
          </div>
        </div>
      </FluentDialog>
    </div>
  );
};

export default CustomerDetail;


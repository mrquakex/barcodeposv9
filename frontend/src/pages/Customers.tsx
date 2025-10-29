import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Mail, Phone, MapPin, Banknote, TrendingUp, ShoppingCart, Award, Eye } from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  debt: number;
  loyaltyPoints: number;
  totalSpent: number;
  // RFM fields (from analytics)
  segment?: string;
  rfmScore?: {
    recency: number;
    frequency: number;
    monetary: number;
    total: number;
  };
  frequency?: number;
  recency?: number;
  lastPurchaseDate?: string;
  averageOrderValue?: string;
}

interface CustomerAnalytics {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  frequency: number;
  recency: number;
  lastPurchaseDate: string | null;
  averageOrderValue: string;
  rfmScore: {
    recency: number;
    frequency: number;
    monetary: number;
    total: number;
  };
  segment: string;
  loyaltyPoints: number;
}

interface CustomerDetail extends Customer {
  sales?: Array<{
    id: string;
    saleNumber: string;
    total: number;
    createdAt: string;
    items: Array<{
      product: { name: string };
      quantity: number;
      total: number;
    }>;
  }>;
}

const Customers: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'sales' | 'rfm'>('info');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchCustomers();
    fetchCustomerAnalytics();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      toast.error('Müşteriler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerAnalytics = async () => {
    try {
      const response = await api.get('/reports/customers');
      setCustomerAnalytics(response.data.customers || []);
    } catch (error) {
      console.error('Customer analytics error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Müşteri güncellendi');
      } else {
        await api.post('/customers', formData);
        toast.success('Müşteri oluşturuldu');
      }
      fetchCustomers();
      fetchCustomerAnalytics();
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kaydetme hatası');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Müşteri silindi');
      fetchCustomers();
      fetchCustomerAnalytics();
    } catch (error) {
      toast.error('Silme hatası');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setShowDialog(true);
  };

  const handleViewDetail = async (customerId: string) => {
    try {
      // Get customer details
      const customerResponse = await api.get(`/customers/${customerId}`);
      const customer = customerResponse.data.customer;

      // Get customer sales
      const salesResponse = await api.get(`/sales?customerId=${customerId}`);
      const sales = salesResponse.data.sales || [];

      // Get analytics
      const analytics = customerAnalytics.find(c => c.id === customerId);

      setSelectedCustomer({
        ...customer,
        sales,
        segment: analytics?.segment,
        rfmScore: analytics?.rfmScore,
        frequency: analytics?.frequency,
        recency: analytics?.recency,
        lastPurchaseDate: analytics?.lastPurchaseDate,
        averageOrderValue: analytics?.averageOrderValue,
      });
      setActiveTab('info');
      setShowDetailDialog(true);
    } catch (error) {
      toast.error('Müşteri detayı yüklenemedi');
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
  };

  // Merge customer data with analytics
  const enrichedCustomers = customers.map(customer => {
    const analytics = customerAnalytics.find(a => a.id === customer.id);
    return {
      ...customer,
      segment: analytics?.segment,
      rfmScore: analytics?.rfmScore,
      frequency: analytics?.frequency,
      recency: analytics?.recency,
    };
  });

  const filteredCustomers = enrichedCustomers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSegment = segmentFilter === 'all' || c.segment === segmentFilter;

    return matchesSearch && matchesSegment;
  });

  const getSegmentBadge = (segment?: string) => {
    if (!segment) return null;

    const config = {
      'Champions': { appearance: 'success' as const, icon: Award },
      'Loyal': { appearance: 'info' as const, icon: TrendingUp },
      'Potential': { appearance: 'warning' as const, icon: User },
      'At Risk': { appearance: 'error' as const, icon: Banknote },
      'Lost': { appearance: 'default' as const, icon: User },
    };

    const { appearance, icon: Icon } = config[segment as keyof typeof config] || config['Lost'];

    return (
      <FluentBadge appearance={appearance} size="small">
        <Icon className="w-3 h-3 inline mr-1" />
        {segment}
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

  return (
    <div className="p-4 md:p-8 space-y-8 fluent-mica">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            👥 Müşteriler
          </h1>
          <p className="text-base text-foreground-secondary">
            {filteredCustomers.length} müşteri
          </p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDialog(true)}
        >
          Yeni Müşteri
        </FluentButton>
      </div>

      {/* Segment Filter */}
      <FluentCard depth="depth-4" className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'Champions', 'Loyal', 'Potential', 'At Risk', 'Lost'].map((seg) => (
            <FluentButton
              key={seg}
              appearance={segmentFilter === seg ? 'primary' : 'subtle'}
              size="small"
              onClick={() => setSegmentFilter(seg)}
            >
              {seg === 'all' ? 'Tümü' : seg}
            </FluentButton>
          ))}
        </div>
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Müşteri ara..."
          icon={<Search className="w-4 h-4" />}
        />
      </FluentCard>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <FluentCard key={customer.id} depth="depth-4" hoverable className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground truncate">{customer.name}</h4>
                  {getSegmentBadge(customer.segment)}
                </div>
                {customer.email && (
                  <div className="flex items-center gap-1 text-xs text-foreground-secondary mb-1">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-1 text-xs text-foreground-secondary">
                    <Phone className="w-3 h-3" />
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-foreground-secondary">Toplam Harcama</p>
                <p className="font-medium text-foreground">₺{Number(customer.totalSpent).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Puan</p>
                <p className="font-medium text-primary">{customer.loyaltyPoints}</p>
              </div>
              {customer.frequency && (
                <div>
                  <p className="text-xs text-foreground-secondary">Alışveriş</p>
                  <p className="font-medium text-foreground">{customer.frequency}</p>
                </div>
              )}
              {customer.rfmScore && (
                <div>
                  <p className="text-xs text-foreground-secondary">RFM Skoru</p>
                  <p className="font-medium text-foreground">{customer.rfmScore.total}/15</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-border">
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1"
                icon={<Eye className="w-3 h-3" />}
                onClick={() => handleViewDetail(customer.id)}
              >
                Detay
              </FluentButton>
              <FluentButton
                appearance="subtle"
                size="small"
                icon={<Edit className="w-3 h-3" />}
                onClick={() => handleEdit(customer)}
              >
                Düzenle
              </FluentButton>
              <FluentButton
                appearance="subtle"
                size="small"
                icon={<Trash2 className="w-3 h-3" />}
                onClick={() => handleDelete(customer.id)}
              >
                Sil
              </FluentButton>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="text-foreground-secondary">Müşteri bulunamadı</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <FluentDialog
        open={showDialog}
        onClose={handleCloseDialog}
        title={editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FluentInput
            label="İsim *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <FluentInput
            label="E-posta"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <FluentInput
            label="Telefon"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <FluentInput
            label="Adres"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="flex gap-2 pt-4">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={handleCloseDialog}
            >
              İptal
            </FluentButton>
            <FluentButton type="submit" appearance="primary" className="flex-1">
              {editingCustomer ? 'Güncelle' : 'Oluştur'}
            </FluentButton>
          </div>
        </form>
      </FluentDialog>

      {/* Detail Dialog */}
      <FluentDialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title="Müşteri Detayı"
        size="large"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                Bilgiler
              </button>
              <button
                onClick={() => setActiveTab('sales')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'sales'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                Satış Geçmişi ({selectedCustomer.sales?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('rfm')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'rfm'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                RFM Analizi
              </button>
            </div>

            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-foreground-secondary">İsim</p>
                    <p className="font-medium text-foreground">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-secondary">Segment</p>
                    {getSegmentBadge(selectedCustomer.segment)}
                  </div>
                  {selectedCustomer.email && (
                    <div>
                      <p className="text-sm text-foreground-secondary">E-posta</p>
                      <p className="font-medium text-foreground">{selectedCustomer.email}</p>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div>
                      <p className="text-sm text-foreground-secondary">Telefon</p>
                      <p className="font-medium text-foreground">{selectedCustomer.phone}</p>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-foreground-secondary">Adres</p>
                      <p className="font-medium text-foreground">{selectedCustomer.address}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-1">Toplam Harcama</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₺{Number(selectedCustomer.totalSpent).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-1">Sadakat Puanı</p>
                    <p className="text-2xl font-bold text-primary">{selectedCustomer.loyaltyPoints}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-1">Borç</p>
                    <p className="text-2xl font-bold text-red-600">₺{Number(selectedCustomer.debt).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sales History Tab */}
            {activeTab === 'sales' && (
              <div className="space-y-3">
                {selectedCustomer.sales && selectedCustomer.sales.length > 0 ? (
                  selectedCustomer.sales.map((sale: any) => (
                    <div key={sale.id} className="p-3 bg-background-alt rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">{sale.saleNumber}</p>
                          <p className="text-xs text-foreground-secondary">
                            {new Date(sale.createdAt).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-primary">₺{Number(sale.total).toFixed(2)}</p>
                      </div>
                      <div className="text-xs text-foreground-secondary">
                        {sale.items.length} ürün
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-foreground-secondary py-8">Henüz satış yok</p>
                )}
              </div>
            )}

            {/* RFM Analysis Tab */}
            {activeTab === 'rfm' && selectedCustomer.rfmScore && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-2">Recency (Yenilik)</p>
                    <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-2">
                      <p className="text-2xl font-bold text-blue-600">{selectedCustomer.rfmScore.recency}</p>
                    </div>
                    <p className="text-xs text-foreground-secondary">
                      {selectedCustomer.recency} gün önce
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-2">Frequency (Sıklık)</p>
                    <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2">
                      <p className="text-2xl font-bold text-green-600">{selectedCustomer.rfmScore.frequency}</p>
                    </div>
                    <p className="text-xs text-foreground-secondary">
                      {selectedCustomer.frequency} alışveriş
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-2">Monetary (Parasal)</p>
                    <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-2">
                      <p className="text-2xl font-bold text-purple-600">{selectedCustomer.rfmScore.monetary}</p>
                    </div>
                    <p className="text-xs text-foreground-secondary">
                      ₺{Number(selectedCustomer.totalSpent).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border text-center">
                  <p className="text-sm text-foreground-secondary mb-2">Toplam RFM Skoru</p>
                  <p className="text-4xl font-bold text-primary mb-2">
                    {selectedCustomer.rfmScore.total} / 15
                  </p>
                  {getSegmentBadge(selectedCustomer.segment)}
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Segment Açıklaması
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {selectedCustomer.segment === 'Champions' && 'En değerli müşterileriniz! Sık alışveriş yapar ve yüksek harcama yaparlar.'}
                    {selectedCustomer.segment === 'Loyal' && 'Sadık müşterileriniz. Düzenli alışveriş yaparlar.'}
                    {selectedCustomer.segment === 'Potential' && 'Potansiyel müşteriler. Gelişim gösterebilirler.'}
                    {selectedCustomer.segment === 'At Risk' && 'Risk altındaki müşteriler. Kaybetme riski var.'}
                    {selectedCustomer.segment === 'Lost' && 'Kaybedilen müşteriler. Geri kazanma kampanyası düşünün.'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-border">
              <FluentButton
                appearance="subtle"
                className="flex-1"
                onClick={() => setShowDetailDialog(false)}
              >
                Kapat
              </FluentButton>
            </div>
          </div>
        )}
      </FluentDialog>
    </div>
  );
};

export default Customers;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, User, Mail, Phone, Eye, LayoutGrid, List, DollarSign, Award, Users, AlertCircle, TrendingUp, Filter, X } from 'lucide-react';
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
}

type ViewMode = 'grid' | 'list';

interface Filters {
  debtStatus: 'all' | 'with-debt' | 'no-debt';
  segment: 'all' | 'vip' | 'normal';
  spendingRange: 'all' | 'low' | 'medium' | 'high';
}

const Customers: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('customersViewMode');
    return (saved as ViewMode) || 'grid';
  });
  const [filters, setFilters] = useState<Filters>({
    debtStatus: 'all',
    segment: 'all',
    spendingRange: 'all',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('customersViewMode', mode);
  };

  const clearFilters = () => {
    setFilters({
      debtStatus: 'all',
      segment: 'all',
      spendingRange: 'all',
    });
  };

  const hasActiveFilters = filters.debtStatus !== 'all' || filters.segment !== 'all' || filters.spendingRange !== 'all';

  useEffect(() => {
    fetchCustomers();
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

  const handleViewDetail = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
  };

  const filteredCustomers = customers.filter((c) => {
    // Arama
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    // Borç durumu filtresi
    const matchesDebt =
      filters.debtStatus === 'all' ||
      (filters.debtStatus === 'with-debt' && c.debt > 0) ||
      (filters.debtStatus === 'no-debt' && c.debt === 0);

    // Segment filtresi
    const matchesSegment =
      filters.segment === 'all' ||
      (filters.segment === 'vip' && c.totalSpent > 5000) ||
      (filters.segment === 'normal' && c.totalSpent <= 5000);

    // Harcama aralığı filtresi
    const matchesSpending =
      filters.spendingRange === 'all' ||
      (filters.spendingRange === 'low' && c.totalSpent < 1000) ||
      (filters.spendingRange === 'medium' && c.totalSpent >= 1000 && c.totalSpent <= 5000) ||
      (filters.spendingRange === 'high' && c.totalSpent > 5000);

    return matchesSearch && matchesDebt && matchesSegment && matchesSpending;
  });

  // İstatistikler
  const stats = {
    total: customers.length,
    vip: customers.filter(c => c.totalSpent > 5000).length,
    withDebt: customers.filter(c => c.debt > 0).length,
    avgSpending: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length 
      : 0,
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
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <User className="w-8 h-8" />
            Müşteriler
          </h1>
          <p className="text-base text-foreground-secondary">
            {filteredCustomers.length} müşteri
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-background-alt rounded-lg p-1">
            <FluentButton
              appearance={viewMode === 'grid' ? 'primary' : 'subtle'}
              size="small"
              icon={<LayoutGrid className="w-4 h-4" />}
              onClick={() => handleViewModeChange('grid')}
            >
              Kart
            </FluentButton>
            <FluentButton
              appearance={viewMode === 'list' ? 'primary' : 'subtle'}
              size="small"
              icon={<List className="w-4 h-4" />}
              onClick={() => handleViewModeChange('list')}
            >
              Liste
            </FluentButton>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDialog(true)}
        >
            Yeni Müşteri
        </FluentButton>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Search Box */}
        <div className="lg:col-span-4">
          <FluentCard depth="depth-4" className="p-4 h-full">
            <div className="flex gap-2">
              <div className="flex-1">
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Müşteri ara..."
          icon={<Search className="w-4 h-4" />}
        />
              </div>
              <FluentButton
                appearance={hasActiveFilters ? 'primary' : 'subtle'}
                icon={<Filter className="w-4 h-4" />}
                onClick={() => setShowFilters(!showFilters)}
              />
              {hasActiveFilters && (
                <FluentButton
                  appearance="subtle"
                  icon={<X className="w-4 h-4" />}
                  onClick={clearFilters}
                />
              )}
            </div>
          </FluentCard>
        </div>

        {/* Stats Cards */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Toplam Müşteri */}
          <FluentCard depth="depth-4" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-xs text-foreground-secondary truncate">Toplam</p>
              </div>
            </div>
      </FluentCard>

          {/* VIP Müşteriler */}
          <FluentCard depth="depth-4" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-success">{stats.vip}</p>
                <p className="text-xs text-foreground-secondary truncate">VIP</p>
              </div>
            </div>
          </FluentCard>

          {/* Borçlu Müşteriler */}
          <FluentCard depth="depth-4" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-error" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-error">{stats.withDebt}</p>
                <p className="text-xs text-foreground-secondary truncate">Borçlu</p>
              </div>
            </div>
          </FluentCard>

          {/* Ortalama Harcama */}
          <FluentCard depth="depth-4" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-info" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-info">₺{stats.avgSpending.toFixed(0)}</p>
                <p className="text-xs text-foreground-secondary truncate">Ortalama</p>
              </div>
            </div>
          </FluentCard>
              </div>
            </div>

      {/* Gelişmiş Filtreler */}
      {showFilters && (
        <FluentCard depth="depth-4" className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-normal text-foreground flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtreler
            </h3>
            {hasActiveFilters && (
              <FluentButton
                appearance="subtle"
                size="small"
                icon={<X className="w-3 h-3" />}
                onClick={clearFilters}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Borç Durumu */}
            <div>
              <label className="block text-xs font-normal text-foreground-secondary mb-1.5">
                Borç Durumu
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'all', label: 'Tümü', count: customers.length },
                  { value: 'with-debt', label: 'Borçlu', count: customers.filter(c => c.debt > 0).length },
                  { value: 'no-debt', label: 'Borçsuz', count: customers.filter(c => c.debt === 0).length },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilters({ ...filters, debtStatus: option.value as any })}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      filters.debtStatus === option.value
                        ? 'border-primary bg-primary/10 text-primary font-normal'
                        : 'border-border bg-background hover:bg-background-alt text-foreground font-normal'
                    }`}
                  >
                    {option.label} <span className="text-foreground-secondary">({option.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Müşteri Segmenti */}
            <div>
              <label className="block text-xs font-normal text-foreground-secondary mb-1.5">
                Segment
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'all', label: 'Tümü', count: customers.length },
                  { value: 'vip', label: 'VIP', count: customers.filter(c => c.totalSpent > 5000).length },
                  { value: 'normal', label: 'Normal', count: customers.filter(c => c.totalSpent <= 5000).length },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilters({ ...filters, segment: option.value as any })}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      filters.segment === option.value
                        ? 'border-primary bg-primary/10 text-primary font-normal'
                        : 'border-border bg-background hover:bg-background-alt text-foreground font-normal'
                    }`}
                  >
                    {option.label} <span className="text-foreground-secondary">({option.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Harcama Aralığı */}
            <div>
              <label className="block text-xs font-normal text-foreground-secondary mb-1.5">
                Harcama
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'all', label: 'Tümü', count: customers.length },
                  { value: 'low', label: '<1K', count: customers.filter(c => c.totalSpent < 1000).length },
                  { value: 'medium', label: '1-5K', count: customers.filter(c => c.totalSpent >= 1000 && c.totalSpent <= 5000).length },
                  { value: 'high', label: '>5K', count: customers.filter(c => c.totalSpent > 5000).length },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilters({ ...filters, spendingRange: option.value as any })}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      filters.spendingRange === option.value
                        ? 'border-primary bg-primary/10 text-primary font-normal'
                        : 'border-border bg-background hover:bg-background-alt text-foreground font-normal'
                    }`}
                  >
                    {option.label} <span className="text-foreground-secondary">({option.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex flex-wrap gap-1.5">
                {filters.debtStatus !== 'all' && (
                  <FluentBadge appearance="info" size="small">
                    {filters.debtStatus === 'with-debt' ? 'Borçlu' : 'Borçsuz'}
                  </FluentBadge>
                )}
                {filters.segment !== 'all' && (
                  <FluentBadge appearance="success" size="small">
                    {filters.segment === 'vip' ? 'VIP' : 'Normal'}
                  </FluentBadge>
                )}
                {filters.spendingRange !== 'all' && (
                  <FluentBadge appearance="warning" size="small">
                    {filters.spendingRange === 'low' ? '<1K' : filters.spendingRange === 'medium' ? '1-5K' : '>5K'}
                  </FluentBadge>
                )}
              </div>
            </div>
          )}
        </FluentCard>
      )}

      {/* Customers Grid View */}
      {viewMode === 'grid' && (
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
      )}

      {/* Customers List View */}
      {viewMode === 'list' && (
        <FluentCard depth="depth-4" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-alt border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Müşteri</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">İletişim</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground-secondary">Harcama</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground-secondary">Borç</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-foreground-secondary">Puan</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-foreground-secondary">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="border-b border-border/50 hover:bg-background-alt transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{customer.name}</p>
                          {customer.totalSpent > 5000 && (
                            <FluentBadge appearance="success" size="small">
                              <Award className="w-3 h-3 inline mr-1" />
                              VIP
                            </FluentBadge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1 text-sm">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-foreground-secondary">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-foreground-secondary">
                            <Phone className="w-3 h-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign className="w-4 h-4 text-success" />
                        <span className="font-medium text-success">
                          ₺{Number(customer.totalSpent).toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-medium ${
                        customer.debt > 0 ? 'text-error' : 'text-foreground-secondary'
                      }`}>
                        ₺{Number(customer.debt).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <FluentBadge appearance="info" size="small">
                        {customer.loyaltyPoints}
                      </FluentBadge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <FluentButton
                          appearance="subtle"
                          size="small"
                          icon={<Eye className="w-3 h-3" />}
                          onClick={() => handleViewDetail(customer.id)}
                        />
                        <FluentButton
                          appearance="subtle"
                          size="small"
                          icon={<Edit className="w-3 h-3" />}
                          onClick={() => handleEdit(customer)}
                        />
                        <FluentButton
                          appearance="subtle"
                          size="small"
                          icon={<Trash2 className="w-3 h-3" />}
                          onClick={() => handleDelete(customer.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FluentCard>
      )}

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
    </div>
  );
};

export default Customers;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, User, Mail, Phone, Eye } from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
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

const Customers: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
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
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

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

      {/* Search */}
      <FluentCard depth="depth-4" className="p-4">
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

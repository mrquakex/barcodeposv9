import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building2, Mail, Phone } from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  balance: number;
}

const Suppliers: React.FC = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.suppliers || []);
    } catch (error) {
      toast.error(t('suppliers.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, formData);
        toast.success(t('suppliers.supplierUpdated'));
      } else {
        await api.post('/suppliers', formData);
        toast.success(t('suppliers.supplierCreated'));
      }
      fetchSuppliers();
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('suppliers.saveError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success(t('suppliers.supplierDeleted'));
      fetchSuppliers();
    } catch (error) {
      toast.error(t('suppliers.saveError'));
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingSupplier(null);
    setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' });
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">Suppliers</h1>
          <p className="fluent-body text-foreground-secondary mt-1">
            {filteredSuppliers.length} suppliers
          </p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDialog(true)}
        >
          Add Supplier
        </FluentButton>
      </div>

      {/* Search */}
      <FluentCard depth="depth-4" className="p-4">
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('suppliers.searchPlaceholder') || 'Tedarikçi ara...'}
          icon={<Search className="w-4 h-4" />}
        />
      </FluentCard>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier) => (
          <FluentCard key={supplier.id} depth="depth-4" hoverable className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="fluent-body font-medium text-foreground truncate">
                  {supplier.name}
                </h4>
                {supplier.contactPerson && (
                  <p className="fluent-caption text-foreground-secondary">{supplier.contactPerson}</p>
                )}
                {supplier.email && (
                  <p className="fluent-caption text-foreground-secondary flex items-center gap-1 truncate mt-1">
                    <Mail className="w-3 h-3" />
                    {supplier.email}
                  </p>
                )}
                {supplier.phone && (
                  <p className="fluent-caption text-foreground-secondary flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {supplier.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-foreground-secondary">Balance</span>
              <FluentBadge appearance={supplier.balance > 0 ? 'error' : 'success'} size="small">
                ₺{supplier.balance.toFixed(2)}
              </FluentBadge>
            </div>

            <div className="flex gap-2 pt-3 border-t border-border">
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1"
                icon={<Edit className="w-3 h-3" />}
                onClick={() => handleEdit(supplier)}
              >
                Edit
              </FluentButton>
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1 text-destructive hover:bg-destructive/10"
                icon={<Trash2 className="w-3 h-3" />}
                onClick={() => handleDelete(supplier.id)}
              >
                Delete
              </FluentButton>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="fluent-body text-foreground-secondary">
            {searchTerm ? 'No suppliers found' : 'No suppliers yet'}
          </p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <FluentDialog
        open={showDialog}
        onClose={handleCloseDialog}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FluentInput
            label="Company Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={<Building2 className="w-4 h-4" />}
            required
          />
          <FluentInput
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          />
          <FluentInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            icon={<Mail className="w-4 h-4" />}
          />
          <FluentInput
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            icon={<Phone className="w-4 h-4" />}
          />
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder={t('suppliers.enterAddress') || 'Adres girin...'}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <FluentButton appearance="subtle" className="flex-1" onClick={handleCloseDialog}>
              Cancel
            </FluentButton>
            <FluentButton type="submit" appearance="primary" className="flex-1">
              {editingSupplier ? t('common.update') || 'Güncelle' : t('common.create') || 'Oluştur'}
            </FluentButton>
          </div>
        </form>
      </FluentDialog>
    </div>
  );
};

export default Suppliers;


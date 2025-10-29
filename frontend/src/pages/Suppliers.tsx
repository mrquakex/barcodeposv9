import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building2, Mail, Phone, Eye, ShoppingBag, TrendingUp } from 'lucide-react';
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

interface SupplierDetail extends Supplier {
  purchaseOrders?: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    orderDate: string;
    items: Array<{
      product: { name: string };
      quantity: number;
      total: number;
    }>;
  }>;
}

const Suppliers: React.FC = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');
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
      toast.error('Tedarikçiler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, formData);
        toast.success('Tedarikçi güncellendi');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Tedarikçi oluşturuldu');
      }
      fetchSuppliers();
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kaydetme hatası');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu tedarikçiyi silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Tedarikçi silindi');
      fetchSuppliers();
    } catch (error) {
      toast.error('Silme hatası');
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

  const handleViewDetail = async (supplierId: string) => {
    try {
      // Get supplier details
      const supplierResponse = await api.get(`/suppliers/${supplierId}`);
      const supplier = supplierResponse.data.supplier;

      // Get purchase orders for this supplier
      const ordersResponse = await api.get('/purchase-orders');
      const allOrders = ordersResponse.data.orders || [];
      const supplierOrders = allOrders.filter((order: any) => order.supplier.id === supplierId);

      setSelectedSupplier({
        ...supplier,
        purchaseOrders: supplierOrders,
      });
      setActiveTab('info');
      setShowDetailDialog(true);
    } catch (error) {
      toast.error('Tedarikçi detayı yüklenemedi');
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingSupplier(null);
    setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' });
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            🏢 Tedarikçiler
          </h1>
          <p className="text-base text-foreground-secondary">
            {filteredSuppliers.length} tedarikçi
          </p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDialog(true)}
        >
          Yeni Tedarikçi
        </FluentButton>
      </div>

      {/* Search */}
      <FluentCard depth="depth-4" className="p-4">
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tedarikçi ara..."
          icon={<Search className="w-4 h-4" />}
        />
      </FluentCard>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier) => (
          <FluentCard key={supplier.id} depth="depth-4" hoverable className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate mb-1">{supplier.name}</h4>
                {supplier.contactPerson && (
                  <p className="text-xs text-foreground-secondary mb-1">
                    İrtibat: {supplier.contactPerson}
                  </p>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-1 text-xs text-foreground-secondary mb-1">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-1 text-xs text-foreground-secondary">
                    <Phone className="w-3 h-3" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border mb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-secondary">Bakiye:</span>
                <span className={`font-medium ${
                  supplier.balance > 0 ? 'text-red-600' : supplier.balance < 0 ? 'text-green-600' : 'text-foreground'
                }`}>
                  ₺{Number(supplier.balance).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-border">
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1"
                icon={<Eye className="w-3 h-3" />}
                onClick={() => handleViewDetail(supplier.id)}
              >
                Detay
              </FluentButton>
              <FluentButton
                appearance="subtle"
                size="small"
                icon={<Edit className="w-3 h-3" />}
                onClick={() => handleEdit(supplier)}
              >
                Düzenle
              </FluentButton>
              <FluentButton
                appearance="subtle"
                size="small"
                icon={<Trash2 className="w-3 h-3" />}
                onClick={() => handleDelete(supplier.id)}
              >
                Sil
              </FluentButton>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="text-foreground-secondary">Tedarikçi bulunamadı</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <FluentDialog
        open={showDialog}
        onClose={handleCloseDialog}
        title={editingSupplier ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FluentInput
            label="Şirket Adı *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <FluentInput
            label="İrtibat Kişisi"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
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
              {editingSupplier ? 'Güncelle' : 'Oluştur'}
            </FluentButton>
          </div>
        </form>
      </FluentDialog>

      {/* Detail Dialog */}
      <FluentDialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title="Tedarikçi Detayı"
        size="large"
      >
        {selectedSupplier && (
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
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'orders'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                Satın Alma Geçmişi ({selectedSupplier.purchaseOrders?.length || 0})
              </button>
            </div>

            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-foreground-secondary">Şirket Adı</p>
                    <p className="font-medium text-foreground">{selectedSupplier.name}</p>
                  </div>
                  {selectedSupplier.contactPerson && (
                    <div>
                      <p className="text-sm text-foreground-secondary">İrtibat Kişisi</p>
                      <p className="font-medium text-foreground">{selectedSupplier.contactPerson}</p>
                    </div>
                  )}
                  {selectedSupplier.email && (
                    <div>
                      <p className="text-sm text-foreground-secondary">E-posta</p>
                      <p className="font-medium text-foreground">{selectedSupplier.email}</p>
                    </div>
                  )}
                  {selectedSupplier.phone && (
                    <div>
                      <p className="text-sm text-foreground-secondary">Telefon</p>
                      <p className="font-medium text-foreground">{selectedSupplier.phone}</p>
                    </div>
                  )}
                  {selectedSupplier.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-foreground-secondary">Adres</p>
                      <p className="font-medium text-foreground">{selectedSupplier.address}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-1">Toplam Sipariş</p>
                    <p className="text-2xl font-bold text-foreground">
                      {selectedSupplier.purchaseOrders?.length || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-1">Toplam Tutar</p>
                    <p className="text-2xl font-bold text-primary">
                      ₺{Number(
                        selectedSupplier.purchaseOrders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground-secondary mb-1">Bakiye</p>
                    <p className={`text-2xl font-bold ${
                      selectedSupplier.balance > 0 ? 'text-red-600' : 
                      selectedSupplier.balance < 0 ? 'text-green-600' : 'text-foreground'
                    }`}>
                      ₺{Number(selectedSupplier.balance).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                {selectedSupplier.purchaseOrders && selectedSupplier.purchaseOrders.length > 0 ? (
                  selectedSupplier.purchaseOrders.map((order: any) => (
                    <div key={order.id} className="p-3 bg-background-alt rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{order.orderNumber}</p>
                            <FluentBadge
                              appearance={
                                order.status === 'RECEIVED' ? 'success' :
                                order.status === 'APPROVED' ? 'info' :
                                order.status === 'CANCELLED' ? 'error' : 'warning'
                              }
                              size="small"
                            >
                              {order.status}
                            </FluentBadge>
                          </div>
                          <p className="text-xs text-foreground-secondary">
                            {new Date(order.orderDate).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-primary">₺{Number(order.totalAmount).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-foreground-secondary">
                        <span>{order.items?.length || 0} ürün</span>
                        <span>Ödenen: ₺{Number(order.paidAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-foreground-secondary py-8">Henüz sipariş yok</p>
                )}
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

export default Suppliers;

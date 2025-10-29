import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, FileText, Trash2, Package, Calendar, CheckCircle, X } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentDialog from '../components/fluent/FluentDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  supplier: { id: string; name: string };
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  items: Array<{
    id: string;
    productId: string;
    product: { name: string; barcode: string };
    quantity: number;
    receivedQty: number;
    unitCost: number;
    total: number;
  }>;
}

const PurchaseOrders: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create form
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDate: '',
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; quantity: number; unitCost: number }>>([]);

  // Receive form
  const [receiveItems, setReceiveItems] = useState<Array<{ itemId: string; receivedQty: number }>>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/purchase-orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      toast.error('Siparişler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.suppliers || []);
    } catch (error) {
      toast.error('Tedarikçiler yüklenemedi');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      toast.error('Ürünler yüklenemedi');
    }
  };

  const handleOpenCreateDialog = () => {
    fetchSuppliers();
    fetchProducts();
    setShowCreateDialog(true);
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1, unitCost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const handleCreateOrder = async () => {
    if (!formData.supplierId) {
      toast.error('Lütfen tedarikçi seçin');
      return;
    }

    if (orderItems.length === 0) {
      toast.error('Lütfen en az bir ürün ekleyin');
      return;
    }

    const validItems = orderItems.filter(item => item.productId && item.quantity > 0 && item.unitCost > 0);
    if (validItems.length === 0) {
      toast.error('Geçerli ürün bilgisi girin');
      return;
    }

    try {
      await api.post('/purchase-orders', {
        ...formData,
        items: validItems,
      });

      toast.success('Sipariş oluşturuldu!');
      fetchOrders();
      setShowCreateDialog(false);
      setFormData({ supplierId: '', expectedDate: '', notes: '' });
      setOrderItems([]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Sipariş oluşturulamadı');
    }
  };

  const handleViewDetail = async (orderId: string) => {
    try {
      const response = await api.get(`/purchase-orders/${orderId}`);
      setSelectedOrder(response.data.order);
      setShowDetailDialog(true);
    } catch (error) {
      toast.error('Sipariş detayı yüklenemedi');
    }
  };

  const handleOpenReceiveDialog = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setReceiveItems(
      order.items.map(item => ({
        itemId: item.id,
        receivedQty: 0,
      }))
    );
    setShowReceiveDialog(true);
  };

  const handleReceiveOrder = async () => {
    if (!selectedOrder) return;

    const validItems = receiveItems.filter(item => item.receivedQty > 0);
    if (validItems.length === 0) {
      toast.error('Lütfen teslim alınacak miktarları girin');
      return;
    }

    try {
      await api.post(`/purchase-orders/${selectedOrder.id}/receive`, {
        items: validItems,
      });

      toast.success('Ürünler teslim alındı ve stok güncellendi!');
      fetchOrders();
      setShowReceiveDialog(false);
      setReceiveItems([]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Teslim alma başarısız');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/purchase-orders/${orderId}/status`, { status });
      toast.success('Durum güncellendi');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Durum güncellenemedi');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Bu siparişi silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/purchase-orders/${orderId}`);
      toast.success('Sipariş silindi');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Sipariş silinemedi');
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            📦 Satın Alma Siparişleri
          </h1>
          <p className="text-base text-foreground-secondary">
            Tedarikçilerden ürün siparişi oluşturun ve takip edin
          </p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreateDialog}
        >
          Yeni Sipariş
        </FluentButton>
      </div>

      {/* Search */}
      <FluentCard depth="depth-4" className="p-4">
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Sipariş veya tedarikçi ara..."
          icon={<Search className="w-4 h-4" />}
        />
      </FluentCard>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <FluentCard key={order.id} depth="depth-4" hoverable className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground">{order.orderNumber}</h4>
                  <FluentBadge
                    appearance={
                      order.status === 'RECEIVED'
                        ? 'success'
                        : order.status === 'APPROVED'
                        ? 'info'
                        : order.status === 'CANCELLED'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  >
                    {order.status}
                  </FluentBadge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                  <span>Tedarikçi: {order.supplier.name}</span>
                  <span>Ürün: {order.items?.length || 0} adet</span>
                  <span>{new Date(order.orderDate).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <p className="text-2xl font-bold text-foreground">₺{Number(order.totalAmount).toFixed(2)}</p>
                <div className="flex gap-2">
                  <FluentButton
                    appearance="subtle"
                    size="small"
                    icon={<Eye className="w-3 h-3" />}
                    onClick={() => handleViewDetail(order.id)}
                  >
                    Detay
                  </FluentButton>
                  {order.status === 'PENDING' && (
                    <FluentButton
                      appearance="primary"
                      size="small"
                      icon={<Package className="w-3 h-3" />}
                      onClick={() => handleOpenReceiveDialog(order)}
                    >
                      Teslim Al
                    </FluentButton>
                  )}
                  {order.status !== 'RECEIVED' && (
                    <FluentButton
                      appearance="subtle"
                      size="small"
                      icon={<Trash2 className="w-3 h-3" />}
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      Sil
                    </FluentButton>
                  )}
                </div>
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="text-foreground-secondary">Henüz sipariş yok</p>
        </div>
      )}

      {/* Create Order Dialog */}
      <FluentDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Yeni Satın Alma Siparişi"
        size="large"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Tedarikçi *
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full h-10 px-3 bg-input border border-border rounded text-foreground"
              >
                <option value="">Tedarikçi seçin...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Beklenen Teslim Tarihi
              </label>
              <input
                type="date"
                value={formData.expectedDate}
                onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                className="w-full h-10 px-3 bg-input border border-border rounded text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Notlar
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full h-20 px-3 py-2 bg-input border border-border rounded text-foreground resize-none"
              placeholder="Sipariş notları..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground-secondary">
                Ürünler *
              </label>
              <FluentButton
                appearance="subtle"
                size="small"
                icon={<Plus className="w-3 h-3" />}
                onClick={handleAddItem}
              >
                Ürün Ekle
              </FluentButton>
            </div>

            <div className="space-y-2">
              {orderItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => handleUpdateItem(index, 'productId', e.target.value)}
                      className="w-full h-10 px-3 bg-input border border-border rounded text-foreground text-sm"
                    >
                      <option value="">Ürün seçin...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.barcode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full h-10 px-3 bg-input border border-border rounded text-foreground text-sm"
                      placeholder="Miktar"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) => handleUpdateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3 bg-input border border-border rounded text-foreground text-sm"
                      placeholder="Birim Fiyat"
                    />
                  </div>
                  <FluentButton
                    appearance="subtle"
                    size="small"
                    icon={<X className="w-3 h-3" />}
                    onClick={() => handleRemoveItem(index)}
                  />
                </div>
              ))}
            </div>

            {orderItems.length === 0 && (
              <p className="text-sm text-foreground-secondary text-center py-4">
                Henüz ürün eklenmedi
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t border-border">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={() => setShowCreateDialog(false)}
            >
              İptal
            </FluentButton>
            <FluentButton
              appearance="primary"
              className="flex-1"
              onClick={handleCreateOrder}
            >
              Sipariş Oluştur
            </FluentButton>
          </div>
        </div>
      </FluentDialog>

      {/* Detail Dialog */}
      <FluentDialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title="Sipariş Detayı"
        size="large"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground-secondary">Sipariş No</p>
                <p className="font-medium text-foreground">{selectedOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Durum</p>
                <FluentBadge
                  appearance={
                    selectedOrder.status === 'RECEIVED' ? 'success' :
                    selectedOrder.status === 'APPROVED' ? 'info' :
                    selectedOrder.status === 'CANCELLED' ? 'error' : 'warning'
                  }
                >
                  {selectedOrder.status}
                </FluentBadge>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Tedarikçi</p>
                <p className="font-medium text-foreground">{selectedOrder.supplier.name}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Sipariş Tarihi</p>
                <p className="font-medium text-foreground">
                  {new Date(selectedOrder.orderDate).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Ürünler</h4>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full">
                  <thead className="bg-background-alt">
                    <tr>
                      <th className="text-left py-2 px-3 text-sm font-medium text-foreground-secondary">Ürün</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Miktar</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Teslim</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Birim</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item: any) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="py-2 px-3">
                          <p className="font-medium text-foreground">{item.product.name}</p>
                          <p className="text-xs text-foreground-secondary">{item.product.barcode}</p>
                        </td>
                        <td className="py-2 px-3 text-right text-foreground">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">
                          <span className={item.receivedQty >= item.quantity ? 'text-green-600' : 'text-orange-600'}>
                            {item.receivedQty}/{item.quantity}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-foreground">₺{Number(item.unitCost).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-medium text-foreground">
                          ₺{Number(item.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between">
                    <span className="font-bold text-foreground">Toplam:</span>
                    <span className="text-xl font-bold text-primary">
                      ₺{Number(selectedOrder.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <FluentButton
                appearance="subtle"
                className="flex-1"
                onClick={() => setShowDetailDialog(false)}
              >
                Kapat
              </FluentButton>
              {selectedOrder.status === 'PENDING' && (
                <FluentButton
                  appearance="primary"
                  className="flex-1"
                  icon={<Package className="w-4 h-4" />}
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleOpenReceiveDialog(selectedOrder);
                  }}
                >
                  Teslim Al
                </FluentButton>
              )}
            </div>
          </div>
        )}
      </FluentDialog>

      {/* Receive Dialog */}
      <FluentDialog
        open={showReceiveDialog}
        onClose={() => setShowReceiveDialog(false)}
        title="Ürünleri Teslim Al"
        size="medium"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-sm text-foreground-secondary">
              Sipariş: <strong>{selectedOrder.orderNumber}</strong>
            </p>

            <div className="space-y-2">
              {selectedOrder.items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-background-alt rounded">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.product.name}</p>
                    <p className="text-xs text-foreground-secondary">
                      Sipariş: {item.quantity} | Teslim: {item.receivedQty}
                    </p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={item.quantity - item.receivedQty}
                    value={receiveItems[index]?.receivedQty || 0}
                    onChange={(e) => {
                      const updated = [...receiveItems];
                      updated[index] = {
                        itemId: item.id,
                        receivedQty: parseInt(e.target.value) || 0,
                      };
                      setReceiveItems(updated);
                    }}
                    className="w-24 h-10 px-3 bg-input border border-border rounded text-foreground"
                    placeholder="Miktar"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t border-border">
              <FluentButton
                appearance="subtle"
                className="flex-1"
                onClick={() => setShowReceiveDialog(false)}
              >
                İptal
              </FluentButton>
              <FluentButton
                appearance="primary"
                className="flex-1"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={handleReceiveOrder}
              >
                Teslim Al ve Stok Güncelle
              </FluentButton>
            </div>
          </div>
        )}
      </FluentDialog>
    </div>
  );
};

export default PurchaseOrders;

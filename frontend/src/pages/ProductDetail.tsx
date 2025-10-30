import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, TrendingUp, TrendingDown, DollarSign, AlertCircle, 
  BarChart3, ShoppingCart, Truck, Image as ImageIcon, Edit, Save, X,
  Calendar, Tag, Boxes, Clock, FileText, CheckCircle, XCircle, ArrowRightLeft
} from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentTabs from '../components/fluent/FluentTabs';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Line, Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';

interface Product {
  id: string;
  barcode: string;
  name: string;
  sellPrice: number;
  buyPrice: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  taxRate: number;
  isFavorite: boolean;
  isActive: boolean;
  categoryId?: string;
  category?: { name: string };
  supplierId?: string;
  supplier?: { name: string };
  description?: string;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  createdAt: string;
  user?: { name: string };
  notes?: string;
}

interface SaleData {
  date: string;
  quantity: number;
  revenue: number;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([]);
  const [salesData, setSalesData] = useState<SaleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('general');
  
  const [editForm, setEditForm] = useState({
    name: '',
    sellPrice: 0,
    buyPrice: 0,
    stock: 0,
    minStock: 0,
    maxStock: 0,
    description: '',
  });

  useEffect(() => {
    if (id) {
      fetchProductDetails();
      fetchStockHistory();
      fetchSalesAnalysis();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      const productData = response.data.product || response.data;
      setProduct(productData);
      setEditForm({
        name: productData.name,
        sellPrice: productData.sellPrice,
        buyPrice: productData.buyPrice,
        stock: productData.stock,
        minStock: productData.minStock,
        maxStock: productData.maxStock || 0,
        description: productData.description || '',
      });
    } catch (error) {
      toast.error('Ürün detayları yüklenemedi');
      navigate('/products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStockHistory = async () => {
    try {
      const response = await api.get(`/stock-movements?productId=${id}`);
      setStockHistory(response.data.movements || response.data || []);
    } catch (error) {
      console.error('Stock history fetch error:', error);
    }
  };

  const fetchSalesAnalysis = async () => {
    try {
      // Mock data for now - will be replaced with actual API
      const mockSales: SaleData[] = [];
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        mockSales.push({
          date: date.toISOString(),
          quantity: Math.floor(Math.random() * 50) + 10,
          revenue: Math.floor(Math.random() * 5000) + 1000,
        });
      }
      setSalesData(mockSales);
    } catch (error) {
      console.error('Sales analysis fetch error:', error);
    }
  };

  const handleSave = async () => {
    if (!product) return;
    try {
      await api.put(`/products/${product.id}`, editForm);
      toast.success('Ürün başarıyla güncellendi');
      setIsEditing(false);
      fetchProductDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Güncelleme başarısız');
    }
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

  if (!product) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <p className="text-lg text-foreground">Ürün bulunamadı</p>
        </div>
      </div>
    );
  }

  // Calculate KPIs
  const totalSalesQty = salesData.reduce((sum, s) => sum + s.quantity, 0);
  const totalRevenue = salesData.reduce((sum, s) => sum + s.revenue, 0);
  const profitMargin = product.sellPrice > 0 
    ? ((product.sellPrice - product.buyPrice) / product.sellPrice * 100).toFixed(1)
    : '0.0';
  const stockValue = product.stock * product.buyPrice;
  const stockStatus = product.stock <= 0 
    ? 'critical' 
    : product.stock <= product.minStock 
    ? 'low' 
    : 'normal';

  // Sales trend chart data
  const salesChartData = {
    labels: salesData.map(s => new Date(s.date).toLocaleDateString('tr-TR', { month: 'short' })),
    datasets: [
      {
        label: 'Satış Adedi',
        data: salesData.map(s => s.quantity),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const revenueChartData = {
    labels: salesData.map(s => new Date(s.date).toLocaleDateString('tr-TR', { month: 'short' })),
    datasets: [
      {
        label: 'Ciro (TL)',
        data: salesData.map(s => s.revenue),
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
      },
    ],
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FluentButton
            appearance="subtle"
            icon={<ArrowLeft className="w-5 h-5" />}
            onClick={() => navigate('/products')}
          >
            Geri
          </FluentButton>
          <div>
            <div className="flex items-center gap-3">
              <Package className="w-7 h-7 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">{product.name}</h1>
              <FluentBadge appearance={product.isActive ? 'success' : 'default'}>
                {product.isActive ? 'Aktif' : 'Pasif'}
              </FluentBadge>
              {stockStatus === 'critical' && (
                <FluentBadge appearance="error">Stokta Yok</FluentBadge>
              )}
              {stockStatus === 'low' && (
                <FluentBadge appearance="warning">Düşük Stok</FluentBadge>
              )}
            </div>
            <p className="text-sm text-foreground-secondary mt-1">
              Barkod: {product.barcode} | SKU: {product.sku || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <FluentButton appearance="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave}>
                Kaydet
              </FluentButton>
              <FluentButton appearance="subtle" icon={<X className="w-4 h-4" />} onClick={() => setIsEditing(false)}>
                İptal
              </FluentButton>
            </>
          ) : (
            <FluentButton appearance="subtle" icon={<Edit className="w-4 h-4" />} onClick={() => setIsEditing(true)}>
              Düzenle
            </FluentButton>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-foreground-secondary">Mevcut Stok</span>
          </div>
          <div className="text-2xl font-semibold text-foreground">{product.stock}</div>
          <div className="text-xs text-foreground-secondary mt-1">
            Min: {product.minStock} | Max: {product.maxStock || 'N/A'}
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <span className="text-xs text-foreground-secondary">Kar Marjı</span>
          </div>
          <div className="text-2xl font-semibold text-foreground">{profitMargin}%</div>
          <div className="text-xs text-foreground-secondary mt-1">
            Alış: {product.buyPrice.toFixed(2)} TL | Satış: {product.sellPrice.toFixed(2)} TL
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-info" />
            </div>
            <span className="text-xs text-foreground-secondary">Toplam Satış</span>
          </div>
          <div className="text-2xl font-semibold text-foreground">{totalSalesQty}</div>
          <div className="text-xs text-foreground-secondary mt-1">Son 12 ay</div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-warning" />
            </div>
            <span className="text-xs text-foreground-secondary">Stok Değeri</span>
          </div>
          <div className="text-2xl font-semibold text-foreground">{stockValue.toFixed(0)} TL</div>
          <div className="text-xs text-foreground-secondary mt-1">
            Alış fiyatı ile
          </div>
        </FluentCard>
      </div>

      {/* Tabs */}
      <FluentTabs
        tabs={[
          { id: 'general', label: 'Genel Bilgiler', icon: <Package className="w-4 h-4" /> },
          { id: 'stock-history', label: 'Stok Geçmişi', icon: <Clock className="w-4 h-4" /> },
          { id: 'sales', label: 'Satış Analizi', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'supplier', label: 'Tedarikçi & Maliyetler', icon: <Truck className="w-4 h-4" /> },
          { id: 'variants', label: 'Varyantlar', icon: <Boxes className="w-4 h-4" /> },
          { id: 'media', label: 'Medya & Belgeler', icon: <ImageIcon className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'general' && (
          <FluentCard depth="depth-4" className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Genel Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Ürün Adı</label>
                {isEditing ? (
                  <FluentInput
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{product.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Kategori</label>
                <p className="text-foreground">{product.category?.name || 'Kategori yok'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Satış Fiyatı</label>
                {isEditing ? (
                  <FluentInput
                    type="number"
                    value={editForm.sellPrice}
                    onChange={(e) => setEditForm({ ...editForm, sellPrice: parseFloat(e.target.value) })}
                  />
                ) : (
                  <p className="text-foreground">{product.sellPrice.toFixed(2)} TL</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Alış Fiyatı</label>
                {isEditing ? (
                  <FluentInput
                    type="number"
                    value={editForm.buyPrice}
                    onChange={(e) => setEditForm({ ...editForm, buyPrice: parseFloat(e.target.value) })}
                  />
                ) : (
                  <p className="text-foreground">{product.buyPrice.toFixed(2)} TL</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Mevcut Stok</label>
                <p className="text-foreground">{product.stock} {product.unit}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Minimum Stok</label>
                {isEditing ? (
                  <FluentInput
                    type="number"
                    value={editForm.minStock}
                    onChange={(e) => setEditForm({ ...editForm, minStock: parseInt(e.target.value) })}
                  />
                ) : (
                  <p className="text-foreground">{product.minStock} {product.unit}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">KDV Oranı</label>
                <p className="text-foreground">{product.taxRate}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Birim</label>
                <p className="text-foreground">{product.unit}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Açıklama</label>
                {isEditing ? (
                  <textarea
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{product.description || 'Açıklama yok'}</p>
                )}
              </div>
            </div>
          </FluentCard>
        )}

        {activeTab === 'stock-history' && (
          <FluentCard depth="depth-4" className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Stok Hareketleri</h3>
            {stockHistory.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-foreground-secondary/30 mx-auto mb-4" />
                <p className="text-foreground-secondary">Henüz stok hareketi yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stockHistory.slice(0, 20).map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-4 bg-background-alt rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        movement.type === 'IN' ? 'bg-success/10' :
                        movement.type === 'OUT' ? 'bg-destructive/10' :
                        'bg-primary/10'
                      }`}>
                        {movement.type === 'IN' && <TrendingUp className="w-5 h-5 text-success" />}
                        {movement.type === 'OUT' && <TrendingDown className="w-5 h-5 text-destructive" />}
                        {movement.type === 'TRANSFER' && <ArrowLeft className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {movement.type === 'IN' ? 'Stok Girişi' : 
                           movement.type === 'OUT' ? 'Stok Çıkışı' : 
                           'Transfer'}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          {new Date(movement.createdAt).toLocaleString('tr-TR')}
                          {movement.user && ` - ${movement.user.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        {movement.previousStock} → {movement.newStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FluentCard>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-6">
            <FluentCard depth="depth-4" className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Satış Trendi (Son 12 Ay)</h3>
              <div className="h-64">
                <Line data={salesChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </FluentCard>
            <FluentCard depth="depth-4" className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Aylık Ciro (Son 12 Ay)</h3>
              <div className="h-64">
                <Bar data={revenueChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </FluentCard>
          </div>
        )}

        {activeTab === 'supplier' && (
          <FluentCard depth="depth-4" className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Tedarikçi Bilgileri</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tedarikçi</label>
                <p className="text-foreground">{product.supplier?.name || 'Tedarikçi atanmamış'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Son Alış Fiyatı</label>
                <p className="text-foreground">{product.buyPrice.toFixed(2)} TL</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Son Güncelleme</label>
                <p className="text-foreground">{new Date(product.updatedAt).toLocaleString('tr-TR')}</p>
              </div>
            </div>
          </FluentCard>
        )}

        {activeTab === 'variants' && (
          <FluentCard depth="depth-4" className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Ürün Varyantları</h3>
            <div className="text-center py-12">
              <Boxes className="w-16 h-16 text-foreground-secondary/30 mx-auto mb-4" />
              <p className="text-foreground-secondary mb-4">Varyant özelliği yakında eklenecek</p>
              <p className="text-sm text-foreground-secondary">Farklı beden, renk veya model seçenekleri ekleyebileceksiniz</p>
            </div>
          </FluentCard>
        )}

        {activeTab === 'media' && (
          <FluentCard depth="depth-4" className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Medya & Belgeler</h3>
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-foreground-secondary/30 mx-auto mb-4" />
              <p className="text-foreground-secondary mb-4">Medya yükleme özelliği yakında eklenecek</p>
              <p className="text-sm text-foreground-secondary">Ürün fotoğrafları ve belgeleri ekleyebileceksiniz</p>
            </div>
          </FluentCard>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;


import React, { useState, useEffect } from 'react';
import { X, Package, Save } from 'lucide-react';
import FluentButton from '../fluent/FluentButton';
import FluentInput from '../fluent/FluentInput';
import toast from 'react-hot-toast';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: {
    id?: string;
    barcode: string;
    name: string;
    description?: string;
    buyPrice: number;
    sellPrice: number;
    stock: number;
    minStock: number;
    maxStock?: number;
    unit: string;
    taxRate: number;
    categoryId?: string;
    supplierId?: string;
  };
  categories?: Array<{ id: string; name: string }>;
  suppliers?: Array<{ id: string; name: string }>;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories = [],
  suppliers = []
}) => {
  const isEdit = !!product?.id;
  
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    description: '',
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 5,
    maxStock: 0,
    unit: 'Adet',
    taxRate: 18,
    categoryId: '',
    supplierId: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        barcode: product.barcode || '',
        name: product.name || '',
        description: product.description || '',
        buyPrice: product.buyPrice || 0,
        sellPrice: product.sellPrice || 0,
        stock: product.stock || 0,
        minStock: product.minStock || 5,
        maxStock: product.maxStock || 0,
        unit: product.unit || 'Adet',
        taxRate: product.taxRate || 18,
        categoryId: product.categoryId || '',
        supplierId: product.supplierId || ''
      });
    } else {
      // Reset for new product
      setFormData({
        barcode: '',
        name: '',
        description: '',
        buyPrice: 0,
        sellPrice: 0,
        stock: 0,
        minStock: 5,
        maxStock: 0,
        unit: 'Adet',
        taxRate: 18,
        categoryId: '',
        supplierId: ''
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.barcode.trim()) {
      newErrors.barcode = 'Barkod zorunludur';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Ürün adı zorunludur';
    }
    if (formData.sellPrice <= 0) {
      newErrors.sellPrice = 'Satış fiyatı 0\'dan büyük olmalıdır';
    }
    if (formData.buyPrice < 0) {
      newErrors.buyPrice = 'Alış fiyatı negatif olamaz';
    }
    if (formData.minStock < 0) {
      newErrors.minStock = 'Minimum stok negatif olamaz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      const { default: api } = await import('../../lib/api');
      
      const payload = {
        ...formData,
        buyPrice: Number(formData.buyPrice),
        sellPrice: Number(formData.sellPrice),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        maxStock: formData.maxStock ? Number(formData.maxStock) : undefined,
        taxRate: Number(formData.taxRate),
        categoryId: formData.categoryId || undefined,
        supplierId: formData.supplierId || undefined
      };

      if (isEdit && product?.id) {
        await api.put(`/products/${product.id}`, payload);
        toast.success('✅ Ürün güncellendi');
      } else {
        await api.post('/products', payload);
        toast.success('✅ Ürün eklendi');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Product save error:', error);
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </h2>
              <p className="text-sm text-foreground-secondary">
                {isEdit ? 'Ürün bilgilerini güncelleyin' : 'Yeni ürün bilgilerini girin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Temel Bilgiler */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Temel Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Barkod <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-card border ${
                    errors.barcode ? 'border-red-500' : 'border-border'
                  } rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  placeholder="1234567890123"
                />
                {errors.barcode && (
                  <p className="text-red-500 text-xs mt-1">{errors.barcode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ürün Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-card border ${
                    errors.name ? 'border-red-500' : 'border-border'
                  } rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  placeholder="Ürün adı"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ürün açıklaması (opsiyonel)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Kategori
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tedarikçi
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => handleChange('supplierId', e.target.value)}
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Tedarikçi Seçin</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Fiyat Bilgileri */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Fiyat Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Alış Fiyatı (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.buyPrice}
                  onChange={(e) => handleChange('buyPrice', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-card border ${
                    errors.buyPrice ? 'border-red-500' : 'border-border'
                  } rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  placeholder="0.00"
                />
                {errors.buyPrice && (
                  <p className="text-red-500 text-xs mt-1">{errors.buyPrice}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Satış Fiyatı (₺) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sellPrice}
                  onChange={(e) => handleChange('sellPrice', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-card border ${
                    errors.sellPrice ? 'border-red-500' : 'border-border'
                  } rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  placeholder="0.00"
                />
                {errors.sellPrice && (
                  <p className="text-red-500 text-xs mt-1">{errors.sellPrice}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  KDV Oranı (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.taxRate}
                  onChange={(e) => handleChange('taxRate', e.target.value)}
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="18"
                />
              </div>
            </div>

            {formData.buyPrice > 0 && formData.sellPrice > 0 && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  💰 Kar Marjı: {((formData.sellPrice - formData.buyPrice) / formData.buyPrice * 100).toFixed(2)}%
                  ({(formData.sellPrice - formData.buyPrice).toFixed(2)} ₺)
                </p>
              </div>
            )}
          </div>

          {/* Stok Bilgileri */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Stok Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mevcut Stok
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleChange('stock', e.target.value)}
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Min. Stok
                </label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => handleChange('minStock', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-card border ${
                    errors.minStock ? 'border-red-500' : 'border-border'
                  } rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  placeholder="5"
                />
                {errors.minStock && (
                  <p className="text-red-500 text-xs mt-1">{errors.minStock}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max. Stok
                </label>
                <input
                  type="number"
                  value={formData.maxStock || ''}
                  onChange={(e) => handleChange('maxStock', e.target.value)}
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Birim
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Adet">Adet</option>
                  <option value="Kg">Kg</option>
                  <option value="Lt">Lt</option>
                  <option value="m">Metre</option>
                  <option value="m2">m²</option>
                  <option value="m3">m³</option>
                  <option value="Kutu">Kutu</option>
                  <option value="Paket">Paket</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-card-hover">
          <FluentButton
            appearance="subtle"
            onClick={onClose}
            disabled={loading}
          >
            İptal
          </FluentButton>
          <FluentButton
            appearance="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSubmit}
            loading={loading}
          >
            {isEdit ? 'Güncelle' : 'Kaydet'}
          </FluentButton>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;


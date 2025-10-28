import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Package, Edit2, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import { useThemeStore } from '../../store/themeStore';
import EmptyState from './EmptyState';
import LoadingSkeleton from './LoadingSkeleton';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  barcode: string;
  name: string;
  sellPrice: number;
  stock: number;
  category?: { name: string };
}

const MobileProducts: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const hapticFeedback = {
    light: () => navigator.vibrate && navigator.vibrate(30),
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Ürünler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode.includes(searchQuery)
  );

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    soundEffects.tap();
    hapticFeedback.light();
  };

  return (
    <div className="mobile-dashboard">
      {/* Header with Search */}
      <div className="dashboard-header">
        <h2 className="greeting-title">📦 Ürünler</h2>
        
        {/* Search Bar */}
        <div className="mobile-search-bar" style={{ marginTop: '12px' }}>
          <Search className="w-5 h-5 text-foreground-secondary" />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mobile-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mobile-search-clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="dashboard-cards">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3">
            <LoadingSkeleton variant="product-card" count={6} />
          </div>
        )}

        {!isLoading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                className="product-card-mobile"
                onClick={() => handleProductClick(product)}
              >
                <div className="product-icon-mobile">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="product-name-mobile">{product.name}</h3>
                <p className="product-price-mobile">₺{product.sellPrice.toFixed(2)}</p>
                <p className="product-stock-mobile">
                  Stok: {product.stock}
                </p>
                {product.category && (
                  <span className="product-category-badge">{product.category.name}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <EmptyState
            icon={Package}
            title="Ürün bulunamadı"
            description={searchQuery ? "Arama sonucu bulunamadı" : "Henüz ürün eklenmemiş"}
          />
        )}
      </div>

      {/* FAB - Add Product */}
      <button
        className="dashboard-fab"
        onClick={() => {
          soundEffects.tap();
          hapticFeedback.light();
          navigate('/products/add');
        }}
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Product Detail Modal (Bottom Sheet) */}
      {selectedProduct && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedProduct(null)}
          />
          
          {/* Bottom Sheet */}
          <div className="bottom-sheet open">
            {/* Header with Gradient */}
            <div style={{
              background: 'linear-gradient(135deg, #3F8EFC 0%, #74C0FC 100%)',
              padding: '20px',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 className="text-xl font-bold text-white">Ürün Detayı</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Product Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-lg">
                  <Package className="w-12 h-12 text-white" />
                </div>
              </div>

              {/* Product Name */}
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{selectedProduct.name}</p>
                {selectedProduct.category && (
                  <span className="inline-block mt-2 px-4 py-1 rounded-full text-sm font-medium"
                    style={{
                      background: 'linear-gradient(135deg, #3F8EFC20 0%, #74C0FC20 100%)',
                      color: '#3F8EFC',
                    }}
                  >
                    {selectedProduct.category.name}
                  </span>
                )}
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Price Card */}
                <div className="p-4 rounded-xl" style={{
                  background: 'linear-gradient(135deg, #10B98120 0%, #059669 20 100%)',
                }}>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Satış Fiyatı</p>
                  <p className="text-2xl font-bold" style={{ color: '#10B981' }}>
                    ₺{selectedProduct.sellPrice.toFixed(2)}
                  </p>
                </div>

                {/* Stock Card */}
                <div className="p-4 rounded-xl" style={{
                  background: selectedProduct.stock <= 0 
                    ? 'linear-gradient(135deg, #EF444420 0%, #DC262620 100%)'
                    : 'linear-gradient(135deg, #3F8EFC20 0%, #74C0FC20 100%)',
                }}>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Stok</p>
                  <p className="text-2xl font-bold" style={{ 
                    color: selectedProduct.stock <= 0 ? '#EF4444' : '#3F8EFC' 
                  }}>
                    {selectedProduct.stock}
                    {selectedProduct.stock <= 0 && ' ⚠️'}
                  </p>
                </div>
              </div>

              {/* Barcode */}
              <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Barkod</p>
                <p className="text-lg font-mono font-semibold text-foreground">{selectedProduct.barcode}</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => {
                    soundEffects.tap();
                    toast('Düzenleme özelliği çok yakında!', { icon: '🚀' });
                  }}
                  className="py-3 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #3F8EFC 0%, #74C0FC 100%)',
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                  Düzenle
                </button>
                <button
                  onClick={() => {
                    soundEffects.error();
                    if (confirm(`"${selectedProduct.name}" ürününü silmek istediğinize emin misiniz?`)) {
                      toast.error('Silme özelliği çok yakında!');
                    }
                  }}
                  className="py-3 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Sil
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileProducts;


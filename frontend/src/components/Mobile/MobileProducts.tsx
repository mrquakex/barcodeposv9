import React, { useState, useEffect } from 'react';
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
          toast('Ürün ekleme çok yakında!', { icon: '🚀' });
        }}
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Product Detail Modal (Bottom Sheet) */}
      {selectedProduct && (
        <div className="bottom-sheet open">
          <div className="bottom-sheet-header">
            <h3 className="font-semibold text-foreground">Ürün Detayı</h3>
            <button
              className="bottom-sheet-close"
              onClick={() => setSelectedProduct(null)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm text-foreground-secondary">Ürün Adı</p>
              <p className="text-lg font-semibold text-foreground">{selectedProduct.name}</p>
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Barkod</p>
              <p className="text-lg font-mono text-foreground">{selectedProduct.barcode}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground-secondary">Fiyat</p>
                <p className="text-lg font-semibold text-primary">₺{selectedProduct.sellPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Stok</p>
                <p className="text-lg font-semibold text-foreground">{selectedProduct.stock}</p>
              </div>
            </div>
            {selectedProduct.category && (
              <div>
                <p className="text-sm text-foreground-secondary">Kategori</p>
                <p className="text-lg text-foreground">{selectedProduct.category.name}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileProducts;


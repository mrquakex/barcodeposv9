import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Package, ArrowLeft, X } from 'lucide-react';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/products');
      const fetchedProducts = response.data.products || [];
      setProducts(fetchedProducts);
      
      // Cache for offline
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cached_products', JSON.stringify({
          products: fetchedProducts,
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      
      // Load from cache
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem('cached_products');
        if (cached) {
          const { products: cachedProducts } = JSON.parse(cached);
          setProducts(cachedProducts);
          toast('📡 Çevrimdışı - önbellekten yüklendi', { duration: 2000 });
        } else {
          toast.error('Ürünler yüklenemedi');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode.includes(searchQuery)
  );

  const handleProductClick = (product: Product) => {
    soundEffects.tap();
    hapticFeedback();
    // Navigate to product detail or edit page
    navigate(`/products/edit/${product.id}`);
  };

  return (
    <div className="mobile-products-clean">
      {/* Clean Header */}
      <div className="products-header-clean">
        <button onClick={() => navigate('/dashboard')} className="back-btn-clean">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="page-title-clean">Ürünler</h1>
        <button 
          onClick={() => {
            navigate('/products/add');
            soundEffects.tap();
            hapticFeedback();
          }} 
          className="add-btn-clean"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-container-clean">
        <Search className="search-icon-clean" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ürün ara..."
          className="search-input-clean"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="clear-search-clean"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Products Count */}
      <div className="products-count-clean">
        <Package className="w-4 h-4" />
        <span>{filteredProducts.length} ürün</span>
      </div>

      {/* Products List */}
      <div className="products-list-clean">
        {isLoading ? (
          // Loading State
          <div className="loading-clean">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="product-skeleton-clean"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          // Empty State
          <div className="empty-state-clean">
            <Package className="w-16 h-16 text-gray-300" />
            <p className="empty-title-clean">Ürün bulunamadı</p>
            <p className="empty-subtitle-clean">
              {searchQuery ? 'Arama kriterlerinizi değiştirin' : 'Yeni ürün ekleyin'}
            </p>
            {!searchQuery && (
              <button 
                onClick={() => navigate('/products/add')}
                className="empty-action-clean"
              >
                <Plus className="w-4 h-4" />
                Ürün Ekle
              </button>
            )}
          </div>
        ) : (
          // Product Items
          filteredProducts.map((product) => (
            <div 
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="product-item-clean"
            >
              <div className="product-info-clean">
                <p className="product-name-clean">{product.name}</p>
                <p className="product-barcode-clean">{product.barcode}</p>
              </div>
              <div className="product-details-clean">
                <p className="product-price-clean">₺{product.sellPrice.toFixed(2)}</p>
                <p className={`product-stock-clean ${product.stock < 10 ? 'low-stock' : ''}`}>
                  Stok: {product.stock}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileProducts;

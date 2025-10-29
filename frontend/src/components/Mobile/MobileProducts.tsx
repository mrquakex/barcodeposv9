import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Package, ArrowLeft, X, Edit, Trash2, 
  MoreVertical, Star, ShoppingCart, TrendingUp, TrendingDown,
  Filter, SlidersHorizontal, CheckSquare, Square, ArrowUpDown, RefreshCw
} from 'lucide-react';
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
  buyPrice?: number;
  stock: number;
  category?: { name: string; color?: string };
  isFavorite?: boolean;
  createdAt?: string;
}

type FilterType = 'all' | 'critical' | 'low' | 'favorites';
type SortType = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'newest';

const MobileProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('name-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Swipe states
  const [swipedProduct, setSwipedProduct] = useState<string | null>(null);
  const [longPressProduct, setLongPressProduct] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', sellPrice: '', stock: '' });
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const longPressTimer = useRef<any>();

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      if (forceRefresh) {
        console.log('🔄 FORCE REFRESH - Clearing cache...');
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('cached_products');
        }
        toast.loading('Yenileniyor...', { duration: 1000 });
      }
      
      console.log('🔄 Loading products from API...');
      const response = await api.get('/products');
      const fetchedProducts = response.data.products || [];
      console.log(`✅ Loaded ${fetchedProducts.length} products from backend`);
      setProducts(fetchedProducts);
      
      // Cache for offline
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cached_products', JSON.stringify({
          products: fetchedProducts,
          timestamp: Date.now(),
        }));
        console.log('💾 Products cached successfully');
      }
      
      if (forceRefresh) {
        toast.success('✅ Yenilendi!');
        hapticFeedback(ImpactStyle.Medium);
      }
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      
      // Load from cache
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem('cached_products');
        if (cached) {
          const { products: cachedProducts, timestamp } = JSON.parse(cached);
          const cacheAge = Date.now() - timestamp;
          const cacheHours = Math.floor(cacheAge / (1000 * 60 * 60));
          
          console.log(`📦 Loading from cache (${cacheHours}h old)`);
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

  // Filter & Sort Logic
  const getFilteredAndSortedProducts = () => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery) ||
      product.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply filter
    if (filter === 'critical') {
      filtered = filtered.filter(p => p.stock < 5);
    } else if (filter === 'low') {
      filtered = filtered.filter(p => p.stock < 15);
    } else if (filter === 'favorites') {
      filtered = filtered.filter(p => p.isFavorite);
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'price-asc': return a.sellPrice - b.sellPrice;
        case 'price-desc': return b.sellPrice - a.sellPrice;
        case 'stock-asc': return a.stock - b.stock;
        case 'stock-desc': return b.stock - a.stock;
        case 'newest': return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default: return 0;
      }
    });

    return filtered;
  };

  const filteredProducts = getFilteredAndSortedProducts();

  // Touch Handlers for Swipe
  const handleTouchStart = (e: React.TouchEvent, productId: string) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    
    // Long press detection
    longPressTimer.current = setTimeout(() => {
      setLongPressProduct(productId);
      hapticFeedback(ImpactStyle.Heavy);
      soundEffects.beep();
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent, productId: string) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Swipe disabled - only long press works
  };

  const handleTouchEnd = (e: React.TouchEvent, productId: string) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const touchX = e.changedTouches[0].clientX;
    const deltaX = touchX - touchStartX.current;

    if (Math.abs(deltaX) < 10) {
      // Regular tap - navigate or quick action
      if (!bulkMode) {
        handleProductClick(productId);
      } else {
        toggleProductSelection(productId);
      }
    }
  };

  const handleProductClick = (productId: string) => {
    soundEffects.tap();
    hapticFeedback();
    // Show quick menu instead of navigating (mobile doesn't have edit page yet)
    setLongPressProduct(productId);
  };

  // Swipe Actions
  const handleSwipeRight = (productId: string) => {
    // Show quick menu instead
    soundEffects.tap();
    hapticFeedback(ImpactStyle.Medium);
    setLongPressProduct(productId);
    setSwipedProduct(null);
  };

  const handleSwipeLeft = async (productId: string) => {
    // Delete action
    if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/products/${productId}`);
        setProducts(prev => prev.filter(p => p.id !== productId));
        toast.success('Ürün silindi');
        soundEffects.cashRegister();
        hapticFeedback(ImpactStyle.Heavy);
      } catch (error) {
        toast.error('Ürün silinemedi');
        soundEffects.error();
      }
    }
    setSwipedProduct(null);
  };

  // Quick Actions Menu
  const handleQuickAction = (action: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    
    switch (action) {
      case 'edit':
        if (product) {
          setEditingProduct(product);
          setEditForm({
            name: product.name,
            sellPrice: product.sellPrice.toString(),
            stock: product.stock?.toString() || '0',
          });
        }
        break;
      case 'addToPos':
        // Add product to POS pending items
        if (product) {
          const posItem = {
            id: product.id,
            barcode: product.barcode,
            name: product.name,
            price: product.sellPrice,
            quantity: 1,
            stock: product.stock,
            addedAt: Date.now()
          };
          
          // Save to localStorage for POS to pick up
          const existing = localStorage.getItem('pos_pending_items');
          const pending = existing ? JSON.parse(existing) : [];
          pending.push(posItem);
          localStorage.setItem('pos_pending_items', JSON.stringify(pending));
          
          toast.success(`${product.name} POS'a eklendi!`);
          soundEffects.success();
          hapticFeedback(ImpactStyle.Medium);
          
          // Navigate to POS
          setTimeout(() => {
            navigate('/pos');
          }, 500);
        }
        break;
      case 'favorite':
        toggleFavorite(productId);
        break;
      case 'stock':
        // Quick stock adjustment
        const newStock = prompt('Yeni stok miktarı:', product?.stock?.toString() || '0');
        if (newStock !== null) {
          updateProductStock(productId, parseInt(newStock));
        }
        break;
      case 'delete':
        handleSwipeLeft(productId);
        break;
    }
    setLongPressProduct(null);
    soundEffects.tap();
    hapticFeedback();
  };

  const updateProductStock = async (productId: string, newStock: number) => {
    try {
      await api.put(`/products/${productId}`, { stock: newStock });
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, stock: newStock } : p
      ));
      toast.success('Stok güncellendi!');
      soundEffects.success();
      hapticFeedback(ImpactStyle.Medium);
    } catch (error) {
      console.error('Stock update error:', error);
      toast.error('Stok güncellenemedi!');
      soundEffects.error();
    }
  };

  const saveProductEdit = async () => {
    if (!editingProduct) return;

    try {
      await api.put(`/products/${editingProduct.id}`, {
        name: editForm.name,
        sellPrice: parseFloat(editForm.sellPrice),
        stock: parseInt(editForm.stock),
      });

      setProducts(prev => prev.map(p =>
        p.id === editingProduct.id
          ? { ...p, name: editForm.name, sellPrice: parseFloat(editForm.sellPrice), stock: parseInt(editForm.stock) }
          : p
      ));

      toast.success('Ürün güncellendi!');
      soundEffects.success();
      hapticFeedback(ImpactStyle.Medium);
      setEditingProduct(null);
    } catch (error) {
      console.error('Product update error:', error);
      toast.error('Ürün güncellenemedi!');
      soundEffects.error();
    }
  };

  const toggleFavorite = async (productId: string) => {
    try {
      // Find current product
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const newFavoriteStatus = !product.isFavorite;

      console.log('⭐ [FAVORITE] Toggling favorite for:', product.name);
      console.log('⭐ [FAVORITE] Current status:', product.isFavorite);
      console.log('⭐ [FAVORITE] New status:', newFavoriteStatus);

      // Optimistic UI update
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, isFavorite: newFavoriteStatus } : p
      ));

      // Save to backend
      await api.patch(`/products/${productId}`, {
        isFavorite: newFavoriteStatus
      });

      console.log('✅ [FAVORITE] Saved to backend successfully!');
      toast.success(newFavoriteStatus ? '⭐ Favorilere eklendi' : '❌ Favorilerden çıkarıldı');
      hapticFeedback();
    } catch (error) {
      console.error('❌ [FAVORITE] Backend save failed:', error);
      
      // Revert optimistic update on error
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, isFavorite: !p.isFavorite } : p
      ));
      
      toast.error('Favori güncellenemedi');
      soundEffects.error();
    }
  };

  // Bulk Actions
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    hapticFeedback();
  };

  const selectAll = () => {
    setSelectedProducts(filteredProducts.map(p => p.id));
    hapticFeedback(ImpactStyle.Medium);
  };

  const deselectAll = () => {
    setSelectedProducts([]);
    hapticFeedback();
  };

  const bulkDelete = async () => {
    if (confirm(`${selectedProducts.length} ürünü silmek istediğinize emin misiniz?`)) {
      try {
        await Promise.all(selectedProducts.map(id => api.delete(`/products/${id}`)));
        setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
        setSelectedProducts([]);
        setBulkMode(false);
        toast.success(`${selectedProducts.length} ürün silindi`);
        soundEffects.cashRegister();
        hapticFeedback(ImpactStyle.Heavy);
      } catch (error) {
        toast.error('Ürünler silinemedi');
        soundEffects.error();
      }
    }
  };

  // Stock Badge Color
  const getStockBadgeClass = (stock: number) => {
    if (stock < 5) return 'critical';
    if (stock < 15) return 'low';
    return 'good';
  };

  // Category Color
  const getCategoryColor = (category?: { name: string; color?: string }) => {
    if (category?.color) return category.color;
    // Default colors based on category name hash
    const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55'];
    const hash = category?.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="mobile-products-ultra">
      {/* Header */}
      <div className="products-header-ultra">
        <button onClick={() => navigate('/dashboard')} className="back-btn-ultra">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="page-title-ultra">Ürünler</h1>
        <div className="header-actions-ultra">
          <button 
            onClick={() => loadProducts(true)} 
            className="icon-btn-ultra"
            disabled={isLoading}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowSortMenu(!showSortMenu)} className="icon-btn-ultra">
            <ArrowUpDown className="w-5 h-5" />
          </button>
          <button onClick={() => setShowFilters(!showFilters)} className="icon-btn-ultra">
            <Filter className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/products/add')} className="add-btn-ultra">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container-ultra">
        <Search className="search-icon-ultra" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="İsim, barkod veya kategori ara..."
          className="search-input-ultra"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="clear-search-ultra">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      {showFilters && (
        <div className="filter-pills-ultra">
          <button
            onClick={() => setFilter('all')}
            className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`filter-pill ${filter === 'critical' ? 'active' : ''}`}
          >
            Kritik
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`filter-pill ${filter === 'low' ? 'active' : ''}`}
          >
            Düşük
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`filter-pill ${filter === 'favorites' ? 'active' : ''}`}
          >
            Favori
          </button>
        </div>
      )}

      {/* Sort Menu */}
      {showSortMenu && (
        <div className="sort-menu-ultra">
          <button onClick={() => { setSortBy('name-asc'); setShowSortMenu(false); }} className={sortBy === 'name-asc' ? 'active' : ''}>
            İsim (A-Z)
          </button>
          <button onClick={() => { setSortBy('name-desc'); setShowSortMenu(false); }} className={sortBy === 'name-desc' ? 'active' : ''}>
            İsim (Z-A)
          </button>
          <button onClick={() => { setSortBy('price-asc'); setShowSortMenu(false); }} className={sortBy === 'price-asc' ? 'active' : ''}>
            Fiyat (Düşük-Yüksek)
          </button>
          <button onClick={() => { setSortBy('price-desc'); setShowSortMenu(false); }} className={sortBy === 'price-desc' ? 'active' : ''}>
            Fiyat (Yüksek-Düşük)
          </button>
          <button onClick={() => { setSortBy('stock-asc'); setShowSortMenu(false); }} className={sortBy === 'stock-asc' ? 'active' : ''}>
            Stok (Az-Çok)
          </button>
          <button onClick={() => { setSortBy('stock-desc'); setShowSortMenu(false); }} className={sortBy === 'stock-desc' ? 'active' : ''}>
            Stok (Çok-Az)
          </button>
          <button onClick={() => { setSortBy('newest'); setShowSortMenu(false); }} className={sortBy === 'newest' ? 'active' : ''}>
            🆕 Yeni Eklenenler
          </button>
        </div>
      )}

      {/* Bulk Mode Toggle */}
      <div className="products-toolbar-ultra">
        <div className="toolbar-left">
          <Package className="w-4 h-4" />
          <span>{filteredProducts.length} ürün</span>
        </div>
        <button
          onClick={() => {
            setBulkMode(!bulkMode);
            setSelectedProducts([]);
            hapticFeedback();
          }}
          className="bulk-toggle"
        >
          {bulkMode ? <X className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
          <span>{bulkMode ? 'İptal' : 'Çoklu Seç'}</span>
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {bulkMode && selectedProducts.length > 0 && (
        <div className="bulk-actions-bar">
          <button onClick={deselectAll} className="bulk-action-btn">
            Temizle
          </button>
          <span className="bulk-count">{selectedProducts.length} seçili</span>
          <button onClick={bulkDelete} className="bulk-action-btn delete">
            <Trash2 className="w-4 h-4" />
            Sil
          </button>
        </div>
      )}

      {/* Products List */}
      <div className="products-list-ultra">
        {isLoading ? (
          // Loading State
          <div className="loading-ultra">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="product-skeleton-ultra"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          // Empty State
          <div className="empty-state-ultra">
            <Package className="w-16 h-16" />
            <p className="empty-title-ultra">Ürün bulunamadı</p>
            <p className="empty-subtitle-ultra">
              {searchQuery ? 'Arama kriterlerinizi değiştirin' : 'Yeni ürün ekleyin'}
            </p>
            {!searchQuery && (
              <button onClick={() => navigate('/products/add')} className="empty-action-ultra">
                <Plus className="w-4 h-4" />
                Ürün Ekle/Güncelle
              </button>
            )}
          </div>
        ) : (
          // Product Items
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`product-item-ultra ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
              onTouchStart={(e) => handleTouchStart(e, product.id)}
              onTouchMove={(e) => handleTouchMove(e, product.id)}
              onTouchEnd={(e) => handleTouchEnd(e, product.id)}
              style={{ borderLeftColor: getCategoryColor(product.category) }}
            >
              {/* Main Content */}
              <div className="product-content-ultra">
                {/* Avatar */}
                <div className="product-avatar-ultra" style={{ background: getCategoryColor(product.category) }}>
                  {getInitials(product.name)}
                </div>

                {/* Info */}
                <div className="product-info-ultra">
                  <div className="product-header-row">
                    <p className="product-name-ultra">{product.name}</p>
                    {product.isFavorite && <Star className="w-4 h-4 favorite-star" fill="currentColor" />}
                  </div>
                  <p className="product-barcode-ultra">{product.barcode}</p>
                  {product.category && (
                    <span className="product-category-ultra">{product.category.name}</span>
                  )}
                </div>

                {/* Details */}
                <div className="product-details-ultra">
                  <p className="product-price-ultra">₺{product.sellPrice.toFixed(2)}</p>
                  <div className={`stock-badge-ultra ${getStockBadgeClass(product.stock)}`}>
                    {product.stock} adet
                  </div>
                </div>

                {/* Bulk Mode Checkbox */}
                {bulkMode && (
                  <div className="product-checkbox">
                    {selectedProducts.includes(product.id) ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="quick-menu-overlay" onClick={() => setEditingProduct(null)}>
          <div className="edit-modal-ultra" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>Ürün Düzenle</h3>
              <button onClick={() => setEditingProduct(null)} className="close-btn">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="edit-modal-body">
              <div className="form-group-ultra">
                <label>Ürün Adı</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Ürün adı"
                />
              </div>
              <div className="form-group-ultra">
                <label>Satış Fiyatı (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.sellPrice}
                  onChange={(e) => setEditForm({ ...editForm, sellPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group-ultra">
                <label>Stok Miktarı</label>
                <input
                  type="number"
                  value={editForm.stock}
                  onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="edit-modal-footer">
              <button onClick={() => setEditingProduct(null)} className="cancel-btn-ultra">
                İptal
              </button>
              <button onClick={saveProductEdit} className="save-btn-ultra">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Long Press Quick Menu */}
      {longPressProduct && (
        <div className="quick-menu-overlay" onClick={() => setLongPressProduct(null)}>
          <div className="quick-menu-ultra" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => handleQuickAction('edit', longPressProduct)} className="quick-menu-item">
              <Edit className="w-5 h-5" />
              <span>Düzenle</span>
            </button>
            <button onClick={() => handleQuickAction('addToPos', longPressProduct)} className="quick-menu-item">
              <ShoppingCart className="w-5 h-5" />
              <span>POS'a Ekle</span>
            </button>
            <button onClick={() => handleQuickAction('favorite', longPressProduct)} className="quick-menu-item">
              <Star className="w-5 h-5" />
              <span>Favorilere Ekle</span>
            </button>
            <button onClick={() => handleQuickAction('stock', longPressProduct)} className="quick-menu-item">
              <Package className="w-5 h-5" />
              <span>Stok Güncelle</span>
            </button>
            <button onClick={() => handleQuickAction('delete', longPressProduct)} className="quick-menu-item delete">
              <Trash2 className="w-5 h-5" />
              <span>Sil</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileProducts;

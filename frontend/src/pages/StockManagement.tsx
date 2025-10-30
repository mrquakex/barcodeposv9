import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Clock,
  Activity,
  BarChart3,
  Archive,
  ArchiveRestore,
  RefreshCw,
  Download,
  Upload,
  Filter,
  Search,
  Grid3x3,
  List,
  Plus,
  Settings,
  Edit,
  Trash2,
  Copy,
  Eye
} from 'lucide-react';
import { FluentButton } from '../components/fluent/FluentButton';
import { FluentCard } from '../components/fluent/FluentCard';
import { ContextMenu, useContextMenu, type ContextMenuItem } from '../components/ui/ContextMenu';
import api from '../services/api';

interface DashboardStats {
  totalProducts: number;
  totalValue: number;
  criticalStock: number;
  last7Days: {
    inCount: number;
    outCount: number;
  };
  avgTurnover: number;
  activeStockCounts: number;
}

const StockManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('catalog');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/stock/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const tabs = [
    { id: 'catalog', label: 'Ürün Kataloğu', icon: Package },
    { id: 'movements', label: 'Stok Hareketleri', icon: Activity },
    { id: 'count', label: 'Stok Sayımı', icon: BarChart3 },
    { id: 'transfer', label: 'Stok Transferi', icon: RefreshCw },
    { id: 'alerts', label: 'Uyarılar', icon: AlertTriangle },
    { id: 'reports', label: 'Raporlar', icon: TrendingUp },
    { id: 'bulk', label: 'Toplu İşlemler', icon: Archive }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Package className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Stok Yönetimi
          </h1>
          <p className="text-foreground-secondary mt-1">
            Tüm stok işlemlerinizi tek ekrandan yönetin
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <FluentButton
            appearance="subtle"
            icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={fetchStats}
            disabled={refreshing}
          >
            Yenile
          </FluentButton>
          <FluentButton
            appearance="subtle"
            icon={<Download className="w-4 h-4" />}
          >
            Dışa Aktar
          </FluentButton>
          <FluentButton
            appearance="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Yeni Ürün
          </FluentButton>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Toplam Ürün */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FluentCard className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary font-medium">Toplam Ürün</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats?.totalProducts.toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </FluentCard>
        </motion.div>

        {/* Toplam Değer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <FluentCard className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary font-medium">Toplam Değer</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  ₺{stats?.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </FluentCard>
        </motion.div>

        {/* Kritik Stok */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <FluentCard className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary font-medium">Kritik Stok</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats?.criticalStock}
                </p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </FluentCard>
        </motion.div>

        {/* Giriş (7 Gün) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <FluentCard className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary font-medium">Giriş (7 Gün)</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  +{stats?.last7Days.inCount.toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </FluentCard>
        </motion.div>

        {/* Çıkış (7 Gün) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FluentCard className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary font-medium">Çıkış (7 Gün)</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  -{stats?.last7Days.outCount.toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </FluentCard>
        </motion.div>

        {/* Devir Hızı */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <FluentCard className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary font-medium">Ort. Devir</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats?.avgTurnover} gün
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </FluentCard>
        </motion.div>
      </div>

      {/* Tabs */}
      <FluentCard className="overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 p-2 bg-card-hover border-b border-border overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  px-4 py-3 rounded-lg
                  flex items-center gap-2 whitespace-nowrap
                  text-sm font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-foreground-secondary hover:bg-card-hover hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'catalog' && <ProductCatalogTab />}
          {activeTab === 'movements' && <StockMovementsTab />}
          {activeTab === 'count' && <StockCountTab />}
          {activeTab === 'transfer' && <StockTransferTab />}
          {activeTab === 'alerts' && <StockAlertsTab />}
          {activeTab === 'reports' && <StockReportsTab />}
          {activeTab === 'bulk' && <BulkOperationsTab />}
        </div>
      </FluentCard>
    </div>
  );
};

// ============================================================================
// TAB 1: PRODUCT CATALOG (with Context Menu)
// ============================================================================

interface Product {
  id: string;
  barcode: string;
  name: string;
  category?: { name: string };
  stock: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  minStock: number;
  maxStock?: number;
  isActive: boolean;
}

const ProductCatalogTab = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Context Menu
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();
  const [contextProduct, setContextProduct] = useState<Product | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.categoryId = selectedCategory;

      const response = await api.get('/products', { params });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Products fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory]);

  // Context menu actions
  const handleEdit = (product: Product) => {
    console.log('Edit product:', product);
    // TODO: Open edit modal
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) {
      try {
        await api.delete(`/products/${product.id}`);
        fetchProducts();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      await api.post('/products', {
        ...product,
        id: undefined,
        barcode: `${product.barcode}-COPY`,
        name: `${product.name} (Kopya)`
      });
      fetchProducts();
    } catch (error) {
      console.error('Duplicate error:', error);
    }
  };

  const handleStockAdjustment = (product: Product, type: 'increase' | 'decrease') => {
    console.log(`Stock ${type} for:`, product);
    // TODO: Open stock adjustment modal
  };

  const handlePriceUpdate = (product: Product) => {
    console.log('Update price for:', product);
    // TODO: Open price update modal
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    // TODO: Open product details modal
  };

  // Context menu items
  const getContextMenuItems = (product: Product): ContextMenuItem[] => [
    {
      id: 'view',
      label: 'Detayları Görüntüle',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => handleViewDetails(product),
      shortcut: 'Enter'
    },
    {
      id: 'edit',
      label: 'Düzenle',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => handleEdit(product),
      shortcut: 'Ctrl+E'
    },
    { id: 'div1', label: '', divider: true },
    {
      id: 'stock',
      label: 'Stok İşlemleri',
      icon: <Package className="w-4 h-4" />,
      submenu: [
        {
          id: 'stock-increase',
          label: 'Stok Artır',
          icon: <TrendingUp className="w-4 h-4" />,
          onClick: () => handleStockAdjustment(product, 'increase')
        },
        {
          id: 'stock-decrease',
          label: 'Stok Azalt',
          icon: <TrendingDown className="w-4 h-4" />,
          onClick: () => handleStockAdjustment(product, 'decrease')
        }
      ]
    },
    {
      id: 'price',
      label: 'Fiyat Güncelle',
      icon: <DollarSign className="w-4 h-4" />,
      onClick: () => handlePriceUpdate(product)
    },
    {
      id: 'duplicate',
      label: 'Kopyala',
      icon: <Copy className="w-4 h-4" />,
      onClick: () => handleDuplicate(product),
      shortcut: 'Ctrl+D'
    },
    { id: 'div2', label: '', divider: true },
    {
      id: 'archive',
      label: product.isActive ? 'Arşivle' : 'Arşivden Çıkar',
      icon: product.isActive ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />,
      onClick: () => console.log('Archive:', product)
    },
    {
      id: 'delete',
      label: 'Sil',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => handleDelete(product),
      danger: true,
      shortcut: 'Del'
    }
  ];

  // Handle right-click on product
  const onProductRightClick = (e: React.MouseEvent, product: Product) => {
    handleContextMenu(e);
    setContextProduct(product);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Package className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters & Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-secondary" />
            <input
              type="text"
              placeholder="Ürün ara (isim, barkod)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg
                       text-foreground placeholder:text-foreground-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <FluentButton
          appearance="subtle"
          icon={<Filter className="w-4 h-4" />}
        >
          Filtreler
        </FluentButton>

        <div className="flex items-center gap-1 bg-card-hover rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'text-foreground-secondary'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-foreground-secondary'}`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products List/Grid */}
      {viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground-secondary">Barkod</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground-secondary">Ürün Adı</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground-secondary">Kategori</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-foreground-secondary">Stok</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-foreground-secondary">Alış</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-foreground-secondary">Satış</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-foreground-secondary">Durum</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <motion.tr
                  key={product.id}
                  onContextMenu={(e) => onProductRightClick(e, product)}
                  whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                  className="border-b border-border/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 text-sm font-mono text-foreground">{product.barcode}</td>
                  <td className="py-3 px-4 text-sm font-medium text-foreground">{product.name}</td>
                  <td className="py-3 px-4 text-sm text-foreground-secondary">
                    {product.category?.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    <span className={`font-semibold ${
                      product.stock <= product.minStock ? 'text-red-600' :
                      product.stock <= product.minStock * 1.5 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium text-foreground">
                    ₺{product.buyPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium text-foreground">
                    ₺{product.sellPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {product.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="text-center py-12 text-foreground-secondary">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Ürün bulunamadı</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <motion.div
              key={product.id}
              onContextMenu={(e) => onProductRightClick(e, product)}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
              className="bg-card border border-border rounded-xl p-4 cursor-pointer transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.stock <= product.minStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {product.stock} {product.unit}
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-foreground-secondary mb-3 font-mono">{product.barcode}</p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm font-medium text-foreground">₺{product.sellPrice.toFixed(2)}</span>
                <span className="text-xs text-foreground-secondary">{product.category?.name || '-'}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextProduct && (
        <ContextMenu
          items={getContextMenuItems(contextProduct)}
          position={contextMenu}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

// ============================================================================
// TAB 2: STOCK MOVEMENTS
// ============================================================================

const StockMovementsTab = () => {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const response = await api.get('/stock-movements');
        setMovements(response.data.movements || []);
      } catch (error) {
        console.error('Movements fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Activity className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline View */}
      <div className="space-y-3">
        {movements.map((movement) => (
          <motion.div
            key={movement.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow"
          >
            <div className={`p-3 rounded-lg ${
              movement.type === 'IN' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {movement.type === 'IN' ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-foreground">
                  {movement.product?.name || 'Ürün'}
                </h4>
                <span className="text-sm text-foreground-secondary">
                  {new Date(movement.createdAt).toLocaleString('tr-TR')}
                </span>
              </div>
              <p className="text-sm text-foreground-secondary">
                <span className={movement.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                  {movement.type === 'IN' ? '+' : '-'}{movement.quantity} {movement.product?.unit}
                </span>
                {movement.note && ` • ${movement.note}`}
              </p>
            </div>
          </motion.div>
        ))}

        {movements.length === 0 && (
          <div className="text-center py-12 text-foreground-secondary">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Henüz stok hareketi bulunmuyor</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TAB 3: STOCK COUNT
// ============================================================================

const StockCountTab = () => {
  const [counts, setCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await api.get('/stock-counts');
        setCounts(response.data || []);
      } catch (error) {
        console.error('Counts fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <BarChart3 className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Stok Sayımları</h3>
        <FluentButton appearance="primary" icon={<Plus className="w-4 h-4" />}>
          Yeni Sayım Başlat
        </FluentButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {counts.map((count) => (
          <FluentCard key={count.id} className="p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground">{count.name}</h4>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                count.status === 'COMPLETED' 
                  ? 'bg-green-100 text-green-800' 
                  : count.status === 'IN_PROGRESS'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {count.status === 'COMPLETED' ? 'Tamamlandı' : count.status === 'IN_PROGRESS' ? 'Devam Ediyor' : 'Beklemede'}
              </span>
            </div>
            <p className="text-sm text-foreground-secondary">
              {new Date(count.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </FluentCard>
        ))}

        {counts.length === 0 && (
          <div className="col-span-2 text-center py-12 text-foreground-secondary">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Henüz stok sayımı bulunmuyor</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TAB 4: STOCK TRANSFER
// ============================================================================

const StockTransferTab = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const response = await api.get('/stock-transfers');
        setTransfers(response.data || []);
      } catch (error) {
        console.error('Transfers fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransfers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <RefreshCw className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Şubeler Arası Transfer</h3>
        <FluentButton appearance="primary" icon={<Plus className="w-4 h-4" />}>
          Yeni Transfer
        </FluentButton>
      </div>

      <div className="space-y-3">
        {transfers.map((transfer) => (
          <motion.div
            key={transfer.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow"
          >
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">
                {transfer.fromBranch?.name} → {transfer.toBranch?.name}
              </h4>
              <p className="text-sm text-foreground-secondary">
                {transfer.product?.name} • {transfer.quantity} {transfer.product?.unit}
              </p>
            </div>
            <span className="text-sm text-foreground-secondary">
              {new Date(transfer.createdAt).toLocaleDateString('tr-TR')}
            </span>
          </motion.div>
        ))}

        {transfers.length === 0 && (
          <div className="text-center py-12 text-foreground-secondary">
            <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Henüz transfer kaydı bulunmuyor</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TAB 5: STOCK ALERTS
// ============================================================================

const StockAlertsTab = () => {
  const [alerts, setAlerts] = useState<any>({ critical: [], overStock: [], inactive: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get('/stock/alerts');
        setAlerts(response.data);
      } catch (error) {
        console.error('Alerts fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <AlertTriangle className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kritik Stok */}
      <div>
        <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Kritik Stok ({alerts.critical?.length || 0})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.critical?.map((product: any) => (
            <FluentCard key={product.id} className="p-4 border-l-4 border-red-500">
              <h4 className="font-semibold text-foreground mb-1">{product.name}</h4>
              <p className="text-sm text-foreground-secondary mb-2">{product.barcode}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-red-600">
                  {product.stock} {product.unit}
                </span>
                <span className="text-xs text-foreground-secondary">
                  Min: {product.minStock}
                </span>
              </div>
            </FluentCard>
          ))}
        </div>
      </div>

      {/* Fazla Stok */}
      <div>
        <h3 className="text-lg font-semibold text-orange-600 mb-3 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Fazla Stok ({alerts.overStock?.length || 0})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.overStock?.map((product: any) => (
            <FluentCard key={product.id} className="p-4 border-l-4 border-orange-500">
              <h4 className="font-semibold text-foreground mb-1">{product.name}</h4>
              <p className="text-sm text-foreground-secondary mb-2">{product.barcode}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-orange-600">
                  {product.stock} {product.unit}
                </span>
                <span className="text-xs text-foreground-secondary">
                  Max: {product.maxStock}
                </span>
              </div>
            </FluentCard>
          ))}
        </div>
      </div>

      {/* Hareketsiz Stok */}
      <div>
        <h3 className="text-lg font-semibold text-gray-600 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Hareketsiz Stok (60+ gün) ({alerts.inactive?.length || 0})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.inactive?.slice(0, 12).map((product: any) => (
            <FluentCard key={product.id} className="p-4 border-l-4 border-gray-500">
              <h4 className="font-semibold text-foreground mb-1">{product.name}</h4>
              <p className="text-sm text-foreground-secondary mb-2">{product.barcode}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600">
                  {product.stock} {product.unit}
                </span>
                <span className="text-xs text-foreground-secondary">
                  ₺{(product.stock * product.buyPrice).toFixed(2)}
                </span>
              </div>
            </FluentCard>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 6: STOCK REPORTS
// ============================================================================

const StockReportsTab = () => {
  const [activeReport, setActiveReport] = useState<'abc' | 'aging' | 'turnover'>('abc');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async (type: 'abc' | 'aging' | 'turnover') => {
    try {
      setLoading(true);
      setActiveReport(type);
      
      let endpoint = '';
      if (type === 'abc') endpoint = '/stock/abc-analysis';
      else if (type === 'aging') endpoint = '/stock/aging-report';
      else if (type === 'turnover') endpoint = '/stock/turnover-rate';

      const response = await api.get(endpoint);
      setReportData(response.data);
    } catch (error) {
      console.error('Report fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport('abc');
  }, []);

  return (
    <div className="space-y-6">
      {/* Report Type Selector */}
      <div className="flex items-center gap-3">
        <FluentButton
          appearance={activeReport === 'abc' ? 'primary' : 'subtle'}
          onClick={() => loadReport('abc')}
        >
          ABC Analizi
        </FluentButton>
        <FluentButton
          appearance={activeReport === 'aging' ? 'primary' : 'subtle'}
          onClick={() => loadReport('aging')}
        >
          Stok Yaşlanma
        </FluentButton>
        <FluentButton
          appearance={activeReport === 'turnover' ? 'primary' : 'subtle'}
          onClick={() => loadReport('turnover')}
        >
          Devir Hızı
        </FluentButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <BarChart3 className="w-10 h-10 text-primary" />
          </motion.div>
        </div>
      ) : (
        <>
          {/* ABC Analysis */}
          {activeReport === 'abc' && reportData?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FluentCard className="p-6 border-l-4 border-green-500">
                <h3 className="text-2xl font-bold text-green-600 mb-2">Kategori A</h3>
                <p className="text-sm text-foreground-secondary mb-3">Yüksek değerli ürünler (%80)</p>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-semibold">{reportData.summary.A.count}</span> ürün</p>
                  <p className="text-sm">₺{reportData.summary.A.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                </div>
              </FluentCard>

              <FluentCard className="p-6 border-l-4 border-yellow-500">
                <h3 className="text-2xl font-bold text-yellow-600 mb-2">Kategori B</h3>
                <p className="text-sm text-foreground-secondary mb-3">Orta değerli ürünler (%15)</p>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-semibold">{reportData.summary.B.count}</span> ürün</p>
                  <p className="text-sm">₺{reportData.summary.B.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                </div>
              </FluentCard>

              <FluentCard className="p-6 border-l-4 border-gray-500">
                <h3 className="text-2xl font-bold text-gray-600 mb-2">Kategori C</h3>
                <p className="text-sm text-foreground-secondary mb-3">Düşük değerli ürünler (%5)</p>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-semibold">{reportData.summary.C.count}</span> ürün</p>
                  <p className="text-sm">₺{reportData.summary.C.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                </div>
              </FluentCard>
            </div>
          )}

          {/* Aging Report */}
          {activeReport === 'aging' && reportData?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FluentCard className="p-6 border-l-4 border-green-500">
                <h3 className="text-xl font-bold text-green-600 mb-2">0-30 Gün</h3>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-semibold">{reportData.summary['0-30'].count}</span> ürün</p>
                  <p className="text-sm">₺{reportData.summary['0-30'].value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                </div>
              </FluentCard>

              <FluentCard className="p-6 border-l-4 border-yellow-500">
                <h3 className="text-xl font-bold text-yellow-600 mb-2">31-60 Gün</h3>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-semibold">{reportData.summary['31-60'].count}</span> ürün</p>
                  <p className="text-sm">₺{reportData.summary['31-60'].value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                </div>
              </FluentCard>

              <FluentCard className="p-6 border-l-4 border-orange-500">
                <h3 className="text-xl font-bold text-orange-600 mb-2">61-90 Gün</h3>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-semibold">{reportData.summary['61-90'].count}</span> ürün</p>
                  <p className="text-sm">₺{reportData.summary['61-90'].value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                </div>
              </FluentCard>

              <FluentCard className="p-6 border-l-4 border-red-500">
                <h3 className="text-xl font-bold text-red-600 mb-2">90+ Gün</h3>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-semibold">{reportData.summary['90+'].count}</span> ürün</p>
                  <p className="text-sm">₺{reportData.summary['90+'].value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                </div>
              </FluentCard>
            </div>
          )}

          {/* Turnover Rate */}
          {activeReport === 'turnover' && reportData?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FluentCard className="p-6 border-l-4 border-green-500">
                <h3 className="text-2xl font-bold text-green-600 mb-2">Hızlı Devir</h3>
                <p className="text-sm text-foreground-secondary mb-3">60+ gün/yıl</p>
                <p className="text-lg font-semibold">{reportData.summary.fast} ürün</p>
              </FluentCard>

              <FluentCard className="p-6 border-l-4 border-yellow-500">
                <h3 className="text-2xl font-bold text-yellow-600 mb-2">Orta Devir</h3>
                <p className="text-sm text-foreground-secondary mb-3">30-60 gün/yıl</p>
                <p className="text-lg font-semibold">{reportData.summary.medium} ürün</p>
              </FluentCard>

              <FluentCard className="p-6 border-l-4 border-red-500">
                <h3 className="text-2xl font-bold text-red-600 mb-2">Yavaş Devir</h3>
                <p className="text-sm text-foreground-secondary mb-3">{'<'}30 gün/yıl</p>
                <p className="text-lg font-semibold">{reportData.summary.slow} ürün</p>
              </FluentCard>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// TAB 7: BULK OPERATIONS
// ============================================================================

const BulkOperationsTab = () => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/stock/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert(`✅ İçe aktarma tamamlandı!\n\nYeni: ${response.data.imported}\nGüncellenen: ${response.data.updated}`);
    } catch (error: any) {
      alert(`❌ Hata: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExcelExport = async () => {
    try {
      const response = await api.get('/stock/export-excel', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `urunler-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('❌ Dışa aktarma başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel Import */}
        <FluentCard className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Upload className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">Excel İçe Aktarma</h3>
              <p className="text-sm text-foreground-secondary">
                Excel dosyasından toplu ürün ekleyin veya güncelleyin
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelImport}
            className="hidden"
          />

          <FluentButton
            appearance="primary"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
            className="w-full"
          >
            {uploading ? 'Yükleniyor...' : 'Excel Dosyası Seç'}
          </FluentButton>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              💡 Excel dosyanızda şu sütunlar olmalı: barkod, name, stock, buyPrice, sellPrice, minStock
            </p>
          </div>
        </FluentCard>

        {/* Excel Export */}
        <FluentCard className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">Excel Dışa Aktarma</h3>
              <p className="text-sm text-foreground-secondary">
                Tüm ürünleri Excel dosyası olarak indirin
              </p>
            </div>
          </div>

          <FluentButton
            appearance="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExcelExport}
            className="w-full"
          >
            Excel Olarak İndir
          </FluentButton>
        </FluentCard>
      </div>

      {/* Bulk Price Update */}
      <FluentCard className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">Toplu Fiyat Güncelleme</h3>
            <p className="text-sm text-foreground-secondary">
              Kategori bazlı veya tüm ürünlerin fiyatlarını güncelleyin
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="px-4 py-2 bg-card border border-border rounded-lg text-foreground">
            <option>Tüm Kategoriler</option>
          </select>

          <select className="px-4 py-2 bg-card border border-border rounded-lg text-foreground">
            <option>Artır</option>
            <option>Azalt</option>
            <option>Sabit Değer</option>
          </select>

          <input
            type="number"
            placeholder="Değer (%)"
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          />
        </div>

        <FluentButton
          appearance="primary"
          className="w-full mt-4"
        >
          Fiyatları Güncelle
        </FluentButton>
      </FluentCard>
    </div>
  );
};

export default StockManagement;

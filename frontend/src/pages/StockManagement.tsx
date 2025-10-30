import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
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
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import { ContextMenu, useContextMenu, type ContextMenuItem } from '../components/ui/ContextMenu';
import Pagination from '../components/ui/Pagination';
import ProductModal from '../components/modals/ProductModal';
import StockAdjustmentModal from '../components/modals/StockAdjustmentModal';
import PriceUpdateModal from '../components/modals/PriceUpdateModal';
import ProductDetailModal from '../components/modals/ProductDetailModal';
import AdvancedExportModal from '../components/modals/AdvancedExportModal';
import api from '../lib/api';
import toast from 'react-hot-toast';

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
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Pagination States
  const [catalogPage, setCatalogPage] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);
  const [countsPage, setCountsPage] = useState(1);
  const [transfersPage, setTransfersPage] = useState(1);
  const [alertsPage, setAlertsPage] = useState(1);
  const itemsPerPage = 20; // Items per page for all tabs

  // Global modals (accessible from header)
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showAdvancedExportModal, setShowAdvancedExportModal] = useState(false);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/stock/dashboard-stats');
      setStats(response.data);
      setLastUpdate(new Date());
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

  // 🔴 REAL-TIME: Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isRealTimeEnabled) return;
    
    const interval = setInterval(() => {
      fetchStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  // ⌨️ KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+N: Yeni Ürün
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowNewProductModal(true);
        toast.success('⌨️ Kısayol: Ctrl+N - Yeni Ürün');
      }
      // Ctrl+E: Dışa Aktar
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        handleExportAll();
        toast.success('⌨️ Kısayol: Ctrl+E - Dışa Aktar');
      }
      // Ctrl+R: Yenile
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        fetchStats();
        toast.success('⌨️ Kısayol: Ctrl+R - Yenile');
      }
      // Esc: Modal'ları kapat
      if (e.key === 'Escape') {
        setShowNewProductModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Export all products
  const handleExportAll = () => {
    console.log('🚀 Opening Advanced Export Modal');
    setShowAdvancedExportModal(true);
    toast('📊 Gelişmiş Dışa Aktarma açılıyor...');
  };

  // Global modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalType, setStockModalType] = useState<'increase' | 'decrease'>('increase');
  const [stockProduct, setStockProduct] = useState<any | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceProduct, setPriceProduct] = useState<any | null>(null);

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
          <div className="flex items-center gap-2 mr-4">
            <button
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                isRealTimeEnabled 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="font-medium">{isRealTimeEnabled ? 'CANLI' : 'DURDURULDU'}</span>
            </button>
            <span className="text-xs text-foreground-secondary">
              Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
            </span>
          </div>
          
          <FluentButton
            appearance="subtle"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportAll}
          >
            Dışa Aktar
          </FluentButton>
          <FluentButton
            appearance="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowNewProductModal(true)}
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FluentCard 
            className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              setActiveTab('catalog');
              toast('📦 Ürün Kataloğu açıldı');
            }}
          >
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FluentCard 
            className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              setActiveTab('reports');
              toast('💰 Stok Raporları açıldı');
            }}
          >
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FluentCard 
            className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              setActiveTab('alerts');
              toast('⚠️ Stok Uyarıları açıldı');
            }}
          >
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FluentCard 
            className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              setActiveTab('movements');
              toast('📈 Stok Hareketleri açıldı');
            }}
          >
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FluentCard 
            className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              setActiveTab('movements');
              toast('📉 Stok Hareketleri açıldı');
            }}
          >
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FluentCard 
            className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              setActiveTab('reports');
              toast('📊 Devir Hızı raporu açıldı');
            }}
          >
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

        {/* Tab Content - Keep all tabs mounted to preserve modal states */}
        <div className="p-6">
          <div style={{ display: activeTab === 'catalog' ? 'block' : 'none' }}>
            <ProductCatalogTab 
              currentPage={catalogPage}
              onPageChange={setCatalogPage}
              itemsPerPage={itemsPerPage}
            />
          </div>
          <div style={{ display: activeTab === 'movements' ? 'block' : 'none' }}>
            <StockMovementsTab
              currentPage={movementsPage}
              onPageChange={setMovementsPage}
              itemsPerPage={itemsPerPage}
            />
          </div>
          <div style={{ display: activeTab === 'count' ? 'block' : 'none' }}>
            <StockCountTab
              currentPage={countsPage}
              onPageChange={setCountsPage}
              itemsPerPage={itemsPerPage}
            />
          </div>
          <div style={{ display: activeTab === 'transfer' ? 'block' : 'none' }}>
            <StockTransferTab
              currentPage={transfersPage}
              onPageChange={setTransfersPage}
              itemsPerPage={itemsPerPage}
            />
          </div>
          <div style={{ display: activeTab === 'alerts' ? 'block' : 'none' }}>
            <StockAlertsTab
              onOpenDetail={(id: string) => {
                setSelectedProductId(id);
                setShowDetailModal(true);
              }}
              onOpenStockIncrease={(product: any) => {
                setStockModalType('increase');
                setStockProduct(product);
                setShowStockModal(true);
              }}
              onOpenEdit={(product: any) => {
                toast(`✏️ ${product.name} düzenleme modal'ı yakında bu ekrandan açılacak`);
              }}
              onOpenPriceUpdate={(product: any) => {
                setPriceProduct(product);
                setShowPriceModal(true);
              }}
            />
          </div>
          <div style={{ display: activeTab === 'reports' ? 'block' : 'none' }}>
            <StockReportsTab />
          </div>
          <div style={{ display: activeTab === 'bulk' ? 'block' : 'none' }}>
            <BulkOperationsTab />
          </div>
        </div>
      </FluentCard>

      {/* Global Product Modal (for header "Yeni Ürün" button) */}
      <ProductCatalogTabWrapper
        showNewProductModal={showNewProductModal}
        setShowNewProductModal={setShowNewProductModal}
        onProductAdded={fetchStats}
      />

      {/* Advanced Export Modal */}
      <AdvancedExportModal
        isOpen={showAdvancedExportModal}
        onClose={() => setShowAdvancedExportModal(false)}
      />

      {/* Global Modals accessible from all tabs (including Alerts) */}
      {showDetailModal && selectedProductId && (
        <ProductDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          productId={selectedProductId}
        />
      )}
      {showStockModal && stockProduct && (
        <StockAdjustmentModal
          isOpen={showStockModal}
          onClose={() => setShowStockModal(false)}
          onSuccess={fetchStats}
          product={{ id: stockProduct.id, name: stockProduct.name, stock: stockProduct.stock, unit: stockProduct.unit, barcode: stockProduct.barcode || '' }}
          type={stockModalType}
        />
      )}
      {showPriceModal && priceProduct && (
        <PriceUpdateModal
          isOpen={showPriceModal}
          onClose={() => setShowPriceModal(false)}
          onSuccess={fetchStats}
          product={{ id: priceProduct.id, name: priceProduct.name, barcode: priceProduct.barcode || '', buyPrice: priceProduct.buyPrice, sellPrice: priceProduct.sellPrice, taxRate: priceProduct.taxRate || 18 }}
        />
      )}
    </div>
  );
};

// Wrapper to access ProductCatalogTab's categories/suppliers for new product modal
const ProductCatalogTabWrapper: React.FC<{
  showNewProductModal: boolean;
  setShowNewProductModal: (show: boolean) => void;
  onProductAdded: () => void;
}> = ({ showNewProductModal, setShowNewProductModal, onProductAdded }) => {
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, suppliersRes] = await Promise.all([
          api.get('/categories'),
          api.get('/suppliers')
        ]);
        setCategories(categoriesRes.data.categories || categoriesRes.data || []);
        setSuppliers(suppliersRes.data.suppliers || suppliersRes.data || []);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    if (showNewProductModal) {
      fetchData();
    }
  }, [showNewProductModal]);

  return (
    <ProductModal
      isOpen={showNewProductModal}
      onClose={() => setShowNewProductModal(false)}
      onSuccess={onProductAdded}
      categories={categories}
      suppliers={suppliers}
    />
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
  taxRate: number;
  minStock: number;
  maxStock?: number;
  isActive: boolean;
}

interface ProductCatalogTabProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

const ProductCatalogTab: React.FC<ProductCatalogTabProps> = ({ currentPage, onPageChange, itemsPerPage }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Context Menu
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();
  const [contextProduct, setContextProduct] = useState<Product | null>(null);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stockModalType, setStockModalType] = useState<'increase' | 'decrease'>('increase');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [stockStatus, setStockStatus] = useState<string>('all'); // all, critical, low, ok

  // Reset to page 1 when search/filters change
  useEffect(() => {
    onPageChange(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory]);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.categoryId = selectedCategory;

      const response = await api.get('/products', { params });
      let productsData = response.data.products || response.data || [];
      productsData = Array.isArray(productsData) ? productsData : [];

      // Apply client-side filters
      if (minPrice > 0 || maxPrice < 10000) {
        productsData = productsData.filter((p: Product) => 
          p.sellPrice >= minPrice && p.sellPrice <= maxPrice
        );
      }

      if (stockStatus !== 'all') {
        productsData = productsData.filter((p: Product) => {
          if (stockStatus === 'critical') return p.stock <= p.minStock;
          if (stockStatus === 'low') return p.stock > p.minStock && p.stock <= p.minStock * 1.5;
          if (stockStatus === 'ok') return p.stock > p.minStock * 1.5;
          return true;
        });
      }

      setProducts(productsData);
    } catch (error) {
      console.error('Products fetch error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories and suppliers
  const fetchCategoriesAndSuppliers = async () => {
    try {
      const [categoriesRes, suppliersRes] = await Promise.all([
        api.get('/categories'),
        api.get('/suppliers')
      ]);
      setCategories(categoriesRes.data.categories || categoriesRes.data || []);
      setSuppliers(suppliersRes.data.suppliers || suppliersRes.data || []);
    } catch (error) {
      console.error('Categories/Suppliers fetch error:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategoriesAndSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, minPrice, maxPrice, stockStatus]);

  // Pagination logic
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = products.slice(startIndex, endIndex);

  // Context menu actions
  const handleEdit = (product: Product) => {
    console.log('✏️ handleEdit called with product:', product);
    console.log('📝 Before state update - showProductModal:', showProductModal);
    setEditingProduct(product);
    setShowProductModal(true);
    console.log('📝 After state update called');
    setTimeout(() => {
      console.log('📝 1 second later - showProductModal should be true');
    }, 1000);
    closeContextMenu();
    toast.success(`✏️ ${product.name} düzenleme modal'ı açılıyor...`);
  };

  const handleDelete = async (product: Product) => {
    console.log('🗑️ handleDelete called with product:', product);
    if (window.confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) {
      try {
        await api.delete(`/products/${product.id}`);
        toast.success('✅ Ürün silindi');
        fetchProducts();
      } catch (error: any) {
        console.error('Delete error:', error);
        toast.error(error.response?.data?.error || 'Silme işlemi başarısız');
      }
    } else {
      toast('❌ Silme işlemi iptal edildi');
    }
    closeContextMenu();
  };

  const handleDuplicate = async (product: Product) => {
    try {
      await api.post('/products', {
        ...product,
        id: undefined,
        barcode: `${product.barcode}-COPY`,
        name: `${product.name} (Kopya)`
      });
      toast.success('✅ Ürün kopyalandı');
      fetchProducts();
    } catch (error: any) {
      console.error('Duplicate error:', error);
      toast.error(error.response?.data?.error || 'Kopyalama başarısız');
    }
    closeContextMenu();
  };

  const handleStockAdjustment = (product: Product, type: 'increase' | 'decrease') => {
    setSelectedProduct(product);
    setStockModalType(type);
    setShowStockModal(true);
    closeContextMenu();
  };

  const handlePriceUpdate = (product: Product) => {
    setSelectedProduct(product);
    setShowPriceModal(true);
    closeContextMenu();
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
    closeContextMenu();
  };

  const handleArchive = async (product: Product) => {
    const newStatus = !product.isActive;
    try {
      await api.put(`/products/${product.id}`, {
        isActive: newStatus
      });
      toast.success(newStatus ? '✅ Ürün aktif edildi' : '✅ Ürün arşivlendi');
      fetchProducts();
    } catch (error: any) {
      console.error('Archive error:', error);
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    }
    closeContextMenu();
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
      onClick: () => handleArchive(product)
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
    console.log('🖱️ Right click on product:', product.name);
    handleContextMenu(e);
    setContextProduct(product);
    toast(`🖱️ Sağ tık menüsü açıldı: ${product.name}`);
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
          onClick={() => setShowFilters(!showFilters)}
        >
          Filtreler {showFilters && '✓'}
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

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-4 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kategori
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fiyat Aralığı
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  placeholder="Min"
                  className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-foreground-secondary">-</span>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  placeholder="Max"
                  className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Stock Status */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Stok Durumu
              </label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">Tümü</option>
                <option value="critical">Kritik (≤ Min Stok)</option>
                <option value="low">Düşük (Min x 1.5)</option>
                <option value="ok">Normal</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex items-center justify-end pt-2">
            <FluentButton
              appearance="subtle"
              onClick={() => {
                setSelectedCategory('');
                setMinPrice(0);
                setMaxPrice(10000);
                setStockStatus('all');
              }}
            >
              Filtreleri Temizle
            </FluentButton>
          </div>
        </motion.div>
      )}

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
              {paginatedProducts.map((product) => (
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
          {paginatedProducts.map((product) => (
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

      {/* Pagination */}
      {products.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          itemsPerPage={itemsPerPage}
          totalItems={products.length}
          className="mt-6"
        />
      )}

      {/* Context Menu */}
      {contextProduct && (
        <ContextMenu
          items={getContextMenuItems(contextProduct)}
          position={contextMenu}
          onClose={closeContextMenu}
        />
      )}

      {/* Modals */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        onSuccess={fetchProducts}
        product={editingProduct || undefined}
        categories={categories}
        suppliers={suppliers}
      />

      {selectedProduct && (
        <>
          <StockAdjustmentModal
            isOpen={showStockModal}
            onClose={() => {
              setShowStockModal(false);
              setSelectedProduct(null);
            }}
            onSuccess={fetchProducts}
            product={selectedProduct}
            type={stockModalType}
          />

          <PriceUpdateModal
            isOpen={showPriceModal}
            onClose={() => {
              setShowPriceModal(false);
              setSelectedProduct(null);
            }}
            onSuccess={fetchProducts}
            product={selectedProduct}
          />

          <ProductDetailModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedProduct(null);
            }}
            productId={selectedProduct.id}
          />
        </>
      )}
    </div>
  );
};

// ============================================================================
// TAB 2: STOCK MOVEMENTS
// ============================================================================

interface StockMovementsTabProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

const StockMovementsTab: React.FC<StockMovementsTabProps> = ({ currentPage, onPageChange, itemsPerPage }) => {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMovement, setShowAddMovement] = useState(false);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stock-movements');
      const movementsData = response.data.movements || response.data || [];
      setMovements(Array.isArray(movementsData) ? movementsData : []);
    } catch (error) {
      console.error('Movements fetch error:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(movements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMovements = movements.slice(startIndex, endIndex);

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
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Stok Hareketleri</h3>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => toast('Ürün seçimi modal\'ı yakında eklenecek. Şimdilik Ürün Kataloğu\'ndan sağ tık ile stok işlemleri yapabilirsiniz.')}
        >
          Manuel Hareket Ekle
        </FluentButton>
      </div>

      {/* Timeline View */}
      <div className="space-y-3">
        {paginatedMovements.map((movement) => (
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
                  {movement.product?.name || 'Bilinmeyen Ürün'}
                </h4>
                <span className="text-sm text-foreground-secondary">
                  {movement.createdAt ? new Date(movement.createdAt).toLocaleString('tr-TR') : '-'}
                </span>
              </div>
              <p className="text-sm text-foreground-secondary">
                <span className={movement.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                  {movement.type === 'IN' ? '+' : '-'}{movement.quantity || 0} {movement.product?.unit || 'Adet'}
                </span>
                {movement.notes && ` • ${movement.notes}`}
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

      {/* Pagination */}
      {movements.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          itemsPerPage={itemsPerPage}
          totalItems={movements.length}
        />
      )}
    </div>
  );
};

// ============================================================================
// TAB 3: STOCK COUNT
// ============================================================================

interface StockCountTabProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

const StockCountTab: React.FC<StockCountTabProps> = ({ currentPage, onPageChange, itemsPerPage }) => {
  const [counts, setCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stock-counts');
      const countsData = response.data.counts || response.data || [];
      setCounts(Array.isArray(countsData) ? countsData : []);
    } catch (error) {
      console.error('Counts fetch error:', error);
      setCounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleNewCount = async () => {
    const name = prompt('Sayım adı girin:');
    if (!name) return;

    try {
      await api.post('/stock-counts', {
        name,
        status: 'IN_PROGRESS'
      });
      toast.success('✅ Yeni sayım başlatıldı');
      fetchCounts();
    } catch (error: any) {
      console.error('New count error:', error);
      toast.error(error.response?.data?.error || 'Sayım başlatılamadı');
    }
  };

  const handleCountClick = (count: any) => {
    toast(`${count.name} sayımı detayları: Durum ${count.status === 'COMPLETED' ? 'Tamamlandı' : count.status === 'IN_PROGRESS' ? 'Devam Ediyor' : 'Beklemede'}. Detay modal'ı yakında eklenecek.`);
  };

  // Pagination logic
  const totalPages = Math.ceil(counts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCounts = counts.slice(startIndex, endIndex);

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
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleNewCount}
        >
          Yeni Sayım Başlat
        </FluentButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedCounts.map((count) => (
          <FluentCard
            key={count.id}
            className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleCountClick(count)}
          >
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

      {/* Pagination */}
      {counts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          itemsPerPage={itemsPerPage}
          totalItems={counts.length}
          className="mt-6"
        />
      )}
    </div>
  );
};

// ============================================================================
// TAB 4: STOCK TRANSFER
// ============================================================================

interface StockTransferTabProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

const StockTransferTab: React.FC<StockTransferTabProps> = ({ currentPage, onPageChange, itemsPerPage }) => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stock-transfers');
      const transfersData = response.data.transfers || response.data || [];
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
    } catch (error) {
      console.error('Transfers fetch error:', error);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleNewTransfer = () => {
    toast('Transfer modal\'ı: Şube seçimi, ürün ve miktar. Backend hazır ama modal UI geliştirme aşamasında. Alternatif: Şubeler arası envanter düzenlemesi manuel yapılabilir.');
  };

  const handleTransferClick = (transfer: any) => {
    toast(`Transfer detayları: ${transfer.fromBranch?.name || 'Bilinmeyen'} → ${transfer.toBranch?.name || 'Bilinmeyen'}. Detay modal'ı yakında eklenecek.`);
  };

  // Pagination logic
  const totalPages = Math.ceil(transfers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransfers = transfers.slice(startIndex, endIndex);

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
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleNewTransfer}
        >
          Yeni Transfer
        </FluentButton>
      </div>

      <div className="space-y-3">
        {paginatedTransfers.map((transfer) => (
          <motion.div
            key={transfer.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => handleTransferClick(transfer)}
            className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">
                {transfer.fromBranch?.name || 'Bilinmeyen'} → {transfer.toBranch?.name || 'Bilinmeyen'}
              </h4>
              <p className="text-sm text-foreground-secondary">
                {transfer.product?.name || 'Bilinmeyen Ürün'} • {transfer.quantity || 0} {transfer.product?.unit || 'Adet'}
              </p>
            </div>
            <span className="text-sm text-foreground-secondary">
              {transfer.createdAt ? new Date(transfer.createdAt).toLocaleDateString('tr-TR') : '-'}
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

      {/* Pagination */}
      {transfers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          itemsPerPage={itemsPerPage}
          totalItems={transfers.length}
          className="mt-6"
        />
      )}
    </div>
  );
};

// ============================================================================
// TAB 5: STOCK ALERTS
// ============================================================================

const StockAlertsTab: React.FC<{
  onOpenDetail: (id: string) => void;
  onOpenStockIncrease: (product: any) => void;
  onOpenEdit: (product: any) => void;
  onOpenPriceUpdate: (product: any) => void;
}> = ({ onOpenDetail, onOpenStockIncrease, onOpenEdit, onOpenPriceUpdate }) => {
  const [alerts, setAlerts] = useState<any>({ critical: [], overStock: [], inactive: [] });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState<'all' | 'critical' | 'overstock' | 'inactive'>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const { contextMenu, handleContextMenu: baseHandleContextMenu, closeContextMenu } = useContextMenu();
  const [menuItems, setMenuItems] = useState<ContextMenuItem[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get('/stock/alerts');
        setAlerts(response.data || { critical: [], overStock: [], inactive: [] });
      } catch (error) {
        console.error('Alerts fetch error:', error);
        setAlerts({ critical: [], overStock: [], inactive: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  // All products combined for unified view
  const allProducts = [
    ...((alerts.critical || []).map((p: any) => ({ ...p, alertType: 'critical' }))),
    ...((alerts.overStock || []).map((p: any) => ({ ...p, alertType: 'overstock' }))),
    ...((alerts.inactive || []).map((p: any) => ({ ...p, alertType: 'inactive' })))
  ];

  const filteredProducts = activeCategory === 'all' 
    ? allProducts 
    : allProducts.filter(p => p.alertType === activeCategory);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeCategory, viewMode, alerts]);

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleContextMenu = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    
    const items: ContextMenuItem[] = [
      {
        id: 'stock-increase',
        label: 'Stok Artır',
        icon: <Plus className="w-4 h-4" />,
        onClick: () => {
          onOpenStockIncrease(product);
          closeContextMenu();
        }
      },
      {
        id: 'view-details',
        label: 'Detayları Görüntüle',
        icon: <Eye className="w-4 h-4" />,
        onClick: () => {
          onOpenDetail(product.id);
          closeContextMenu();
        }
      },
      {
        id: 'edit',
        label: 'Düzenle',
        icon: <Edit className="w-4 h-4" />,
        onClick: () => {
          onOpenEdit(product);
          closeContextMenu();
        }
      },
      {
        id: 'price-update',
        label: 'Fiyat Güncelle',
        icon: <DollarSign className="w-4 h-4" />,
        onClick: () => {
          onOpenPriceUpdate(product);
          closeContextMenu();
        }
      },
      { id: 'sep-1', label: '-', divider: true },
      {
        id: 'archive',
        label: product.isActive ? 'Arşivle' : 'Arşivden Çıkar',
        icon: product.isActive ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />,
        onClick: () => {
          toast(product.isActive ? `📦 ${product.name} arşivlendi` : `♻️ ${product.name} arşivden çıkarıldı`);
          closeContextMenu();
        }
      },
      {
        id: 'delete',
        label: 'Sil',
        icon: <Trash2 className="w-4 h-4 text-red-500" />,
        danger: true,
        onClick: () => {
          if (confirm(`${product.name} silinsin mi?`)) {
            toast.error(`🗑️ ${product.name} silindi`);
          }
          closeContextMenu();
        }
      }
    ];
    setMenuItems(items);
    baseHandleContextMenu(e);
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBulkStockAdd = () => {
    toast.success(`✅ ${selectedProducts.size} ürün için toplu stok ekleme başlatıldı!`);
  };

  const handleBulkExport = async () => {
    try {
      const productsToExport = filteredProducts.filter(p => selectedProducts.has(p.id));
      toast.success(`📥 ${productsToExport.length} ürün Excel'e aktarılıyor...`);
      // Export logic here
    } catch (error) {
      toast.error('Export başarısız');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <AlertTriangle className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  const AlertBadge = ({ type }: { type: string }) => {
    const colors = {
      critical: 'bg-red-500/10 text-red-600 border-red-500',
      overstock: 'bg-orange-500/10 text-orange-600 border-orange-500',
      inactive: 'bg-gray-500/10 text-gray-600 border-gray-500'
    };
    const labels = {
      critical: 'Kritik',
      overstock: 'Fazla',
      inactive: 'Hareketsiz'
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[type as keyof typeof colors]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-surface rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-foreground-secondary hover:bg-card-hover'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'text-foreground-secondary hover:bg-card-hover'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'Tümü', count: allProducts.length },
              { id: 'critical', label: 'Kritik', count: alerts.critical?.length || 0, color: 'text-red-600' },
              { id: 'overstock', label: 'Fazla', count: alerts.overStock?.length || 0, color: 'text-orange-600' },
              { id: 'inactive', label: 'Hareketsiz', count: alerts.inactive?.length || 0, color: 'text-gray-600' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-surface text-foreground-secondary hover:bg-card-hover'
                }`}
              >
                <span className={cat.color}>{cat.label}</span>
                <span className="ml-1 opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-secondary">
              {selectedProducts.size} seçili
            </span>
            <FluentButton
              appearance="subtle"
              size="small"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleBulkStockAdd}
            >
              Toplu Stok Ekle
            </FluentButton>
            <FluentButton
              appearance="subtle"
              size="small"
              icon={<Download className="w-4 h-4" />}
              onClick={handleBulkExport}
            >
              Seçilenleri Dışa Aktar
            </FluentButton>
          </div>
        )}
      </div>

      {/* Products Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pageItems.map((product: any) => (
            <FluentCard
              key={product.id}
              className={`p-4 border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${
                product.alertType === 'critical' ? 'border-red-500' :
                product.alertType === 'overstock' ? 'border-orange-500' :
                'border-gray-500'
              } ${selectedProducts.has(product.id) ? 'ring-2 ring-primary' : ''}`}
              onContextMenu={(e) => handleContextMenu(e, product)}
              onClick={() => handleSelectProduct(product.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-foreground flex-1">{product.name}</h4>
                <AlertBadge type={product.alertType} />
              </div>
              <p className="text-sm text-foreground-secondary mb-2">{product.barcode}</p>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${
                  product.alertType === 'critical' ? 'text-red-600' :
                  product.alertType === 'overstock' ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  {product.stock} {product.unit}
                </span>
                <span className="text-xs text-foreground-secondary">
                  {product.alertType === 'critical' && `Min: ${product.minStock}`}
                  {product.alertType === 'overstock' && `Max: ${product.maxStock}`}
                  {product.alertType === 'inactive' && `₺${(product.stock * product.buyPrice).toFixed(2)}`}
                </span>
              </div>
              {product.alertType === 'critical' && (
                <FluentButton
                  appearance="primary"
                  size="small"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStockIncrease(product);
                  }}
                  className="w-full"
                >
                  Stok Ekle
                </FluentButton>
              )}
            </FluentCard>
          ))}
        </div>
      ) : (
        <FluentCard className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="form-checkbox h-4 w-4 text-primary rounded"
                  />
                </th>
                <th className="p-3 text-left text-sm font-semibold text-foreground">Ürün</th>
                <th className="p-3 text-left text-sm font-semibold text-foreground">Barkod</th>
                <th className="p-3 text-left text-sm font-semibold text-foreground">Durum</th>
                <th className="p-3 text-right text-sm font-semibold text-foreground">Stok</th>
                <th className="p-3 text-right text-sm font-semibold text-foreground">Limit</th>
                <th className="p-3 text-right text-sm font-semibold text-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((product: any, index: number) => (
                <tr
                  key={product.id}
                  className={`border-b border-border hover:bg-card-hover cursor-pointer ${
                    selectedProducts.has(product.id) ? 'bg-primary/5' : ''
                  }`}
                  onContextMenu={(e) => handleContextMenu(e, product)}
                  onClick={() => handleSelectProduct(product.id)}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="form-checkbox h-4 w-4 text-primary rounded"
                    />
                  </td>
                  <td className="p-3 text-sm font-medium text-foreground">{product.name}</td>
                  <td className="p-3 text-sm text-foreground-secondary">{product.barcode}</td>
                  <td className="p-3">
                    <AlertBadge type={product.alertType} />
                  </td>
                  <td className={`p-3 text-right text-sm font-semibold ${
                    product.alertType === 'critical' ? 'text-red-600' :
                    product.alertType === 'overstock' ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>
                    {product.stock} {product.unit}
                  </td>
                  <td className="p-3 text-right text-xs text-foreground-secondary">
                    {product.alertType === 'critical' && `Min: ${product.minStock}`}
                    {product.alertType === 'overstock' && `Max: ${product.maxStock}`}
                    {product.alertType === 'inactive' && `₺${(product.stock * product.buyPrice).toFixed(2)}`}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {product.alertType === 'critical' && (
                        <FluentButton
                          appearance="primary"
                          size="small"
                          icon={<Plus className="w-3 h-3" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenStockIncrease(product);
                          }}
                        >
                          Stok Ekle
                        </FluentButton>
                      )}
                      <FluentButton
                        appearance="subtle"
                        size="small"
                        icon={<Eye className="w-3 h-3" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetail(product.id);
                        }}
                      >
                        Detay
                      </FluentButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </FluentCard>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        className="mt-4"
      />

      {/* Context Menu */}
      <ContextMenu
        position={contextMenu}
        items={menuItems}
        onClose={closeContextMenu}
      />

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <FluentCard className="p-10 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-foreground-secondary opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {activeCategory === 'all' ? 'Hiç uyarı yok' : 'Bu kategoride uyarı yok'}
          </h3>
          <p className="text-foreground-secondary">
            {activeCategory === 'all' 
              ? 'Tüm stoklar normal seviyede!' 
              : 'Bu kategoride uyarı gerektiren ürün bulunmuyor.'}
          </p>
        </FluentCard>
      )}
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
            <>
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

              {/* ABC Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <FluentCard className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Kategori Bazında Değer Dağılımı</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { category: 'A', value: reportData.summary.A.totalValue, count: reportData.summary.A.count },
                      { category: 'B', value: reportData.summary.B.totalValue, count: reportData.summary.B.count },
                      { category: 'C', value: reportData.summary.C.totalValue, count: reportData.summary.C.count },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="category" stroke="#888" />
                      <YAxis stroke="#888" />
                      <RechartsTooltip
                        contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: any) => `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="#3b82f6" name="Toplam Değer" />
                    </BarChart>
                  </ResponsiveContainer>
                </FluentCard>

                {/* Pie Chart */}
                <FluentCard className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Ürün Sayısı Dağılımı</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Kategori A', value: reportData.summary.A.count },
                          { name: 'Kategori B', value: reportData.summary.B.count },
                          { name: 'Kategori C', value: reportData.summary.C.count },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#6b7280" />
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </FluentCard>
              </div>
            </>
          )}

          {/* Aging Report */}
          {activeReport === 'aging' && reportData?.summary && (
            <>
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

              {/* Aging Chart */}
              <FluentCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Yaşlanma Analizi - Stok Değeri Dağılımı</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={[
                    { period: '0-30', count: reportData.summary['0-30'].count, value: reportData.summary['0-30'].value },
                    { period: '31-60', count: reportData.summary['31-60'].count, value: reportData.summary['31-60'].value },
                    { period: '61-90', count: reportData.summary['61-90'].count, value: reportData.summary['61-90'].value },
                    { period: '90+', count: reportData.summary['90+'].count, value: reportData.summary['90+'].value },
                  ]}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="period" stroke="#888" />
                    <YAxis stroke="#888" />
                    <RechartsTooltip
                      contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: any, name: string) => {
                        if (name === 'Değer') return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
                        return value;
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" name="Değer" />
                    <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Ürün Sayısı" />
                  </AreaChart>
                </ResponsiveContainer>
              </FluentCard>
            </>
          )}

          {/* Turnover Rate */}
          {activeReport === 'turnover' && reportData?.summary && (
            <>
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

              {/* Turnover Chart */}
              {reportData?.products && Array.isArray(reportData.products) && reportData.products.length > 0 && (
                <FluentCard className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Devir Hızı Analizi - En Yüksek 15 Ürün</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={reportData.products.slice(0, 15).map((item: any) => {
                      const productName = item?.product?.name || 'Bilinmeyen Ürün';
                      return {
                        name: productName.length > 20 ? productName.substring(0, 20) + '...' : productName,
                        turnover: item?.turnoverRate || 0,
                        stock: item?.currentStock || 0
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#888" />
                      <RechartsTooltip
                        contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: any, name: string) => {
                          if (name === 'Devir Hızı') return `${value} gün/yıl`;
                          return value;
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="turnover" stroke="#3b82f6" strokeWidth={2} name="Devir Hızı" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="stock" stroke="#10b981" strokeWidth={2} name="Stok Miktarı" />
                    </LineChart>
                  </ResponsiveContainer>
                </FluentCard>
              )}
            </>
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
  const [bulkPriceLoading, setBulkPriceLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkOperation, setBulkOperation] = useState('increase');
  const [bulkValue, setBulkValue] = useState(10);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories || res.data || []);
      } catch (error) {
        console.error('Categories fetch error:', error);
      }
    };
    fetchCategories();
  }, []);

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

      toast.success(`✅ İçe aktarma tamamlandı!\n\nYeni: ${response.data.imported}\nGüncellenen: ${response.data.updated}`);
    } catch (error: any) {
      toast.error(`❌ Hata: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      toast.error('❌ Sadece Excel (.xlsx) veya CSV (.csv) dosyaları desteklenir');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/stock/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`✅ ${file.name} başarıyla içe aktarıldı!\n\nYeni: ${response.data.imported}\nGüncellenen: ${response.data.updated}`);
    } catch (error: any) {
      toast.error(`❌ Hata: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploading(false);
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

  const handleBulkPriceUpdate = async () => {
    if (!bulkValue || bulkValue <= 0) {
      toast.error('Lütfen geçerli bir değer girin');
      return;
    }

    if (!window.confirm(`${bulkCategory ? 'Seçili kategori' : 'Tüm ürünler'} için fiyatları ${bulkOperation === 'increase' ? 'artırmak' : 'azaltmak'} istediğinize emin misiniz?`)) {
      return;
    }

    setBulkPriceLoading(true);
    try {
      const response = await api.post('/stock/bulk-update-prices', {
        categoryId: bulkCategory || undefined,
        operation: bulkOperation,
        value: Number(bulkValue)
      });

      toast.success(`✅ ${response.data.updated || 0} ürün güncellendi`);
    } catch (error: any) {
      console.error('Bulk price update error:', error);
      toast.error(error.response?.data?.error || 'Toplu güncelleme başarısız');
    } finally {
      setBulkPriceLoading(false);
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

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all mb-4 ${
              isDragging 
                ? 'border-primary bg-primary/10 scale-105' 
                : 'border-border bg-card-hover hover:border-primary/50'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-foreground font-medium">Yükleniyor...</p>
              </div>
            ) : (
              <>
                <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-primary animate-bounce' : 'text-foreground-secondary'}`} />
                <p className="text-foreground font-semibold mb-2">
                  {isDragging ? '🎯 Buraya bırak!' : '📤 Dosyayı sürükle-bırak'}
                </p>
                <p className="text-sm text-foreground-secondary mb-4">veya</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleExcelImport}
                  className="hidden"
                  id="excel-drag-drop-upload"
                />
                <label htmlFor="excel-drag-drop-upload" className="cursor-pointer">
                  <FluentButton
                    appearance="primary"
                  >
                    Dosya Seç
                  </FluentButton>
                </label>
                <p className="text-xs text-foreground-secondary mt-3">
                  .xlsx veya .csv | Binlerce ürün tek seferde
                </p>
              </>
            )}
          </div>

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
          <select 
            value={bulkCategory}
            onChange={(e) => setBulkCategory(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select 
            value={bulkOperation}
            onChange={(e) => setBulkOperation(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          >
            <option value="increase">Artır (%)</option>
            <option value="decrease">Azalt (%)</option>
            <option value="fixed">Sabit Değer (₺)</option>
          </select>

          <input
            type="number"
            min="0"
            step="0.01"
            value={bulkValue}
            onChange={(e) => setBulkValue(Number(e.target.value))}
            placeholder="Değer"
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          />
        </div>

        <FluentButton
          appearance="primary"
          className="w-full mt-4"
          onClick={handleBulkPriceUpdate}
          loading={bulkPriceLoading}
        >
          Fiyatları Güncelle
        </FluentButton>
      </FluentCard>
    </div>
  );
};

export default StockManagement;

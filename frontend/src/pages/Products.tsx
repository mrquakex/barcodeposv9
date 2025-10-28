import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Edit, Trash2, Star, StarOff, Barcode, Package, Upload,
  Grid3x3, List, Filter, Download, Copy, MoreVertical, Eye, EyeOff,
  CheckSquare, Square, X, ChevronDown, ChevronUp, SlidersHorizontal, FileDown,
  Printer, QrCode, Archive, RefreshCw, Tag, ArrowUpDown, AlertCircle, TrendingUp
} from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
import FluentBadge from '../components/fluent/FluentBadge';
import { ExcelImport } from '../components/ExcelImport';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

interface Product {
  id: string;
  barcode: string;
  name: string;
  sellPrice: number;
  buyPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  taxRate: number;
  isFavorite: boolean;
  isActive?: boolean;
  categoryId?: string;
  category?: { name: string };
  createdAt?: string;
  updatedAt?: string;
}

interface Category {
  id: string;
  name: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'barcode' | 'sellPrice' | 'stock' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface Filters {
  categories: string[];
  priceRange: [number, number];
  stockStatus: string[];
  activeStatus: string[];
  isFavorite: boolean | null;
}

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  product: Product | null;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: Filters;
}

const Products: React.FC = () => {
  const { t } = useTranslation();
  
  // 💠 Basic States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 💠 Enterprise States
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false, x: 0, y: 0, product: null });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  
  // 💠 Filters
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    priceRange: [0, 10000],
    stockStatus: [],
    activeStatus: [],
    isFavorite: null,
  });
  
  // 💠 ENTERPRISE: Saved Filters
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    const saved = localStorage.getItem('productFilters');
    return saved ? JSON.parse(saved) : [];
  });
  
  // 💠 ENTERPRISE: Column Visibility (Table View)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('tableColumns');
    return saved ? JSON.parse(saved) : {
      barcode: true,
      name: true,
      category: true,
      price: true,
      stock: true,
      favorite: true,
      actions: true,
    };
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  
  // 💠 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(viewMode === 'grid' ? 12 : 20);
  
  // 💠 Form Data
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    sellPrice: 0,
    buyPrice: 0,
    stock: 0,
    minStock: 5,
    unit: 'Adet',
    taxRate: 18,
    categoryId: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      toast.error(t('products.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success(t('products.productUpdated'));
      } else {
        await api.post('/products', formData);
        toast.success(t('products.productCreated'));
      }
      fetchProducts();
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('products.saveError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success(t('products.productDeleted'));
      fetchProducts();
    } catch (error) {
      toast.error(t('products.saveError'));
    }
  };

  const toggleFavorite = async (product: Product) => {
    try {
      await api.put(`/products/${product.id}`, { isFavorite: !product.isFavorite });
      toast.success(product.isFavorite ? 'Removed from favorites' : 'Added to favorites');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      sellPrice: product.sellPrice,
      buyPrice: product.buyPrice,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
      taxRate: product.taxRate,
      categoryId: product.categoryId || '',
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingProduct(null);
    setFormData({
      barcode: '',
      name: '',
      sellPrice: 0,
      buyPrice: 0,
      stock: 0,
      minStock: 5,
      unit: 'Adet',
      taxRate: 18,
      categoryId: '',
    });
  };

  // 💠 ENTERPRISE: Advanced Filtering & Sorting
  const filteredProducts = products
    .filter((p) => {
      // Search filter
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(p.categoryId || '')) {
        return false;
      }

      // Price range filter
      if (p.sellPrice < filters.priceRange[0] || p.sellPrice > filters.priceRange[1]) {
        return false;
      }

      // Stock status filter
      if (filters.stockStatus.length > 0) {
        const status = 
          p.stock === 0 ? 'out' :
          p.stock <= p.minStock ? 'low' :
          p.stock <= p.minStock * 2 ? 'medium' : 'high';
        if (!filters.stockStatus.includes(status)) return false;
      }

      // Active status filter
      if (filters.activeStatus.length > 0) {
        const isActive = p.isActive !== false;
        const status = isActive ? 'active' : 'inactive';
        if (!filters.activeStatus.includes(status)) return false;
      }

      // Favorite filter
      if (filters.isFavorite !== null && p.isFavorite !== filters.isFavorite) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'barcode':
          aValue = a.barcode;
          bValue = b.barcode;
          break;
        case 'sellPrice':
          aValue = a.sellPrice;
          bValue = b.sellPrice;
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // 💠 Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortField, sortOrder]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 💠 ENTERPRISE: Selection Handlers
  const toggleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
    }
  };

  const clearSelection = () => setSelectedProducts(new Set());

  // 💠 ENTERPRISE: Context Menu Handlers
  const handleContextMenu = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      product,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, product: null });
  };

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    const handleScroll = () => closeContextMenu();
    
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // 💠 ENTERPRISE: Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N: Yeni ürün
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowDialog(true);
      }
      
      // Ctrl+F: Arama odakla
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
      
      // Ctrl+E: Export
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportToExcel();
      }
      
      // Ctrl+A: Tümünü seç (eğer ürün varsa)
      if (e.ctrlKey && e.key === 'a' && paginatedProducts.length > 0) {
        e.preventDefault();
        toggleSelectAll();
      }
      
      // Delete: Seçili ürünleri sil
      if (e.key === 'Delete' && selectedProducts.size > 0) {
        e.preventDefault();
        handleBulkDelete();
      }
      
      // Escape: Dialog'ları kapat
      if (e.key === 'Escape') {
        if (showDialog) {
          handleCloseDialog();
        }
        if (showFilters) {
          setShowFilters(false);
        }
        if (showExcelImport) {
          setShowExcelImport(false);
        }
        if (selectedProducts.size > 0) {
          clearSelection();
        }
      }
      
      // Ctrl+G: Grid view
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        setViewMode('grid');
      }
      
      // Ctrl+L: List view
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        setViewMode('list');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDialog, showFilters, showExcelImport, selectedProducts, paginatedProducts, viewMode]);

  // 💠 ENTERPRISE: Bulk Operations
  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!confirm(`${selectedProducts.size} ürünü silmek istediğinize emin misiniz?`)) return;
    
    try {
      await Promise.all(
        Array.from(selectedProducts).map(id => api.delete(`/products/${id}`))
      );
      toast.success(`${selectedProducts.size} ürün silindi`);
      fetchProducts();
      clearSelection();
    } catch (error) {
      toast.error('Toplu silme işlemi başarısız');
    }
  };

  const handleBulkCategoryChange = async (categoryId: string) => {
    if (selectedProducts.size === 0) return;
    
    try {
      await Promise.all(
        Array.from(selectedProducts).map(id => 
          api.put(`/products/${id}`, { categoryId })
        )
      );
      toast.success(`${selectedProducts.size} ürünün kategorisi güncellendi`);
      fetchProducts();
      clearSelection();
    } catch (error) {
      toast.error('Toplu kategori değiştirme başarısız');
    }
  };

  // 💠 ENTERPRISE: Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // 💠 ENTERPRISE: Saved Filters Handlers
  const saveCurrentFilter = () => {
    const name = prompt('Filtre adı girin:');
    if (!name) return;
    
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters: { ...filters },
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('productFilters', JSON.stringify(updated));
    toast.success(`"${name}" filtresi kaydedildi`);
  };

  const loadSavedFilter = (filterId: string) => {
    const saved = savedFilters.find(f => f.id === filterId);
    if (saved) {
      setFilters(saved.filters);
      toast.success(`"${saved.name}" filtresi yüklendi`);
    }
  };

  const deleteSavedFilter = (filterId: string) => {
    const updated = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updated);
    localStorage.setItem('productFilters', JSON.stringify(updated));
    toast.success('Filtre silindi');
  };

  // 💠 ENTERPRISE: Column Visibility Handler
  const toggleColumn = (columnKey: string) => {
    const updated = { ...visibleColumns, [columnKey]: !visibleColumns[columnKey] };
    setVisibleColumns(updated);
    localStorage.setItem('tableColumns', JSON.stringify(updated));
  };

  // 💠 ENTERPRISE: Export Functions
  const exportToExcel = () => {
    const selectedData = products.filter(p => selectedProducts.has(p.id));
    const dataToExport = selectedData.length > 0 ? selectedData : filteredProducts;
    
    // Simple CSV export (you can use XLSX library for better Excel support)
    const headers = ['Barkod', 'Ürün Adı', 'Satış Fiyatı', 'Alış Fiyatı', 'Stok', 'Birim', 'Kategori'];
    const rows = dataToExport.map(p => [
      p.barcode,
      p.name,
      p.sellPrice,
      p.buyPrice,
      p.stock,
      p.unit,
      p.category?.name || '-'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success(`${dataToExport.length} ürün Excel'e aktarıldı`);
  };

  const exportToPDF = () => {
    toast('PDF export özelliği yakında eklenecek');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">{t('products.loadingProducts')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 fluent-mica">
      {/* 🎨 Modern Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('products.title')}</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-foreground-secondary">
              {filteredProducts.length} ürün
            </span>
            {selectedProducts.size > 0 && (
              <>
                <span className="text-foreground-tertiary">•</span>
                <span className="font-semibold text-primary">
                  {selectedProducts.size} seçili
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {/* 💎 Modern View Mode Toggle */}
          <div className="flex gap-1 bg-background-alt border border-border rounded-lg p-1.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200',
                viewMode === 'grid'
                  ? 'bg-gradient-to-br from-primary to-primary-pressed text-white shadow-md'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background/50'
              )}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-gradient-to-br from-primary to-primary-pressed text-white shadow-md'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background/50'
              )}
            >
              <List className="w-4 h-4" />
            </button>
      </div>

          {/* 💠 ENTERPRISE: Column Menu (Table View Only) */}
          {viewMode === 'list' && (
            <div className="relative">
              <FluentButton
                appearance="subtle"
                icon={<SlidersHorizontal className="w-4 h-4" />}
                onClick={() => setShowColumnMenu(!showColumnMenu)}
              >
                Sütunlar
              </FluentButton>
              
              {showColumnMenu && (
                <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded fluent-depth-8 p-2 min-w-[200px] z-50">
                  <div className="space-y-1">
                    {[
                      { key: 'barcode', label: 'Barkod' },
                      { key: 'name', label: 'Ürün Adı' },
                      { key: 'category', label: 'Kategori' },
                      { key: 'price', label: 'Fiyat' },
                      { key: 'stock', label: 'Stok' },
                      { key: 'favorite', label: 'Favori' },
                      { key: 'actions', label: 'İşlemler' },
                    ].map(col => (
                      <label key={col.key} className="flex items-center gap-2 px-3 py-2 hover:bg-background-alt rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-foreground">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filters Toggle */}
          <FluentButton
            appearance={showFilters ? 'primary' : 'subtle'}
            icon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtreler
          </FluentButton>

          {/* Export */}
          <FluentButton
            appearance="subtle"
            icon={<Download className="w-4 h-4" />}
            onClick={exportToExcel}
          >
            <span className="hidden sm:inline">Dışa Aktar</span>
          </FluentButton>

          {/* Excel Import */}
          <FluentButton
            appearance="subtle"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => setShowExcelImport(true)}
          >
            <span className="hidden sm:inline">İçe Aktar</span>
          </FluentButton>

          {/* Add Product */}
          <FluentButton
            appearance="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowDialog(true)}
          >
            Ekle
          </FluentButton>
        </div>
      </div>

      {/* 💎 Modern Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <FluentCard depth="depth-4" hoverable className="p-6 group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Toplam Ürün</p>
              <p className="text-2xl font-bold text-foreground mt-1">{products.length}</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-4" hoverable className="p-6 group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-success/10 to-success/5 rounded-xl group-hover:from-success/20 group-hover:to-success/10 transition-all">
              <Package className="w-7 h-7 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Toplam Değer</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ₺{products.reduce((sum, p) => sum + (p.sellPrice * p.stock), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-4" hoverable className="p-6 group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl group-hover:from-warning/20 group-hover:to-warning/10 transition-all">
              <AlertCircle className="w-7 h-7 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Kritik Stok</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {products.filter(p => p.stock <= p.minStock).length}
              </p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-4" hoverable className="p-6 group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-info/10 to-info/5 rounded-xl group-hover:from-info/20 group-hover:to-info/10 transition-all">
              <TrendingUp className="w-7 h-7 text-info" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Kategoriler</p>
              <p className="text-2xl font-bold text-foreground mt-1">{categories.length}</p>
            </div>
          </div>
        </FluentCard>
      </div>

      {/* 💠 ENTERPRISE: Bulk Actions Toolbar */}
      {selectedProducts.size > 0 && (
        <FluentCard depth="depth-8" className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
              <FluentBadge appearance="info" size="medium">
                {selectedProducts.size} seçili
              </FluentBadge>
              <button
                onClick={clearSelection}
                className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
              >
                Seçimi Temizle
              </button>
            </div>
            <div className="flex gap-2">
              <FluentButton
                appearance="subtle"
                size="small"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleBulkDelete}
              >
                Sil
              </FluentButton>
              <FluentButton
                appearance="subtle"
                size="small"
                icon={<Tag className="w-4 h-4" />}
                onClick={() => {
                  const categoryId = prompt('Kategori ID girin:');
                  if (categoryId) handleBulkCategoryChange(categoryId);
                }}
              >
                Kategori Değiştir
              </FluentButton>
              <FluentButton
                appearance="subtle"
                size="small"
                icon={<Download className="w-4 h-4" />}
                onClick={exportToExcel}
              >
                Export
              </FluentButton>
            </div>
          </div>
        </FluentCard>
      )}

      {/* 💠 ENTERPRISE: Search & Filters Layout */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <FluentCard depth="depth-4" className="w-64 p-4 space-y-6 h-fit shrink-0">
      <div className="flex items-center justify-between">
              <h3 className="fluent-subtitle font-semibold text-foreground">Filtreler</h3>
              <button
                onClick={() => setFilters({
                  categories: [],
                  priceRange: [0, 10000],
                  stockStatus: [],
                  activeStatus: [],
                  isFavorite: null,
                })}
                className="text-sm text-primary hover:underline"
              >
                Temizle
              </button>
            </div>

            {/* 💠 ENTERPRISE: Saved Filters */}
            {savedFilters.length > 0 && (
              <div>
                <label className="fluent-body-small font-medium text-foreground block mb-2">
                  Kayıtlı Filtreler
                </label>
                <div className="space-y-2">
                  {savedFilters.map(saved => (
                    <div key={saved.id} className="flex items-center gap-2">
                      <button
                        onClick={() => loadSavedFilter(saved.id)}
                        className="flex-1 px-3 py-2 text-left text-sm bg-background hover:bg-background-alt border border-border rounded transition-colors"
                      >
                        {saved.name}
                      </button>
                      <button
                        onClick={() => deleteSavedFilter(saved.id)}
                        className="p-2 hover:bg-destructive/10 rounded transition-colors text-destructive"
                        title="Sil"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={saveCurrentFilter}
                  className="w-full mt-2 px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors font-medium"
                >
                  + Mevcut Filtreyi Kaydet
                </button>
              </div>
            )}
            
            {/* Save Filter Button (if no saved filters) */}
            {savedFilters.length === 0 && (
              <button
                onClick={saveCurrentFilter}
                className="w-full px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors font-medium"
              >
                Filtreyi Kaydet
              </button>
            )}

            {/* Category Filter */}
            <div>
              <label className="fluent-body-small font-medium text-foreground block mb-2">
                Kategori
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto fluent-scrollbar">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(cat.id)}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...filters.categories, cat.id]
                          : filters.categories.filter(c => c !== cat.id);
                        setFilters({ ...filters, categories: newCategories });
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-foreground">{cat.name}</span>
                  </label>
                ))}
            </div>
          </div>

            {/* Stock Status Filter */}
        <div>
              <label className="fluent-body-small font-medium text-foreground block mb-2">
                Stok Durumu
              </label>
              <div className="space-y-2">
                {[
                  { value: 'out', label: 'Tükendi', color: 'error' },
                  { value: 'low', label: 'Kritik', color: 'warning' },
                  { value: 'medium', label: 'Düşük', color: 'info' },
                  { value: 'high', label: 'Normal', color: 'success' },
                ].map(status => (
                  <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.stockStatus.includes(status.value)}
                      onChange={(e) => {
                        const newStatus = e.target.checked
                          ? [...filters.stockStatus, status.value]
                          : filters.stockStatus.filter(s => s !== status.value);
                        setFilters({ ...filters, stockStatus: newStatus });
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-foreground">{status.label}</span>
                  </label>
                ))}
        </div>
      </div>

            {/* Favorite Filter */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isFavorite === true}
                  onChange={(e) => {
                    setFilters({ ...filters, isFavorite: e.target.checked ? true : null });
                  }}
                  className="rounded border-border"
                />
                <Star className="w-4 h-4 text-warning" />
                <span className="text-sm text-foreground">Sadece Favoriler</span>
              </label>
            </div>
          </FluentCard>
        )}

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Search */}
          <FluentCard depth="depth-4" className="p-4">
            <FluentInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('products.searchPlaceholder') || 'Ürün adı veya barkod ile ara...'}
              icon={<Search className="w-4 h-4" />}
            />
          </FluentCard>

          {/* 💠 ENTERPRISE: View Mode Rendering */}
          {viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedProducts.map((product) => (
                <FluentCard 
                  key={product.id} 
                  depth="depth-4" 
                  hoverable 
                  className="p-4 relative"
                  onContextMenu={(e) => handleContextMenu(e, product)}
                >
                  {/* Checkbox for selection */}
                  <div className="absolute top-4 left-4 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectProduct(product.id);
                      }}
                      className="p-1 hover:bg-background-alt rounded transition-colors"
                    >
                      {selectedProducts.has(product.id) ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-foreground-secondary" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-start justify-between mb-3 ml-8">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="fluent-body font-medium text-foreground truncate max-w-[150px]">
                          {product.name}
                        </h4>
                        <p className="fluent-caption text-foreground-secondary flex items-center gap-1">
                          <Barcode className="w-3 h-3" />
                          {product.barcode}
                        </p>
            </div>
          </div>
                    <button
                      onClick={() => toggleFavorite(product)}
                      className="text-foreground-secondary hover:text-warning transition-colors"
                    >
                      {product.isFavorite ? (
                        <Star className="w-4 h-4 fill-warning text-warning" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Fiyat</span>
                      <span className="text-foreground font-medium">
                        ₺{product.sellPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Stok</span>
                      <FluentBadge
                        appearance={product.stock <= product.minStock ? 'error' : 'success'}
                        size="small"
                      >
                        {product.stock} {product.unit}
                      </FluentBadge>
                    </div>
                    {product.category && (
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-secondary">Kategori</span>
                        <span className="text-foreground-tertiary">{product.category.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <FluentButton
                      appearance="subtle"
                      size="small"
                      className="flex-1"
                      icon={<Edit className="w-3 h-3" />}
                      onClick={() => handleEdit(product)}
                    >
                      Düzenle
                    </FluentButton>
                    <FluentButton
                      appearance="subtle"
                      size="small"
                      className="flex-1 text-destructive hover:bg-destructive/10"
                      icon={<Trash2 className="w-3 h-3" />}
                      onClick={() => handleDelete(product.id)}
                    >
                      Sil
                    </FluentButton>
                  </div>
                </FluentCard>
              ))}
            </div>
          ) : (
            /* TABLE VIEW */
            <FluentCard depth="depth-4" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-background-alt">
                      <th className="px-4 py-3 text-left">
                        <button
                          onClick={toggleSelectAll}
                          className="p-1 hover:bg-background rounded transition-colors"
                        >
                          {selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-foreground-secondary" />
                          )}
                        </button>
                      </th>
                      
                      {/* 💠 Sortable Headers (Conditional) */}
                      {visibleColumns.barcode && (
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort('barcode')}
                            className="flex items-center gap-2 hover:text-primary transition-colors fluent-body-small font-semibold text-foreground"
                          >
                            Barkod
                            {sortField === 'barcode' ? (
                              sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                            )}
                          </button>
                        </th>
                      )}
                      
                      {visibleColumns.name && (
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center gap-2 hover:text-primary transition-colors fluent-body-small font-semibold text-foreground"
                          >
                            Ürün Adı
                            {sortField === 'name' ? (
                              sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                            )}
                          </button>
                        </th>
                      )}
                      
                      {visibleColumns.category && (
                        <th className="px-4 py-3 text-left fluent-body-small font-semibold text-foreground">
                          Kategori
                        </th>
                      )}
                      
                      {visibleColumns.price && (
                        <th className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleSort('sellPrice')}
                            className="flex items-center gap-2 ml-auto hover:text-primary transition-colors fluent-body-small font-semibold text-foreground"
                          >
                            Fiyat
                            {sortField === 'sellPrice' ? (
                              sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                            )}
                          </button>
                        </th>
                      )}
                      
                      {visibleColumns.stock && (
                        <th className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleSort('stock')}
                            className="flex items-center gap-2 mx-auto hover:text-primary transition-colors fluent-body-small font-semibold text-foreground"
                          >
                            Stok
                            {sortField === 'stock' ? (
                              sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                            )}
                          </button>
                        </th>
                      )}
                      
                      {visibleColumns.favorite && (
                        <th className="px-4 py-3 text-center fluent-body-small font-semibold text-foreground">Favori</th>
                      )}
                      
                      {visibleColumns.actions && (
                        <th className="px-4 py-3 text-center fluent-body-small font-semibold text-foreground">İşlemler</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product) => (
                      <tr
                        key={product.id}
                        className={cn(
                          'border-b border-border transition-colors hover:bg-background-alt',
                          selectedProducts.has(product.id) && 'bg-primary/5'
                        )}
                        onContextMenu={(e) => handleContextMenu(e, product)}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectProduct(product.id);
                            }}
                            className="p-1 hover:bg-background rounded transition-colors"
                          >
                            {selectedProducts.has(product.id) ? (
                              <CheckSquare className="w-5 h-5 text-primary" />
                            ) : (
                              <Square className="w-5 h-5 text-foreground-secondary" />
                            )}
                          </button>
                        </td>
                        {visibleColumns.barcode && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Barcode className="w-4 h-4 text-foreground-secondary" />
                              <span className="fluent-body-small font-mono text-foreground">
                                {product.barcode}
                      </span>
                            </div>
                          </td>
                        )}
                        
                        {visibleColumns.name && (
                          <td className="px-4 py-3">
                            <span className="fluent-body font-medium text-foreground">
                              {product.name}
                            </span>
                          </td>
                        )}
                        
                        {visibleColumns.category && (
                          <td className="px-4 py-3">
                            <span className="fluent-body-small text-foreground-secondary">
                              {product.category?.name || '-'}
                            </span>
                          </td>
                        )}
                        
                        {visibleColumns.price && (
                          <td className="px-4 py-3 text-right">
                            <span className="fluent-body font-semibold text-foreground">
                              ₺{product.sellPrice.toFixed(2)}
                            </span>
                          </td>
                        )}
                        
                        {visibleColumns.stock && (
                          <td className="px-4 py-3 text-center">
                            <FluentBadge
                              appearance={product.stock <= product.minStock ? 'error' : 'success'}
                              size="small"
                            >
                              {product.stock} {product.unit}
                            </FluentBadge>
                          </td>
                        )}
                        
                        {visibleColumns.favorite && (
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => toggleFavorite(product)}
                              className="p-1 hover:bg-background rounded transition-colors"
                            >
                              {product.isFavorite ? (
                                <Star className="w-4 h-4 fill-warning text-warning" />
                              ) : (
                                <StarOff className="w-4 h-4 text-foreground-secondary" />
                              )}
                            </button>
                          </td>
                        )}
                        
                        {visibleColumns.actions && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-1.5 hover:bg-background rounded transition-colors text-foreground-secondary hover:text-primary"
                                title="Düzenle"
                              >
                          <Edit className="w-4 h-4" />
                              </button>
                              <button
                          onClick={() => handleDelete(product.id)}
                                className="p-1.5 hover:bg-destructive/10 rounded transition-colors text-foreground-secondary hover:text-destructive"
                                title="Sil"
                        >
                                <Trash2 className="w-4 h-4" />
                              </button>
                      </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FluentCard>
          )}

      {/* 🍎 Apple-style Pagination */}
      {filteredProducts.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${currentPage === 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }
            `}
          >
            ‹
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1);

              // Show ellipsis
              const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
              const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

              if (!showPage && !showEllipsisBefore && !showEllipsisAfter) {
                return null;
              }

              if (showEllipsisBefore || showEllipsisAfter) {
                return (
                  <span
                    key={`ellipsis-${page}`}
                    className="px-2 text-gray-400"
                  >
                    ···
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`
                    min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all
                    ${page === currentPage
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    }
                  `}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${currentPage === totalPages
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }
            `}
          >
            ›
          </button>

          {/* Page Info */}
          <span className="ml-4 text-sm text-gray-500 font-medium">
            {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} / {filteredProducts.length}
          </span>
        </div>
      )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
              <p className="fluent-body text-foreground-secondary">
                {searchTerm ? 'No products found' : 'No products yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 💠 ENTERPRISE: Context Menu (Right-click) */}
      {contextMenu.visible && contextMenu.product && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-card border border-border rounded fluent-depth-16 py-2 min-w-[200px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleEdit(contextMenu.product!);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-background-alt transition-colors text-foreground"
          >
            <Edit className="w-4 h-4" />
            <span className="fluent-body">Düzenle</span>
          </button>
          
          <button
            onClick={() => {
              if (contextMenu.product) {
                navigator.clipboard.writeText(contextMenu.product.name);
                toast.success('Ürün adı kopyalandı');
              }
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-background-alt transition-colors text-foreground"
          >
            <Copy className="w-4 h-4" />
            <span className="fluent-body">Kopyala</span>
          </button>

          <button
            onClick={() => {
              if (contextMenu.product) {
                toggleFavorite(contextMenu.product);
              }
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-background-alt transition-colors text-foreground"
          >
            {contextMenu.product.isFavorite ? (
              <>
                <StarOff className="w-4 h-4" />
                <span className="fluent-body">Favorilerden Çıkar</span>
              </>
            ) : (
              <>
                <Star className="w-4 h-4" />
                <span className="fluent-body">Favorilere Ekle</span>
              </>
            )}
          </button>

          <div className="border-t border-border my-1" />

          <button
            onClick={() => {
              toast('Barkod yazdırma özelliği yakında eklenecek');
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-background-alt transition-colors text-foreground"
          >
            <Printer className="w-4 h-4" />
            <span className="fluent-body">Barkod Yazdır</span>
          </button>

          <button
            onClick={() => {
              toast('QR kod özelliği yakında eklenecek');
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-background-alt transition-colors text-foreground"
          >
            <QrCode className="w-4 h-4" />
            <span className="fluent-body">QR Kod Oluştur</span>
          </button>

          <div className="border-t border-border my-1" />

          <button
            onClick={() => {
              if (contextMenu.product) {
                handleDelete(contextMenu.product.id);
              }
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-destructive/10 transition-colors text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            <span className="fluent-body">Sil</span>
          </button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <FluentDialog
        open={showDialog}
        onClose={handleCloseDialog}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FluentInput
              label={t('products.barcode')}
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              required
            />
            <FluentInput
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <FluentInput
              label={t('products.sellPrice')}
              type="number"
              step="0.01"
              value={formData.sellPrice}
              onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) })}
              required
            />
            <FluentInput
              label={t('products.buyPrice')}
              type="number"
              step="0.01"
              value={formData.buyPrice}
              onChange={(e) => setFormData({ ...formData, buyPrice: parseFloat(e.target.value) })}
              required
            />
            <FluentInput
              label={t('products.stock')}
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
              required
            />
            <FluentInput
              label={t('products.minStock')}
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
              required
            />
            <FluentInput
              label={t('products.unit')}
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
            <FluentInput
              label={t('products.taxRate')}
              type="number"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
              required
            />
            <div className="md:col-span-2">
              <label className="fluent-body-small text-foreground-secondary block mb-2">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full h-10 px-3 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <FluentButton appearance="subtle" className="flex-1" onClick={handleCloseDialog}>
              Cancel
            </FluentButton>
            <FluentButton type="submit" appearance="primary" className="flex-1">
              {editingProduct ? t('common.update') || 'Güncelle' : t('common.create') || 'Oluştur'}
            </FluentButton>
                      </div>
        </form>
      </FluentDialog>

      {/* Excel Import Modal */}
      {showExcelImport && (
        <ExcelImport
          onSuccess={() => {
            fetchProducts();
            setShowExcelImport(false);
          }}
          onClose={() => setShowExcelImport(false)}
        />
      )}
    </div>
  );
};

export default Products;


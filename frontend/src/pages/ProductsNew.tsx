import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import ExcelImport from '../components/Excel/ExcelImport';
import ExcelExport from '../components/Excel/ExcelExport';
import { Product, Category } from '../types';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { 
  Plus, Search, Edit, Trash2, Package, FileSpreadsheet, Sparkles, Grid3x3, List,
  X, Filter, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Download,
  BarChart3, ShoppingCart, Eye, MoreVertical, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../components/ui/StatCard';

const ProductsNew: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [filters, setFilters] = useState({
    categoryId: '',
    stockStatus: 'all', // all, low, normal, out
    priceRange: 'all', // all, 0-50, 50-100, 100+
    status: 'all' // all, active, inactive
  });
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    categoryId: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    unit: 'Adet',
    taxRate: '20',
    isActive: true,
    description: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    
    // URL'den kategori parametresini oku
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setFilters(prev => ({ ...prev, categoryId: categoryParam }));
      setShowFilters(true);
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Categories fetch error:', error);
    }
  };

  // Advanced Stats
  const stats = useMemo(() => {
    const total = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const lowStock = products.filter(p => p.stock <= p.minStock).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const avgPrice = products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;

    return { total, totalValue, lowStock, outOfStock, avgPrice };
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search filter
      const searchMatch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery);
      
      // Category filter
      const categoryMatch = !filters.categoryId || p.categoryId === filters.categoryId;
      
      // Stock status filter
      let stockMatch = true;
      if (filters.stockStatus === 'low') stockMatch = p.stock <= p.minStock && p.stock > 0;
      if (filters.stockStatus === 'out') stockMatch = p.stock === 0;
      if (filters.stockStatus === 'normal') stockMatch = p.stock > p.minStock;
      
      // Price range filter
      let priceMatch = true;
      if (filters.priceRange === '0-50') priceMatch = p.price <= 50;
      if (filters.priceRange === '50-100') priceMatch = p.price > 50 && p.price <= 100;
      if (filters.priceRange === '100+') priceMatch = p.price > 100;
      
      // Status filter
      const statusMatch = filters.status === 'all' || 
        (filters.status === 'active' && p.isActive) ||
        (filters.status === 'inactive' && !p.isActive);

      return searchMatch && categoryMatch && stockMatch && priceMatch && statusMatch;
    });
  }, [products, searchQuery, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost || '0'),
        stock: parseFloat(formData.stock),
        minStock: parseInt(formData.minStock || '0'),
        taxRate: parseFloat(formData.taxRate),
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, data);
        toast.success('✅ Ürün güncellendi!');
      } else {
        await api.post('/products', data);
        toast.success('✅ Ürün eklendi!');
      }
      fetchProducts();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      barcode: product.barcode,
      categoryId: product.categoryId || '',
      price: product.price.toString(),
      cost: product.cost?.toString() || '',
      stock: product.stock.toString(),
      minStock: product.minStock?.toString() || '0',
      unit: product.unit,
      taxRate: product.taxRate.toString(),
      isActive: product.isActive,
      description: product.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    try {
      await api.delete(`/products/${id}`);
      toast.success('🗑️ Ürün silindi!');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ürün silinemedi');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`${selectedProducts.length} ürünü silmek istediğinize emin misiniz?`)) return;

    try {
      const response = await api.post('/products/bulk-delete', { ids: selectedProducts });
      toast.success(`🗑️ ${response.data.count} ürün silindi!`);
      setSelectedProducts([]);
      fetchProducts();
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast.error(error.response?.data?.error || 'Toplu silme başarısız');
    }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: '',
      barcode: '',
      categoryId: '',
      price: '',
      cost: '',
      stock: '',
      minStock: '',
      unit: 'Adet',
      taxRate: '20',
      isActive: true,
      description: '',
    });
  };

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      stockStatus: 'all',
      priceRange: 'all',
      status: 'all'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
      >
          <div>
          <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 shadow-lg">
              <Package className="w-6 md:w-8 h-6 md:h-8 text-white" />
            </div>
              Ürün Yönetimi
            </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-lg">
            Enterprise seviye stok ve ürün takip sistemi
            </p>
          </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="outline" onClick={() => setShowExcelImport(true)} className="flex-1 md:flex-none gap-2 h-12 md:h-auto">
              <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
            </Button>
          <ExcelExport data={products} filename="urunler" />
          <Button onClick={() => setShowModal(true)} className="flex-1 md:flex-none gap-2 h-12 md:h-auto bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600">
              <Plus className="w-4 h-4" />
              Yeni Ürün
            </Button>
          </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Toplam Ürün"
          value={stats.total}
          description="Aktif ürünler"
          icon={Package}
          color="from-blue-600 to-blue-700"
        />
        <StatCard
          title="Toplam Değer"
          value={formatCurrency(stats.totalValue)}
          description="Stok değeri"
          icon={TrendingUp}
          color="from-slate-600 to-slate-700"
        />
        <StatCard
          title="Düşük Stok"
          value={stats.lowStock}
          description="Kritik seviye"
          icon={AlertCircle}
          color="from-orange-500 to-red-600"
        />
        <StatCard
          title="Tükendi"
          value={stats.outOfStock}
          description="Stok yok"
          icon={TrendingDown}
          color="from-red-600 to-red-700"
        />
        <StatCard
          title="Ort. Fiyat"
          value={formatCurrency(stats.avgPrice)}
          description="Birim fiyat"
          icon={BarChart3}
          color="from-blue-500 to-slate-600"
        />
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-950/20 border border-blue-400 dark:border-blue-800 rounded-xl p-3 md:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-sm md:text-base text-blue-900 dark:text-blue-100">
              {selectedProducts.length} ürün seçildi
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedProducts([])} className="flex-1 md:flex-none h-12 md:h-auto">
              Seçimi Kaldır
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="flex-1 md:flex-none h-12 md:h-auto">
              <Trash2 className="w-4 h-4 mr-2" />
              Toplu Sil
            </Button>
        </div>
      </motion.div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-none md:rounded-3xl shadow-2xl w-full h-full md:h-auto max-w-4xl md:max-h-[90vh] overflow-hidden"
            >
              <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-slate-700 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 md:w-12 h-10 md:h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Package className="w-5 md:w-6 h-5 md:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">
                      {editingId ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
                    </h2>
                    <p className="text-blue-100 text-xs md:text-sm">Ürün bilgilerini doldurun</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={resetForm} className="text-white hover:bg-white/20 h-10 w-10 md:h-auto md:w-auto">
                  <X className="w-5 md:w-6 h-5 md:h-6" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-4 md:space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] md:max-h-[calc(90vh-120px)]">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-semibold">Ürün Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Ürün adını girin"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode" className="text-base font-semibold">Barkod *</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      required
                      placeholder="8690123456789"
                      className="h-12 font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoryId" className="text-base font-semibold">Kategori</Label>
                    <select
                      id="categoryId"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full h-12 px-4 border rounded-md bg-background"
                    >
                      <option value="">Kategori Seçin</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-base font-semibold">Satış Fiyatı *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      placeholder="0.00 ₺"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost" className="text-base font-semibold">Maliyet</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0.00 ₺"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock" className="text-base font-semibold">Stok Miktarı *</Label>
                    <Input
                      id="stock"
                      type="number"
                      step="0.01"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                      placeholder="0"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minStock" className="text-base font-semibold">Minimum Stok</Label>
                    <Input
                      id="minStock"
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      placeholder="0"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-base font-semibold">Birim</Label>
                    <select
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full h-12 px-4 border rounded-md bg-background"
                    >
                      <option value="Adet">Adet</option>
                      <option value="Kg">Kg</option>
                      <option value="Lt">Lt</option>
                      <option value="M">M</option>
                      <option value="Paket">Paket</option>
                      <option value="Kutu">Kutu</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate" className="text-base font-semibold">KDV Oranı</Label>
                    <select
                      id="taxRate"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                      className="w-full h-12 px-4 border rounded-md bg-background"
                    >
                      <option value="0">%0</option>
                      <option value="1">%1</option>
                      <option value="10">%10</option>
                      <option value="20">%20</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-2 cursor-pointer"
                    />
                    <Label htmlFor="isActive" className="cursor-pointer text-base font-semibold">Ürün Aktif</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">Açıklama</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border rounded-md bg-background min-h-[100px]"
                    placeholder="Ürün hakkında detaylı açıklama (opsiyonel)"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:min-w-[120px] h-12 md:h-auto">
                    İptal
                  </Button>
                  <Button type="submit" className="w-full sm:min-w-[120px] h-12 md:h-auto bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600">
                    {editingId ? '✓ Güncelle' : '+ Kaydet'}
                  </Button>
        </div>
              </form>
      </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Excel Import Modal */}
      <AnimatePresence>
        {showExcelImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowExcelImport(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowExcelImport(false)}
                  className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
                <ExcelImport
                  onImportComplete={() => {
                    fetchProducts();
                    setShowExcelImport(false);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white via-blue-50/20 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-800 group">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-slate-600 to-blue-600" />
        
        {/* Glassmorphism overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  inputMode="search"
                  placeholder="Ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 sm:flex-none gap-2 h-12"
                >
                  <Filter className="w-4 h-4" />
                  Filtreler
                </Button>
                <div className="hidden sm:flex gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid gap-4 md:grid-cols-4 pt-4 border-t"
                >
                  <div>
                    <Label className="text-sm font-medium mb-2">Kategori</Label>
                    <select
                      value={filters.categoryId}
                      onChange={(e) => setFilters({...filters, categoryId: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Tümü</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2">Stok Durumu</Label>
                    <select
                      value={filters.stockStatus}
                      onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="all">Tümü</option>
                      <option value="normal">Normal</option>
                      <option value="low">Düşük Stok</option>
                      <option value="out">Tükendi</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2">Fiyat Aralığı</Label>
                    <select
                      value={filters.priceRange}
                      onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="all">Tümü</option>
                      <option value="0-50">0₺ - 50₺</option>
                      <option value="50-100">50₺ - 100₺</option>
                      <option value="100+">100₺+</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2">Durum</Label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="all">Tümü</option>
                      <option value="active">Aktif</option>
                      <option value="inactive">Pasif</option>
                    </select>
                  </div>

                  <div className="md:col-span-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Filtreleri Temizle
                    </Button>
            </div>
      </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>

        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ürün Bulunamadı</h3>
              <p className="text-muted-foreground mb-6">
                Arama kriterlerinize uygun ürün bulunamadı.
              </p>
              <Button onClick={clearFilters} variant="outline">
                Filtreleri Temizle
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedProducts.map((product, index) => (
            <motion.div
              key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group relative"
                >
                  <Card className="hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 hover:border-blue-500/50">
                    {/* Product Barcode Image */}
                    <div className="h-48 bg-gradient-to-br from-blue-600 to-slate-700 relative flex flex-col items-center justify-center overflow-hidden p-6">
                      {/* Barcode SVG */}
                      <div className="bg-white rounded-lg p-4 mb-3 shadow-lg">
                        <svg width="140" height="60" xmlns="http://www.w3.org/2000/svg">
                          {/* Barcode lines */}
                          {[2,8,12,18,24,28,32,38,44,48,54,60,66,70,74,80,86,92,96,102,108,112,118,124,130,136].map((x, i) => (
                            <rect key={i} x={x} y="5" width={i % 3 === 0 ? "4" : i % 2 === 0 ? "3" : "2"} height="40" fill="#000" />
                          ))}
                        </svg>
                        <p className="text-center text-xs font-mono mt-1 text-gray-700">{product.barcode}</p>
                    </div>
                      <Package className="w-8 h-8 text-white/60" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.stock <= product.minStock && (
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            {product.stock === 0 ? 'Tükendi' : 'Düşük Stok'}
                          </span>
                        )}
                        {!product.isActive && (
                          <span className="bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            Pasif
                          </span>
                  )}
                </div>

                      {/* Checkbox */}
                      <div className="absolute top-3 right-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-5 h-5 rounded cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                  </div>

                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-1 truncate group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block">
                        {product.barcode}
                      </p>
                      
                      <div className="flex items-baseline justify-between mb-4">
                        <span className="text-3xl font-black bg-gradient-to-r from-blue-700 to-slate-700 bg-clip-text text-transparent">
                        {formatCurrency(product.price)}
                        </span>
                        <span className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
                          {product.category?.name || '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <span className={`font-semibold ${
                          product.stock <= product.minStock ? 'text-red-600' : 'text-green-600'
                        }`}>
                          Stok: {product.stock} {product.unit}
                        </span>
                        <span className="text-muted-foreground">KDV: %{product.taxRate}</span>
                    </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 group-hover:border-blue-500 group-hover:text-blue-600"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="w-3 h-3 mr-2" />
                          Düzenle
                      </Button>
                      <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-red-50 hover:border-red-500 hover:text-red-600"
                        onClick={() => handleDelete(product.id)}
                      >
                          <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(filteredProducts.map(p => p.id));
                          } else {
                            setSelectedProducts([]);
                          }
                        }}
                        className="w-4 h-4"
                      />
                    </TableHead>
                    <TableHead className="font-bold">Barkod</TableHead>
                    <TableHead className="font-bold">Ürün Adı</TableHead>
                    <TableHead className="font-bold">Kategori</TableHead>
                    <TableHead className="font-bold">Fiyat</TableHead>
                    <TableHead className="font-bold">Stok</TableHead>
                    <TableHead className="font-bold">KDV</TableHead>
                    <TableHead className="font-bold">Durum</TableHead>
                    <TableHead className="text-right font-bold">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-4 h-4"
                        />
                      </TableCell>
                        <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                      <TableCell className="font-semibold">{product.name}</TableCell>
                        <TableCell>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                          {product.category?.name || '-'}
                            </span>
                        </TableCell>
                      <TableCell className="font-bold text-green-600">{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                          <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                              product.stock <= product.minStock
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}
                          >
                            {product.stock} {product.unit}
                          </span>
                        </TableCell>
                        <TableCell>%{product.taxRate}</TableCell>
                        <TableCell>
                          {product.isActive ? (
                          <span className="text-green-600 font-semibold">✓ Aktif</span>
                          ) : (
                          <span className="text-red-600 font-semibold">✗ Pasif</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product.id)}
                            className="hover:bg-red-50 hover:text-red-600"
                            >
                            <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredProducts.length > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6">
              {/* Page Info */}
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{filteredProducts.length}</span> üründen{' '}
                  <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span>-
                  <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> arası gösteriliyor
                </p>
                
                {/* Items per page selector */}
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-background"
                >
                  <option value={12}>12 ürün</option>
                  <option value={24}>24 ürün</option>
                  <option value={48}>48 ürün</option>
                  <option value={96}>96 ürün</option>
                </select>
              </div>

              {/* Pagination Buttons - Sadece 1'den fazla sayfa varsa göster */}
              {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 w-9"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="icon"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-9 w-9 ${currentPage === pageNum ? 'bg-gradient-to-r from-blue-700 to-slate-700 text-white' : ''}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 w-9"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              )}
            </div>
          )}
            </CardContent>
          </Card>
    </div>
  );
};

export default ProductsNew;

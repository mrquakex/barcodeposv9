import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Star, StarOff, Barcode, Package, Upload } from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
import FluentBadge from '../components/fluent/FluentBadge';
import { ExcelImport } from '../components/ExcelImport';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
  categoryId?: string;
  category?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

const Products: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 🍎 Apple-style: 12 items per page (3x4 grid)
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

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🍎 Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">{t('products.title')}</h1>
          <p className="fluent-body text-foreground-secondary mt-1">
            {t('products.productsCount', { count: filteredProducts.length })}
          </p>
        </div>
        <div className="flex gap-3">
          <FluentButton
            appearance="subtle"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => setShowExcelImport(true)}
          >
            Excel İçe Aktar
          </FluentButton>
          <FluentButton
            appearance="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowDialog(true)}
          >
            {t('products.addProduct')}
          </FluentButton>
        </div>
      </div>

      {/* Search */}
      <FluentCard depth="depth-4" className="p-4">
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('products.searchPlaceholder') || 'Ürün adı veya barkod ile ara...'}
          icon={<Search className="w-4 h-4" />}
        />
      </FluentCard>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedProducts.map((product) => (
          <FluentCard key={product.id} depth="depth-4" hoverable className="p-4">
            <div className="flex items-start justify-between mb-3">
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
                <span className="text-foreground-secondary">Price</span>
                <span className="text-foreground font-medium">
                  ₺{product.sellPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">Stock</span>
                <FluentBadge
                  appearance={product.stock <= product.minStock ? 'error' : 'success'}
                  size="small"
                >
                  {product.stock} {product.unit}
                </FluentBadge>
              </div>
              {product.category && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Category</span>
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
                Edit
              </FluentButton>
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1 text-destructive hover:bg-destructive/10"
                icon={<Trash2 className="w-3 h-3" />}
                onClick={() => handleDelete(product.id)}
              >
                Delete
              </FluentButton>
            </div>
          </FluentCard>
        ))}
      </div>

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


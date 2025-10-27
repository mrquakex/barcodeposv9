import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, FolderOpen } from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Category {
  id: string;
  name: string;
  _count?: { products: number };
}

interface Product {
  id: string;
  name: string;
  barcode: string;
  sellPrice: number;
  stock: number;
  unit: string;
  isActive: boolean;
}

const Categories: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '' });
  
  // 🍎 Kategori ürünleri modal state'leri
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      toast.error(t('categories.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
        toast.success(t('categories.categoryUpdated'));
      } else {
        await api.post('/categories', formData);
        toast.success(t('categories.categoryCreated'));
      }
      fetchCategories();
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('categories.saveError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('categories.confirmDelete') || 'Bu kategoriyi silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success(t('categories.categoryDeleted'));
      fetchCategories();
    } catch (error) {
      toast.error(t('categories.saveError'));
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCategory(null);
    setFormData({ name: '' });
  };

  // 🍎 Kategori ürünlerini getir
  const handleViewCategoryProducts = async (category: Category) => {
    if (!category._count?.products || category._count.products === 0) {
      toast.error('Bu kategoride ürün bulunmuyor');
      return;
    }

    setSelectedCategory(category);
    setShowProductsModal(true);
    setIsLoadingProducts(true);

    try {
      const response = await api.get(`/categories/${category.id}`);
      setCategoryProducts(response.data.category.products || []);
    } catch (error) {
      toast.error('Ürünler yüklenemedi');
      setShowProductsModal(false);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleCloseProductsModal = () => {
    setShowProductsModal(false);
    setSelectedCategory(null);
    setCategoryProducts([]);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">{t('common.loading') || 'Yükleniyor...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">{t('categories.title')}</h1>
          <p className="fluent-body text-foreground-secondary mt-1">
            {t('categories.categoriesCount', { count: filteredCategories.length })}
          </p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDialog(true)}
        >
          {t('categories.addCategory')}
        </FluentButton>
      </div>

      {/* Search */}
      <FluentCard depth="depth-4" className="p-4">
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('categories.searchPlaceholder') || 'Kategori ara...'}
          icon={<Search className="w-4 h-4" />}
        />
      </FluentCard>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCategories.map((category) => (
          <FluentCard key={category.id} depth="depth-4" hoverable className="p-4">
            {/* 🍎 Tıklanabilir Kategori Başlığı */}
            <div 
              className="flex items-center gap-3 mb-4 cursor-pointer group"
              onClick={() => handleViewCategoryProducts(category)}
            >
              <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                <FolderOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="fluent-body font-medium text-foreground truncate group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h4>
                <p className="fluent-caption text-foreground-secondary">
                  {t('categories.productsCount', { count: category._count?.products || 0 })}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-border">
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1"
                icon={<Edit className="w-3 h-3" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(category);
                }}
              >
                {t('common.edit')}
              </FluentButton>
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1 text-destructive hover:bg-destructive/10"
                icon={<Trash2 className="w-3 h-3" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(category.id);
                }}
              >
                {t('common.delete')}
              </FluentButton>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="fluent-body text-foreground-secondary">
            {searchTerm ? t('categories.noCategoriesFound') : t('categories.noCategoriesYet')}
          </p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <FluentDialog
        open={showDialog}
        onClose={handleCloseDialog}
        title={editingCategory ? t('categories.editCategory') : t('categories.addCategory')}
        size="small"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FluentInput
            label={t('categories.categoryName') || 'Kategori Adı'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('categories.categoryNamePlaceholder') || 'Kategori adı girin...'}
                    required
          />

          <div className="flex gap-2 pt-4">
            <FluentButton appearance="subtle" className="flex-1" onClick={handleCloseDialog}>
              {t('common.cancel') || 'İptal'}
            </FluentButton>
            <FluentButton type="submit" appearance="primary" className="flex-1">
              {editingCategory ? t('common.update') || 'Güncelle' : t('common.create') || 'Oluştur'}
            </FluentButton>
                </div>
              </form>
      </FluentDialog>

      {/* 💠 Kategori Ürünleri Modal - Microsoft Fluent Design */}
      {showProductsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 animate-fade-in">
          <div className="bg-card rounded-md fluent-depth-64 w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-scale-in border border-border">
            {/* Header - Microsoft Fluent Style */}
            <div className="bg-background-alt border-b border-border px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded flex items-center justify-center fluent-depth-4">
                  <FolderOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="fluent-title-2 text-foreground">{selectedCategory?.name}</h2>
                  <p className="fluent-caption text-foreground-secondary">
                    {categoryProducts.length} {t('common.products') || 'Ürün'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseProductsModal}
                className="w-8 h-8 rounded hover:bg-background-tertiary flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-foreground-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
                    </div>

            {/* Products List - Microsoft Fluent Style */}
            <div className="flex-1 overflow-y-auto p-5 bg-background fluent-scrollbar">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 fluent-body text-foreground-secondary">Yükleniyor...</p>
                    </div>
                  </div>
              ) : categoryProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <FolderOpen className="w-16 h-16 text-foreground-tertiary mb-4" />
                  <p className="fluent-body text-foreground-secondary">Bu kategoride ürün bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-card rounded p-4 fluent-depth-4 border border-border hover:fluent-depth-8 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="fluent-subtitle text-foreground truncate mb-1">{product.name}</h3>
                          <div className="flex flex-wrap items-center gap-3 fluent-caption text-foreground-secondary">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                              {product.barcode}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              {product.stock} {product.unit || 'adet'}
                            </span>
                            {!product.isActive && (
                              <span className="px-2 py-0.5 fluent-caption bg-red-50 text-red-700 rounded">
                                İnaktif
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="fluent-title-3 text-primary">
                            {product.sellPrice.toFixed(2)} ₺
                          </p>
                          <p className="fluent-caption text-foreground-tertiary">Satış Fiyatı</p>
                        </div>
                  </div>
                </div>
        ))}
                </div>
              )}
      </div>

            {/* Footer - Microsoft Fluent Style */}
            <div className="bg-background-alt border-t border-border px-5 py-4">
              <FluentButton
                appearance="primary"
                className="w-full"
                onClick={handleCloseProductsModal}
              >
                Kapat
              </FluentButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;


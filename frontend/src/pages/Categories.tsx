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

const Categories: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '' });

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
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="fluent-body font-medium text-foreground truncate">
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
                onClick={() => handleEdit(category)}
              >
                {t('common.edit')}
              </FluentButton>
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1 text-destructive hover:bg-destructive/10"
                icon={<Trash2 className="w-3 h-3" />}
                onClick={() => handleDelete(category.id)}
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
    </div>
  );
};

export default Categories;


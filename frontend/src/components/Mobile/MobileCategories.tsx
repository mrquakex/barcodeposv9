import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { ArrowLeft, Plus, Search, Edit, Trash2, FolderOpen, Package, X } from 'lucide-react';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  description?: string;
  productCount?: number;
}

const MobileCategories: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [swipedCategory, setSwipedCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      toast.error('Kategoriler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent, categoryId: string) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent, categoryId: string) => {
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchStartX.current;

    if (Math.abs(deltaX) > 50) {
      setSwipedCategory(categoryId);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, categoryId: string) => {
    const touchX = e.changedTouches[0].clientX;
    const deltaX = touchX - touchStartX.current;

    if (Math.abs(deltaX) < 10) {
      soundEffects.tap();
      hapticFeedback();
    }
  };

  // Actions
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setSwipedCategory(null);
    soundEffects.tap();
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Kategoriyi silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/categories/${categoryId}`);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      toast.success('Kategori silindi');
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Medium);
    } catch (error) {
      toast.error('Kategori silinemedi');
    }
    setSwipedCategory(null);
  };

  const handleSave = async () => {
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
        toast.success('Kategori güncellendi');
      } else {
        await api.post('/categories', formData);
        toast.success('Kategori eklendi');
      }
      loadCategories();
      setEditingCategory(null);
      setShowAddModal(false);
      setFormData({ name: '', description: '' });
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Medium);
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryColors = [
    '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', 
    '#AF52DE', '#FF2D55', '#A2845E'
  ];

  return (
    <div className="mobile-categories-ultra">
      {/* Header */}
      <div className="mobile-header-ultra">
        <button onClick={() => navigate(-1)} className="back-btn-ultra">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1>Kategoriler</h1>
        <button onClick={() => { setShowAddModal(true); hapticFeedback(); }} className="add-btn-ultra">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Search */}
      <div className="search-bar-ultra">
        <Search className="w-5 h-5 search-icon-ultra" />
        <input
          type="text"
          placeholder="Kategori ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-ultra"
        />
      </div>

      {/* Category List */}
      <div className="category-list-ultra">
        {isLoading ? (
          <div className="loading-ultra">Yükleniyor...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="empty-state-ultra">
            <FolderOpen className="w-16 h-16 opacity-20" />
            <p>Kategori bulunamadı</p>
          </div>
        ) : (
          filteredCategories.map((category, index) => (
            <div
              key={category.id}
              className={`category-item-ultra ${swipedCategory === category.id ? 'swiped' : ''}`}
              onTouchStart={(e) => handleTouchStart(e, category.id)}
              onTouchMove={(e) => handleTouchMove(e, category.id)}
              onTouchEnd={(e) => handleTouchEnd(e, category.id)}
            >
              {/* Swipe Actions */}
              {swipedCategory === category.id && (
                <>
                  <button 
                    className="swipe-action-ultra edit-action"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    className="swipe-action-ultra delete-action"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Category Info */}
              <div className="category-content-ultra">
                <div 
                  className="category-icon-ultra"
                  style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                >
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="category-info-ultra">
                  <h3>{category.name}</h3>
                  {category.description && (
                    <p className="category-desc">{category.description}</p>
                  )}
                </div>
                {category.productCount !== undefined && (
                  <div className="product-count-badge">
                    <Package className="w-4 h-4" />
                    <span>{category.productCount}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingCategory) && (
        <div className="modal-overlay-ultra" onClick={() => { setShowAddModal(false); setEditingCategory(null); }}>
          <div className="modal-ultra" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-ultra">
              <h3>{editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingCategory(null); }} className="close-btn-ultra">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body-ultra">
              <div className="form-group-ultra">
                <label>Kategori Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Kategori adı"
                />
              </div>
              <div className="form-group-ultra">
                <label>Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kategori açıklaması"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer-ultra">
              <button onClick={() => { setShowAddModal(false); setEditingCategory(null); }} className="cancel-btn-ultra">
                İptal
              </button>
              <button onClick={handleSave} className="save-btn-ultra" disabled={!formData.name}>
                {editingCategory ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileCategories;


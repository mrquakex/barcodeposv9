import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { 
  ArrowLeft, Plus, Search, Edit, Trash2, Building2, Phone, 
  Mail, DollarSign, X, PhoneCall
} from 'lucide-react';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import toast from 'react-hot-toast';

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  balance?: number;
}

const MobileSuppliers: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [swipedSupplier, setSwipedSupplier] = useState<string | null>(null);
  const [longPressSupplier, setLongPressSupplier] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  
  const touchStartX = useRef<number>(0);
  const longPressTimer = useRef<any>();

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.suppliers || []);
    } catch (error) {
      toast.error('Tedarikçiler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent, supplierId: string) => {
    touchStartX.current = e.touches[0].clientX;
    
    longPressTimer.current = setTimeout(() => {
      setLongPressSupplier(supplierId);
      hapticFeedback(ImpactStyle.Medium);
      soundEffects.tap();
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent, supplierId: string) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchStartX.current;

    if (Math.abs(deltaX) > 50) {
      setSwipedSupplier(supplierId);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, supplierId: string) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const touchX = e.changedTouches[0].clientX;
    const deltaX = touchX - touchStartX.current;

    if (Math.abs(deltaX) < 10) {
      soundEffects.tap();
      hapticFeedback();
    }
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      toast.error('Telefon numarası yok');
      return;
    }
    window.location.href = `tel:${phone}`;
    hapticFeedback(ImpactStyle.Light);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setSwipedSupplier(null);
    setLongPressSupplier(null);
    soundEffects.tap();
  };

  const handleDelete = async (supplierId: string) => {
    if (!confirm('Tedarikçiyi silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/suppliers/${supplierId}`);
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      toast.success('Tedarikçi silindi');
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Medium);
    } catch (error) {
      toast.error('Tedarikçi silinemedi');
    }
    setSwipedSupplier(null);
  };

  const handleSave = async () => {
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, formData);
        toast.success('Tedarikçi güncellendi');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Tedarikçi eklendi');
      }
      loadSuppliers();
      setEditingSupplier(null);
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Medium);
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone?.includes(searchQuery)
  );

  return (
    <div className="mobile-suppliers-ultra">
      {/* Header */}
      <div className="mobile-header-ultra">
        <button onClick={() => navigate(-1)} className="back-btn-ultra">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1>Tedarikçiler</h1>
        <button onClick={() => { setShowAddModal(true); hapticFeedback(); }} className="add-btn-ultra">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Search */}
      <div className="search-bar-ultra">
        <Search className="w-5 h-5 search-icon-ultra" />
        <input
          type="text"
          placeholder="Tedarikçi ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-ultra"
        />
      </div>

      {/* Supplier List */}
      <div className="supplier-list-ultra">
        {isLoading ? (
          <div className="loading-ultra">Yükleniyor...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="empty-state-ultra">
            <Building2 className="w-16 h-16 opacity-20" />
            <p>Tedarikçi bulunamadı</p>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className={`supplier-item-ultra ${swipedSupplier === supplier.id ? 'swiped' : ''}`}
              onTouchStart={(e) => handleTouchStart(e, supplier.id)}
              onTouchMove={(e) => handleTouchMove(e, supplier.id)}
              onTouchEnd={(e) => handleTouchEnd(e, supplier.id)}
            >
              {/* Swipe Actions */}
              {swipedSupplier === supplier.id && (
                <>
                  <button 
                    className="swipe-action-ultra edit-action"
                    onClick={() => handleEdit(supplier)}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    className="swipe-action-ultra delete-action"
                    onClick={() => handleDelete(supplier.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Supplier Info */}
              <div className="supplier-content-ultra">
                <div className="supplier-icon-ultra">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="supplier-info-ultra">
                  <h3>{supplier.name}</h3>
                  <div className="supplier-meta-ultra">
                    {supplier.phone && (
                      <span className="meta-item">
                        <Phone className="w-3.5 h-3.5" />
                        {supplier.phone}
                      </span>
                    )}
                    {supplier.balance !== undefined && supplier.balance !== 0 && (
                      <span className={`meta-item balance-badge ${supplier.balance < 0 ? 'negative' : 'positive'}`}>
                        <DollarSign className="w-3.5 h-3.5" />
                        ₺{Math.abs(supplier.balance).toFixed(2)} {supplier.balance < 0 ? 'Borç' : 'Alacak'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Long Press Quick Menu */}
      {longPressSupplier && (
        <div className="quick-menu-overlay" onClick={() => setLongPressSupplier(null)}>
          <div className="quick-menu-ultra" onClick={(e) => e.stopPropagation()}>
            {suppliers.find(s => s.id === longPressSupplier)?.phone && (
              <button onClick={() => {
                handleCall(suppliers.find(s => s.id === longPressSupplier)?.phone);
                setLongPressSupplier(null);
              }} className="quick-menu-item">
                <PhoneCall className="w-5 h-5" />
                <span>Ara</span>
              </button>
            )}
            <button onClick={() => {
              const supplier = suppliers.find(s => s.id === longPressSupplier);
              if (supplier) handleEdit(supplier);
            }} className="quick-menu-item">
              <Edit className="w-5 h-5" />
              <span>Düzenle</span>
            </button>
            <button onClick={() => {
              if (longPressSupplier) handleDelete(longPressSupplier);
            }} className="quick-menu-item delete">
              <Trash2 className="w-5 h-5" />
              <span>Sil</span>
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingSupplier) && (
        <div className="modal-overlay-ultra" onClick={() => { setShowAddModal(false); setEditingSupplier(null); }}>
          <div className="modal-ultra" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-ultra">
              <h3>{editingSupplier ? 'Tedarikçiyi Düzenle' : 'Yeni Tedarikçi'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingSupplier(null); }} className="close-btn-ultra">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body-ultra">
              <div className="form-group-ultra">
                <label>Firma Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tedarikçi adı"
                />
              </div>
              <div className="form-group-ultra">
                <label>Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <div className="form-group-ultra">
                <label>E-posta</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ornek@email.com"
                />
              </div>
              <div className="form-group-ultra">
                <label>Adres</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Adres bilgisi"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer-ultra">
              <button onClick={() => { setShowAddModal(false); setEditingSupplier(null); }} className="cancel-btn-ultra">
                İptal
              </button>
              <button onClick={handleSave} className="save-btn-ultra" disabled={!formData.name}>
                {editingSupplier ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileSuppliers;


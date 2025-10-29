import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { 
  ArrowLeft, Plus, Search, Edit, Trash2, User, Mail, Phone, 
  MapPin, DollarSign, X, Star, PhoneCall, MessageCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  debt: number;
  loyaltyPoints: number;
  totalSpent: number;
  isActive?: boolean;
}

const MobileCustomers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [swipedCustomer, setSwipedCustomer] = useState<string | null>(null);
  const [longPressCustomer, setLongPressCustomer] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const longPressTimer = useRef<any>();

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      toast.error('Müşteriler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent, customerId: string) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    
    longPressTimer.current = setTimeout(() => {
      setLongPressCustomer(customerId);
      hapticFeedback(ImpactStyle.Medium);
      soundEffects.tap();
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent, customerId: string) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;

    // Only swipe if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < -50) {
        // Swipe LEFT → Open edit/delete actions
        setSwipedCustomer(customerId);
      } else if (deltaX > 50 && swipedCustomer === customerId) {
        // Swipe RIGHT → Close actions (return to normal)
        setSwipedCustomer(null);
        hapticFeedback(ImpactStyle.Light);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, customerId: string) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const touchX = e.changedTouches[0].clientX;
    const deltaX = touchX - touchStartX.current;

    if (Math.abs(deltaX) < 10) {
      handleCustomerClick(customerId);
    }
  };

  const handleCustomerClick = (customerId: string) => {
    soundEffects.tap();
    hapticFeedback();
    setLongPressCustomer(customerId);
  };

  // Actions
  const handleCall = (phone?: string) => {
    if (!phone) {
      toast.error('Telefon numarası yok');
      return;
    }
    window.location.href = `tel:${phone}`;
    hapticFeedback(ImpactStyle.Light);
  };

  const handleMessage = (phone?: string) => {
    if (!phone) {
      toast.error('Telefon numarası yok');
      return;
    }
    window.location.href = `sms:${phone}`;
    hapticFeedback(ImpactStyle.Light);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setLongPressCustomer(null);
    soundEffects.tap();
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Müşteriyi silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/customers/${customerId}`);
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      toast.success('Müşteri silindi');
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Medium);
    } catch (error) {
      toast.error('Müşteri silinemedi');
    }
    setSwipedCustomer(null);
  };

  const handleSave = async () => {
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Müşteri güncellendi');
      } else {
        await api.post('/customers', formData);
        toast.success('Müşteri eklendi');
      }
      loadCustomers();
      setEditingCustomer(null);
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Medium);
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mobile-customers-ultra">
      {/* Header */}
      <div className="mobile-header-ultra">
        <button onClick={() => navigate(-1)} className="back-btn-ultra">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1>Müşteriler</h1>
        <button onClick={() => { setShowAddModal(true); hapticFeedback(); }} className="add-btn-ultra">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Search */}
      <div className="search-bar-ultra">
        <Search className="w-5 h-5 search-icon-ultra" />
        <input
          type="text"
          placeholder="Müşteri ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-ultra"
        />
      </div>

      {/* Customer List */}
      <div className="customer-list-ultra">
        {isLoading ? (
          <div className="loading-ultra">Yükleniyor...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state-ultra">
            <User className="w-16 h-16 opacity-20" />
            <p>Müşteri bulunamadı</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className={`customer-item-ultra ${swipedCustomer === customer.id ? 'swiped' : ''}`}
              onTouchStart={(e) => handleTouchStart(e, customer.id)}
              onTouchMove={(e) => handleTouchMove(e, customer.id)}
              onTouchEnd={(e) => handleTouchEnd(e, customer.id)}
            >
              {/* Swipe Actions */}
              {swipedCustomer === customer.id && (
                <>
                  <button 
                    className="swipe-action-ultra edit-action"
                    onClick={() => handleEdit(customer)}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    className="swipe-action-ultra delete-action"
                    onClick={() => handleDelete(customer.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Customer Info */}
              <div className="customer-content-ultra">
                <div className="customer-avatar-ultra">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="customer-info-ultra">
                  <h3>{customer.name}</h3>
                  <div className="customer-meta-ultra">
                    {customer.phone && (
                      <span className="meta-item">
                        <Phone className="w-3.5 h-3.5" />
                        {customer.phone}
                      </span>
                    )}
                    {customer.debt > 0 && (
                      <span className="meta-item debt-badge">
                        <DollarSign className="w-3.5 h-3.5" />
                        ₺{customer.debt.toFixed(2)} Borç
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
      {longPressCustomer && (
        <div className="quick-menu-overlay" onClick={() => setLongPressCustomer(null)}>
          <div className="quick-menu-ultra" onClick={(e) => e.stopPropagation()}>
            {customers.find(c => c.id === longPressCustomer)?.phone && (
              <>
                <button onClick={() => {
                  handleCall(customers.find(c => c.id === longPressCustomer)?.phone);
                  setLongPressCustomer(null);
                }} className="quick-menu-item">
                  <PhoneCall className="w-5 h-5" />
                  <span>Ara</span>
                </button>
                <button onClick={() => {
                  handleMessage(customers.find(c => c.id === longPressCustomer)?.phone);
                  setLongPressCustomer(null);
                }} className="quick-menu-item">
                  <MessageCircle className="w-5 h-5" />
                  <span>Mesaj Gönder</span>
                </button>
              </>
            )}
            <button onClick={() => {
              const customer = customers.find(c => c.id === longPressCustomer);
              if (customer) handleEdit(customer);
            }} className="quick-menu-item">
              <Edit className="w-5 h-5" />
              <span>Düzenle</span>
            </button>
            <button onClick={() => {
              if (longPressCustomer) handleDelete(longPressCustomer);
            }} className="quick-menu-item delete">
              <Trash2 className="w-5 h-5" />
              <span>Sil</span>
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingCustomer) && (
        <div className="modal-overlay-ultra" onClick={() => { setShowAddModal(false); setEditingCustomer(null); }}>
          <div className="modal-ultra" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-ultra">
              <h3>{editingCustomer ? 'Müşteriyi Düzenle' : 'Yeni Müşteri'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingCustomer(null); }} className="close-btn-ultra">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body-ultra">
              <div className="form-group-ultra">
                <label>İsim *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Müşteri adı"
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
              <button onClick={() => { setShowAddModal(false); setEditingCustomer(null); }} className="cancel-btn-ultra">
                İptal
              </button>
              <button onClick={handleSave} className="save-btn-ultra" disabled={!formData.name}>
                {editingCustomer ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileCustomers;


import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { 
  ArrowLeft, Plus, Search, Edit, Trash2, User, Mail, Phone, 
  MapPin, DollarSign, X, Star, PhoneCall, MessageCircle, Filter,
  TrendingUp, Receipt, FileText, CreditCard, CheckCircle
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
  
  // 🆕 New features
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vip' | 'debt'>('all');
  
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

  const handleCustomerClick = async (customerId: string) => {
    soundEffects.tap();
    hapticFeedback();
    
    // 🆕 Open detail modal
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setShowDetailModal(true);
      
      // Load customer sales
      try {
        const salesRes = await api.get(`/sales?customerId=${customerId}`);
        setCustomerSales(salesRes.data.sales || []);
      } catch (error) {
        console.log('Sales not available');
      }
    }
  };

  // 🆕 New handlers
  const handleOpenPayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount('');
    setShowPaymentModal(true);
    setShowDetailModal(false);
    soundEffects.tap();
  };

  const handlePayDebt = async () => {
    if (!selectedCustomer || !paymentAmount) return;
    
    try {
      await api.post(`/customers/${selectedCustomer.id}/pay-debt`, {
        amount: parseFloat(paymentAmount),
      });
      toast.success('Ödeme alındı');
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Medium);
      loadCustomers();
      setShowPaymentModal(false);
      setPaymentAmount('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ödeme alınamadı');
    }
  };

  const handleOpenNote = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNoteText('');
    setShowNoteModal(true);
    setShowDetailModal(false);
    soundEffects.tap();
  };

  const handleSaveNote = async () => {
    if (!selectedCustomer || !noteText.trim()) return;
    
    try {
      await api.post(`/customers/${selectedCustomer.id}/notes`, {
        note: noteText,
      });
      toast.success('Not eklendi');
      soundEffects.tap();
      hapticFeedback();
      setShowNoteModal(false);
      setNoteText('');
    } catch (error) {
      toast.error('Not eklenemedi');
    }
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

  // 🆕 Filter logic
  const filteredCustomers = customers
    .filter(customer => {
      // Search filter
      const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Type filter
      if (filterType === 'vip') {
        return customer.totalSpent > 5000; // VIP threshold
      } else if (filterType === 'debt') {
        return customer.debt > 0;
      }
      
      return true; // 'all'
    });

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

      {/* 🆕 Filters */}
      <div className="filter-chips-clean">
        <button
          onClick={() => { setFilterType('all'); hapticFeedback(); }}
          className={`filter-chip-clean ${filterType === 'all' ? 'active' : ''}`}
        >
          Tümü ({customers.length})
        </button>
        <button
          onClick={() => { setFilterType('vip'); hapticFeedback(); }}
          className={`filter-chip-clean ${filterType === 'vip' ? 'active' : ''}`}
        >
          <Star className="w-3.5 h-3.5" />
          VIP ({customers.filter(c => c.totalSpent > 5000).length})
        </button>
        <button
          onClick={() => { setFilterType('debt'); hapticFeedback(); }}
          className={`filter-chip-clean ${filterType === 'debt' ? 'active' : ''}`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Borçlu ({customers.filter(c => c.debt > 0).length})
        </button>
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

      {/* 🆕 Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay-ultra" onClick={() => setShowDetailModal(false)}>
          <div className="modal-ultra detail-modal-clean" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-ultra">
              <h3>{selectedCustomer.name}</h3>
              <button onClick={() => setShowDetailModal(false)} className="close-btn-ultra">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body-ultra">
              {/* Stats */}
              <div className="customer-stats-clean">
                <div className="stat-box-clean">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <div>
                    <p className="stat-label">Toplam Harcama</p>
                    <p className="stat-value">₺{selectedCustomer.totalSpent.toFixed(0)}</p>
                  </div>
                </div>
                {selectedCustomer.debt > 0 && (
                  <div className="stat-box-clean alert">
                    <DollarSign className="w-5 h-5" />
                    <div>
                      <p className="stat-label">Borç</p>
                      <p className="stat-value">₺{selectedCustomer.debt.toFixed(0)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              {(selectedCustomer.phone || selectedCustomer.email) && (
                <div className="contact-info-clean">
                  {selectedCustomer.phone && (
                    <div className="contact-item-clean">
                      <Phone className="w-4 h-4" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="contact-item-clean">
                      <Mail className="w-4 h-4" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Sales History */}
              {customerSales.length > 0 && (
                <div className="sales-history-clean">
                  <h4>Son Satışlar</h4>
                  {customerSales.slice(0, 5).map((sale: any) => (
                    <div key={sale.id} className="sale-item-clean">
                      <Receipt className="w-4 h-4" />
                      <div className="sale-info">
                        <span className="sale-number">#{sale.saleNumber}</span>
                        <span className="sale-date">
                          {new Date(sale.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <span className="sale-total">₺{sale.total.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="detail-actions-clean">
                {selectedCustomer.debt > 0 && (
                  <button 
                    onClick={() => handleOpenPayment(selectedCustomer)}
                    className="action-btn-clean primary"
                  >
                    <CreditCard className="w-5 h-5" />
                    Borç Öde
                  </button>
                )}
                <button 
                  onClick={() => handleOpenNote(selectedCustomer)}
                  className="action-btn-clean secondary"
                >
                  <FileText className="w-5 h-5" />
                  Not Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="modal-overlay-ultra" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-ultra payment-modal-clean" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-ultra">
              <h3>Borç Ödemesi</h3>
              <button onClick={() => setShowPaymentModal(false)} className="close-btn-ultra">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body-ultra">
              <div className="payment-info-clean">
                <p className="customer-name">{selectedCustomer.name}</p>
                <p className="debt-amount">Borç: ₺{selectedCustomer.debt.toFixed(2)}</p>
              </div>
              <div className="form-group-ultra">
                <label>Ödeme Tutarı</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max={selectedCustomer.debt}
                  autoFocus
                />
              </div>
              <div className="quick-amounts-clean">
                <button onClick={() => setPaymentAmount((selectedCustomer.debt / 2).toFixed(2))}>
                  Yarısı
                </button>
                <button onClick={() => setPaymentAmount(selectedCustomer.debt.toFixed(2))}>
                  Tamamı
                </button>
              </div>
            </div>
            <div className="modal-footer-ultra">
              <button onClick={() => setShowPaymentModal(false)} className="cancel-btn-ultra">
                İptal
              </button>
              <button 
                onClick={handlePayDebt} 
                className="save-btn-ultra" 
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                <CheckCircle className="w-5 h-5" />
                Ödemeyi Al
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Note Modal */}
      {showNoteModal && selectedCustomer && (
        <div className="modal-overlay-ultra" onClick={() => setShowNoteModal(false)}>
          <div className="modal-ultra note-modal-clean" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-ultra">
              <h3>Not Ekle</h3>
              <button onClick={() => setShowNoteModal(false)} className="close-btn-ultra">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body-ultra">
              <p className="customer-name-label">{selectedCustomer.name}</p>
              <div className="form-group-ultra">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Müşteri hakkında not..."
                  rows={5}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer-ultra">
              <button onClick={() => setShowNoteModal(false)} className="cancel-btn-ultra">
                İptal
              </button>
              <button 
                onClick={handleSaveNote} 
                className="save-btn-ultra" 
                disabled={!noteText.trim()}
              >
                <FileText className="w-5 h-5" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileCustomers;


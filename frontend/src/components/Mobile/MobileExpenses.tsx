import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { 
  ArrowLeft, Plus, Search, Edit, Trash2, DollarSign, 
  Calendar, FileText, X, TrendingDown
} from 'lucide-react';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import toast from 'react-hot-toast';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category?: string;
  createdAt: string;
}

const MobileExpenses: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [swipedExpense, setSwipedExpense] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: '', category: '' });
  
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data.expenses || []);
    } catch (error) {
      toast.error('Giderler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, expenseId: string) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent, expenseId: string) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;

    // Only swipe if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < -50) {
        // Swipe LEFT → Open edit/delete actions
        setSwipedExpense(expenseId);
      } else if (deltaX > 50 && swipedExpense === expenseId) {
        // Swipe RIGHT → Close actions (return to normal)
        setSwipedExpense(null);
        hapticFeedback(ImpactStyle.Light);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchX = e.changedTouches[0].clientX;
    const deltaX = touchX - touchStartX.current;

    if (Math.abs(deltaX) < 10) {
      soundEffects.tap();
      hapticFeedback();
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category || '',
    });
    setSwipedExpense(null);
    soundEffects.tap();
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Gideri silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/expenses/${expenseId}`);
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      toast.success('Gider silindi');
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Medium);
    } catch (error) {
      toast.error('Gider silinemedi');
    }
    setSwipedExpense(null);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, data);
        toast.success('Gider güncellendi');
      } else {
        await api.post('/expenses', data);
        toast.success('Gider eklendi');
      }
      loadExpenses();
      setEditingExpense(null);
      setShowAddModal(false);
      setFormData({ description: '', amount: '', category: '' });
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Medium);
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="mobile-expenses-ultra">
      {/* Header */}
      <div className="mobile-header-ultra">
        <button onClick={() => navigate(-1)} className="back-btn-ultra">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1>Giderler</h1>
        <button onClick={() => { setShowAddModal(true); hapticFeedback(); }} className="add-btn-ultra">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Search */}
      <div className="search-bar-ultra">
        <Search className="w-5 h-5 search-icon-ultra" />
        <input
          type="text"
          placeholder="Gider ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-ultra"
        />
      </div>

      {/* Stats */}
      <div className="stats-bar-ultra">
        <div className="stat-ultra expense-stat">
          <TrendingDown className="w-5 h-5" />
          <div>
            <span className="stat-label">Toplam Gider</span>
            <span className="stat-value">₺{totalExpenses.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="expense-list-ultra">
        {isLoading ? (
          <div className="loading-ultra">Yükleniyor...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-state-ultra">
            <DollarSign className="w-16 h-16 opacity-20" />
            <p>Gider bulunamadı</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className={`expense-item-ultra ${swipedExpense === expense.id ? 'swiped' : ''}`}
              onTouchStart={(e) => handleTouchStart(e, expense.id)}
              onTouchMove={(e) => handleTouchMove(e, expense.id)}
              onTouchEnd={handleTouchEnd}
            >
              {/* Swipe Actions */}
              {swipedExpense === expense.id && (
                <>
                  <button 
                    className="swipe-action-ultra edit-action"
                    onClick={() => handleEdit(expense)}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    className="swipe-action-ultra delete-action"
                    onClick={() => handleDelete(expense.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Expense Info */}
              <div className="expense-content-ultra">
                <div className="expense-info-ultra">
                  <h3>{expense.description}</h3>
                  <div className="expense-meta-ultra">
                    {expense.category && (
                      <span className="meta-item">
                        <FileText className="w-3.5 h-3.5" />
                        {expense.category}
                      </span>
                    )}
                    <span className="meta-item">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(expense.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
                <div className="expense-amount">
                  <span className="amount-value">₺{expense.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingExpense) && (
        <div className="modal-overlay-ultra" onClick={() => { setShowAddModal(false); setEditingExpense(null); }}>
          <div className="modal-ultra" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-ultra">
              <h3>{editingExpense ? 'Gideri Düzenle' : 'Yeni Gider'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingExpense(null); }} className="close-btn-ultra">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body-ultra">
              <div className="form-group-ultra">
                <label>Açıklama *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Gider açıklaması"
                />
              </div>
              <div className="form-group-ultra">
                <label>Tutar (₺) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group-ultra">
                <label>Kategori</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Kira, Personel, Fatura vb."
                />
              </div>
            </div>
            <div className="modal-footer-ultra">
              <button onClick={() => { setShowAddModal(false); setEditingExpense(null); }} className="cancel-btn-ultra">
                İptal
              </button>
              <button onClick={handleSave} className="save-btn-ultra" disabled={!formData.description || !formData.amount}>
                {editingExpense ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileExpenses;


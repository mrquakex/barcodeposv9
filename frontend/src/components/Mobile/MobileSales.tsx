import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { 
  ArrowLeft, Search, Eye, Share2, DollarSign, Calendar, 
  User, CreditCard, Banknote, FileText, Filter, X
} from 'lucide-react';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import toast from 'react-hot-toast';

interface Sale {
  id: string;
  saleNumber: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  customer?: { name: string };
  items?: Array<{ product: { name: string }; quantity: number; total: number }>;
}

type FilterType = 'all' | 'today' | 'week' | 'month';
type PaymentFilter = 'all' | 'cash' | 'card' | 'credit';

const MobileSales: React.FC = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [swipedSale, setSwipedSale] = useState<string | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [stats, setStats] = useState({ total: 0, count: 0, average: 0 });
  
  const touchStartX = useRef<number>(0);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  useEffect(() => {
    loadSales();
  }, [filterType, paymentFilter]);

  const loadSales = async () => {
    try {
      console.log('🔄 Loading sales...');
      const params: any = {};
      
      if (filterType !== 'all') {
        const now = new Date();
        if (filterType === 'today') {
          params.startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        } else if (filterType === 'week') {
          params.startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        } else if (filterType === 'month') {
          params.startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        }
      }

      console.log('📤 Request params:', params);
      const response = await api.get('/sales', { params });
      console.log('📦 API response:', response.data);
      
      // Backend can return either {sales: [...]} or direct array
      let salesData = Array.isArray(response.data) ? response.data : (response.data.sales || []);
      console.log(`✅ Loaded ${salesData.length} sales`);

      // Filter by payment method
      if (paymentFilter !== 'all') {
        salesData = salesData.filter((sale: Sale) => 
          sale.paymentMethod.toLowerCase() === paymentFilter
        );
        console.log(`🔍 After payment filter: ${salesData.length} sales`);
      }

      setSales(salesData);
      
      // 🆕 Calculate stats
      const total = salesData.reduce((sum: number, sale: Sale) => sum + sale.total, 0);
      const count = salesData.length;
      const average = count > 0 ? total / count : 0;
      setStats({ total, count, average });
    } catch (error) {
      console.error('❌ Load sales error:', error);
      toast.error('Satışlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent, saleId: string) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent, saleId: string) => {
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchStartX.current;

    if (Math.abs(deltaX) > 50) {
      setSwipedSale(saleId);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, saleId: string) => {
    const touchX = e.changedTouches[0].clientX;
    const deltaX = touchX - touchStartX.current;

    if (Math.abs(deltaX) < 10) {
      handleSaleClick(saleId);
    }
  };

  const handleSaleClick = (saleId: string) => {
    soundEffects.tap();
    hapticFeedback();
    const sale = sales.find(s => s.id === saleId);
    if (sale) setViewingSale(sale);
  };

  const handleShare = async (sale: Sale) => {
    try {
      const text = `
🧾 SATIŞ FİŞİ
━━━━━━━━━━━━━━━━
Fiş No: ${sale.saleNumber}
Tarih: ${new Date(sale.createdAt).toLocaleDateString('tr-TR')}
${sale.customer ? `Müşteri: ${sale.customer.name}` : ''}
━━━━━━━━━━━━━━━━
${sale.items?.map(item => `${item.product.name} x${item.quantity} - ₺${item.total.toFixed(2)}`).join('\n') || ''}
━━━━━━━━━━━━━━━━
TOPLAM: ₺${sale.total.toFixed(2)}
Ödeme: ${sale.paymentMethod === 'cash' ? 'Nakit' : sale.paymentMethod === 'card' ? 'Kart' : 'Veresiye'}
      `.trim();

      await Share.share({
        title: `Satış Fişi - ${sale.saleNumber}`,
        text: text,
        dialogTitle: 'Satış Fişini Paylaş',
      });

      hapticFeedback(ImpactStyle.Light);
      soundEffects.tap();
    } catch (error) {
      console.error('Share error:', error);
    }
    setSwipedSale(null);
  };

  const handleView = (sale: Sale) => {
    setViewingSale(sale);
    setSwipedSale(null);
    hapticFeedback();
  };

  const filteredSales = sales.filter(sale =>
    sale.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <div className="mobile-sales-ultra">
      {/* Header */}
      <div className="mobile-header-ultra">
        <button onClick={() => navigate(-1)} className="back-btn-ultra">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1>Satışlar</h1>
        <button onClick={() => { setShowFilters(!showFilters); hapticFeedback(); }} className="filter-btn-ultra">
          <Filter className="w-6 h-6" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="filters-section-ultra">
          <div className="filter-chips-ultra">
            <button 
              className={`chip-ultra ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => { setFilterType('all'); hapticFeedback(); }}
            >
              Tümü
            </button>
            <button 
              className={`chip-ultra ${filterType === 'today' ? 'active' : ''}`}
              onClick={() => { setFilterType('today'); hapticFeedback(); }}
            >
              Bugün
            </button>
            <button 
              className={`chip-ultra ${filterType === 'week' ? 'active' : ''}`}
              onClick={() => { setFilterType('week'); hapticFeedback(); }}
            >
              Bu Hafta
            </button>
            <button 
              className={`chip-ultra ${filterType === 'month' ? 'active' : ''}`}
              onClick={() => { setFilterType('month'); hapticFeedback(); }}
            >
              Bu Ay
            </button>
          </div>
          <div className="filter-chips-ultra">
            <button 
              className={`chip-ultra ${paymentFilter === 'all' ? 'active' : ''}`}
              onClick={() => { setPaymentFilter('all'); hapticFeedback(); }}
            >
              Tüm Ödemeler
            </button>
            <button 
              className={`chip-ultra ${paymentFilter === 'cash' ? 'active' : ''}`}
              onClick={() => { setPaymentFilter('cash'); hapticFeedback(); }}
            >
              Nakit
            </button>
            <button 
              className={`chip-ultra ${paymentFilter === 'card' ? 'active' : ''}`}
              onClick={() => { setPaymentFilter('card'); hapticFeedback(); }}
            >
              Kart
            </button>
            <button 
              className={`chip-ultra ${paymentFilter === 'credit' ? 'active' : ''}`}
              onClick={() => { setPaymentFilter('credit'); hapticFeedback(); }}
            >
              Veresiye
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="search-bar-ultra">
        <Search className="w-5 h-5 search-icon-ultra" />
        <input
          type="text"
          placeholder="Satış ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-ultra"
        />
      </div>

      {/* Stats */}
      <div className="stats-bar-ultra">
        <div className="stat-ultra">
          <span className="stat-label">Toplam Satış</span>
          <span className="stat-value">{filteredSales.length}</span>
        </div>
        <div className="stat-ultra">
          <span className="stat-label">Toplam Ciro</span>
          <span className="stat-value">₺{totalRevenue.toFixed(2)}</span>
        </div>
      </div>

      {/* Sales List */}
      <div className="sales-list-ultra">
        {isLoading ? (
          <div className="loading-ultra">Yükleniyor...</div>
        ) : filteredSales.length === 0 ? (
          <div className="empty-state-ultra">
            <FileText className="w-16 h-16 opacity-20" />
            <p>Satış bulunamadı</p>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div
              key={sale.id}
              className={`sale-item-ultra ${swipedSale === sale.id ? 'swiped' : ''}`}
              onTouchStart={(e) => handleTouchStart(e, sale.id)}
              onTouchMove={(e) => handleTouchMove(e, sale.id)}
              onTouchEnd={(e) => handleTouchEnd(e, sale.id)}
            >
              {/* Swipe Actions */}
              {swipedSale === sale.id && (
                <>
                  <button 
                    className="swipe-action-ultra view-action"
                    onClick={() => handleView(sale)}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button 
                    className="swipe-action-ultra share-action"
                    onClick={() => handleShare(sale)}
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Sale Info */}
              <div className="sale-content-ultra">
                <div className="sale-header-ultra">
                  <span className="sale-number">#{sale.saleNumber}</span>
                  <span className="sale-total">₺{sale.total.toFixed(2)}</span>
                </div>
                <div className="sale-meta-ultra">
                  <span className="meta-item">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(sale.createdAt).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {sale.customer && (
                    <span className="meta-item">
                      <User className="w-3.5 h-3.5" />
                      {sale.customer.name}
                    </span>
                  )}
                  <span className={`payment-badge ${sale.paymentMethod.toLowerCase()}`}>
                    {sale.paymentMethod === 'cash' ? (
                      <><Banknote className="w-3.5 h-3.5" /> Nakit</>
                    ) : sale.paymentMethod === 'card' ? (
                      <><CreditCard className="w-3.5 h-3.5" /> Kart</>
                    ) : (
                      <><FileText className="w-3.5 h-3.5" /> Veresiye</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sale Detail Modal */}
      {viewingSale && (
        <div className="modal-overlay-ultra" onClick={() => setViewingSale(null)}>
          <div className="modal-ultra sale-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-ultra">
              <h3>Satış Detayı</h3>
              <button onClick={() => setViewingSale(null)} className="close-btn-ultra">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body-ultra">
              <div className="detail-row-ultra">
                <span className="detail-label">Fiş No:</span>
                <span className="detail-value">#{viewingSale.saleNumber}</span>
              </div>
              <div className="detail-row-ultra">
                <span className="detail-label">Tarih:</span>
                <span className="detail-value">
                  {new Date(viewingSale.createdAt).toLocaleString('tr-TR')}
                </span>
              </div>
              {viewingSale.customer && (
                <div className="detail-row-ultra">
                  <span className="detail-label">Müşteri:</span>
                  <span className="detail-value">{viewingSale.customer.name}</span>
                </div>
              )}
              <div className="detail-row-ultra">
                <span className="detail-label">Ödeme:</span>
                <span className="detail-value">
                  {viewingSale.paymentMethod === 'cash' ? 'Nakit' :
                   viewingSale.paymentMethod === 'card' ? 'Kart' : 'Veresiye'}
                </span>
              </div>
              
              {viewingSale.items && viewingSale.items.length > 0 && (
                <>
                  <div className="divider-ultra" />
                  <h4 className="items-title-ultra">Ürünler</h4>
                  <div className="items-list-ultra">
                    {viewingSale.items.map((item, idx) => (
                      <div key={idx} className="item-row-ultra">
                        <span className="item-name">{item.product.name}</span>
                        <span className="item-quantity">x{item.quantity}</span>
                        <span className="item-total">₺{item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="divider-ultra" />
                </>
              )}
              
              <div className="detail-row-ultra total-row">
                <span className="detail-label">TOPLAM:</span>
                <span className="detail-value total">₺{viewingSale.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="modal-footer-ultra">
              <button onClick={() => handleShare(viewingSale)} className="share-btn-ultra">
                <Share2 className="w-5 h-5" />
                Paylaş
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileSales;


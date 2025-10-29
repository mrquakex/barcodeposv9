import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { 
  Camera, ShoppingCart, Trash2, Plus, Minus, X, 
  ArrowLeft, CheckCircle2, WifiOff, RotateCcw, Bell,
  DollarSign, CreditCard, User, Users, Calculator,
  MessageSquare, Send, Mail, MessageCircle, Printer
} from 'lucide-react';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  stock?: number;
  note?: string;
}

interface QuickProduct {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  icon: string;
}

type PaymentMode = 'simple' | 'smart-change' | 'split' | 'multiple';

const MobilePOS: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showCartDetail, setShowCartDetail] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleTotal, setLastSaleTotal] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [quickProducts, setQuickProducts] = useState<QuickProduct[]>([]);
  const [stockWarning, setStockWarning] = useState<string | null>(null);

  // Payment modes
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('simple');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [splitPeople, setSplitPeople] = useState(2);
  const [multiplePayments, setMultiplePayments] = useState<{method: string; amount: number}[]>([]);
  
  // Note system
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Receipt sharing
  const [showReceiptShare, setShowReceiptShare] = useState(false);

  // Gesture handling
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);
  const [actionHistory, setActionHistory] = useState<Array<{ type: string; data: any }>>([]);

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = receivedAmount ? parseFloat(receivedAmount) - total : 0;

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  // Check online status
  useEffect(() => {
    const checkConnection = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  // Gesture handlers
  const undoLastAction = () => {
    if (actionHistory.length === 0) return;
    const lastAction = actionHistory[actionHistory.length - 1];
    
    if (lastAction.type === 'add_item') {
      removeItem(lastAction.data.barcode);
    } else if (lastAction.type === 'remove_item') {
      addToCart(lastAction.data);
    }
    
    setActionHistory(prev => prev.slice(0, -1));
    toast.success('Geri alındı!', { duration: 1500 });
    hapticFeedback(ImpactStyle.Medium);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    // Check if tap is on empty area (not on buttons or products)
    const target = e.target as HTMLElement;
    const isEmptyArea = !target.closest('button') && 
                        !target.closest('.quick-item-main') && 
                        !target.closest('.detail-item-pro') &&
                        !target.closest('.pay-btn-pro');

    // Double tap detection (only on empty area)
    if (deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && isEmptyArea) {
      if (Date.now() - lastTap < 500) {
        handleDoubleTap();
      }
      setLastTap(Date.now());
    }

    // Swipe detection (min 50px, max 500ms)
    if (deltaTime < 500) {
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 50) {
        if (deltaX > 0) {
          handleSwipeRight();
        } else {
          handleSwipeLeft();
        }
      } else if (Math.abs(deltaY) > 50 && Math.abs(deltaX) < 50) {
        if (deltaY > 0) {
          handleSwipeDown();
        } else {
          handleSwipeUp();
        }
      }
    }

    setTouchStart(null);
  };

  const handleDoubleTap = () => {
    if (cartItems.length > 0) {
      setShowCartDetail(true);
      hapticFeedback(ImpactStyle.Light);
      soundEffects.tap();
    }
  };

  const handleSwipeRight = () => {
    if (cartItems.length > 0) {
      undoLastAction();
    }
  };

  const handleSwipeLeft = () => {
    if (cartItems.length > 0) {
      setShowCartDetail(true);
      hapticFeedback(ImpactStyle.Light);
    }
  };

  const handleSwipeUp = () => {
    if (cartItems.length > 0) {
      setShowCartDetail(true);
      hapticFeedback(ImpactStyle.Light);
    }
  };

  const handleSwipeDown = () => {
    if (showCartDetail) {
      setShowCartDetail(false);
      hapticFeedback(ImpactStyle.Light);
    }
  };

  // Shake detection
  useEffect(() => {
    let lastShake = 0;
    const handleShake = (e: DeviceMotionEvent) => {
      if (!e.acceleration) return;
      
      const { x, y, z } = e.acceleration;
      const acceleration = Math.sqrt((x || 0) ** 2 + (y || 0) ** 2 + (z || 0) ** 2);
      
      if (acceleration > 15 && Date.now() - lastShake > 1000) {
        lastShake = Date.now();
        if (cartItems.length > 0 && actionHistory.length > 0) {
          // Güçlü titreşim!
          hapticFeedback(ImpactStyle.Heavy);
          soundEffects.tap();
          undoLastAction();
        }
      }
    };

    window.addEventListener('devicemotion', handleShake as any);
    return () => window.removeEventListener('devicemotion', handleShake as any);
  }, [cartItems, actionHistory]);

  // Load quick products
  useEffect(() => {
    loadQuickProducts();
  }, []);

  const loadQuickProducts = async () => {
    try {
      // Load real products from API (first 8 products)
      const response = await api.get('/products');
      const products = response.data.products || [];
      
      // Map to quick products format with emoji
      const quickProds: QuickProduct[] = products.slice(0, 8).map((p: any) => ({
        id: p.id, // ✅ Real UUID from database!
        barcode: p.barcode,
        name: p.name,
        price: p.sellPrice,
        stock: p.stock,
        icon: getCategoryEmoji(p.category?.name)
      }));
      
      setQuickProducts(quickProds);
    } catch (error) {
      console.error('Quick products load error:', error);
      // Don't show quick products if API fails
      setQuickProducts([]);
    }
  };

  // Get emoji based on category name
  const getCategoryEmoji = (categoryName?: string): string => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('içecek') || name.includes('drink')) return '🥤';
    if (name.includes('gıda') || name.includes('food')) return '🍞';
    if (name.includes('süt') || name.includes('milk')) return '🥛';
    if (name.includes('çikolata') || name.includes('chocolate')) return '🍫';
    if (name.includes('çay') || name.includes('tea')) return '☕';
    if (name.includes('kahve') || name.includes('coffee')) return '☕';
    if (name.includes('su') || name.includes('water')) return '💧';
    if (name.includes('meyve') || name.includes('fruit')) return '🍊';
    return '📦'; // Default
  };

  const startScan = async () => {
    if (isScanning) return;
    
    try {
      setIsScanning(true);
      hapticFeedback(ImpactStyle.Light);
      soundEffects.beep();
      
      const permissionResult = await BarcodeScanner.checkPermissions();
      if (permissionResult.camera !== 'granted') {
        const result = await BarcodeScanner.requestPermissions();
        if (result.camera !== 'granted') {
          toast.error('Kamera izni gerekli');
          setIsScanning(false);
          return;
        }
      }
      
      toast('📸 Kamera açılıyor...', { duration: 800 });
      const scanResult = await BarcodeScanner.scan();
      
      if (scanResult.barcodes && scanResult.barcodes.length > 0) {
        const barcode = scanResult.barcodes[0].displayValue || scanResult.barcodes[0].rawValue;
        if (barcode) {
          await addProductByBarcode(barcode);
          hapticFeedback(ImpactStyle.Medium);
          soundEffects.cashRegister();
        }
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      if (!error.message?.toLowerCase().includes('cancel')) {
        toast.error('Tarama hatası');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const addProductByBarcode = async (barcode: string) => {
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data;
      
      if (!product) {
        toast.error('Ürün bulunamadı');
        soundEffects.error();
        return;
      }

      if (product.stock && product.stock <= 15) {
        setStockWarning(`${product.name} - Kalan: ${product.stock} adet`);
        setTimeout(() => setStockWarning(null), 5000);
      }

      addToCart({
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        price: product.sellPrice,
        quantity: 1,
        stock: product.stock
      });
      
    } catch (error: any) {
      console.error('Product fetch error:', error);
      toast.error('Ürün bulunamadı');
      soundEffects.error();
    }
  };

  const addQuickProduct = (product: QuickProduct) => {
    if (product.stock && product.stock <= 15) {
      setStockWarning(`${product.name} - Kalan: ${product.stock} adet`);
      setTimeout(() => setStockWarning(null), 5000);
    }

    addToCart({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      price: product.price,
      quantity: 1,
      stock: product.stock
    });
    
    hapticFeedback();
    soundEffects.tap();
  };

  const addToCart = (item: CartItem) => {
    const existingItem = cartItems.find(i => i.barcode === item.barcode);
    
    if (existingItem) {
      setCartItems(prev => prev.map(i => 
        i.barcode === item.barcode 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
      toast.success(`${item.name} +1`, { duration: 1500 });
    } else {
      setCartItems(prev => [...prev, item]);
      toast.success(`✅ ${item.name} eklendi`, { duration: 2000 });
    }
    
    // Add to action history
    setActionHistory(prev => [...prev, { type: 'add_item', data: item }]);
  };

  const updateQuantity = (barcode: string, delta: number) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item.barcode === barcode) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
      
      return updated;
    });
    
    soundEffects.tap();
    hapticFeedback();
  };

  const removeItem = (barcode: string) => {
    const item = cartItems.find(i => i.barcode === barcode);
    if (item) {
      setActionHistory(prev => [...prev, { type: 'remove_item', data: item }]);
    }
    
    setCartItems(prev => prev.filter(item => item.barcode !== barcode));
    toast.success('Ürün silindi', { duration: 1000 });
    soundEffects.tap();
    hapticFeedback(ImpactStyle.Medium);
  };

  const clearCart = () => {
    if (cartItems.length === 0) return;
    
    if (confirm('Sepeti temizlemek istediğinize emin misiniz?')) {
      setCartItems([]);
      toast.success('Sepet temizlendi');
      soundEffects.tap();
      hapticFeedback(ImpactStyle.Heavy);
    }
  };

  const updateItemNote = (barcode: string, note: string) => {
    setCartItems(prev => prev.map(item =>
      item.barcode === barcode ? { ...item, note } : item
    ));
    setEditingNote(null);
    setNoteText('');
    toast.success('Not eklendi');
    hapticFeedback();
  };

  const completeSale = async (paymentMethod: 'CASH' | 'CARD' | 'CREDIT') => {
    if (cartItems.length === 0) {
      toast.error('Sepet boş!');
      soundEffects.error();
      return;
    }

    try {
      hapticFeedback(ImpactStyle.Medium);
      
      const paymentNames = { CASH: 'Nakit', CARD: 'Kart', CREDIT: 'Veresiye' };
      console.log('🔥 Satış başlatılıyor:', paymentMethod, paymentNames[paymentMethod]);
      
      // TOKEN KONTROLÜ
      const token = localStorage.getItem('token');
      console.log('🔑 Token var mı?', token ? 'EVET ✅' : 'HAYIR ❌');
      console.log('🌐 Backend URL:', 'https://api.barcodepos.trade/api/sales');
      
      if (!token) {
        toast.error('❌ TOKEN YOK! Lütfen önce giriş yapın!', { duration: 4000 });
        soundEffects.error();
        hapticFeedback(ImpactStyle.Heavy);
        setTimeout(() => navigate('/login'), 1000);
        return;
      }
      
      toast.success(`✅ Token OK! Satış başlıyor...`, { duration: 1000 });
      
      setTimeout(() => {
        toast.loading(`${paymentNames[paymentMethod]} ile ödeme yapılıyor...`, { duration: 2000 });
      }, 100);

      const saleData = {
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,  // ✅ Backend unitPrice bekliyor!
          taxRate: 0,  // ✅ Vergi oranı (şimdilik 0)
        })),
        paymentMethod,
        subtotal: total,  // ✅ Backend subtotal bekliyor
        taxAmount: 0,  // ✅ Vergi tutarı (şimdilik 0)
        total
      };

      console.log('📦 Gönderilen veri:', JSON.stringify(saleData, null, 2));

      const response = await api.post('/sales', saleData);
      
      console.log('✅ API yanıtı:', response.data);
      
      setLastSaleTotal(total);
      setShowSuccess(true);
      setShowCartDetail(false);
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Heavy);
      
      setCartItems([]);
      setReceivedAmount('');
      setPaymentMode('simple');
      
      setTimeout(() => {
        setShowReceiptShare(true);
      }, 2000);
      
      toast.success('Satış tamamlandı! 🎉', { duration: 2000 });
      
    } catch (error: any) {
      console.error('❌ Satış hatası:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error status:', error.response?.status);
      
      const errorMsg = error.response?.data?.message || error.message || 'Satış kaydedilemedi!';
      toast.error(`Hata: ${errorMsg}`, { duration: 4000 });
      soundEffects.error();
      hapticFeedback(ImpactStyle.Heavy);
    }
  };

  // Smart change calculation
  const calculateSmartChange = (amount: number): string[] => {
    const bills = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.25, 0.10, 0.05, 0.01];
    const result: string[] = [];
    let remaining = amount;

    bills.forEach(bill => {
      const count = Math.floor(remaining / bill);
      if (count > 0) {
        result.push(`${count}x ${bill >= 1 ? bill + '₺' : (bill * 100) + 'kr'}`);
        remaining = Math.round((remaining - (bill * count)) * 100) / 100;
      }
    });

    return result;
  };

  // Share receipt
  const shareReceipt = async (method: string) => {
    const receipt = `
🧾 BarcodePOS PRO
━━━━━━━━━━━━━━━━━━━━
${cartItems.map(item => `${item.name}\n${item.quantity} x ₺${item.price.toFixed(2)} = ₺${(item.price * item.quantity).toFixed(2)}`).join('\n\n')}
━━━━━━━━━━━━━━━━━━━━
TOPLAM: ₺${lastSaleTotal.toFixed(2)}

Teşekkür ederiz! 🙏
`.trim();

    try {
      if (method === 'share' && Capacitor.isNativePlatform()) {
        await Share.share({
          title: 'Fiş',
          text: receipt,
          dialogTitle: 'Fişi Paylaş'
        });
      } else {
        // Web için clipboard
        await navigator.clipboard.writeText(receipt);
        toast.success('Fiş kopyalandı!');
      }
      
      hapticFeedback();
      soundEffects.tap();
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Paylaşılamadı');
    }
  };

  // Success Screen with Receipt Share
  if (showSuccess) {
    return (
      <div className="mobile-pos-success">
        <div className="success-content-pro">
          <div className="success-icon-pro">
            <CheckCircle2 className="w-20 h-20" />
          </div>
          <h1 className="success-title-pro">Satış Tamamlandı!</h1>
          <p className="success-amount-pro">₺{lastSaleTotal.toFixed(2)}</p>
          <p className="success-subtitle-pro">Ödeme başarıyla alındı</p>
          
          {showReceiptShare && (
            <div className="receipt-share-pro">
              <p className="share-title-pro">📤 Fiş Gönder:</p>
              <div className="share-buttons-pro">
                <button onClick={() => shareReceipt('share')} className="share-btn-pro whatsapp">
                  <MessageCircle className="w-5 h-5" />
                  <span>Paylaş</span>
                </button>
                <button onClick={() => shareReceipt('copy')} className="share-btn-pro mail">
                  <Mail className="w-5 h-5" />
                  <span>Kopyala</span>
                </button>
                <button onClick={() => toast('Yazıcı özelliği yakında!', {icon: '🖨️'})} className="share-btn-pro print">
                  <Printer className="w-5 h-5" />
                  <span>Yazdır</span>
                </button>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => {
              setShowSuccess(false);
              setShowReceiptShare(false);
            }}
            className="success-btn-pro"
          >
            Yeni Satışa Başla
          </button>
        </div>
      </div>
    );
  }

  // Full Screen Cart Detail
  if (showCartDetail) {
    return (
      <div className="mobile-pos-detail">
        {/* Header */}
        <div className="detail-header-pro">
          <button onClick={() => setShowCartDetail(false)} className="back-btn-detail">
            <ArrowLeft className="w-5 h-5" />
            <span>Geri</span>
          </button>
          <h2>SEPET</h2>
          <button onClick={clearCart} className="clear-btn-detail" disabled={cartItems.length === 0}>
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="detail-items-pro">
          {cartItems.map((item) => (
            <div key={item.barcode} className="detail-item-pro">
              <div className="item-top-pro">
                <div className="item-info-detail">
                  <h3>{item.name}</h3>
                  <p className="item-calc">{item.quantity} x ₺{item.price.toFixed(2)}</p>
                  {item.stock && item.stock <= 15 && (
                    <p className="item-stock-warn">⚠️ Stok: {item.stock}</p>
                  )}
                  {item.note && (
                    <p className="item-note">📝 {item.note}</p>
                  )}
                </div>
                <p className="item-total-detail">₺{(item.price * item.quantity).toFixed(2)}</p>
              </div>
              
              <div className="item-actions-detail">
                <button onClick={() => updateQuantity(item.barcode, -1)} className="qty-btn-detail minus">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="qty-display-detail">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.barcode, 1)} className="qty-btn-detail plus">
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    setEditingNote(item.barcode);
                    setNoteText(item.note || '');
                  }} 
                  className="note-btn-detail"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button onClick={() => removeItem(item.barcode)} className="remove-btn-detail">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Note Edit */}
              {editingNote === item.barcode && (
                <div className="note-edit-pro">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Not ekle..."
                    className="note-input-pro"
                    autoFocus
                  />
                  <button onClick={() => updateItemNote(item.barcode, noteText)} className="note-save-pro">
                    Kaydet
                  </button>
                  <button onClick={() => setEditingNote(null)} className="note-cancel-pro">
                    İptal
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Total & Payment */}
        <div className="detail-payment-pro">
          <div className="total-section-pro">
            <span>TOPLAM</span>
            <span className="total-amount-pro">₺{total.toFixed(2)}</span>
          </div>

          {/* Payment Mode Selector */}
          <div className="payment-mode-selector">
            <button
              onClick={() => setPaymentMode('simple')}
              className={`mode-btn ${paymentMode === 'simple' ? 'active' : ''}`}
            >
              Basit
            </button>
            <button
              onClick={() => setPaymentMode('smart-change')}
              className={`mode-btn ${paymentMode === 'smart-change' ? 'active' : ''}`}
            >
              <Calculator className="w-4 h-4" />
              Para Üstü
            </button>
            <button
              onClick={() => setPaymentMode('split')}
              className={`mode-btn ${paymentMode === 'split' ? 'active' : ''}`}
            >
              <Users className="w-4 h-4" />
              Böl
            </button>
          </div>

          {/* Smart Change Mode */}
          {paymentMode === 'smart-change' && (
            <div className="smart-change-pro">
              <div className="change-input-pro">
                <label>Alınan:</label>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="0"
                  className="amount-input-pro"
                />
              </div>
              
              {change > 0 && (
                <div className="change-result-pro">
                  <p className="change-amount">Para Üstü: ₺{change.toFixed(2)}</p>
                  <div className="smart-breakdown">
                    <p className="breakdown-title">💡 Vermek için:</p>
                    {calculateSmartChange(change).map((item, i) => (
                      <span key={i} className="breakdown-item">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="quick-amounts-pro">
                {[50, 100, 150, 200, 500].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setReceivedAmount(amount.toString())}
                    className="quick-amount-btn"
                  >
                    {amount}₺
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Split Payment Mode */}
          {paymentMode === 'split' && (
            <div className="split-payment-pro">
              <div className="split-people-pro">
                <label>Kişi sayısı:</label>
                <div className="people-control">
                  <button onClick={() => setSplitPeople(Math.max(2, splitPeople - 1))} className="people-btn">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="people-count">{splitPeople}</span>
                  <button onClick={() => setSplitPeople(splitPeople + 1)} className="people-btn">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="split-amount-pro">Kişi başı: ₺{(total / splitPeople).toFixed(2)}</p>
            </div>
          )}

          {/* Payment Buttons */}
          <div className="payment-buttons-pro">
            <button onClick={() => completeSale('CASH')} className="pay-btn-pro cash">
              <DollarSign className="w-5 h-5" />
              <span>Nakit</span>
            </button>
            <button onClick={() => completeSale('CARD')} className="pay-btn-pro card">
              <CreditCard className="w-5 h-5" />
              <span>Kart</span>
            </button>
            <button onClick={() => completeSale('CREDIT')} className="pay-btn-pro credit">
              <User className="w-5 h-5" />
              <span>Veresiye</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main POS Screen
  return (
    <div 
      className="mobile-pos-main"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="pos-header-main">
        <div className="header-left-main">
          <h1>BarcodePOS PRO</h1>
          {!isOnline && (
            <div className="offline-badge">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}
        </div>
        <div className="header-actions-main">
          <button 
            onClick={undoLastAction} 
            className="icon-btn-main" 
            disabled={actionHistory.length === 0}
            title="Geri Al (Sağa Kaydır / Salla)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={clearCart} className="icon-btn-main" disabled={cartItems.length === 0}>
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stock Warning */}
      {stockWarning && (
        <div className="stock-warning-banner">
          <Bell className="w-4 h-4" />
          <span>{stockWarning}</span>
          <button onClick={() => setStockWarning(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Empty State or Quick Products */}
      {cartItems.length === 0 ? (
        <div className="empty-state-main">
          <ShoppingCart className="w-16 h-16 empty-icon-main" />
          <h2>Sepetiniz boş</h2>
          <p>Barkod okutarak veya sık satanlardan seçerek satışa başlayın</p>
        </div>
      ) : null}

      {/* Quick Products */}
      <div className="quick-products-main">
        <h3>⭐ Sık Satanlar</h3>
        <div className="quick-grid-main">
          {quickProducts.slice(0, 8).map((product) => (
            <button
              key={product.id}
              onClick={() => addQuickProduct(product)}
              className="quick-item-main"
            >
              <span className="quick-icon">{product.icon}</span>
              <span className="quick-name">{product.name}</span>
              <span className="quick-price">₺{product.price}</span>
              {product.stock <= 15 && (
                <span className="quick-stock-warn">⚠️</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Cart */}
      {cartItems.length > 0 && (
        <button 
          onClick={() => setShowCartDetail(true)}
          className="mini-cart-main"
        >
          <div className="mini-cart-left">
            <ShoppingCart className="w-5 h-5" />
            <span>{cartItems.length} ürün</span>
          </div>
          <div className="mini-cart-right">
            <span className="mini-cart-total">₺{total.toFixed(2)}</span>
            <span className="mini-cart-arrow">▲</span>
          </div>
        </button>
      )}

      {/* FAB */}
      <button 
        onClick={startScan}
        disabled={isScanning}
        className="fab-scan-main"
      >
        <Camera className="w-6 h-6" />
        <span>{isScanning ? 'Taranıyor...' : 'TARA'}</span>
      </button>
    </div>
  );
};

export default MobilePOS;

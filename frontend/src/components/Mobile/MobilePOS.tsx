import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { 
  Camera, ShoppingCart, Trash2, Plus, Minus, X, 
  ArrowLeft, CheckCircle2, Info, Bell, Wifi, WifiOff,
  RotateCcw, MessageSquare, DollarSign, CreditCard, User, Users
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

  // Gesture state
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [shakeCount, setShakeCount] = useState(0);

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  // Check online status
  useEffect(() => {
    const checkConnection = () => {
      setIsOnline(navigator.onLine);
    };
    
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  // Load quick products
  useEffect(() => {
    loadQuickProducts();
  }, []);

  // Shake to undo (Gesture #8)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleShake = (event: any) => {
      if (event.acceleration.x > 15 || event.acceleration.y > 15 || event.acceleration.z > 15) {
        setShakeCount(prev => prev + 1);
        
        if (shakeCount >= 2) {
          undoLastAction();
          setShakeCount(0);
        }
      }
    };

    window.addEventListener('devicemotion', handleShake);
    return () => window.removeEventListener('devicemotion', handleShake);
  }, [shakeCount, cartItems]);

  const loadQuickProducts = async () => {
    try {
      // Mock data - gerçekte API'den gelecek
      const mockProducts: QuickProduct[] = [
        { id: '1', barcode: '8690632018560', name: 'Cola', price: 30, stock: 50, icon: '🥤' },
        { id: '2', barcode: '8690632018561', name: 'Fanta', price: 28, stock: 14, icon: '🍊' },
        { id: '3', barcode: '8690632018562', name: 'Su', price: 5, stock: 100, icon: '💧' },
        { id: '4', barcode: '8690632018563', name: 'Ekmek', price: 8, stock: 200, icon: '🍞' },
        { id: '5', barcode: '8690632018564', name: 'Çay', price: 10, stock: 80, icon: '☕' },
        { id: '6', barcode: '8690632018565', name: 'Çikolata', price: 15, stock: 60, icon: '🍫' },
        { id: '7', barcode: '8690632018566', name: 'Süt', price: 25, stock: 40, icon: '🥛' },
        { id: '8', barcode: '8690632018567', name: 'Meyve Suyu', price: 12, stock: 70, icon: '🧃' },
      ];
      setQuickProducts(mockProducts);
    } catch (error) {
      console.error('Quick products load error:', error);
    }
  };

  // Start barcode scan
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

  // Add product by barcode
  const addProductByBarcode = async (barcode: string) => {
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data;
      
      if (!product) {
        toast.error('Ürün bulunamadı');
        soundEffects.error();
        return;
      }

      // Check stock warning
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

  // Add quick product
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

  // Add to cart
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
  };

  // Update quantity
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

  // Remove item
  const removeItem = (barcode: string) => {
    setCartItems(prev => prev.filter(item => item.barcode !== barcode));
    toast.success('Ürün silindi', { duration: 1000 });
    soundEffects.tap();
    hapticFeedback(ImpactStyle.Medium);
  };

  // Clear cart
  const clearCart = () => {
    if (cartItems.length === 0) return;
    
    if (confirm('Sepeti temizlemek istediğinize emin misiniz?')) {
      setCartItems([]);
      toast.success('Sepet temizlendi');
      soundEffects.tap();
      hapticFeedback(ImpactStyle.Heavy);
    }
  };

  // Undo last action (Gesture #8)
  const undoLastAction = () => {
    if (cartItems.length === 0) return;
    
    const lastItem = cartItems[cartItems.length - 1];
    toast((t) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>Son işlemi geri al?<br/>{lastItem.name}</span>
        <button onClick={() => {
          removeItem(lastItem.barcode);
          toast.dismiss(t.id);
        }} style={{ padding: '5px 10px', background: '#000', color: '#fff', border: 'none', borderRadius: '5px' }}>
          EVET
        </button>
      </div>
    ), { duration: 3000 });
    
    hapticFeedback(ImpactStyle.Heavy);
    soundEffects.error();
  };

  // Complete sale
  const completeSale = async (paymentMethod: 'CASH' | 'CARD' | 'CREDIT') => {
    if (cartItems.length === 0) {
      toast.error('Sepet boş!');
      soundEffects.error();
      return;
    }

    try {
      hapticFeedback(ImpactStyle.Medium);
      
      const paymentNames = { CASH: 'Nakit', CARD: 'Kart', CREDIT: 'Veresiye' };
      toast.loading(`${paymentNames[paymentMethod]} ile ödeme yapılıyor...`, { duration: 1000 });

      const saleData = {
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        paymentMethod,
        total
      };

      await api.post('/sales', saleData);
      
      setLastSaleTotal(total);
      setShowSuccess(true);
      setShowCartDetail(false);
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Heavy);
      
      setCartItems([]);
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Sale error:', error);
      toast.error('Satış kaydedilemedi!');
      soundEffects.error();
    }
  };

  // Success Screen
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
          
          <button 
            onClick={() => setShowSuccess(false)}
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
                <button onClick={() => removeItem(item.barcode)} className="remove-btn-detail">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total & Payment */}
        <div className="detail-payment-pro">
          <div className="total-section-pro">
            <span>TOPLAM</span>
            <span className="total-amount-pro">₺{total.toFixed(2)}</span>
          </div>

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
    <div className="mobile-pos-main">
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
          <button onClick={() => cartItems.length > 0 && undoLastAction()} className="icon-btn-main" disabled={cartItems.length === 0}>
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

      {/* Mini Cart (if items exist) */}
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

      {/* FAB - Scan Button */}
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

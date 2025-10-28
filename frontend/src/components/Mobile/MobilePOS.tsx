import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { 
  Camera, ShoppingCart, Trash2, Plus, Minus, X, 
  CreditCard, DollarSign, User, ArrowLeft, CheckCircle2
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
}

const MobilePOS: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleTotal, setLastSaleTotal] = useState(0);

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  // Start barcode scan
  const startScan = async () => {
    if (isScanning) return;
    
    try {
      setIsScanning(true);
      hapticFeedback(ImpactStyle.Light);
      soundEffects.beep();
      console.log('🚀 Starting barcode scan...');
      
      const permissionResult = await BarcodeScanner.checkPermissions();
      console.log('Permission status:', permissionResult);
      
      if (permissionResult.camera !== 'granted') {
        const result = await BarcodeScanner.requestPermissions();
        if (result.camera !== 'granted') {
          toast.error('Kamera izni gerekli');
          setIsScanning(false);
          return;
        }
      }
      
      console.log('📸 Opening scanner...');
      toast('📸 Kamera açılıyor...', { duration: 1000 });
      
      const scanResult = await BarcodeScanner.scan();
      console.log('Scan result:', scanResult);
      
      if (scanResult.barcodes && scanResult.barcodes.length > 0) {
        const barcode = scanResult.barcodes[0].displayValue || scanResult.barcodes[0].rawValue;
        console.log('✅ Barcode found:', barcode);
        
        if (barcode) {
          await addProductByBarcode(barcode);
          hapticFeedback(ImpactStyle.Medium);
          soundEffects.cashRegister();
        }
      } else {
        console.log('❌ No barcode found');
        toast('Barkod bulunamadı', { icon: '🔍' });
      }
    } catch (error: any) {
      console.error('❌ Scan error:', error);
      
      if (!error.message?.toLowerCase().includes('cancel')) {
        toast.error('Tarama hatası: ' + (error.message || 'Bilinmeyen hata'));
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Add product by barcode
  const addProductByBarcode = async (barcode: string) => {
    try {
      console.log('🔍 Fetching product:', barcode);
      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data;
      
      console.log('📦 Product found:', product);
      
      if (!product) {
        toast.error('Ürün bulunamadı');
        soundEffects.error();
        return;
      }

      const existingItem = cartItems.find(item => item.barcode === barcode);
      
      if (existingItem) {
        setCartItems(prev => prev.map(item => 
          item.barcode === barcode 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
        toast.success(`${product.name} +1`, { duration: 1500 });
      } else {
        setCartItems(prev => [...prev, {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
          price: product.sellPrice,
          quantity: 1
        }]);
        toast.success(`✅ ${product.name} eklendi`, { duration: 2000 });
      }
      
      hapticFeedback(ImpactStyle.Light);
    } catch (error: any) {
      console.error('Product fetch error:', error);
      toast.error(error.response?.data?.message || 'Ürün bulunamadı');
      soundEffects.error();
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
    hapticFeedback();
  };

  // Clear cart
  const clearCart = () => {
    if (cartItems.length === 0) return;
    
    if (confirm('Sepeti temizlemek istediğinize emin misiniz?')) {
      setCartItems([]);
      toast.success('Sepet temizlendi');
      soundEffects.tap();
    }
  };

  // Complete sale
  const completeSale = async (paymentMethod: 'CASH' | 'CARD' | 'CREDIT') => {
    if (cartItems.length === 0) {
      toast.error('Sepet boş!');
      soundEffects.error();
      return;
    }

    try {
      setIsProcessing(true);
      hapticFeedback(ImpactStyle.Medium);
      
      const paymentNames = {
        CASH: 'Nakit',
        CARD: 'Kart',
        CREDIT: 'Veresiye'
      };
      
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

      console.log('💰 Sending sale data:', saleData);
      await api.post('/sales', saleData);
      
      console.log('✅ Sale completed successfully');
      
      // Show success screen
      setLastSaleTotal(total);
      setShowSuccess(true);
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Heavy);
      
      // Clear cart
      setCartItems([]);
      
      // Hide success after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ Sale error:', error);
      toast.error(error.response?.data?.message || 'Satış kaydedilemedi!');
      soundEffects.error();
      hapticFeedback(ImpactStyle.Heavy);
    } finally {
      setIsProcessing(false);
    }
  };

  // Success Screen
  if (showSuccess) {
    return (
      <div className="sale-success-screen">
        <div className="success-content">
          <div className="success-icon-wrapper">
            <CheckCircle2 className="success-icon" />
          </div>
          <h1 className="success-title">Satış Tamamlandı!</h1>
          <p className="success-amount">₺{lastSaleTotal.toFixed(2)}</p>
          <p className="success-subtitle">Ödeme başarıyla alındı</p>
          <button 
            onClick={() => setShowSuccess(false)}
            className="success-done-btn"
          >
            Tamam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-pos-professional">
      {/* Header */}
      <div className="pos-header-pro">
        <button onClick={() => navigate('/dashboard')} className="back-btn-pro">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="header-title-pro">
          <ShoppingCart className="w-5 h-5" />
          <h1>Satış Yap</h1>
        </div>
        <button 
          onClick={clearCart} 
          className="clear-btn-pro"
          disabled={cartItems.length === 0}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Cart Summary Bar */}
      {cartItems.length > 0 && (
        <div className="cart-summary-bar">
          <div className="summary-info">
            <span className="summary-label">{cartItems.length} ürün</span>
            <span className="summary-total">₺{total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div className="cart-section-pro">
        {cartItems.length === 0 ? (
          <div className="empty-cart-pro">
            <div className="empty-icon-pro">
              <ShoppingCart className="w-20 h-20" />
            </div>
            <h3 className="empty-title-pro">Sepet Boş</h3>
            <p className="empty-subtitle-pro">Barkod okutarak ürün ekleyin</p>
            <button onClick={startScan} className="empty-scan-btn-pro">
              <Camera className="w-5 h-5" />
              Barkod Tara
            </button>
          </div>
        ) : (
          <div className="cart-items-pro">
            {cartItems.map(item => (
              <div key={item.barcode} className="cart-item-pro">
                <div className="item-info-pro">
                  <p className="item-name-pro">{item.name}</p>
                  <p className="item-price-pro">₺{item.price.toFixed(2)}</p>
                </div>
                <div className="item-actions-pro">
                  <button 
                    onClick={() => updateQuantity(item.barcode, -1)}
                    className="qty-btn-pro minus"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="qty-display-pro">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.barcode, 1)}
                    className="qty-btn-pro plus"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => removeItem(item.barcode)}
                    className="remove-btn-pro"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="item-subtotal-pro">
                  ₺{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="actions-section-pro">
        {/* Scan Button - Always Visible */}
        <button 
          onClick={startScan}
          disabled={isScanning || isProcessing}
          className="scan-btn-pro"
        >
          <Camera className="w-6 h-6" />
          <span>{isScanning ? 'Taranıyor...' : 'Barkod Tara'}</span>
        </button>

        {/* Payment Buttons - Show when cart has items */}
        {cartItems.length > 0 && (
          <>
            <div className="payment-divider-pro">
              <span>Ödeme Yöntemi</span>
            </div>
            <div className="payment-grid-pro">
              <button 
                onClick={() => completeSale('CASH')}
                disabled={isProcessing}
                className="payment-btn-pro cash"
              >
                <DollarSign className="w-6 h-6" />
                <span>Nakit</span>
                <span className="payment-amount">₺{total.toFixed(2)}</span>
              </button>
              <button 
                onClick={() => completeSale('CARD')}
                disabled={isProcessing}
                className="payment-btn-pro card"
              >
                <CreditCard className="w-6 h-6" />
                <span>Kart</span>
                <span className="payment-amount">₺{total.toFixed(2)}</span>
              </button>
              <button 
                onClick={() => completeSale('CREDIT')}
                disabled={isProcessing}
                className="payment-btn-pro credit"
              >
                <User className="w-6 h-6" />
                <span>Veresiye</span>
                <span className="payment-amount">₺{total.toFixed(2)}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MobilePOS;

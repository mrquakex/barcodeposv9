import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { 
  Camera, ShoppingCart, Trash2, Plus, Minus, X, 
  CreditCard, DollarSign, User, ArrowLeft
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

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Start barcode scan
  const startScan = async () => {
    if (isScanning) return;
    
    try {
      setIsScanning(true);
      console.log('🚀 Starting barcode scan...');
      
      // Request camera permission
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

      // Haptic feedback
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
      
      console.log('📸 Opening scanner...');
      
      // Start scanning
      const scanResult = await BarcodeScanner.scan();
      console.log('Scan result:', scanResult);
      
      if (scanResult.barcodes && scanResult.barcodes.length > 0) {
        const barcode = scanResult.barcodes[0].displayValue || scanResult.barcodes[0].rawValue;
        console.log('✅ Barcode found:', barcode);
        
        if (barcode) {
          await addProductByBarcode(barcode);
          
          // Success haptic
          if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Medium });
          }
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
      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data;
      
      if (!product) {
        toast.error('Ürün bulunamadı');
        return;
      }

      // Check if already in cart
      const existingItem = cartItems.find(item => item.barcode === barcode);
      
      if (existingItem) {
        // Increase quantity
        setCartItems(prev => prev.map(item => 
          item.barcode === barcode 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
        toast.success(`${product.name} +1`);
      } else {
        // Add new item
        setCartItems(prev => [...prev, {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
          price: product.sellPrice,
          quantity: 1
        }]);
        toast.success(`${product.name} eklendi`);
      }
    } catch (error) {
      console.error('Product fetch error:', error);
      toast.error('Ürün eklenemedi');
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
  };

  // Remove item
  const removeItem = (barcode: string) => {
    setCartItems(prev => prev.filter(item => item.barcode !== barcode));
    soundEffects.tap();
  };

  // Clear cart
  const clearCart = () => {
    if (cartItems.length === 0) return;
    
    if (confirm('Sepeti temizlemek istediğinize emin misiniz?')) {
      setCartItems([]);
      toast.success('Sepet temizlendi');
    }
  };

  // Complete sale
  const completeSale = async (paymentMethod: 'CASH' | 'CARD' | 'CREDIT') => {
    if (cartItems.length === 0) {
      toast.error('Sepet boş');
      return;
    }

    try {
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
      
      toast.success('Satış tamamlandı! ✅');
      soundEffects.cashRegister();
      
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
      
      setCartItems([]);
    } catch (error) {
      console.error('Sale error:', error);
      toast.error('Satış kaydedilemedi');
    }
  };

  return (
    <div className="mobile-pos-clean">
      {/* Header */}
      <div className="pos-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="pos-title">Satış Yap</h1>
        <button onClick={clearCart} className="clear-btn">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Cart Items */}
      <div className="cart-section">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <ShoppingCart className="w-16 h-16 text-gray-300" />
            <p className="text-gray-400 mt-4">Sepet boş</p>
            <p className="text-gray-400 text-sm">Barkod okutarak ürün ekleyin</p>
          </div>
        ) : (
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.barcode} className="cart-item">
                <div className="item-info">
                  <p className="item-name">{item.name}</p>
                  <p className="item-price">₺{item.price.toFixed(2)}</p>
                </div>
                <div className="item-actions">
                  <button 
                    onClick={() => updateQuantity(item.barcode, -1)}
                    className="qty-btn"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.barcode, 1)}
                    className="qty-btn"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => removeItem(item.barcode)}
                    className="remove-btn"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total */}
      <div className="total-section">
        <div className="total-row">
          <span className="total-label">Toplam</span>
          <span className="total-value">₺{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-section">
        {/* Scan Button */}
        <button 
          onClick={startScan}
          disabled={isScanning}
          className="scan-btn"
        >
          <Camera className="w-6 h-6" />
          <span>{isScanning ? 'Taranıyor...' : 'Barkod Tara'}</span>
        </button>

        {/* Payment Buttons */}
        {cartItems.length > 0 && (
          <div className="payment-buttons">
            <button 
              onClick={() => completeSale('CASH')}
              className="payment-btn cash"
            >
              <DollarSign className="w-5 h-5" />
              Nakit
            </button>
            <button 
              onClick={() => completeSale('CARD')}
              className="payment-btn card"
            >
              <CreditCard className="w-5 h-5" />
              Kart
            </button>
            <button 
              onClick={() => completeSale('CREDIT')}
              className="payment-btn credit"
            >
              <User className="w-5 h-5" />
              Veresiye
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobilePOS;

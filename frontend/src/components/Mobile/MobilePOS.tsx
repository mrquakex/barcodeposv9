import React, { useState, useRef, useEffect } from 'react';
import { Camera, ShoppingCart, CreditCard, Search, Plus, X, Minus, Trash2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { soundEffects } from '../../lib/sound-effects';

/**
 * 📱 MOBILE POS - NATIVE APP UI
 * Efsane mobil deneyim - iOS/Android Native görünüm
 * Microsoft Fluent Design + Native Gestures
 */

interface Product {
  id: string;
  barcode: string;
  name: string;
  sellPrice: number;
  stock: number;
  taxRate: number;
}

interface CartItem extends Product {
  quantity: number;
  total: number;
}

const MobilePOS: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [frequentProducts, setFrequentProducts] = useState<Product[]>([]);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 📱 APP VERSION (increment this with each APK release)
  const CURRENT_VERSION: string = "1.0.1"; // This APK version
  const LATEST_VERSION: string = "1.0.2"; // Server latest version (for future updates)

  // 🔄 Check for updates on app start
  useEffect(() => {
    checkForUpdates();
    loadFrequentProducts();
  }, []);

  const checkForUpdates = () => {
    const lastCheckedVersion = localStorage.getItem('lastCheckedVersion');
    
    // If there's a new version available and user hasn't dismissed it
    if (LATEST_VERSION !== CURRENT_VERSION && lastCheckedVersion !== LATEST_VERSION) {
      setShowUpdateDialog(true);
    }
  };

  const handleUpdate = () => {
    // Navigate to download page
    window.open('/indir.html', '_blank');
    localStorage.setItem('lastCheckedVersion', LATEST_VERSION);
    setShowUpdateDialog(false);
  };

  const dismissUpdate = () => {
    localStorage.setItem('lastCheckedVersion', LATEST_VERSION);
    setShowUpdateDialog(false);
  };

  const loadFrequentProducts = async () => {
    try {
      const response = await api.get('/products?limit=6');
      setFrequentProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get(`/products?search=${encodeURIComponent(query)}&limit=10`);
      setSearchResults(response.data.products || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  // 📳 Advanced Haptic Patterns
  const hapticFeedback = {
    light: () => navigator.vibrate && navigator.vibrate(30),
    medium: () => navigator.vibrate && navigator.vibrate(50),
    heavy: () => navigator.vibrate && navigator.vibrate(100),
    success: () => navigator.vibrate && navigator.vibrate([100, 50, 100]),
    error: () => navigator.vibrate && navigator.vibrate([200, 100, 200, 100, 200]),
    scanning: () => navigator.vibrate && navigator.vibrate([50, 100, 50]),
  };

  const toggleTorch = async () => {
    try {
      if (isTorchOn) {
        await BarcodeScanner.disableTorch();
        setIsTorchOn(false);
        hapticFeedback.light();
      } else {
        await BarcodeScanner.enableTorch();
        setIsTorchOn(true);
        hapticFeedback.medium();
      }
    } catch (error) {
      console.error('Torch toggle failed:', error);
    }
  };

  const startCameraScan = async () => {
    try {
      setIsScanning(true);
      setIsTorchOn(false);
      
      // 📳 Haptic: Scan started
      hapticFeedback.light();

      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (status.granted) {
        soundEffects.beep();
        
        // 📳 Haptic: Scanning...
        hapticFeedback.scanning();
        
        const result = await BarcodeScanner.startScan();
        
        if (result.hasContent && result.content) {
          // 📳 Haptic: Success!
          hapticFeedback.success();
          
          soundEffects.cashRegister();
          await addProductByBarcode(result.content);
        }
      } else {
        toast.error('Kamera izni gerekli!');
        hapticFeedback.error();
      }
    } catch (error: any) {
      toast.error('Kamera hatası!');
      soundEffects.error();
      hapticFeedback.error();
    } finally {
      setIsScanning(false);
      setIsTorchOn(false);
      BarcodeScanner.stopScan();
    }
  };

  const addProductByBarcode = async (barcode: string) => {
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data;
      
      if (product && product.isActive) {
        addToCart(product);
        toast.success(`✅ ${product.name} eklendi`);
        soundEffects.click();
        
        // Haptic success
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
      } else {
        toast.error('Ürün bulunamadı!');
        soundEffects.error();
      }
    } catch (error) {
      toast.error('Ürün bulunamadı');
      soundEffects.error();
    }
  };

  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].total = newCart[existingIndex].quantity * newCart[existingIndex].sellPrice;
      setCart(newCart);
    } else {
      setCart([...cart, {
        ...product,
        quantity: 1,
        total: product.sellPrice
      }]);
    }
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const newCart = cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.sellPrice }
        : item
    );
    setCart(newCart);
    
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
    soundEffects.delete();
    
    if (navigator.vibrate) {
      navigator.vibrate([30, 30]);
    }
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Sepet temizlendi');
    soundEffects.delete();
  };

  const handlePayment = () => {
    if (cart.length === 0) {
      toast.error('Sepet boş!');
      return;
    }
    setShowPayment(true);
  };

  const completePayment = async () => {
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = cart.reduce(
        (sum, item) => sum + (item.total * item.taxRate) / (100 + item.taxRate),
        0
      );

      await api.post('/sales', {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.sellPrice,
          taxRate: item.taxRate,
        })),
        paymentMethod: 'CASH',
        subtotal,
        taxAmount,
        total: subtotal,
      });

      // Success feedback
      soundEffects.cashRegister();
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
      
      toast.success('✅ Satış tamamlandı!');
      setCart([]);
      setShowPayment(false);
      setShowCart(false);
    } catch (error) {
      toast.error('Satış hatası!');
      soundEffects.error();
    }
  };

  const total = cart.reduce((sum, item) => sum + item.total, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mobile-app-wrapper">
      {/* Mobile Header */}
      <div className="mobile-header">
        <h1 className="mobile-header-title">📱 BarcodePOS</h1>
        <button 
          className="relative"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart className="w-6 h-6 text-primary" />
          {itemCount > 0 && (
            <span className="mobile-badge absolute -top-2 -right-2">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mobile-search">
        <Search className="w-5 h-5 text-foreground-secondary" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Ürün ara veya barkod gir..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchProducts(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery) {
              addProductByBarcode(searchQuery);
              setSearchQuery('');
            }
          }}
        />
        {searchQuery && (
          <button onClick={() => {
            setSearchQuery('');
            setSearchResults([]);
          }}>
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mobile-card">
          <p className="text-sm font-semibold text-foreground-secondary mb-2">
            {searchResults.length} ürün bulundu
          </p>
          <div className="space-y-2">
            {searchResults.map(product => (
              <button
                key={product.id}
                className="mobile-list-item w-full"
                onClick={() => {
                  addToCart(product);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-sm text-foreground-secondary">
                    Stok: {product.stock}
                  </p>
                </div>
                <p className="text-lg font-bold text-primary">
                  ₺{product.sellPrice.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Frequent Products */}
      {searchResults.length === 0 && (
        <div className="mobile-card">
          <h3 className="font-semibold text-foreground mb-3">⚡ Sık Satılanlar</h3>
          <div className="grid grid-cols-2 gap-3">
            {frequentProducts.map(product => (
              <button
                key={product.id}
                className="bg-background-alt p-4 rounded-lg border border-border active:scale-95 transition-transform"
                onClick={() => addToCart(product)}
              >
                <p className="font-medium text-foreground text-sm mb-1 truncate">
                  {product.name}
                </p>
                <p className="text-lg font-bold text-primary">
                  ₺{product.sellPrice.toFixed(2)}
                </p>
                <p className="text-xs text-foreground-secondary">
                  Stok: {product.stock}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sales Summary Card */}
      {cart.length > 0 && (
        <div className="mobile-card bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-secondary">Sepet Toplamı</p>
              <p className="text-2xl font-bold text-primary">₺{total.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground-secondary">{itemCount} ürün</p>
              <button
                className="text-sm text-destructive font-medium"
                onClick={clearCart}
              >
                Temizle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <button
        className="fab"
        onClick={startCameraScan}
        disabled={isScanning}
      >
        <Camera className="w-7 h-7" />
      </button>

      {cart.length > 0 && (
        <button
          className="fab"
          style={{ bottom: `calc(150px + env(safe-area-inset-bottom))` }}
          onClick={handlePayment}
        >
          <CreditCard className="w-7 h-7" />
        </button>
      )}

      {/* Cart Bottom Sheet */}
      <div className={`bottom-sheet ${showCart ? 'open' : ''}`}>
        <div className="bottom-sheet-handle" />
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">
              Sepet ({itemCount})
            </h2>
            <button onClick={() => setShowCart(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-background-alt rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-foreground-secondary">
                    ₺{item.sellPrice.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-background border border-border rounded"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-background border border-border rounded"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center text-destructive"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="font-bold text-primary w-20 text-right">
                  ₺{item.total.toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-lg font-bold mb-4">
              <span>Toplam:</span>
              <span className="text-primary">₺{total.toFixed(2)}</span>
            </div>
            <button
              className="mobile-btn-primary"
              onClick={handlePayment}
            >
              💳 Ödeme Al
            </button>
          </div>
        </div>
      </div>

      {/* Payment Bottom Sheet */}
      <div className={`bottom-sheet ${showPayment ? 'open' : ''}`}>
        <div className="bottom-sheet-handle" />
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Ödeme</h2>
            <button onClick={() => setShowPayment(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-background-alt p-4 rounded-lg">
              <p className="text-sm text-foreground-secondary mb-1">Ödenecek Tutar</p>
              <p className="text-3xl font-bold text-primary">₺{total.toFixed(2)}</p>
            </div>

            <div className="segment-control">
              <button className="segment-item active">💵 Nakit</button>
              <button className="segment-item">💳 Kart</button>
              <button className="segment-item">👤 Veresiye</button>
            </div>

            <button
              className="mobile-btn-primary"
              onClick={completePayment}
            >
              ✅ Ödemeyi Tamamla
            </button>
            <button
              className="mobile-btn-secondary"
              onClick={() => setShowPayment(false)}
            >
              İptal
            </button>
          </div>
        </div>
      </div>

      {/* 📸 PROFESSIONAL BARCODE SCANNER OVERLAY */}
      {isScanning && (
        <div className="scanner-overlay">
          {/* Header with Close & Torch */}
          <div className="scanner-header">
            <h2 className="scanner-title">📸 Barkod Tarama</h2>
            <div className="flex items-center gap-3">
              {/* Flash/Torch Toggle */}
              <button
                className={`torch-button ${isTorchOn ? 'active' : ''}`}
                onClick={toggleTorch}
              >
                {isTorchOn ? '🔦' : '💡'}
              </button>
              {/* Close Button */}
              <button
                className="scanner-close"
                onClick={() => {
                  setIsScanning(false);
                  setIsTorchOn(false);
                  BarcodeScanner.stopScan();
                  hapticFeedback.light();
                }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scanning Frame with Laser */}
          <div className="scanning-frame">
            {/* Bottom corners */}
            <div className="corner-bl" />
            <div className="corner-br" />
            
            {/* 🔴 Laser Line Animation */}
            <div className="laser-line" />
          </div>

          {/* Instructions & Status */}
          <div className="scanner-instructions">
            <p>Barkodu beyaz çerçeveye hizalayın</p>
            <div className="scanning-status">
              <div className="scanning-pulse" />
              <span>Taranıyor...</span>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 UPDATE DIALOG - iOS 17 Style */}
      {showUpdateDialog && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={dismissUpdate}
          />
          
          {/* Update Dialog */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <div className="mobile-card max-w-sm w-full animate-scale-in">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-pressed rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              
              {/* Content */}
              <h3 className="text-2xl font-bold text-center text-foreground mb-2">
                🎉 Yeni Güncelleme!
              </h3>
              <p className="text-center text-foreground-secondary mb-2">
                <strong>v{LATEST_VERSION}</strong> sürümü mevcut
              </p>
              <p className="text-sm text-center text-foreground-secondary mb-6">
                Yeni özellikler ve iyileştirmeler ile daha iyi bir deneyim!
              </p>
              
              {/* Buttons */}
              <div className="space-y-3">
                <button
                  className="mobile-btn-primary"
                  onClick={handleUpdate}
                >
                  🚀 Şimdi Güncelle
                </button>
                <button
                  className="mobile-btn-secondary"
                  onClick={dismissUpdate}
                >
                  Daha Sonra
                </button>
              </div>
              
              {/* Version info */}
              <p className="text-xs text-center text-foreground-tertiary mt-4">
                Mevcut sürüm: v{CURRENT_VERSION}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Bottom safe area */}
      <div className="h-24" />
    </div>
  );
};

export default MobilePOS;


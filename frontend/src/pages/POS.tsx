import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { useCartStore } from '../store/cartStore';
import { Product, Customer, Category } from '../types';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { 
  Search, Trash2, Plus, Minus, CreditCard, Banknote, ShoppingCart,
  User, X, Receipt, Printer, CheckCircle2, Clock,
  Package, Grid3x3, List, Star, Sparkles, Zap, DollarSign,
  Users, Calendar, BarChart3, Camera
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../components/ui/StatCard';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const POS: React.FC = () => {
  const [barcode, setBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT'>('CASH');
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lastSale, setLastSale] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal, getNetTotal } = useCartStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
    fetchRecentSales();
    barcodeInputRef.current?.focus();

    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setShowCustomerModal(true);
      }
      if (e.key === 'F5') {
        e.preventDefault();
        if (items.length > 0) setShowPaymentModal(true);
      }
      if (e.key === 'F8') {
        e.preventDefault();
        if (items.length > 0) {
          clearCart();
          toast.success('🗑️ Sepet temizlendi');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [items]);

  // Kamera ile barkod okuma
  useEffect(() => {
    let isProcessing = false;

    const startScanner = async () => {
      if (showCamera) {
        // HTTPS kontrolü
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          toast.error('🔒 Kamera sadece HTTPS bağlantısında çalışır!', { duration: 6000 });
          setShowCamera(false);
          return;
        }

        // getUserMedia desteği kontrolü
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error('❌ Tarayıcınız kamera kullanımını desteklemiyor!', { duration: 6000 });
          setShowCamera(false);
          return;
        }

        try {
          // Önce kamera iznini test et
          console.log('📸 Kamera izni isteniyor...');
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          
          // İzin alındı, stream'i hemen kapat
          stream.getTracks().forEach(track => track.stop());
          console.log('✅ Kamera izni alındı!');

          const scanner = new Html5Qrcode('barcode-scanner-pos', {
            verbose: false,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.CODE_93,
              Html5QrcodeSupportedFormats.ITF,
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_11,
              Html5QrcodeSupportedFormats.CODABAR,
            ],
          });
          scannerRef.current = scanner;

          // ⚡ ULTRA FAST & SHARP config (profesyonel optimize)
          const config = {
            fps: 30, // 🚀 MAXIMUM SPEED! 30 FPS = instant scan
            qrbox: { width: 250, height: 150 }, // 🎯 Optimal focus area
            aspectRatio: 1.777778,
            disableFlip: false,
            // 🔥 ADVANCED CAMERA SETTINGS
            videoConstraints: {
              facingMode: 'environment',
              focusMode: 'continuous', // ✨ Sürekli otomatik odaklanma
              advanced: [
                { zoom: 2.0 }, // 🔍 2x zoom = daha net
                { focusDistance: 0.1 }, // 📏 Yakın mesafe odaklama
                { exposureMode: 'continuous' }, // 💡 Otomatik ışık ayarı
                { whiteBalanceMode: 'continuous' }, // 🌈 Otomatik beyaz dengesi
              ]
            }
          };

          // ARKA KAMERA ID'sini bul (yüksek çözünürlüklü olanı seç)
          let cameraId = 'environment';
          try {
            const devices = await Html5Qrcode.getCameras();
            console.log('📸 Bulunan kameralar:', devices);
            
            // Arka kamerayı bul (label'dan)
            const backCamera = devices.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('arka')
            );
            
            if (backCamera) {
              cameraId = backCamera.id;
              console.log('✅ Arka kamera bulundu:', backCamera.label);
            } else if (devices.length > 0) {
              // Son kamera genellikle arka kamera (en iyi çözünürlük)
              cameraId = devices[devices.length - 1].id;
              console.log('✅ Kamera seçildi:', devices[devices.length - 1].label);
            }
          } catch (e) {
            console.warn('⚠️ Kamera listesi alınamadı, default kullanılıyor:', e);
          }

          await scanner.start(
            cameraId,
            config,
            async (decodedText) => {
              if (isProcessing) return;
              isProcessing = true;
              
              // BARKOD TEMİZLE
              const cleanBarcode = decodedText.trim().replace(/\s+/g, '').toUpperCase();
              console.log('✅ BARKOD (RAW):', decodedText);
              console.log('✅ BARKOD (CLEAN):', cleanBarcode);
              
              // Ürünü bul ve sepete ekle
              try {
                toast.loading('🔍 Aranıyor...');
                
                let response;
                try {
                  response = await api.get(`/products/barcode/${encodeURIComponent(cleanBarcode)}`);
                } catch {
                  response = await api.get(`/products/barcode/${encodeURIComponent(decodedText)}`);
                }
                
                const product = response.data.product;
                toast.dismiss();

                if (product.stock <= 0) {
                  toast.error(`❌ ${product.name} stokta yok!`, { duration: 4000 });
                  isProcessing = false;
                  return;
                }

                addItem(product, 1);
                toast.success(`✅ ${product.name} eklendi!`, { 
                  duration: 2000,
                  icon: '🛒' 
                });
                
                // Kapat ve reset
                setTimeout(() => {
                  setShowCamera(false);
                  isProcessing = false;
                }, 800);
              } catch (error: any) {
                toast.dismiss();
                console.error('❌ Ürün yok (Clean):', cleanBarcode);
                console.error('❌ Ürün yok (RAW):', decodedText);
                
                // Detaylı hata logu
                if (error.response) {
                  console.error('API Response:', error.response.status, error.response.data);
                }
                
                toast.error(`❌ Ürün bulunamadı: ${cleanBarcode}`, { duration: 5000 });
                
                // Kamerayı kapatma, tekrar deneme için açık bırak
                setTimeout(() => {
                  isProcessing = false;
                }, 2000);
              }
            },
            () => {}
          );

          toast.success('📸 Kamera açıldı! Barkodu göster...', { duration: 2000 });
          console.log('✅ Scanner başlatıldı');
        } catch (error: any) {
          console.error('❌ Kamera hatası:', error);
          
          let errorMsg = 'Kamera açılamadı!';
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMsg = '🚫 Kamera izni reddedildi! Ayarlardan izin verin.';
          } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMsg = '📷 Kamera bulunamadı!';
          } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMsg = '⚠️ Kamera başka bir uygulama tarafından kullanılıyor!';
          } else if (error.name === 'OverconstrainedError') {
            errorMsg = '⚙️ Kamera ayarları uygun değil!';
          } else if (error.message) {
            errorMsg = `❌ ${error.message}`;
          }
          
          toast.error(errorMsg, { duration: 6000 });
          setShowCamera(false);
        }
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
          console.log('✅ Scanner durduruldu');
        } catch (error) {
          console.error('❌ Stop scanner error:', error);
        }
      }
      isProcessing = false;
    };

    if (showCamera) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [showCamera, addItem]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', { params: { isActive: true } });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Products fetch error:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Categories fetch error:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers);
    } catch (error) {
      console.error('Customers fetch error:', error);
    }
  };

  const fetchRecentSales = async () => {
    try {
      const response = await api.get('/sales', { params: { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' } });
      setRecentSales(response.data.sales || []);
    } catch (error) {
      console.error('Recent sales fetch error:', error);
    }
  };


  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setLoading(true);
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data.product;

      if (product.stock > 0) {
        addItem(product, 1);
        toast.success(`✓ ${product.name} eklendi`);
        setBarcode('');
      } else {
        toast.error('⚠️ Ürün stokta yok!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || '❌ Ürün bulunamadı');
      setBarcode('');
    } finally {
      setLoading(false);
      barcodeInputRef.current?.focus();
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.stock > 0) {
      addItem(product, 1);
      toast.success(`✓ ${product.name} sepete eklendi`, {
        duration: 1000,
        icon: '🛒',
      });
    } else {
      toast.error('⚠️ Ürün stokta yok!');
    }
  };

  const handleCompleteSale = async () => {
    if (items.length === 0) {
      toast.error('Sepet boş!');
      return;
    }

    const netAmount = getNetTotal();
    const change = receivedAmount - netAmount;

    // Veresiye için müşteri zorunlu
    if (paymentMethod === 'CREDIT' && !selectedCustomer) {
      toast.error('Veresiye satış için müşteri seçmelisiniz!');
      return;
    }

    // Nakit için para kontrolü
    if (paymentMethod === 'CASH' && change < 0) {
      toast.error('Yetersiz ödeme!');
      return;
    }

    const saleData = {
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      customerId: selectedCustomer?.id,
      paymentMethod,
    };

    try {
      const response = await api.post('/sales', saleData);
      setLastSale(response.data.sale);
      toast.success('🎉 Satış başarıyla tamamlandı!', {
        duration: 2000,
      });
      clearCart();
      setSelectedCustomer(null);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      setReceivedAmount(0);
      fetchRecentSales();
      barcodeInputRef.current?.focus();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Satış işlemi başarısız');
    }
  };

  const filteredProducts = products.filter(p => {
    const searchMatch = !searchQuery || 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    const categoryMatch = !selectedCategory || p.categoryId === selectedCategory;
    return searchMatch && categoryMatch;
  });

  const totalAmount = getTotal();
  const netAmount = getNetTotal();
  const change = receivedAmount - netAmount;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Sepet"
          value={items.length}
          description={items.length > 0 ? formatCurrency(netAmount) : 'Boş'}
          icon={Package}
          color="from-blue-700 to-blue-800"
        />
        <StatCard
          title="Müşteri"
          value={selectedCustomer ? '✓' : '-'}
          description={selectedCustomer?.name || 'Seçilmedi'}
          icon={User}
          color="from-slate-600 to-slate-700"
        />
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
      {/* Left: Products */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 order-2 md:order-1">
          {/* Barcode Scanner */}
          <Card className="border-2 border-blue-200 dark:border-blue-900 shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleBarcodeSubmit} className="flex flex-col gap-3">
                {/* SADECE MOBİL: Kamera butonu (büyük, öncelikli) */}
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="md:hidden w-full h-20 bg-gradient-to-br from-blue-600 to-slate-700 hover:from-blue-700 hover:to-slate-800 text-white rounded-xl shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center gap-4 font-black text-xl"
                >
                  <Camera className="w-9 h-9" />
                  📸 KAMERA İLE OKUT
                </button>

                {/* Barkod input - Desktop tam genişlik, Mobil ikinci sırada */}
                <div className="relative w-full">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
              <Input
                ref={barcodeInputRef}
                type="text"
                    inputMode="numeric"
                    placeholder="Barkod giriniz..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                disabled={loading}
                    className="pl-20 pr-6 h-16 text-lg font-semibold tracking-wide border-2 border-slate-300 focus:border-blue-600 dark:border-slate-700 shadow-sm"
                  />
                  {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Clock className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                  )}
                </div>
            </form>
          </CardContent>
        </Card>

          {/* Products Grid */}
          <Card className="flex-1 overflow-hidden flex flex-col min-h-0">
          <CardHeader>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 sm:h-auto"
                  />
                </div>

                {/* Category & View Mode */}
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2 border rounded-md bg-background text-sm sm:min-w-[150px]"
                  >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <div className="hidden sm:flex gap-1 border rounded-md p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
            </div>
          </CardHeader>
            <CardContent className="flex-1 overflow-y-auto min-h-0">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <motion.button
                      key={product.id}
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleProductClick(product)}
                      className={`p-4 md:p-5 rounded-xl border-2 transition-all text-left shadow-md ${
                        product.stock === 0 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300' 
                          : 'hover:border-blue-600 hover:shadow-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                      disabled={product.stock === 0}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-14 h-14 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-md">
                          <Package className="w-7 h-7 md:w-6 md:h-6 text-white" />
                        </div>
                        {product.stock <= product.minStock && product.stock > 0 && (
                          <span className="text-xs bg-red-600 text-white px-2 md:px-3 py-1 rounded-full font-bold shadow-md">
                            Düşük
                          </span>
                        )}
                        {product.stock === 0 && (
                          <span className="text-xs bg-gray-600 text-white px-2 md:px-3 py-1 rounded-full font-bold">
                            Yok
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-base md:text-base truncate mb-2 text-slate-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-muted-foreground mb-3 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded inline-block">
                        Stok: <span className={product.stock <= product.minStock ? 'text-red-600 font-bold' : 'font-semibold'}>{product.stock}</span> {product.unit}
                      </p>
                      <p className="text-xl md:text-2xl font-black text-blue-700 dark:text-blue-400">
                        {formatCurrency(product.price)}
                      </p>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
              {filteredProducts.map((product) => (
                    <motion.button
                  key={product.id}
                      whileHover={{ scale: 1.02 }}
                  onClick={() => handleProductClick(product)}
                      className="w-full p-4 rounded-lg border hover:border-blue-500 hover:shadow-md transition-all text-left flex items-center gap-4"
                  disabled={product.stock === 0}
                >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category?.name} • Stok: {product.stock} {product.unit}
                        </p>
                      </div>
                      <p className="text-xl font-black text-green-600">
                    {formatCurrency(product.price)}
                  </p>
                    </motion.button>
              ))}
            </div>
              )}
          </CardContent>
        </Card>
      </div>

        {/* Right: Cart & Payment */}
        <div className="w-full md:w-[420px] flex flex-col gap-4 min-h-0 order-1 md:order-2">
          {/* Cart */}
          <Card className="flex-1 overflow-hidden flex flex-col min-h-0 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
            <CardHeader className="border-b-2 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-md">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">Sepet</div>
                    {items.length > 0 && (
                      <div className="text-xs text-muted-foreground">{items.length} ürün</div>
                    )}
                  </div>
            </CardTitle>
                {items.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Temizle
                  </Button>
                )}
              </div>
          </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="w-16 h-16 text-muted-foreground opacity-30 mb-4" />
                  <p className="text-muted-foreground font-medium">Sepet Boş</p>
                  <p className="text-sm text-muted-foreground">Ürün eklemek için barkod okutun</p>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="border-2 rounded-xl p-3 md:p-5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:border-blue-600 transition-all shadow-md hover:shadow-lg border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-bold text-sm md:text-base text-slate-900 dark:text-white mb-1">{item.product.name}</p>
                          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-mono">{formatCurrency(item.product.price)} × {item.quantity}</p>
                        </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 md:p-2 rounded-lg transition-colors"
                    >
                          <Trash2 className="w-5 h-5 md:w-5 md:h-5" />
                    </button>
                  </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 md:gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-12 h-12 md:w-10 md:h-10 p-0 border-2 border-slate-300 dark:border-slate-600 hover:border-blue-600 hover:bg-blue-50"
                      >
                        <Minus className="w-5 h-5 md:w-4 md:h-4" />
                          </Button>
                          <span className="w-12 md:w-14 text-center font-black text-lg md:text-xl text-slate-900 dark:text-white">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                            className="w-12 h-12 md:w-10 md:h-10 p-0 border-2 border-slate-300 dark:border-slate-600 hover:border-blue-600 hover:bg-blue-50"
                      >
                        <Plus className="w-5 h-5 md:w-4 md:h-4" />
                          </Button>
                    </div>
                        <p className="text-xl md:text-2xl font-black text-blue-700 dark:text-blue-400">
                          {formatCurrency(item.subtotal)}
                        </p>
                  </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
            )}
          </CardContent>
        </Card>

          {/* Totals & Actions */}
        <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Customer */}
              <div className="p-3 border-2 border-dashed rounded-lg">
                {selectedCustomer ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-sm">{selectedCustomer.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-12 md:h-auto text-base md:text-sm"
                    onClick={() => setShowCustomerModal(true)}
                  >
                    <User className="w-5 h-5 md:w-4 md:h-4 mr-2" />
                    <span className="md:hidden">Müşteri Seç</span>
                    <span className="hidden md:inline">Müşteri Seç (F2)</span>
                  </Button>
                )}
            </div>

              {/* Totals */}
              <div className="space-y-3">
            <div className="flex justify-between text-sm md:text-sm font-semibold">
              <span>Ara Toplam:</span>
              <span className="text-base md:text-base">{formatCurrency(totalAmount)}</span>
            </div>


                <div className="border-t-2 border-blue-200 dark:border-blue-900 pt-3 flex justify-between items-center bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 p-4 md:p-3 rounded-xl">
                  <span className="text-lg md:text-xl font-black">TOPLAM:</span>
                  <span className="text-2xl md:text-3xl font-black text-blue-700 dark:text-blue-400">
                    {formatCurrency(netAmount)}
                  </span>
                </div>
            </div>

              {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                  className="flex-1 h-20 md:h-16 text-xl md:text-xl font-black bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600 shadow-xl hover:shadow-2xl transition-all"
                  onClick={() => setShowPaymentModal(true)}
                disabled={items.length === 0}
              >
                  <CreditCard className="w-7 h-7 md:w-6 md:h-6 mr-2 md:mr-3" />
                  <span className="md:hidden">ÖDEME AL</span>
                  <span className="hidden md:inline">Ödeme Al (F5)</span>
              </Button>
            </div>

              {/* Quick Actions & Shortcuts */}
              <div className="pt-3 border-t space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomerModal(true)}
                    className="h-10 text-xs font-semibold border-blue-300 hover:bg-blue-50 hover:border-blue-600"
                  >
                    <User className="w-3 h-3 mr-1" />
                    F2: Müşteri
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => items.length > 0 && setShowPaymentModal(true)}
                    disabled={items.length === 0}
                    className="h-10 text-xs font-semibold border-green-300 hover:bg-green-50 hover:border-green-600"
                  >
                    <CreditCard className="w-3 h-3 mr-1" />
                    F5: Ödeme
              </Button>
              <Button
                    variant="outline"
                    size="sm"
                    onClick={() => items.length > 0 && clearCart()}
                disabled={items.length === 0}
                    className="h-10 text-xs font-semibold border-red-300 hover:bg-red-50 hover:border-red-600"
              >
                    <Trash2 className="w-3 h-3 mr-1" />
                    F8: Temizle
              </Button>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-700 to-slate-700 px-6 py-5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  Müşteri Seç
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowCustomerModal(false)} className="text-white hover:bg-white/20">
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                {/* No customer option */}
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setShowCustomerModal(false);
                    toast.success('✓ Müşteri seçimi temizlendi');
                  }}
                  className={`w-full mb-4 p-5 rounded-xl border-2 transition-all shadow-md hover:shadow-lg text-left ${
                    !selectedCustomer 
                      ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20' 
                      : 'border-slate-300 dark:border-slate-700 hover:border-blue-600'
                  }`}
                >
                  <p className="font-black text-lg text-slate-900 dark:text-white">Bilinmeyen Müşteri</p>
                  <p className="text-sm text-muted-foreground">Müşteri bilgisi olmadan satış</p>
                </button>

                <div className="space-y-3">
                  {customers.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowCustomerModal(false);
                        toast.success(`✓ Müşteri: ${customer.name}`);
                      }}
                      className={`w-full p-5 rounded-xl border-2 transition-all shadow-md hover:shadow-lg text-left flex items-center gap-4 ${
                        selectedCustomer?.id === customer.id
                          ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20'
                          : 'border-slate-300 dark:border-slate-700 hover:border-blue-600'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-md">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-lg text-slate-900 dark:text-white">{customer.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">📞 {customer.phone || customer.email}</p>
                      </div>
                      {customer.debt > 0 && (
                        <span className="text-red-600 font-bold bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">
                          Borç: {formatCurrency(customer.debt)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl"
            >
              <div className="bg-gradient-to-r from-blue-700 to-slate-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  Ödeme Al
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowPaymentModal(false)} className="text-white hover:bg-white/20">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Total */}
                <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 rounded-2xl border-2 border-blue-200 dark:border-blue-900 shadow-lg">
                  <p className="text-base text-muted-foreground font-semibold mb-3">Ödenecek Tutar</p>
                  <p className="text-6xl font-black text-blue-700 dark:text-blue-400">{formatCurrency(netAmount)}</p>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-base font-bold">Ödeme Yöntemi</Label>
                  <div className={`grid ${selectedCustomer ? 'grid-cols-4' : 'grid-cols-3'} gap-3`}>
                    {[
                      { value: 'CASH', label: 'Nakit', icon: Banknote },
                      { value: 'CARD', label: 'Kart', icon: CreditCard },
                      { value: 'TRANSFER', label: 'Havale', icon: DollarSign },
                      ...(selectedCustomer ? [{ value: 'CREDIT', label: 'Veresiye', icon: User }] : []),
                    ].map((method) => (
                      <button
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value as any)}
                        className={`p-5 rounded-xl border-2 transition-all shadow-md hover:shadow-lg ${
                          paymentMethod === method.value
                            ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20'
                            : 'border-slate-300 dark:border-slate-700 hover:border-blue-600'
                        }`}
                      >
                        <method.icon className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === method.value ? 'text-blue-600' : 'text-gray-400'}`} />
                        <p className={`text-base font-black ${paymentMethod === method.value ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600'}`}>{method.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Received Amount (Cash only) */}
                {paymentMethod === 'CASH' && (
                  <div className="space-y-4">
                    <Label className="text-base font-bold">Alınan Tutar</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={receivedAmount || ''}
                      onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-16 text-3xl font-black text-center border-2 border-slate-300 focus:border-blue-600 dark:border-slate-700"
                      autoFocus
                    />
                    {change >= 0 && receivedAmount > 0 && (
                      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border-2 border-green-300 shadow-lg">
                        <p className="text-base text-muted-foreground font-semibold mb-2">Para Üstü</p>
                        <p className="text-4xl font-black text-green-600">{formatCurrency(change)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Credit Info */}
                {paymentMethod === 'CREDIT' && selectedCustomer && (
                  <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-xl border-2 border-orange-300 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-6 h-6 text-orange-600" />
                      <p className="text-base font-bold text-orange-800 dark:text-orange-400">Veresiye Satış</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>{selectedCustomer.name}</strong> adlı müşteriye veresiye satış yapılacak.
                    </p>
                    {selectedCustomer.debt > 0 && (
                      <p className="text-sm font-bold text-red-600">
                        Mevcut Borç: {formatCurrency(selectedCustomer.debt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Complete Button */}
                <Button
                  onClick={handleCompleteSale}
                  disabled={paymentMethod === 'CASH' && change < 0}
                  className="w-full h-16 text-xl font-black bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600 shadow-xl"
                >
                  <CheckCircle2 className="w-6 h-6 mr-3" />
                  Satışı Tamamla
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && lastSale && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md"
            >
              <div className="bg-gradient-to-r from-blue-700 to-slate-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  Satış Başarılı
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowReceiptModal(false)} className="text-white hover:bg-white/20">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-3xl font-black text-green-600 mb-2">
                    {formatCurrency(lastSale.totalAmount)}
                  </h3>
                  <p className="text-muted-foreground">
                    Satış #{lastSale.id.slice(0, 8)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 font-semibold"
                    onClick={() => setShowReceiptModal(false)}
                  >
                    Kapat
                  </Button>
                  <Button
                    className="flex-1 h-12 font-bold bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600"
                    onClick={() => {
                      toast.success('🖨️ Fiş yazdırılıyor...');
                      setShowReceiptModal(false);
                    }}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Yazdır
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Kamera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-slate-700 p-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Camera className="w-6 h-6" />
                BARKOD OKUYUCU
              </h3>
              <button
                onClick={() => setShowCamera(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Scanner Container - FULL SCREEN */}
            <div className="flex-1 relative">
              <div 
                id="barcode-scanner-pos" 
                className="w-full h-full"
              />
              
              {/* KIRMIZI LAZER TARAMA ÇİZGİSİ - Animasyonlu */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-full max-w-md h-64">
                  {/* Kırmızı tarama çizgisi */}
                  <motion.div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.8)]"
                    style={{
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.4)'
                    }}
                    animate={{
                      top: ['0%', '100%', '0%'],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  
                  {/* Çerçeve köşeleri */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500" />
                  
                  {/* Pulse efekt */}
                  <motion.div
                    className="absolute inset-0 border-2 border-red-500/30 rounded-lg"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [0.98, 1, 0.98],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Footer - Talimatlar */}
            <div className="bg-gradient-to-r from-blue-600 to-slate-700 p-5 space-y-3">
              <div className="bg-white/10 rounded-lg p-3 space-y-2">
                <p className="text-base text-white text-center font-black">
                  📸 KIRMIZI LAZER İÇİNE GETİRİN
                </p>
                <p className="text-sm text-blue-100 text-center font-bold">
                  ⚡ 20 FPS Yüksek Hız • 9 Format • HD Tarama • Otomatik
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 text-xs text-white font-bold">
                <span className="bg-white/20 px-2 py-1 rounded">✓ EAN-13</span>
                <span className="bg-white/20 px-2 py-1 rounded">✓ EAN-8</span>
                <span className="bg-white/20 px-2 py-1 rounded">✓ UPC-A</span>
                <span className="bg-white/20 px-2 py-1 rounded">✓ Code-128</span>
                <span className="bg-white/20 px-2 py-1 rounded">✓ QR Code</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-blue-100 text-center font-bold">
                  💡 İYİ IŞIK • 📏 15-20 CM MESAFE • 🤚 HAREKETSİZ TUT
                </p>
                <p className="text-xs text-blue-200 text-center font-semibold">
                  Barkod otomatik okunacak ve sepete eklenecek!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POS;

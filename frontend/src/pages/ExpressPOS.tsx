import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan,
  Camera,
  User,
  Settings,
  DollarSign,
  CreditCard,
  Wallet,
  Trash2,
  Plus,
  Minus,
  X,
  Check,
  Receipt,
  History,
  Percent,
  Tag,
  Volume2,
  VolumeX,
  Grid,
  List,
  Search,
  Printer,
  Mail,
  MessageSquare,
  Repeat,
  Edit,
  Clock,
  Users,
  Package,
  Zap,
  ShoppingCart,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category?: {
    id: string;
    name: string;
  };
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  note: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Payment {
  method: 'CASH' | 'CREDIT_CARD' | 'CREDIT';
  amount: number;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  debt: number;
}

interface Sale {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  saleItems: Array<{
    product: Product;
    quantity: number;
    unitPrice: number;
  }>;
}

interface Channel {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  cart: CartItem[];
  customer: Customer | null;
  createdAt: Date;
}

// Kurumsal tek renk - Tüm kanallar blue-slate gradient
const getChannelName = (index: number) => `Kanal ${index + 1}`;

const ExpressPOS: React.FC = () => {
  const { user } = useAuthStore();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  // 🎯 PROFESYONEL KAMERA STATE
  const [cameraInfo, setCameraInfo] = useState<{
    deviceName: string;
    resolution: string;
    fps: number;
    scanCount: number;
  }>({
    deviceName: 'Yükleniyor...',
    resolution: '1920x1080',
    fps: 30,
    scanCount: 0,
  });
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [flashEffect, setFlashEffect] = useState<'none' | 'success' | 'error'>('none');
  const [cameraLoading, setCameraLoading] = useState(false); // Kamera açılış loading durumu
  
  // 🚀 ADVANCED KAMERA CONTROLS
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.5); // Default 1.5x for better barcode detection
  const [scanQuality, setScanQuality] = useState<'poor' | 'good' | 'excellent'>('good');
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [brightnessLevel, setBrightnessLevel] = useState(-1); // -3 to +3 (default -1 for anti-glare)
  const [contrastLevel, setContrastLevel] = useState(1); // -3 to +3 (default +1 for clarity)
  const [exposureMode, setExposureMode] = useState<'manual' | 'auto'>('manual');
  const [whiteBalance, setWhiteBalance] = useState<'auto' | 'daylight' | 'cloudy' | 'tungsten'>('auto');
  const videoStreamRef = useRef<MediaStream | null>(null);
  
  // 🤖 AI AUTO-ADJUSTMENT
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [isAutoAdjusting, setIsAutoAdjusting] = useState(false);
  const autoRetryTimeoutRef = useRef<number | null>(null);
  
  // Channel State - Kurumsal tek renk
  const [channels, setChannels] = useState<Channel[]>([
    {
      id: '1',
      name: 'Kanal 1',
      color: 'blue-slate',
      bgColor: 'bg-gradient-to-r from-blue-600 to-slate-700',
      textColor: 'text-blue-600',
      cart: [],
      customer: null,
      createdAt: new Date(),
    }
  ]);
  const [activeChannelId, setActiveChannelId] = useState<string>('1');
  
  // Active channel computed
  const activeChannel = channels.find(ch => ch.id === activeChannelId) || channels[0];
  const cart = activeChannel.cart;
  const selectedCustomer = activeChannel.customer;
  
  // State
  const [barcode, setBarcode] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Müşteri State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Ödeme State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  
  // İndirim/Kampanya State
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<CartItem | null>(null);
  const [discountInput, setDiscountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  
  // UI State
  const [showCamera, setShowCamera] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showRecentSales, setShowRecentSales] = useState(false);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  
  // Fiş yazdırma State
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // ==================== CHANNEL MANAGEMENT ====================
  
  // Yeni kanal ekle
  const addChannel = () => {
    if (channels.length >= 5) {
      toast.error('⚠️ Maksimum 5 kanal açabilirsiniz!');
      return;
    }

    const newChannelIndex = channels.length;
    const newChannel: Channel = {
      id: (newChannelIndex + 1).toString(),
      name: getChannelName(newChannelIndex),
      color: 'blue-slate', // Kurumsal tek renk
      bgColor: 'bg-gradient-to-r from-blue-600 to-slate-700',
      textColor: 'text-blue-600',
      cart: [],
      customer: null,
      createdAt: new Date(),
    };

    setChannels(prev => [...prev, newChannel]);
    setActiveChannelId(newChannel.id);
    toast.success(`✅ ${newChannel.name} açıldı!`);
    playSound('success');
  };

  // Kanal kapat
  const removeChannel = (channelId: string) => {
    if (channels.length === 1) {
      toast.error('⚠️ En az 1 kanal açık olmalı!');
      return;
    }

    const channel = channels.find(ch => ch.id === channelId);
    if (!channel) return;

    // Sepet doluysa onay iste
    if (channel.cart.length > 0) {
      if (!confirm(`🗑️ ${channel.name}'de ${channel.cart.length} ürün var. Silmek istediğinize emin misiniz?`)) {
        return;
      }
    }

    const newChannels = channels.filter(ch => ch.id !== channelId);
    setChannels(newChannels);

    // Aktif kanalı kapattıysak, ilk kanala geç
    if (activeChannelId === channelId) {
      setActiveChannelId(newChannels[0].id);
    }

    toast.success(`✅ ${channel.name} kapatıldı!`);
  };

  // Kanal değiştir
  const switchChannel = (channelId: string) => {
    const channel = channels.find(ch => ch.id === channelId);
    if (!channel) return;

    setActiveChannelId(channelId);
    toast(`📌 ${channel.name} aktif`, { icon: '🔄', duration: 1000 });
  };

  // Aktif kanalı güncelle (sepet, müşteri)
  const updateActiveChannel = (updates: Partial<Channel>) => {
    setChannels(prev =>
      prev.map(ch =>
        ch.id === activeChannelId
          ? { ...ch, ...updates }
          : ch
      )
    );
  };

  // Fetch data
  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchCustomers();
    fetchRecentSales();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Channel shortcuts (Ctrl+1 to Ctrl+5)
      if (e.ctrlKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const channelId = e.key;
        if (channels.find(ch => ch.id === channelId)) {
          switchChannel(channelId);
        }
        return;
      }

      // Alt+N - Yeni kanal (Ctrl+N Chrome kullanıyor)
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        addChannel();
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setShowCamera(true);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setShowRecentSales(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setShowCustomerModal(true);
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleClearCart();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleQuickPayment('CASH');
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleQuickPayment('CREDIT_CARD');
      } else if (e.key === 'F10') {
        e.preventDefault();
        handleQuickPayment('CREDIT');
      } else if (e.key === 'F11') {
        e.preventDefault();
        setShowPaymentModal(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPaymentModal(false);
        setShowCamera(false);
        setShowCustomerModal(false);
        setShowDiscountModal(false);
        setShowRecentSales(false);
        setShowPrintModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart, channels, activeChannelId]);

  // 🔦 TORCH CONTROL
  const toggleTorch = async () => {
    if (!videoStreamRef.current) return;
    
    try {
      const track = videoStreamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled }]
        } as any);
        setTorchEnabled(!torchEnabled);
        toast.success(torchEnabled ? '🔦 El Feneri Kapandı' : '🔦 El Feneri Açıldı', { duration: 1000 });
      }
    } catch (error) {
      console.error('Torch toggle error:', error);
      toast.error('❌ El feneri kullanılamıyor');
    }
  };

  // 🔍 ZOOM CONTROL
  const handleZoomChange = async (newZoom: number) => {
    if (!videoStreamRef.current) return;
    
    try {
      const track = videoStreamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.zoom) {
        await track.applyConstraints({
          advanced: [{ zoom: newZoom }]
        } as any);
        setZoomLevel(newZoom);
      }
    } catch (error) {
      console.error('Zoom error:', error);
    }
  };

  // 💡 BRIGHTNESS CONTROL (Anti-glare / Parlama önleyici) - ENHANCED
  const handleBrightnessChange = async (newBrightness: number) => {
    setBrightnessLevel(newBrightness);
    
    // ALWAYS use CSS filter (more reliable and immediate)
    const videoElement = document.querySelector('#barcode-scanner video') as HTMLVideoElement;
    if (videoElement) {
      // Aggressive formula: -3 = 0.4, 0 = 1.0, +3 = 1.6
      const brightnessValue = 1 + (newBrightness * 0.2);
      const contrastValue = 1 + (contrastLevel * 0.15);
      const saturationValue = newBrightness < 0 ? 0.9 : 1.0; // Reduce saturation for anti-glare
      
      videoElement.style.filter = `brightness(${brightnessValue}) contrast(${contrastValue}) saturate(${saturationValue})`;
      console.log(`🎨 Filter applied: brightness(${brightnessValue.toFixed(2)}) contrast(${contrastValue.toFixed(2)})`);
    }
    
    // Also try native API (if supported)
    if (videoStreamRef.current) {
      try {
        const track = videoStreamRef.current.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        
        if (capabilities.exposureCompensation) {
          await track.applyConstraints({
            advanced: [{ exposureCompensation: newBrightness }]
          } as any);
        }
      } catch (error) {
        // Silently fail, CSS filter is already applied
      }
    }
  };

  // 🎨 CONTRAST CONTROL - ENHANCED
  const handleContrastChange = async (newContrast: number) => {
    setContrastLevel(newContrast);
    
    // ALWAYS use CSS filter
    const videoElement = document.querySelector('#barcode-scanner video') as HTMLVideoElement;
    if (videoElement) {
      const brightnessValue = 1 + (brightnessLevel * 0.2);
      const contrastValue = 1 + (newContrast * 0.15);
      const saturationValue = brightnessLevel < 0 ? 0.9 : 1.0;
      
      videoElement.style.filter = `brightness(${brightnessValue}) contrast(${contrastValue}) saturate(${saturationValue})`;
    }
  };

  // 🚀 QUICK FIX: Parlamayı Otomatik Gider (One-Click Solution)
  const handleQuickAntiGlare = () => {
    // Aggressive anti-glare settings
    setBrightnessLevel(-2);
    setContrastLevel(2);
    
    const videoElement = document.querySelector('#barcode-scanner video') as HTMLVideoElement;
    if (videoElement) {
      // brightness: 0.6 (dark), contrast: 1.3 (high), saturation: 0.85 (reduced)
      videoElement.style.filter = 'brightness(0.6) contrast(1.3) saturate(0.85)';
    }
    
    toast.success('⚡ Parlama giderildi! Brightness: -2, Contrast: +2', { duration: 2000 });
  };

  // 🔄 Reset to Optimal (Not normal, but optimal for anti-glare)
  const handleResetToOptimal = () => {
    setBrightnessLevel(-1);
    setContrastLevel(1);
    
    const videoElement = document.querySelector('#barcode-scanner video') as HTMLVideoElement;
    if (videoElement) {
      // Optimal: slightly dark, slightly high contrast
      videoElement.style.filter = 'brightness(0.8) contrast(1.15) saturate(0.9)';
    }
    
    toast.success('✨ Optimal ayarlar yüklendi', { duration: 1500 });
  };

  // 🤖 AUTO-ZOOM: Otomatik yakınlaştırma (kamera açıldığında)
  const applyAutoZoom = async (targetZoom: number) => {
    if (!videoStreamRef.current) return;
    
    try {
      const track = videoStreamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.zoom) {
        await track.applyConstraints({
          advanced: [{ zoom: targetZoom }]
        } as any);
        setZoomLevel(targetZoom);
        console.log(`🔍 Auto-Zoom applied: ${targetZoom}x`);
      }
    } catch (error) {
      console.error('Auto-zoom error:', error);
    }
  };

  // 🔄 AUTO-RETRY: Barkod okunamazsa otomatik ayarla ve tekrar dene
  const handleAutoRetry = async (failedBarcode: string) => {
    if (autoRetryCount >= 3 || isAutoAdjusting) {
      console.log('⚠️ Max retry reached or already adjusting');
      return;
    }
    
    setIsAutoAdjusting(true);
    setAutoRetryCount(prev => prev + 1);
    
    console.log(`🔄 Auto-Retry ${autoRetryCount + 1}/3: Adjusting settings...`);
    
    // Progressive enhancement strategy
    switch (autoRetryCount) {
      case 0:
        // Try 1: Increase zoom to 2.0x
        console.log('🎯 Strategy 1: Zoom 2.0x');
        await applyAutoZoom(2.0);
        toast('🔍 Zoom artırıldı: 2.0x', { duration: 1500, icon: '🔍' });
        break;
        
      case 1:
        // Try 2: Increase zoom to 2.5x + increase contrast
        console.log('🎯 Strategy 2: Zoom 2.5x + High Contrast');
        await applyAutoZoom(2.5);
        handleContrastChange(2);
        toast('🔍 Zoom 2.5x + Kontrast artırıldı', { duration: 1500, icon: '🎯' });
        break;
        
      case 2:
        // Try 3: Max zoom 3.0x + aggressive anti-glare
        console.log('🎯 Strategy 3: Max Zoom 3.0x + Aggressive Anti-Glare');
        await applyAutoZoom(3.0);
        handleBrightnessChange(-2);
        handleContrastChange(2);
        toast('🔍 Maksimum zoom + Anti-glare', { duration: 1500, icon: '⚡' });
        break;
    }
    
    // Reset flag after 2 seconds
    setTimeout(() => {
      setIsAutoAdjusting(false);
    }, 2000);
  };

  // 🧹 Reset auto-retry on successful scan
  const resetAutoRetry = () => {
    setAutoRetryCount(0);
    setIsAutoAdjusting(false);
    if (autoRetryTimeoutRef.current) {
      clearTimeout(autoRetryTimeoutRef.current);
      autoRetryTimeoutRef.current = null;
    }
  };

  // Kamera ile barkod okuma
  useEffect(() => {
    let isProcessing = false; // Çift okuma önleme

    const startScanner = async () => {
      if (showCamera) {
        setCameraLoading(true); // Loading başlat
        
        // HTTPS kontrolü
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          toast.error('🔒 Kamera sadece HTTPS bağlantısında çalışır!', { duration: 6000 });
          setShowCamera(false);
          setCameraLoading(false);
          return;
        }

        // getUserMedia desteği kontrolü
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error('❌ Tarayıcınız kamera kullanımını desteklemiyor!', { duration: 6000 });
          setShowCamera(false);
          setCameraLoading(false);
          return;
        }

        try {
          // Önce kamera iznini test et ve torch desteğini kontrol et
          console.log('📸 Kamera izni isteniyor...');
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          });
          
          // Torch kontrolü (NON-BLOCKING - paralel)
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities() as any;
          if (capabilities?.torch) {
            setIsTorchSupported(true);
          }
          
          // Stream'i kapat (html5-qrcode kendi açacak)
          stream.getTracks().forEach(track => track.stop());

          const scanner = new Html5Qrcode('barcode-scanner', {
            verbose: false, // Çok fazla log basmasın
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
            ],
          });
          scannerRef.current = scanner;

          // ARKA KAMERA ID'sini bul - HIZLI AMA GÜVENLE!
          let cameraId = 'environment'; // Default
          try {
            const devices = await Html5Qrcode.getCameras();
            console.log('📸 Bulunan kameralar:', devices);
            
            // Arka kamerayı bul (environment)
            const backCamera = devices.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('arka')
            );
            
            if (backCamera) {
              cameraId = backCamera.id;
              console.log('✅ Arka kamera bulundu:', backCamera.label);
              setCameraInfo(prev => ({ ...prev, deviceName: backCamera.label }));
            } else if (devices.length > 0) {
              // Arka kamera yoksa, son kamerayı kullan
              cameraId = devices[devices.length - 1].id;
              console.log('✅ Kamera seçildi:', devices[devices.length - 1].label);
              setCameraInfo(prev => ({ ...prev, deviceName: devices[devices.length - 1].label }));
            }
          } catch (e) {
            console.warn('⚠️ Kamera listesi alınamadı, default kullanılıyor:', e);
            setCameraInfo(prev => ({ ...prev, deviceName: 'Arka Kamera' }));
          }

          // 🎯 FULL HD VIDEO CONSTRAINTS - HER YÖNDEN OKUSUN!
          const fullHDConfig = {
            fps: 30,
            qrbox: 300, // 🔄 Kare alan = her yönden okur (yatay, dikey, çapraz)
            disableFlip: false, // ✅ Flip'e izin ver (her açı)
            videoConstraints: {
              facingMode: { exact: 'environment' },
              width: { ideal: 1920, min: 1280 },   // Full HD width
              height: { ideal: 1080, min: 720 },   // Full HD height
            }
          };

          console.log('🎥 Full HD başlatılıyor: 1920x1080 @ 30fps - HER YÖNDEN OKUR! 🔄');
          
          // ✅ Scanner başlatılıyor - loading birazdan kapanacak
          await scanner.start(
            cameraId, // String olarak camera ID
            fullHDConfig, // Config with videoConstraints
            async (decodedText, decodedResult) => {
              // Çift okuma önleme
              if (isProcessing) {
                return;
              }

              isProcessing = true;
              
              // ⏱️ SCAN TIME BAŞLAT
              const scanStartTime = Date.now();
              
              // BARKOD TEMİZLE (boşluk, özel karakter, normalize)
              const cleanBarcode = decodedText.trim().replace(/\s+/g, '').toUpperCase();
              console.log('✅ BARKOD (RAW):', decodedText);
              console.log('✅ BARKOD (CLEAN):', cleanBarcode);
              
              // 📊 SCAN QUALITY HESAPLA (barkod uzunluğuna göre)
              const quality = cleanBarcode.length >= 13 ? 'excellent' : 
                            cleanBarcode.length >= 8 ? 'good' : 'poor';
              setScanQuality(quality);
              
              // 📊 Scan counter artır
              setCameraInfo(prev => ({ ...prev, scanCount: prev.scanCount + 1 }));
              setScanStatus('scanning');
              
              // 🎵 Beep sesi (scan quality'ye göre farklı)
              if (quality === 'excellent') {
                playSound('beep'); // Normal beep
              } else {
                playSound('beep'); // Aynı ses ama farklı pitch olabilir
              }
              
              // 📳 Vibration (hafif)
              if (navigator.vibrate) {
                navigator.vibrate(50);
              }
              
              // Ürünü bul ve sepete ekle
              try {
                toast.loading('🔍 Aranıyor...');
                
                // Hem temiz hem RAW barkod ile dene
                let response;
                try {
                  response = await api.get(`/products/barcode/${encodeURIComponent(cleanBarcode)}`);
                } catch {
                  // Temiz barkod bulamazsa RAW dene
                  response = await api.get(`/products/barcode/${encodeURIComponent(decodedText)}`);
                }
                
                const product = response.data.product;

                toast.dismiss();

                if (product.stock <= 0) {
                  toast.error(`❌ ${product.name} stokta yok!`, { duration: 4000 });
                  playSound('error');
                  isProcessing = false;
                  return;
                }

                addToCart(product);
                toast.success(`✅ ${product.name} eklendi!`, { 
                  duration: 2000,
                  icon: '🛒' 
                });
                playSound('success');
                
                // ✅ BAŞARILI FEEDBACK
                setScanStatus('success');
                setFlashEffect('success');
                
                // ⏱️ SCAN TIME KAYDET
                const scanTime = Date.now() - scanStartTime;
                setLastScanTime(scanTime);
                console.log(`⚡ Tarama süresi: ${scanTime}ms`);
                
                // 🧹 RESET AUTO-RETRY (başarılı scan)
                resetAutoRetry();
                
                // 📳 Başarılı vibration (çift titreşim)
                if (navigator.vibrate) {
                  navigator.vibrate([100, 50, 100]);
                }
                
                // Flash efektini kaldır
                setTimeout(() => setFlashEffect('none'), 500);
                
                // Kapat
                setTimeout(() => {
                  setShowCamera(false);
                  setScanStatus('idle');
                }, 800);
              } catch (error: any) {
                toast.dismiss();
                console.error('❌ Ürün yok (Clean):', cleanBarcode);
                console.error('❌ Ürün yok (RAW):', decodedText);
                
                // 🤖 AUTO-RETRY: Otomatik ayarlama ve tekrar deneme
                if (autoRetryCount < 3) {
                  toast(`⚙️ Ürün bulunamadı. Otomatik ayarlama (${autoRetryCount + 1}/3)...`, { duration: 2000, icon: '🤖' });
                  await handleAutoRetry(cleanBarcode);
                } else {
                  toast.error(`❌ Ürün bulunamadı: ${cleanBarcode} (3 deneme yapıldı)`, { duration: 5000 });
                }
                
                playSound('error');
                
                // ❌ HATA FEEDBACK
                setScanStatus('error');
                setFlashEffect('error');
                
                // 📳 Hata vibration (uzun titreşim)
                if (navigator.vibrate) {
                  navigator.vibrate(200);
                }
                
                // Flash efektini kaldır
                setTimeout(() => {
                  setFlashEffect('none');
                  setScanStatus('idle');
                }, 500);
                
                isProcessing = false;
              }
            },
            (errorMessage) => {
              // Scanning - log basma
            }
          );
          
          // 🚀 Scanner başladı - LOADING'İ HEMEN KAPAT!
          setCameraLoading(false);
          toast.success('📸 Hazır!', { duration: 1000 });
          console.log('✅ Scanner başlatıldı');

          // Video elementinden stream'i al (torch ve zoom için) - ARKA PLANDA!
          setTimeout(async () => {
            const videoElement = document.querySelector('#barcode-scanner video') as HTMLVideoElement;
            if (videoElement && videoElement.srcObject) {
              videoStreamRef.current = videoElement.srcObject as MediaStream;
              console.log('✅ Video stream yakalandı (torch/zoom için)');
              
              // 🎨 AUTO-APPLY OPTIMAL ANTI-GLARE SETTINGS ON START (INSTANT!)
              // Default: brightness -1, contrast +1 (optimal for most conditions)
              videoElement.style.filter = 'brightness(0.8) contrast(1.15) saturate(0.9)';
              console.log('🎨 Optimal anti-glare filter applied automatically');
              
              // 🔍 AUTO-APPLY ZOOM 1.5X ON START (NON-BLOCKING!)
              applyAutoZoom(1.5).then(() => {
                console.log('🔍 Auto-Zoom 1.5x applied');
                toast.success('🤖 AI Ayarlar Aktif', { duration: 1500 });
              });
            }
          }, 50); // 🚀 Arka planda hızlıca uygula
        } catch (error: any) {
          console.error('❌ Kamera hatası:', error);
          
          // Detaylı hata mesajı
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
          setCameraLoading(false); // Loading bitir
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
  }, [showCamera]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Categories fetch error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=1000');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Products fetch error:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Customers fetch error:', error);
    }
  };

  const fetchRecentSales = async () => {
    try {
      const response = await api.get('/sales?limit=10');
      setRecentSales(response.data.sales || []);
    } catch (error) {
      console.error('Recent sales fetch error:', error);
    }
  };

  // Ses çal
  const playSound = (type: 'success' | 'error' | 'beep') => {
    if (!soundEnabled) return;
    
    const audio = new Audio();
    if (type === 'beep') {
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTgIFWi78OibUBELUKXh8LZkHQU5k9nyy3ksBS2Ay/HajDgJFmm98OqcUBELT6Ph8LRkHgU6lNvy0H0tBSx+zPDcjzkJFWm98OmcUhILTqPg8LNlHwU7ltvyzn0tBSt9y/DajzsKFWi88OidUxMLTaLf8LJmHwU8l9vyz38uBCp7yvDZkD4LFGe78OidVBQLTKDe8LFnIAU9mNzyz4EvBCl6yO/YkT8MFGa68OieVRUKS5/d8LBoIQU+md3yzoExBCh5xu/XkUEOE2S58OmeVhYKSpzd8K9pIgU+mt7yzYMyBCh4xO/WkUIRE2O48OqfVxYJSJrb8K5qIwQ/nN7yy4UzBSd2w+7VkUMUEmG38OqgWBcJRpjZ8K1rJAQ/nt/yyoU1BSZ0we3UkUUXEmC18OqhWRkIRZbY8Ktsk';
    }
    audio.play().catch(() => {});
  };

  // Barkod ile ürün ekle
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setLoading(true);
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data.product;

      if (product.stock <= 0) {
        toast.error('❌ Ürün stokta yok!');
        playSound('error');
        return;
      }

      addToCart(product);
      setBarcode('');
      playSound('beep');
      toast.success(`✅ ${product.name} sepete eklendi!`);
    } catch (error: any) {
      toast.error('❌ Ürün bulunamadı!');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  // Sepete ürün ekle
  const addToCart = (product: Product) => {
    const currentCart = cart;
    const existingItem = currentCart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('⚠️ Stok yetersiz!');
        playSound('error');
        return;
      }
      const newCart = currentCart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      updateActiveChannel({ cart: newCart });
    } else {
      const newCart = [...currentCart, { product, quantity: 1, discount: 0, note: '' }];
      updateActiveChannel({ cart: newCart });
    }
    playSound('beep');
  };

  // Sepetten ürün çıkar
  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.product.id !== productId);
    updateActiveChannel({ cart: newCart });
    playSound('error');
    toast.success('✅ Ürün sepetten çıkarıldı!');
  };

  // Miktar artır
  const increaseQuantity = (productId: string) => {
    const newCart = cart.map(item => {
      if (item.product.id === productId) {
        if (item.quantity >= item.product.stock) {
          toast.error('⚠️ Stok yetersiz!');
          playSound('error');
          return item;
        }
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    });
    updateActiveChannel({ cart: newCart });
  };

  // Miktar azalt
  const decreaseQuantity = (productId: string) => {
    const newCart = cart.map(item =>
      item.product.id === productId && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    updateActiveChannel({ cart: newCart });
  };

  // Sepeti temizle
  const handleClearCart = () => {
    if (cart.length === 0) return;
    
    if (confirm('🗑️ Sepeti temizlemek istediğinize emin misiniz?')) {
      updateActiveChannel({ cart: [], customer: null });
      toast.success('✅ Sepet temizlendi!');
    }
  };

  // İndirim uygula
  const openDiscountModal = (item: CartItem) => {
    setSelectedCartItem(item);
    setDiscountInput(item.discount.toString());
    setNoteInput(item.note);
    setShowDiscountModal(true);
  };

  const applyDiscount = () => {
    if (!selectedCartItem) return;
    
    const discount = parseFloat(discountInput) || 0;
    if (discount < 0 || discount > 100) {
      toast.error('❌ İndirim 0-100 arasında olmalı!');
      return;
    }

    const newCart = cart.map(item =>
      item.product.id === selectedCartItem.product.id
        ? { ...item, discount, note: noteInput }
        : item
    );
    updateActiveChannel({ cart: newCart });

    toast.success(`✅ İndirim uygulandı: %${discount}`);
    setShowDiscountModal(false);
    setSelectedCartItem(null);
  };

  // Müşteri seç
  const selectCustomer = (customer: Customer) => {
    updateActiveChannel({ customer });
    setShowCustomerModal(false);
    toast.success(`✅ Müşteri seçildi: ${customer.name}`);
  };

  // Hızlı ödeme
  const handleQuickPayment = (method: 'CASH' | 'CREDIT_CARD' | 'CREDIT') => {
    if (cart.length === 0) {
      toast.error('❌ Sepet boş!');
      return;
    }

    if (method === 'CREDIT' && !selectedCustomer) {
      toast.error('❌ Veresiye için müşteri seçmelisiniz!');
      setShowCustomerModal(true);
      return;
    }
    
    completeSale([{ method, amount: totalAmount }]);
  };

  // Karma ödeme
  const handleMixedPayment = () => {
    if (cart.length === 0) {
      toast.error('❌ Sepet boş!');
      return;
    }

    const paymentList: Payment[] = [];
    const cash = parseFloat(cashAmount) || 0;
    const card = parseFloat(cardAmount) || 0;
    const total = cash + card;

    if (cash > 0) paymentList.push({ method: 'CASH', amount: cash });
    if (card > 0) paymentList.push({ method: 'CREDIT_CARD', amount: card });

    if (paymentList.length === 0) {
      toast.error('❌ Ödeme tutarı girmelisiniz!');
      return;
    }

    if (total < totalAmount) {
      toast.error(`❌ Yetersiz ödeme! Kalan: ${(totalAmount - total).toFixed(2)} ₺`);
      return;
    }

    completeSale(paymentList);
  };

  // Satış tamamla
  const completeSale = async (paymentList: Payment[]) => {
    if (cart.length === 0) {
      toast.error('❌ Sepet boş!');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price - (item.product.price * item.discount / 100),
        })),
        paymentMethod: paymentList[0].method,
        totalAmount,
        customerId: selectedCustomer?.id,
      };

      const response = await api.post('/sales', saleData);
      
      playSound('success');
      toast.success(`🎉 ${activeChannel.name} - Satış tamamlandı!`);
      
      // Fiş yazdırma modal göster
      setLastSale(response.data.sale);
      setShowPrintModal(true);
      
      // Aktif kanalı temizle (ama kapat değil!)
      updateActiveChannel({ cart: [], customer: null });
      setShowPaymentModal(false);
      setPayments([]);
      setCashAmount('');
      setCardAmount('');
      fetchProducts();
      fetchRecentSales();
    } catch (error: any) {
      toast.error('❌ Satış başarısız: ' + (error.response?.data?.error || error.message));
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  // Satışı tekrarla
  const repeatSale = (sale: Sale) => {
    const newCart: CartItem[] = [];
    sale.saleItems.forEach(item => {
      const product = products.find(p => p.id === item.product.id);
      if (product) {
        newCart.push({ 
          product, 
          quantity: item.quantity, 
          discount: 0, 
          note: '' 
        });
      }
    });
    updateActiveChannel({ cart: newCart });
    setShowRecentSales(false);
    toast.success(`✅ Satış ${activeChannel.name}'e eklendi!`);
  };

  // Fiş yazdır
  const printReceipt = () => {
    if (!lastSale) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fiş - ${lastSale.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
          h1 { text-align: center; font-size: 20px; margin-bottom: 10px; }
          .info { margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
          table { width: 100%; margin-bottom: 15px; }
          th { text-align: left; border-bottom: 1px solid #000; }
          td { padding: 5px 0; }
          .total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>BARCODEPOS</h1>
        <div class="info">
          <p><strong>Fiş No:</strong> ${lastSale.id.slice(0, 8).toUpperCase()}</p>
          <p><strong>Tarih:</strong> ${new Date(lastSale.createdAt).toLocaleString('tr-TR')}</p>
          <p><strong>Kasiyer:</strong> ${user?.name}</p>
          <p><strong>Ödeme:</strong> ${lastSale.paymentMethod}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Adet</th>
              <th>Birim</th>
              <th>Toplam</th>
            </tr>
          </thead>
          <tbody>
            ${lastSale.saleItems.map(item => `
              <tr>
                <td>${item.product.name}</td>
                <td>${item.quantity}</td>
                <td>${item.unitPrice.toFixed(2)} ₺</td>
                <td>${(item.unitPrice * item.quantity).toFixed(2)} ₺</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          <p>TOPLAM: ${lastSale.totalAmount.toFixed(2)} ₺</p>
        </div>
        <div class="footer">
          <p>Bizi tercih ettiğiniz için teşekkürler!</p>
          <p>www.barcodepos.trade</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Toplam hesapla
  const subtotal = cart.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);
  
  const totalDiscount = cart.reduce((sum, item) => {
    return sum + (item.product.price * item.discount / 100) * item.quantity;
  }, 0);
  
  const totalAmount = subtotal - totalDiscount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category?.id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm);
    return matchesCategory && matchesSearch && product.stock > 0;
  });

  // En çok satan ürünler (ilk 20)
  const favoriteProducts = products.filter(p => p.stock > 0).slice(0, 20);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/20">
      {/* CHANNEL TABS - Çoklu Müşteri Kanalı */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-800 shadow-lg"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 overflow-x-auto scrollbar-thin">
          {channels.map((channel) => {
            const isActive = channel.id === activeChannelId;
            const channelTotal = channel.cart.reduce((sum, item) => {
              const discountedPrice = item.product.price - (item.product.price * item.discount / 100);
              return sum + discountedPrice * item.quantity;
            }, 0);
            const channelItemCount = channel.cart.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <motion.div
                key={channel.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchChannel(channel.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-slate-700 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {/* Close Button */}
                {channels.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeChannel(channel.id);
                    }}
                    className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${
                      isActive ? 'bg-white text-red-600' : 'bg-red-500 text-white'
                    } flex items-center justify-center hover:scale-125 transition-all shadow-lg font-black text-xs z-10`}
                  >
                    ×
                  </button>
                )}

                {/* Channel Info */}
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold">{channel.name}</p>
                  <span className="text-[10px] opacity-75">•</span>
                  <span className="text-xs font-bold">{channelTotal.toFixed(2)}₺</span>
                  {channelItemCount > 0 && (
                    <>
                      <span className="text-[10px] opacity-75">•</span>
                      <span className="text-xs font-semibold">{channelItemCount}</span>
                    </>
                  )}
                  {channel.customer && (
                    <>
                      <span className="text-[10px] opacity-75">•</span>
                      <span className="text-xs font-semibold truncate max-w-[60px]">{channel.customer.name}</span>
                    </>
                  )}
                </div>

                {/* Keyboard Shortcut - Sadece desktop'ta göster */}
                <div className={`hidden md:flex text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-700'
                }`}>
                  Ctrl+{channel.id}
                </div>
              </motion.div>
            );
          })}

          {/* Add Channel Button */}
          {channels.length < 5 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addChannel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-slate-700 text-white font-bold shadow-sm hover:shadow-md transition-all text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Yeni
              <span className="hidden md:inline text-[10px] opacity-75">(Alt+N)</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* HEADER - Barkod ve Kontroller */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-slate-700 shadow-2xl p-3 md:p-4"
      >
        {/* Mobil: İki satır - Input üstte, butonlar altta */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
          {/* Barkod Input */}
          <div className="flex-1 flex items-center gap-2">
            <Scan className="w-6 h-6 text-white flex-shrink-0 hidden md:block" />
            <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-2">
              <input
                ref={barcodeInputRef}
                type="text"
                inputMode="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Barkod okut..."
                className="flex-1 px-4 h-12 md:h-auto md:py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg"
                disabled={loading}
                autoFocus
              />
            </form>
          </div>

          {/* Kontrol Butonları */}
          <div className="flex items-center gap-2">
            {/* Kamera Butonu - Mobilde daha büyük */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCamera(!showCamera)}
              className="flex-1 md:flex-none h-12 md:h-auto px-4 md:px-4 py-3 rounded-xl bg-white text-blue-600 font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span className="md:hidden">KAMERA</span>
              <span className="hidden md:inline">F2</span>
            </motion.button>

            {/* Son Satışlar - Desktop */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRecentSales(true)}
              className="hidden md:flex px-4 py-3 rounded-xl bg-white text-slate-700 dark:bg-slate-800 dark:text-white font-bold shadow-lg hover:shadow-xl transition-all items-center gap-2"
            >
              <History className="w-5 h-5" />
              <span className="hidden lg:inline">F3</span>
            </motion.button>

            {/* Müşteri Seç - Desktop */}
            <button
              onClick={() => setShowCustomerModal(true)}
              className="hidden md:flex px-4 py-3 rounded-xl bg-white text-slate-700 dark:bg-slate-800 dark:text-white font-bold shadow-lg hover:shadow-xl transition-all items-center gap-2"
            >
              <User className="w-5 h-5" />
              <span className="hidden lg:inline">{selectedCustomer ? selectedCustomer.name : 'Müşteri (F4)'}</span>
            </button>

            {/* Toplam Badge */}
            <div className="flex-1 md:flex-none px-4 md:px-6 h-12 md:h-auto py-3 rounded-xl bg-white text-blue-600 font-black text-lg md:text-xl shadow-lg flex items-center justify-center gap-2">
              <DollarSign className="w-5 md:w-6 h-5 md:h-6" />
              <span className="text-base md:text-xl">{totalAmount.toFixed(2)} ₺</span>
            </div>

            {/* Ses Toggle - Desktop */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="hidden md:block p-3 rounded-xl bg-white text-slate-700 dark:bg-slate-800 dark:text-white shadow-lg hover:shadow-xl transition-all"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden">
        {/* SOL PANEL - Favori Ürünler (Desktop Only) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden xl:flex w-64 flex-col bg-white dark:bg-slate-900 border-r-3 border-blue-200 dark:border-slate-800 shadow-xl p-4"
        >
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            FAVORİLER
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {favoriteProducts.map(product => (
              <motion.button
                key={product.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addToCart(product)}
                className="w-full p-3 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-800 dark:to-blue-950 border-2 border-blue-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-md hover:shadow-lg"
              >
                <p className="font-black text-xs text-slate-900 dark:text-white mb-1 line-clamp-2 text-left">
                  {product.name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-blue-600">{product.price.toFixed(2)} ₺</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    product.stock > 10 ? 'bg-green-100 text-green-700' :
                    product.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {product.stock}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ORTA PANEL - Kategoriler + Ürünler */}
        <div className="flex-1 flex flex-col p-3 md:p-4 overflow-hidden">
          {/* Kategoriler */}
          <div className="mb-3 md:mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-black text-xs md:text-sm whitespace-nowrap shadow-lg transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-slate-700 text-white scale-105'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
              }`}
            >
              TÜM ÜRÜNLER
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-black text-xs md:text-sm whitespace-nowrap shadow-lg transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-blue-600 to-slate-700 text-white scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
              >
                {category.name.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Arama ve Görünüm */}
          <div className="mb-3 md:mb-4 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                inputMode="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full pl-11 pr-4 h-12 md:h-auto md:py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none font-semibold shadow-md"
              />
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="hidden md:flex w-12 h-12 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all shadow-md"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
          </div>

          {/* Ürün Grid/List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Package className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm font-bold">Ürün Bulunamadı</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2 md:gap-3' : 'space-y-2'}>
                {filteredProducts.map(product => (
                  <motion.button
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(product)}
                    className={`rounded-xl bg-white dark:bg-slate-800 border-2 md:border-3 border-blue-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl transition-all shadow-lg ${
                      viewMode === 'grid' ? 'p-3 md:p-4 flex flex-col' : 'p-3 flex items-center gap-3'
                    }`}
                  >
                    <div className={viewMode === 'grid' ? 'w-full' : 'flex-1'}>
                      <p className={`font-black text-slate-900 dark:text-white ${
                        viewMode === 'grid' ? 'text-xs md:text-sm mb-2 line-clamp-2 min-h-[2rem] md:min-h-[2.5rem]' : 'text-sm line-clamp-1'
                      }`}>
                        {product.name.toUpperCase()}
                      </p>
                      {product.category && (
                        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                          {product.category.name}
                        </p>
                      )}
                    </div>
                    <div className={`flex items-center ${viewMode === 'grid' ? 'justify-between' : 'gap-3'}`}>
                      <span className={`font-black text-blue-600 ${viewMode === 'grid' ? 'text-base md:text-lg' : 'text-base'}`}>
                        {product.price.toFixed(2)} ₺
                      </span>
                      <span className={`text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
                        product.stock > 10 ? 'bg-green-100 text-green-700' :
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {product.stock}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SAĞ PANEL - Sepet + Ödeme */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-slate-900 md:border-l-3 border-blue-200 dark:border-slate-800 shadow-2xl max-h-[50vh] md:max-h-none"
        >
          {/* Sepet Header */}
          <div className="p-3 md:p-4 bg-gradient-to-r from-blue-600 to-slate-700 text-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
                <Receipt className="w-5 md:w-6 h-5 md:h-6" />
                SEPET
              </h2>
              <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-white text-blue-600 font-black text-sm">
                {totalItems}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={handleClearCart}
                disabled={cart.length === 0}
                className="text-xs font-bold text-blue-100 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden md:inline">Temizle (F5)</span>
                <span className="md:hidden">Temizle</span>
              </button>
              {selectedCustomer && (
                <div className="text-xs font-bold text-blue-100 flex items-center gap-1 truncate max-w-[120px]">
                  <Users className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{selectedCustomer.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sepet Items */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 scrollbar-thin">
            <AnimatePresence>
              {cart.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-slate-400"
                >
                  <Receipt className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm font-bold">Sepet Boş</p>
                  <p className="text-xs">Ürün eklemek için barkod okutun</p>
                </motion.div>
              ) : (
                cart.map(item => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-black text-sm text-slate-900 dark:text-white mb-1">
                          {item.product.name}
                        </h3>
                        {item.discount > 0 && (
                          <span className="text-xs font-bold text-green-600">
                            -%{item.discount} İndirim
                          </span>
                        )}
                        {item.note && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">
                            Not: {item.note}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openDiscountModal(item)}
                          className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                          title="İndirim/Not ekle"
                        >
                          <Percent className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decreaseQuantity(item.product.id)}
                          className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 flex items-center justify-center font-black transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-base font-black text-slate-900 dark:text-white w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increaseQuantity(item.product.id)}
                          className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 flex items-center justify-center font-black transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        {item.discount > 0 && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold line-through">
                            {(item.product.price * item.quantity).toFixed(2)} ₺
                          </p>
                        )}
                        <p className="text-base font-black text-blue-600">
                          {((item.product.price - (item.product.price * item.discount / 100)) * item.quantity).toFixed(2)} ₺
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Toplam ve Ödeme */}
          <div className="p-4 border-t-3 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Ara Toplam:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{subtotal.toFixed(2)} ₺</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">İndirim:</span>
                  <span className="text-sm font-bold text-green-600">-{totalDiscount.toFixed(2)} ₺</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t-2 border-slate-200 dark:border-slate-700">
                <span className="text-xl font-black text-slate-900 dark:text-white">TOPLAM:</span>
                <span className="text-3xl font-black text-blue-600">{totalAmount.toFixed(2)} ₺</span>
              </div>
            </div>

            {/* Hızlı Ödeme Butonları */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickPayment('CASH')}
                disabled={cart.length === 0 || loading}
                className="py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
              >
                <DollarSign className="w-5 h-5 mb-1" />
                NAKİT
                <span className="text-xs opacity-75">(F8)</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickPayment('CREDIT_CARD')}
                disabled={cart.length === 0 || loading}
                className="py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
              >
                <CreditCard className="w-5 h-5 mb-1" />
                KART
                <span className="text-xs opacity-75">(F9)</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickPayment('CREDIT')}
                disabled={cart.length === 0 || loading}
                className="py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
              >
                <Wallet className="w-5 h-5 mb-1" />
                VERESİYE
                <span className="text-xs opacity-75">(F10)</span>
              </motion.button>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-slate-700 text-white font-black text-base shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              KARMA ÖDEME (F11)
            </button>
          </div>
        </motion.div>
      </div>

      {/* KAMERA MODAL - MOBİL OPTİMİZE */}
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
                <span className="hidden sm:inline">BARKOD OKUYUCU</span>
                <span className="sm:hidden">OKUYUCU</span>
              </h3>
              
              {/* 📦 MOBİL SEPET ÖZETİ - Sadece mobilde görünür */}
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="md:hidden bg-green-500 rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg"
                  >
                    <ShoppingCart className="w-5 h-5 text-white" />
                    <div className="text-white font-black">
                      <div className="text-xs leading-none">{cart.length} Ürün</div>
                      <div className="text-sm leading-none">{totalAmount.toFixed(0)} ₺</div>
                    </div>
                  </motion.div>
                )}
                
                <button
                  onClick={() => {
                    setShowCamera(false);
                    setScanStatus('idle');
                    setFlashEffect('none');
                    setCameraInfo(prev => ({ ...prev, scanCount: 0 }));
                    setTorchEnabled(false);
                    setZoomLevel(1.0);
                    setLastScanTime(0);
                    setScanQuality('good');
                    setBrightnessLevel(-1);
                    setContrastLevel(1);
                    resetAutoRetry(); // Reset auto-retry state
                    if (videoStreamRef.current) {
                      videoStreamRef.current.getTracks().forEach(track => track.stop());
                      videoStreamRef.current = null;
                    }
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Scanner Container - FULL SCREEN */}
            <div className="flex-1 relative">
              <div 
                id="barcode-scanner" 
                className="w-full h-full"
              />
              
              {/* ⏳ LOADING OVERLAY - Kamera hazırlanıyor */}
              <AnimatePresence>
                {cameraLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-br from-blue-600 to-slate-800 flex flex-col items-center justify-center z-50"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="mb-6"
                    >
                      <Camera className="w-20 h-20 text-white" />
                    </motion.div>
                    <motion.p
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-2xl font-black text-white mb-2"
                    >
                      Kamera Hazırlanıyor...
                    </motion.p>
                    <p className="text-sm text-blue-200">
                      ⚡ Full HD 1920x1080 • 30 FPS • AI Otomatik Ayarlar
                    </p>
                    
                    {/* Loading dots */}
                    <div className="flex gap-2 mt-6">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          className="w-3 h-3 bg-white rounded-full"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* 🎨 FLASH EFFECTS (Yeşil=Başarılı, Kırmızı=Hata) */}
              <AnimatePresence>
                {flashEffect === 'success' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-green-500 pointer-events-none"
                  />
                )}
                {flashEffect === 'error' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-red-500 pointer-events-none"
                  />
                )}
              </AnimatePresence>
              
              {/* 📊 ADVANCED KAMERA BİLGİLERİ - Üst Sol (MOBILDE GİZLİ) */}
              <div className="hidden md:block absolute top-4 left-4 bg-black/80 backdrop-blur-md rounded-2xl p-3 space-y-1.5 text-white text-xs font-bold shadow-2xl border border-white/10">
                <div className="flex items-center gap-2 pb-1.5 border-b border-white/20">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400">CANLI</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">📷 Cihaz</span>
                  <span className="text-green-400">{cameraInfo.deviceName.length > 15 ? cameraInfo.deviceName.slice(0, 15) + '...' : cameraInfo.deviceName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">📐 Çözünürlük</span>
                  <span className="text-blue-400">{cameraInfo.resolution}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">⚡ FPS</span>
                  <span className="text-yellow-400">{cameraInfo.fps}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">🔍 Zoom</span>
                  <span className="text-purple-400">{zoomLevel.toFixed(1)}x</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">📊 Tarama</span>
                  <span className="text-pink-400">{cameraInfo.scanCount}</span>
                </div>
                {lastScanTime > 0 && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-white/20">
                    <span className="text-gray-400">⏱️ Son</span>
                    <span className="text-cyan-400">{lastScanTime}ms</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">🎯 Kalite</span>
                  <span className={`${
                    scanQuality === 'excellent' ? 'text-green-400' :
                    scanQuality === 'good' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {scanQuality === 'excellent' ? '⭐⭐⭐' :
                     scanQuality === 'good' ? '⭐⭐' : '⭐'}
                  </span>
                </div>
                {/* AI Auto-Adjustment Status */}
                {isAutoAdjusting && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-white/20">
                    <span className="text-gray-400">🤖 AI</span>
                    <span className="text-orange-400 animate-pulse">Ayarlıyor {autoRetryCount}/3</span>
                  </div>
                )}
                {autoRetryCount > 0 && !isAutoAdjusting && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-white/20">
                    <span className="text-gray-400">🔄 Deneme</span>
                    <span className="text-cyan-400">{autoRetryCount}/3</span>
                  </div>
                )}
              </div>
              
              {/* 🎯 DURUM GÖSTERGESİ - Üst Orta (Mobilde minimal) */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <motion.div
                  animate={{
                    scale: scanStatus === 'scanning' ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: scanStatus === 'scanning' ? Infinity : 0,
                  }}
                  className={`px-3 md:px-6 py-1.5 md:py-3 rounded-full font-black text-xs md:text-sm shadow-2xl ${
                    scanStatus === 'success' ? 'bg-green-500 text-white' :
                    scanStatus === 'error' ? 'bg-red-500 text-white' :
                    scanStatus === 'scanning' ? 'bg-yellow-500 text-black animate-pulse' :
                    'bg-blue-600/90 text-white'
                  }`}
                >
                  {/* Mobilde sadece emoji, desktop'ta tam yazı */}
                  <span className="md:hidden">
                    {scanStatus === 'success' ? '✅' :
                     scanStatus === 'error' ? '❌' :
                     scanStatus === 'scanning' ? '🔍' :
                     '📸'}
                  </span>
                  <span className="hidden md:inline">
                    {scanStatus === 'success' ? '✅ BAŞARILI!' :
                     scanStatus === 'error' ? '❌ BULUNAMADI!' :
                     scanStatus === 'scanning' ? '🔍 ARANIYOR...' :
                     '📸 TARANMAYA HAZIR'}
                  </span>
                </motion.div>
              </div>
              
              {/* KIRMIZI LAZER TARAMA ÇİZGİSİ - Animasyonlu (HER YÖNDEN!) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-full max-w-sm h-80">
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
              
              {/* 💡 ADVANCED BRIGHTNESS CONTROLS - Sol Alt (MOBILDE GİZLİ) */}
              <div className="hidden md:block absolute bottom-4 left-4 bg-black/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border-2 border-blue-500/30 space-y-3 max-w-[280px]">
                <div className="text-sm text-white font-black text-center pb-2 border-b-2 border-white/20 flex items-center justify-center gap-2">
                  <span className="text-xl">💡</span>
                  PARLAMA KONTROLİ
                </div>
                
                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleQuickAntiGlare}
                    className="py-2.5 px-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-1"
                  >
                    <span className="text-base">⚡</span>
                    PARLAMAYI GİDER
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleResetToOptimal}
                    className="py-2.5 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-1"
                  >
                    <span className="text-base">✨</span>
                    OPTİMAL
                  </motion.button>
                </div>
                
                {/* Brightness Slider */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-gray-300 font-bold px-1">
                    <span>🌙 Karanlık</span>
                    <span className="text-white">Parlaklık</span>
                    <span>☀️ Parlak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBrightnessChange(Math.max(brightnessLevel - 1, -3))}
                      disabled={brightnessLevel <= -3}
                      className="w-8 h-8 rounded-full bg-black/70 border-2 border-white/30 text-white flex items-center justify-center disabled:opacity-20 hover:bg-black/90 transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="-3"
                        max="3"
                        step="1"
                        value={brightnessLevel}
                        onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                        className="w-full h-3 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, 
                            #1e293b 0%, 
                            #475569 ${((brightnessLevel + 3) / 6) * 100}%, 
                            #fbbf24 ${((brightnessLevel + 3) / 6) * 100}%, 
                            #fbbf24 100%)`
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleBrightnessChange(Math.min(brightnessLevel + 1, 3))}
                      disabled={brightnessLevel >= 3}
                      className="w-8 h-8 rounded-full bg-black/70 border-2 border-white/30 text-white flex items-center justify-center disabled:opacity-20 hover:bg-black/90 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center bg-black/50 rounded-lg py-1.5 px-3">
                    <span className={`text-sm font-black ${
                      brightnessLevel <= -2 ? 'text-red-400' :
                      brightnessLevel < 0 ? 'text-blue-400' :
                      brightnessLevel === 0 ? 'text-gray-400' :
                      'text-yellow-400'
                    }`}>
                      {brightnessLevel > 0 ? `+${brightnessLevel}` : brightnessLevel} 
                      {brightnessLevel <= -2 ? ' (Max Anti-Glare)' :
                       brightnessLevel === -1 ? ' (Anti-Glare)' :
                       brightnessLevel === 0 ? ' (Normal)' :
                       brightnessLevel === 1 ? ' (Parlak)' :
                       ' (Max Parlak)'}
                    </span>
                  </div>
                </div>
                
                {/* Contrast Slider */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-gray-300 font-bold px-1">
                    <span>📉 Düşük</span>
                    <span className="text-white">Kontrast</span>
                    <span>📈 Yüksek</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleContrastChange(Math.max(contrastLevel - 1, -3))}
                      disabled={contrastLevel <= -3}
                      className="w-8 h-8 rounded-full bg-black/70 border-2 border-white/30 text-white flex items-center justify-center disabled:opacity-20 hover:bg-black/90 transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="-3"
                        max="3"
                        step="1"
                        value={contrastLevel}
                        onChange={(e) => handleContrastChange(Number(e.target.value))}
                        className="w-full h-3 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, 
                            #64748b 0%, 
                            #94a3b8 ${((contrastLevel + 3) / 6) * 100}%, 
                            #06b6d4 ${((contrastLevel + 3) / 6) * 100}%, 
                            #06b6d4 100%)`
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleContrastChange(Math.min(contrastLevel + 1, 3))}
                      disabled={contrastLevel >= 3}
                      className="w-8 h-8 rounded-full bg-black/70 border-2 border-white/30 text-white flex items-center justify-center disabled:opacity-20 hover:bg-black/90 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center bg-black/50 rounded-lg py-1.5 px-3">
                    <span className="text-sm font-black text-cyan-400">
                      {contrastLevel > 0 ? `+${contrastLevel}` : contrastLevel}
                    </span>
                  </div>
                </div>

                {/* Current Status */}
                <div className="pt-2 border-t-2 border-white/20">
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-2 border border-green-500/30">
                    <p className="text-xs text-green-300 text-center font-bold">
                      ✅ Otomatik anti-glare aktif
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 🔦 TORCH BUTTON - Sağ Alt (MOBILDE GİZLİ - Otomatik) */}
              {isTorchSupported && (
                <motion.button
                  onClick={toggleTorch}
                  whileTap={{ scale: 0.9 }}
                  className={`hidden md:flex absolute bottom-20 right-4 w-16 h-16 rounded-full shadow-2xl border-4 items-center justify-center transition-all ${
                    torchEnabled 
                      ? 'bg-yellow-400 border-yellow-500 text-yellow-900' 
                      : 'bg-black/70 border-white/30 text-white'
                  }`}
                >
                  <Zap className={`w-8 h-8 ${torchEnabled ? 'animate-pulse' : ''}`} />
                </motion.button>
              )}
              
              {/* 🔍 ZOOM CONTROLS - Sağ Ortası (MOBILDE GİZLİ - Otomatik) */}
              <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-3">
                {/* Zoom In */}
                <motion.button
                  onClick={() => handleZoomChange(Math.min(zoomLevel + 0.5, 3.0))}
                  whileTap={{ scale: 0.9 }}
                  disabled={zoomLevel >= 3.0}
                  className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-sm border-2 border-white/30 text-white flex items-center justify-center shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-6 h-6" />
                </motion.button>
                
                {/* Zoom Level Display */}
                <div className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border-2 border-white/30 text-white flex items-center justify-center shadow-xl">
                  <span className="text-xs font-black">{zoomLevel.toFixed(1)}x</span>
                </div>
                
                {/* Zoom Out */}
                <motion.button
                  onClick={() => handleZoomChange(Math.max(zoomLevel - 0.5, 1.0))}
                  whileTap={{ scale: 0.9 }}
                  disabled={zoomLevel <= 1.0}
                  className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-sm border-2 border-white/30 text-white flex items-center justify-center shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-6 h-6" />
                </motion.button>
              </div>
            </div>
            
            {/* Footer - Profesyonel Talimatlar (MOBILDE MİNİMAL) */}
            <div className="bg-gradient-to-r from-blue-600 to-slate-700 p-3 md:p-5 space-y-2 md:space-y-3">
              <div className="bg-white/10 rounded-lg p-2 md:p-3 space-y-1 md:space-y-2">
                <p className="text-sm md:text-base text-white text-center font-black">
                  🎯 KIRMIZI LAZER İÇİNE GETİRİN
                </p>
                <p className="text-xs md:text-sm text-blue-100 text-center font-bold hidden md:block">
                  🔄 HER YÖNDEN OKUR • ⚡ 30 FPS • Full HD 1920x1080
                </p>
                <p className="text-xs text-green-300 text-center font-bold md:hidden">
                  🔄 Yatay • Dikey • Çapraz - Her Yön!
                </p>
              </div>
              
              {/* Desteklenen Formatlar (MOBILDE GİZLİ) */}
              <div className="hidden md:flex flex-wrap justify-center gap-2 text-xs text-white font-bold">
                <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> EAN-13
                </span>
                <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> EAN-8
                </span>
                <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> UPC-A
                </span>
                <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> Code-128
                </span>
                <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> QR Code
                </span>
              </div>
              
              {/* Profesyonel İpuçları (MOBILDE GİZLİ) */}
              <div className="hidden md:grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/10 rounded-lg p-2">
                  <div className="text-2xl mb-1">💡</div>
                  <div className="text-xs text-white font-bold">İyi Işık</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <div className="text-2xl mb-1">📏</div>
                  <div className="text-xs text-white font-bold">15-20 cm</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <div className="text-2xl mb-1">🤚</div>
                  <div className="text-xs text-white font-bold">Sabit Tut</div>
                </div>
              </div>
              
              {/* Feedback Bilgileri (MOBILDE GİZLİ) */}
              <div className="hidden md:block bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-2 border border-white/20">
                <p className="text-xs text-white text-center font-bold">
                  🎵 Ses + 📳 Titreşim + 🎨 Flash Feedback
                </p>
              </div>
              
              {/* Advanced Controls Info (MOBILDE GİZLİ) */}
              <div className="hidden md:block bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-3 border border-white/20 space-y-1">
                <p className="text-xs text-white text-center font-black mb-2">
                  🚀 ADVANCED CONTROLS
                </p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white/10 rounded-lg p-2">
                    <div className="text-lg mb-0.5">🔦</div>
                    <div className="text-xs text-white font-bold">
                      {isTorchSupported ? 'El Feneri' : 'Desteklenmiyor'}
                    </div>
                    {isTorchSupported && (
                      <div className={`text-xs font-bold ${torchEnabled ? 'text-yellow-300' : 'text-gray-400'}`}>
                        {torchEnabled ? 'AÇIK' : 'KAPALI'}
                      </div>
                    )}
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <div className="text-lg mb-0.5">🔍</div>
                    <div className="text-xs text-white font-bold">Digital Zoom</div>
                    <div className="text-xs text-cyan-300 font-bold">1.0x - 3.0x</div>
                  </div>
                </div>
              </div>
              
              {/* 🛒 SEPETİ GÖR BUTONU - Sadece mobilde, sepet doluysa */}
              {cart.length > 0 && (
                <motion.button
                  onClick={() => {
                    setShowCamera(false);
                    setScanStatus('idle');
                    setFlashEffect('none');
                    setCameraInfo(prev => ({ ...prev, scanCount: 0 }));
                    setTorchEnabled(false);
                    setZoomLevel(1.0);
                    setLastScanTime(0);
                    setScanQuality('good');
                    setBrightnessLevel(-1);
                    setContrastLevel(1);
                    resetAutoRetry();
                    if (videoStreamRef.current) {
                      videoStreamRef.current.getTracks().forEach(track => track.stop());
                      videoStreamRef.current = null;
                    }
                    toast.success('📦 Sepet görüntüleniyor', { duration: 1000 });
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="md:hidden w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <ShoppingCart className="w-6 h-6" />
                  SEPETİ GÖR ({cart.length} Ürün - {totalAmount.toFixed(0)} ₺)
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MÜŞTERİ SEÇME MODAL */}
      <AnimatePresence>
        {showCustomerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCustomerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  MÜŞTERİ SEÇ
                </h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedCustomer && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-900">
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                    Seçili: {selectedCustomer.name}
                  </p>
                  <button
                    onClick={() => updateActiveChannel({ customer: null })}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold mt-1"
                  >
                    Seçimi Kaldır
                  </button>
                </div>
              )}
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {customers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all text-left"
                  >
                    <p className="font-black text-base text-slate-900 dark:text-white">{customer.name}</p>
                    {customer.phone && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
                        📞 {customer.phone}
                      </p>
                    )}
                    {customer.debt > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400 font-bold mt-1">
                        Borç: {customer.debt.toFixed(2)} ₺
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* İNDİRİM MODAL */}
      <AnimatePresence>
        {showDiscountModal && selectedCartItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDiscountModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-6 h-6 text-blue-600" />
                  İNDİRİM UYGULA
                </h3>
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="font-bold text-slate-900 dark:text-white mb-2">
                  {selectedCartItem.product.name}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
                  Fiyat: {selectedCartItem.product.price.toFixed(2)} ₺
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    İndirim (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none font-bold text-lg"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Not (Opsiyonel)
                  </label>
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none font-semibold resize-none"
                    placeholder="Kampanya, özel indirim vb."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDiscountModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  >
                    İPTAL
                  </button>
                  <button
                    onClick={applyDiscount}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-slate-700 text-white font-black hover:shadow-xl transition-all"
                  >
                    UYGULA
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KARMA ÖDEME MODAL */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  KARMA ÖDEME
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-bold mb-1">Toplam Tutar:</p>
                <p className="text-3xl font-black text-blue-600">{totalAmount.toFixed(2)} ₺</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Nakit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none font-bold text-lg"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Kart
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none font-bold text-lg"
                    placeholder="0.00"
                  />
                </div>

                {(() => {
                  const cash = parseFloat(cashAmount) || 0;
                  const card = parseFloat(cardAmount) || 0;
                  const total = cash + card;
                  const remaining = totalAmount - total;

                  return (
                    <div className={`p-3 rounded-xl ${
                      remaining <= 0 ? 'bg-green-50 dark:bg-green-950/20 border-2 border-green-300 dark:border-green-900' :
                      'bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-300 dark:border-yellow-900'
                    }`}>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
                        {remaining <= 0 ? 'Para Üstü:' : 'Kalan:'}
                      </p>
                      <p className={`text-2xl font-black ${
                        remaining <= 0 ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {Math.abs(remaining).toFixed(2)} ₺
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                >
                  İPTAL
                </button>
                <button
                  onClick={handleMixedPayment}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-slate-700 text-white font-black hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  TAMAMLA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SON SATIŞLAR MODAL */}
      <AnimatePresence>
        {showRecentSales && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRecentSales(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-6 h-6 text-blue-600" />
                  SON SATIŞLAR
                </h3>
                <button
                  onClick={() => setShowRecentSales(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-3">
                {recentSales.map(sale => (
                  <div
                    key={sale.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">
                          #{sale.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sale.createdAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-blue-600">
                          {sale.totalAmount.toFixed(2)} ₺
                        </span>
                        <button
                          onClick={() => repeatSale(sale)}
                          className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 transition-all"
                          title="Satışı Tekrarla"
                        >
                          <Repeat className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sale.saleItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                        >
                          {item.quantity}x {item.product.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FİŞ YAZDIR MODAL */}
      <AnimatePresence>
        {showPrintModal && lastSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPrintModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-green-600 flex items-center gap-2">
                  <Check className="w-6 h-6" />
                  SATIŞ TAMAMLANDI!
                </h3>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border-2 border-green-200 dark:border-green-900">
                <p className="text-center text-3xl font-black text-green-600 mb-2">
                  {lastSale.totalAmount.toFixed(2)} ₺
                </p>
                <p className="text-center text-sm text-slate-600 dark:text-slate-400 font-semibold">
                  Fiş No: #{lastSale.id.slice(0, 8).toUpperCase()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={printReceipt}
                  className="py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Printer className="w-6 h-6" />
                  YAZDIR
                </button>
                <button
                  onClick={() => {
                    toast.success('✅ E-posta özelliği yakında!');
                  }}
                  className="py-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-black shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Mail className="w-6 h-6" />
                  E-POSTA
                </button>
                <button
                  onClick={() => {
                    toast.success('✅ SMS özelliği yakında!');
                  }}
                  className="py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-2"
                >
                  <MessageSquare className="w-6 h-6" />
                  SMS
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="py-4 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <X className="w-6 h-6" />
                  KAPAT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpressPOS;

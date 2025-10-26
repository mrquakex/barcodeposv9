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

  // Kamera ile barkod okuma
  useEffect(() => {
    let isProcessing = false; // Çift okuma önleme

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
          
          // İzin alındı, stream'i hemen kapat (html5-qrcode kendi açacak)
          stream.getTracks().forEach(track => track.stop());
          console.log('✅ Kamera izni alındı!');

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

          // MOBİL UYUMLU config (basit ve stabil)
          const config = {
            fps: 10, // Mobilde 10 FPS daha stabil
            qrbox: { width: 250, height: 150 }, // Orta boyut (mobil uyumlu)
            aspectRatio: 1.777778,
          };

          // ARKA KAMERA ID'sini bul
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
            } else if (devices.length > 0) {
              // Arka kamera yoksa, ilk kamerayı kullan
              cameraId = devices[devices.length - 1].id; // Genellikle son kamera arka kamera
              console.log('✅ Kamera seçildi:', devices[devices.length - 1].label);
            }
          } catch (e) {
            console.warn('⚠️ Kamera listesi alınamadı, default kullanılıyor:', e);
          }

          await scanner.start(
            cameraId, // Kamera ID veya 'environment'
            config,
            async (decodedText, decodedResult) => {
              // Çift okuma önleme
              if (isProcessing) {
                return;
              }

              isProcessing = true;
              
              // BARKOD TEMİZLE (boşluk, özel karakter, normalize)
              const cleanBarcode = decodedText.trim().replace(/\s+/g, '').toUpperCase();
              console.log('✅ BARKOD (RAW):', decodedText);
              console.log('✅ BARKOD (CLEAN):', cleanBarcode);
              playSound('beep');
              
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
                
                // Kapat
                setTimeout(() => {
                  setShowCamera(false);
                }, 800);
              } catch (error: any) {
                toast.dismiss();
                console.error('❌ Ürün yok (Clean):', cleanBarcode);
                console.error('❌ Ürün yok (RAW):', decodedText);
                toast.error(`❌ Ürün bulunamadı: ${cleanBarcode}`, { duration: 5000 });
                playSound('error');
                isProcessing = false;
              }
            },
            (errorMessage) => {
              // Scanning - log basma
            }
          );

          toast.success('📸 Kamera açıldı! Barkodu göster...', { duration: 2000 });
          console.log('✅ Scanner başlatıldı');
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
        className="bg-gradient-to-r from-blue-600 to-slate-700 shadow-2xl p-4"
      >
        <div className="flex items-center gap-3">
          {/* Barkod Input */}
          <div className="flex-1 flex items-center gap-2">
            <Scan className="w-6 h-6 text-white flex-shrink-0" />
            <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-2">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Barkod okut veya ara... (F1)"
                className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg"
                disabled={loading}
                autoFocus
              />
            </form>
          </div>

          {/* Kamera Butonu */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCamera(!showCamera)}
            className="px-4 py-3 rounded-xl bg-white text-blue-600 font-black shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            <span className="hidden md:inline">F2</span>
          </motion.button>

          {/* Son Satışlar */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRecentSales(true)}
            className="px-4 py-3 rounded-xl bg-white text-slate-700 dark:bg-slate-800 dark:text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <History className="w-5 h-5" />
            <span className="hidden lg:inline">F3</span>
          </motion.button>

          {/* Müşteri Seç */}
          <button
            onClick={() => setShowCustomerModal(true)}
            className="px-4 py-3 rounded-xl bg-white text-slate-700 dark:bg-slate-800 dark:text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <User className="w-5 h-5" />
            <span className="hidden lg:inline">{selectedCustomer ? selectedCustomer.name : 'Müşteri (F4)'}</span>
          </button>

          {/* Toplam Badge */}
          <div className="px-6 py-3 rounded-xl bg-white text-blue-600 font-black text-xl shadow-lg flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            {totalAmount.toFixed(2)} ₺
          </div>

          {/* Ses Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 rounded-xl bg-white text-slate-700 dark:bg-slate-800 dark:text-white shadow-lg hover:shadow-xl transition-all"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
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
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Kategoriler */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-xl font-black text-sm whitespace-nowrap shadow-lg transition-all ${
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
                className={`px-6 py-3 rounded-xl font-black text-sm whitespace-nowrap shadow-lg transition-all ${
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
          <div className="mb-4 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none font-semibold shadow-md"
              />
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all shadow-md"
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
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3' : 'space-y-2'}>
                {filteredProducts.map(product => (
                  <motion.button
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(product)}
                    className={`rounded-xl bg-white dark:bg-slate-800 border-3 border-blue-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl transition-all shadow-lg ${
                      viewMode === 'grid' ? 'p-4 flex flex-col' : 'p-3 flex items-center gap-3'
                    }`}
                  >
                    <div className={viewMode === 'grid' ? 'w-full' : 'flex-1'}>
                      <p className={`font-black text-slate-900 dark:text-white ${
                        viewMode === 'grid' ? 'text-sm mb-2 line-clamp-2 min-h-[2.5rem]' : 'text-sm line-clamp-1'
                      }`}>
                        {product.name.toUpperCase()}
                      </p>
                      {product.category && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                          {product.category.name}
                        </p>
                      )}
                    </div>
                    <div className={`flex items-center ${viewMode === 'grid' ? 'justify-between' : 'gap-3'}`}>
                      <span className={`font-black text-blue-600 ${viewMode === 'grid' ? 'text-lg' : 'text-base'}`}>
                        {product.price.toFixed(2)} ₺
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
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
          className="w-80 lg:w-96 flex flex-col bg-white dark:bg-slate-900 border-l-3 border-blue-200 dark:border-slate-800 shadow-2xl"
        >
          {/* Sepet Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-slate-700 text-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Receipt className="w-6 h-6" />
                SEPET
              </h2>
              <span className="px-3 py-1 rounded-full bg-white text-blue-600 font-black text-sm">
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
                Temizle (F5)
              </button>
              {selectedCustomer && (
                <div className="text-xs font-bold text-blue-100 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {selectedCustomer.name}
                </div>
              )}
            </div>
          </div>

          {/* Sepet Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
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
                id="barcode-scanner" 
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
                  📱 Mobil Optimize • 9 Format • Arka Kamera • Otomatik
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

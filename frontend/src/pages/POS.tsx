import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Search, X, Trash2, CreditCard, Banknote, User, Plus, Printer, Wallet, Tag, RotateCcw, UserPlus, Pause, Edit3, Clock } from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
import KeyboardShortcutsHelp from '../components/POS/KeyboardShortcutsHelp';
import DiscountDialog, { DiscountData } from '../components/POS/DiscountDialog';
import StockWarningDialog from '../components/POS/StockWarningDialog';
import ReturnDialog from '../components/POS/ReturnDialog';
import QuickCustomerAdd from '../components/POS/QuickCustomerAdd';
import HoldSalesDialog from '../components/POS/HoldSalesDialog';
import PriceOverrideDialog from '../components/POS/PriceOverrideDialog';
import ShiftManagementDialog from '../components/POS/ShiftManagementDialog';
import ZReportDialog from '../components/POS/ZReportDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { cn } from '../lib/utils';
import { useKeyboardShortcuts, POSShortcuts } from '../hooks/useKeyboardShortcuts';
import { soundEffects } from '../lib/sound-effects';
import { useAuthStore } from '../store/authStore';
import storage from '../lib/storage';

interface Product {
  id: string;
  barcode: string;
  name: string;
  sellPrice: number;
  stock: number;
  taxRate: number;
  isActive?: boolean;
}

interface CartItem extends Product {
  quantity: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  debt: number;
  phone?: string;
  email?: string;
}

// 💠 ENTERPRISE: Multi-Channel Tab Interface
interface SalesChannel {
  id: string;
  name: string;
  cart: CartItem[];
  customer: Customer | null;
  discount?: DiscountData | null;
}

// 💠 ENTERPRISE: Split Payment Interface
interface SplitPayment {
  cash: number;
  card: number;
}

// 💠 ENTERPRISE: Held Sale Interface
interface HeldSale {
  id: string;
  channelName: string;
  cart: CartItem[];
  customer: Customer | null;
  total: number;
  timestamp: Date;
  discount?: DiscountData | null;
}

const POS: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  // 💠 ENTERPRISE: Multi-Channel States
  const [channels, setChannels] = useState<SalesChannel[]>([
    { id: '1', name: 'Müşteri 1', cart: [], customer: null }
  ]);
  const [activeChannelId, setActiveChannelId] = useState('1');
  
  // Basic States
  const [isScanning, setIsScanning] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [useFlash, setUseFlash] = useState(false);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showQuickCustomerAdd, setShowQuickCustomerAdd] = useState(false);
  const [showHoldSales, setShowHoldSales] = useState(false);
  const [showPriceOverride, setShowPriceOverride] = useState(false);
  const [showShiftManagement, setShowShiftManagement] = useState(false);
  const [showZReport, setShowZReport] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [selectedItemForPriceEdit, setSelectedItemForPriceEdit] = useState<CartItem | null>(null);
  
  // 💠 ENTERPRISE: Shift Management State (persisted in localStorage)
  const [currentShift, setCurrentShift] = useState<any>(() => {
    return storage.getItem('pos_current_shift', null);
  });
  
  // 💠 ENTERPRISE: Held Sales State (persisted in localStorage)
  const [heldSales, setHeldSales] = useState<HeldSale[]>(() => {
    return storage.getItem<HeldSale[]>('pos_held_sales', []);
  });

  // 💠 ENTERPRISE: Frequent Products (persisted in localStorage)
  const [frequentProducts, setFrequentProducts] = useState<Product[]>(() => {
    return storage.getItem<Product[]>('pos_frequent_products', []);
  });
  const [showFrequentProducts, setShowFrequentProducts] = useState(true);
  
  // 💠 ENTERPRISE: Smart Search States (Unified Barcode + Product Search)
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // 💠 ENTERPRISE: Dynamic Dropdown Height (JavaScript Solution)
  const [dropdownHeight, setDropdownHeight] = useState<number>(400);
  
  // 💠 ENTERPRISE: Muhtelif Mode (Quick Custom Item)
  const [isMuhtelifMode, setIsMuhtelifMode] = useState(false);
  
  // 💠 ENTERPRISE: Customer Search
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  
  // 💠 ENTERPRISE: Simple Calculator States
  const [calculatorPaid, setCalculatorPaid] = useState<string>('');
  const [calculatorChange, setCalculatorChange] = useState<number>(0);
  
  // 💠 ENTERPRISE: Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 💠 ENTERPRISE: Payment States
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CREDIT' | 'SPLIT'>('CASH');
  const [splitPayment, setSplitPayment] = useState<SplitPayment>({ cash: 0, card: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // Get active channel
  const activeChannel = channels.find(ch => ch.id === activeChannelId) || channels[0];

  // 💠 ENTERPRISE: Dynamic Dropdown Height Calculation
  const calculateOptimalDropdownHeight = useCallback(() => {
    const itemCount = searchResults.length;
    const itemHeight = 88; // Her ürün item'ı yaklaşık 88px (py-4 + içerik)
    const headerHeight = 50; // "X ürün bulundu" banner yüksekliği
    const padding = 20; // Üst-alt boşluklar
    
    // İçerik yüksekliğini hesapla
    const contentHeight = (itemCount * itemHeight) + headerHeight + padding;
    
    // Maksimum yükseklik (ekran yüksekliği - üst boşluklar)
    const maxHeight = window.innerHeight - 180;
    
    // Minimum yükseklik (en az 300px, en fazla ekranın %40'si)
    const minHeight = Math.min(400, window.innerHeight * 0.4);
    
    // Optimal yükseklik: içerik yüksekliği ile sınırlar arasında
    const optimalHeight = Math.max(
      minHeight,
      Math.min(contentHeight, maxHeight)
    );
    
    return optimalHeight;
  }, [searchResults.length]);

  useEffect(() => {
    fetchCustomers();
    return () => {
      // Cleanup: Stop camera on unmount
      if (isScanning) {
        stopCamera();
      }
    };
  }, []);

  // 📸 Start camera when modal opens
  useEffect(() => {
    if (showCameraModal && !isScanning) {
      startCamera();
    }
  }, [showCameraModal]);

  // 💠 ENTERPRISE: Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 💠 ENTERPRISE: Live Clock - Update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 💠 ENTERPRISE: Update dropdown height when search results change
  useEffect(() => {
    if (searchResults.length > 0 && showSearchResults) {
      const newHeight = calculateOptimalDropdownHeight();
      setDropdownHeight(newHeight);
    }
  }, [searchResults, showSearchResults, calculateOptimalDropdownHeight]);

  // 💠 ENTERPRISE: Recalculate height on window resize
  useEffect(() => {
    const handleResize = () => {
      if (searchResults.length > 0 && showSearchResults) {
        const newHeight = calculateOptimalDropdownHeight();
        setDropdownHeight(newHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [searchResults, showSearchResults, calculateOptimalDropdownHeight]);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  // 💠 ENTERPRISE: Smart Search - Auto-detects barcode vs product name
  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const response = await api.get(`/products?search=${encodeURIComponent(query)}&limit=10`);
      const products = response.data.products || [];
      setSearchResults(products.filter((p: Product) => p.isActive));
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 💠 ENTERPRISE: Muhtelif Parser - Parse "PRODUCT_NAME PRICE" format
  const parseMuhtelifInput = (input: string): { name: string; price: number } | null => {
    // Regex: captures everything before the last number as name, and the number (with optional decimal) as price
    // Examples: "SÜT 10TL" -> name: "SÜT", price: 10
    //           "EKMEK 5" -> name: "EKMEK", price: 5
    //           "AYRAN 3.50TL" -> name: "AYRAN", price: 3.50
    const pattern = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:TL)?$/i;
    const match = input.trim().match(pattern);
    
    if (match) {
      const name = match[1].trim().toUpperCase();
      const priceStr = match[2].replace(',', '.');
      const price = parseFloat(priceStr);
      
      if (name && price > 0) {
        return { name, price };
      }
    }
    
    return null;
  };

  // 💠 ENTERPRISE: Add Muhtelif Item to Cart
  const addMuhtelifToCart = (name: string, price: number) => {
    const muhtelifItem: CartItem = {
      id: `muhtelif-${Date.now()}`,
      barcode: 'MUHTELIF',
      name: name,
      sellPrice: price,
      stock: 9999, // Unlimited stock for custom items
      taxRate: 18, // Default 18% tax
      quantity: 1,
      total: price
    };

    const updatedChannels = [...channels];
    const channelIndex = updatedChannels.findIndex(ch => ch.id === activeChannelId);
    
    if (channelIndex !== -1) {
      const existingItemIndex = updatedChannels[channelIndex].cart.findIndex(
        item => item.name === name && item.barcode === 'MUHTELIF'
      );
      
      if (existingItemIndex !== -1) {
        // Increment quantity if same muhtelif item exists
        updatedChannels[channelIndex].cart[existingItemIndex].quantity += 1;
        updatedChannels[channelIndex].cart[existingItemIndex].total =
          updatedChannels[channelIndex].cart[existingItemIndex].quantity * price;
      } else {
        // Add new muhtelif item
        updatedChannels[channelIndex].cart.push(muhtelifItem);
      }
      
      setChannels(updatedChannels);
      toast.success(`${name} sepete eklendi`);
      setSearchInput(''); // Clear input
    }
  };

  // 💠 ENTERPRISE: Smart Input Handler - Unified barcode + product search
  const handleSmartSearchChange = (value: string) => {
    setSearchInput(value);

    // 💠 Muhtelif Mode: Disable autocomplete
    if (isMuhtelifMode) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    // Auto-detect: If it looks like a barcode (only numbers), don't show dropdown immediately
    // But still search in case user wants to see products with that barcode
    const isNumeric = /^\d+$/.test(value);
    
    if (!isNumeric && value.length >= 2) {
      // Text search - show dropdown with debounce
      searchTimeoutRef.current = window.setTimeout(() => {
        searchProducts(value);
      }, 300);
    } else if (value.length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // 💠 ENTERPRISE: Smart Enter Handler - Barcode or select first result
  const handleSmartEnter = async () => {
    if (!searchInput.trim()) return;

    // 💠 ENTERPRISE: Muhtelif Mode - Parse and add custom item
    if (isMuhtelifMode) {
      const parsed = parseMuhtelifInput(searchInput);
      if (parsed) {
        addMuhtelifToCart(parsed.name, parsed.price);
      } else {
        toast.error('Geçersiz format! Örnek: SÜT 10TL');
        soundEffects.error(); // 🔊 Sound: Invalid format
      }
      return;
    }

    // If dropdown is shown and has results, select first one
    if (showSearchResults && searchResults.length > 0) {
      selectProductFromSearch(searchResults[0]);
      return;
    }

    // Otherwise, treat as barcode
    try {
      const response = await api.get(`/products/barcode/${searchInput}`);
      const product = response.data;

      if (!product || !product.id) {
        toast.error('Ürün bulunamadı!');
        return;
      }

      if (!product.isActive) {
        toast.error('Bu ürün inaktif!');
        return;
      }

      soundEffects.beep(); // 🔊 Sound: Barcode scanned
      addToCart(product);
      setSearchInput('');
      setSearchResults([]);
      setShowSearchResults(false);
      toast.success('Sepete eklendi');
    } catch (error: any) {
      toast.error('Ürün bulunamadı');
      soundEffects.error(); // 🔊 Sound: Product not found
    }
  };

  // 💠 ENTERPRISE: Select Product from Search
  const selectProductFromSearch = (product: Product) => {
    addToCart(product);
    setSearchInput('');
    setSearchResults([]);
    setShowSearchResults(false);
    toast.success(`${product.name} sepete eklendi`);
    
    // Focus back to search input
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  // 💠 ENTERPRISE: Multi-Channel Functions
  const addNewChannel = () => {
    const newId = (channels.length + 1).toString();
    setChannels([...channels, {
      id: newId,
      name: `Müşteri ${newId}`,
      cart: [],
      customer: null
    }]);
    setActiveChannelId(newId);
    toast.success(`Müşteri ${newId} kanalı açıldı`);
  };

  const closeChannel = (channelId: string) => {
    if (channels.length === 1) {
      toast.error('En az bir kanal açık olmalı!');
      return;
    }
    
    const channel = channels.find(ch => ch.id === channelId);
    if (channel && channel.cart.length > 0) {
      if (!confirm('Bu kanalda ürünler var. Kapatmak istediğinize emin misiniz?')) {
        return;
      }
    }

    const newChannels = channels.filter(ch => ch.id !== channelId);
    setChannels(newChannels);
    
    if (activeChannelId === channelId) {
      setActiveChannelId(newChannels[0].id);
    }
    
    toast.success('Kanal kapatıldı');
  };

  const updateChannel = (channelId: string, updates: Partial<SalesChannel>) => {
    setChannels(channels.map(ch => 
      ch.id === channelId ? { ...ch, ...updates } : ch
    ));
  };

  // 💠 ENTERPRISE: Handle Camera Barcode Scan
  const handleCameraScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    // Prevent duplicate scans (same code within 2 seconds)
    if (barcode === lastScannedCode) {
      return;
    }
    setLastScannedCode(barcode);
    setTimeout(() => setLastScannedCode(''), 2000);

    try {
      // 📳 Haptic Feedback - Vibrate on scan
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data;

      if (!product || !product.id) {
        toast.error('Ürün bulunamadı!');
        soundEffects.error();
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]); // Error pattern
        }
        return;
      }

      if (!product.isActive) {
        toast.error('Bu ürün inaktif!');
        soundEffects.error();
        return;
      }

      // 🎉 Success!
      addToCart(product);
      toast.success(`✅ ${product.name} sepete eklendi`, { duration: 2000 });
      soundEffects.cashRegister(); // Cash register sound
      
      // 📳 Success vibration pattern
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      
      // ✅ Auto-close camera after successful scan
      await stopCamera();
      setShowCameraModal(false);
    } catch (error: any) {
      toast.error('Ürün bulunamadı');
      soundEffects.error();
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    }
  };

  const addToCart = (product: Product, skipStockCheck: boolean = false) => {
    // 💠 ENTERPRISE: Stock Warning Check
    if (!skipStockCheck && product.stock <= 10) {
      setPendingProduct(product);
      setShowStockWarning(true);
      if (product.stock <= 0) {
        soundEffects.warning(); // 🔊 Sound: Out of stock
      }
      return;
    }

    const newCart = [...activeChannel.cart];
    const existing = newCart.find(item => item.id === product.id);
    
    if (existing) {
      existing.quantity += 1;
      existing.total = existing.quantity * (existing.sellPrice || 0);
      } else {
      newCart.push({
        ...product,
        quantity: 1,
        total: product.sellPrice || 0
      });
    }
    
    updateChannel(activeChannelId, { cart: newCart });
    
    // 💠 ENTERPRISE: Track frequent products
    updateFrequentProducts(product);
    
    soundEffects.click(); // 🔊 Sound: Item added
  };

  // 💠 ENTERPRISE: Update Frequent Products
  const updateFrequentProducts = (product: Product) => {
    const existingIndex = frequentProducts.findIndex(p => p.id === product.id);
    
    if (existingIndex >= 0) {
      // Move to front
      const updated = [product, ...frequentProducts.filter(p => p.id !== product.id)].slice(0, 6);
      setFrequentProducts(updated);
      storage.setItem('pos_frequent_products', updated);
    } else {
      // Add new product to front, keep max 6
      const updated = [product, ...frequentProducts].slice(0, 6);
      setFrequentProducts(updated);
      storage.setItem('pos_frequent_products', updated);
    }
  };

  // 💠 ENTERPRISE: Add Product from Stock Warning (Force Add)
  const handleAddAnyway = () => {
    if (pendingProduct) {
      addToCart(pendingProduct, true);
      setPendingProduct(null);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const newCart = activeChannel.cart.map(item =>
      item.id === productId
        ? { ...item, quantity, total: quantity * (item.sellPrice || 0) }
        : item
    );
    
    updateChannel(activeChannelId, { cart: newCart });
  };

  const removeFromCart = (productId: string) => {
    const newCart = activeChannel.cart.filter(item => item.id !== productId);
    updateChannel(activeChannelId, { cart: newCart });
    soundEffects.delete(); // 🔊 Sound: Item removed
  };

  const clearCart = () => {
    updateChannel(activeChannelId, { cart: [], customer: null });
    toast.success('Sepet temizlendi');
    soundEffects.delete(); // 🔊 Sound: Cart cleared
  };

  const selectCustomer = (customer: Customer) => {
    updateChannel(activeChannelId, { customer });
    setShowCustomerDialog(false);
    setCustomerSearchQuery('');
    toast.success(`Müşteri: ${customer.name}`);
  };

  // 💠 ENTERPRISE: Apply Discount
  const applyDiscount = (discount: DiscountData) => {
    updateChannel(activeChannelId, { discount });
    soundEffects.success();
    toast.success(`İndirim uygulandı: ${discount.description}`);
  };

  // 💠 ENTERPRISE: Remove Discount
  const removeDiscount = () => {
    updateChannel(activeChannelId, { discount: null });
    soundEffects.click();
    toast.success('İndirim kaldırıldı');
  };

  // 💠 ENTERPRISE: Persist held sales to localStorage
  useEffect(() => {
    storage.setItem('pos_held_sales', heldSales);
  }, [heldSales]);

  // 💠 ENTERPRISE: Persist current shift to localStorage
  useEffect(() => {
    if (currentShift) {
      storage.setItem('pos_current_shift', currentShift);
    } else {
      storage.removeItem('pos_current_shift');
    }
  }, [currentShift]);

  // 💠 ENTERPRISE: Hold Current Sale
  const holdCurrentSale = () => {
    if (activeChannel.cart.length === 0) {
      toast.error('Sepet boş! Park edilecek bir satış yok.');
      return;
    }

    const subtotal = activeChannel.cart.reduce((sum, item) => sum + (item.total || 0), 0);
    const discountAmount = activeChannel.discount
      ? activeChannel.discount.type === 'percentage'
        ? (subtotal * activeChannel.discount.value) / 100
        : activeChannel.discount.value
      : 0;
    const total = subtotal - discountAmount;

    const newHeldSale: HeldSale = {
      id: Date.now().toString(),
      channelName: activeChannel.name,
      cart: [...activeChannel.cart],
      customer: activeChannel.customer,
      total,
      timestamp: new Date(),
      discount: activeChannel.discount,
    };

    setHeldSales((prev) => [newHeldSale, ...prev]);
    
    // Clear current channel
    updateChannel(activeChannelId, {
      cart: [],
      customer: null,
      discount: null,
    });

    toast.success(`${activeChannel.name} park edildi!`);
    soundEffects.success();
  };

  // 💠 ENTERPRISE: Restore Held Sale
  const restoreHeldSale = (sale: HeldSale) => {
    // Restore to active channel
    updateChannel(activeChannelId, {
      name: sale.channelName,
      cart: sale.cart,
      customer: sale.customer,
      discount: sale.discount,
    });

    // Remove from held sales
    setHeldSales((prev) => prev.filter((s) => s.id !== sale.id));
  };

  // 💠 ENTERPRISE: Delete Held Sale
  const deleteHeldSale = (saleId: string) => {
    setHeldSales((prev) => prev.filter((s) => s.id !== saleId));
  };

  // 💠 ENTERPRISE: Open Price Override Dialog
  const openPriceOverride = (item: CartItem) => {
    // Check if user has admin or manager role
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      toast.error('Fiyat değiştirme yalnızca yöneticiler için kullanılabilir');
      soundEffects.error();
      return;
    }

    setSelectedItemForPriceEdit(item);
    setShowPriceOverride(true);
  };

  // 💠 ENTERPRISE: Apply Price Override
  const handlePriceOverride = (newPrice: number, reason: string) => {
    if (!selectedItemForPriceEdit) return;

    const oldPrice = selectedItemForPriceEdit.sellPrice;
    const updatedItem = {
      ...selectedItemForPriceEdit,
      sellPrice: newPrice,
      total: newPrice * selectedItemForPriceEdit.quantity,
    };

    // Update cart with new price
    const updatedCart = activeChannel.cart.map((item) =>
      item.id === selectedItemForPriceEdit.id ? updatedItem : item
    );

    updateChannel(activeChannelId, { cart: updatedCart });

    toast.success(
      `Fiyat değiştirildi: ₺${oldPrice.toFixed(2)} → ₺${newPrice.toFixed(2)}\nNeden: ${reason}`
    );
    soundEffects.success();

    // Log price override for audit (in production, this would be sent to backend)
    console.log('[PRICE_OVERRIDE_AUDIT]', {
      user: user?.name || 'Unknown',
      userId: user?.id || 'Unknown',
      timestamp: new Date().toISOString(),
      product: selectedItemForPriceEdit.name,
      productId: selectedItemForPriceEdit.id,
      oldPrice,
      newPrice,
      difference: newPrice - oldPrice,
      reason,
    });
  };

  // 💠 ENTERPRISE: Start Shift
  const handleStartShift = (openingCash: number) => {
    const newShift = {
      id: Date.now().toString(),
      startTime: new Date(),
      openingCash,
      salesCount: 0,
      totalSales: 0,
      cashSales: 0,
      cardSales: 0,
      creditSales: 0,
      totalDiscount: 0,
      returnCount: 0,
      refunds: 0,
    };
    setCurrentShift(newShift);
    toast.success('Vardiya başlatıldı!');
    soundEffects.success();
  };

  // 💠 ENTERPRISE: End Shift
  const handleEndShift = (closingCash: number) => {
    if (!currentShift) return;

    const completedShift = {
      ...currentShift,
      endTime: new Date(),
      closingCash,
    };

    setCurrentShift(completedShift);
    setShowZReport(true);
    toast.success('Vardiya kapatıldı! Z raporu görüntüleniyor...');
    soundEffects.success();

    // After showing report, clear shift
    setTimeout(() => {
      setCurrentShift(null);
    }, 1000);
  };

  // 💠 ENTERPRISE: Update Shift on Sale
  const updateShiftOnSale = (saleData: any) => {
    if (!currentShift) return;

    const updatedShift = {
      ...currentShift,
      salesCount: (currentShift.salesCount || 0) + 1,
      totalSales: (currentShift.totalSales || 0) + saleData.total,
      cashSales:
        saleData.paymentMethod === 'CASH'
          ? (currentShift.cashSales || 0) + saleData.total
          : currentShift.cashSales || 0,
      cardSales:
        saleData.paymentMethod === 'CARD'
          ? (currentShift.cardSales || 0) + saleData.total
          : currentShift.cardSales || 0,
      creditSales:
        saleData.paymentMethod === 'CREDIT'
          ? (currentShift.creditSales || 0) + saleData.total
          : currentShift.creditSales || 0,
      totalDiscount: (currentShift.totalDiscount || 0) + (saleData.discountAmount || 0),
    };

    setCurrentShift(updatedShift);
  };

  // 💠 ENTERPRISE: Keyboard Shortcuts System
  useKeyboardShortcuts({
    enabled: true,
    shortcuts: [
      {
        key: POSShortcuts.HELP,
        description: 'Klavye kısayolları yardımı',
        action: () => setShowKeyboardHelp(prev => !prev),
      },
      {
        key: POSShortcuts.DISCOUNT,
        description: 'İndirim ekle',
        action: () => {
          if (activeChannel.cart.length > 0) {
            setShowDiscountDialog(true);
          } else {
            toast.error('Sepet boş!');
          }
        },
      },
      {
        key: POSShortcuts.DISCOUNT_CTRL,
        ctrl: true,
        description: 'İndirim ekle (Ctrl+D)',
        action: () => {
          if (activeChannel.cart.length > 0) {
            setShowDiscountDialog(true);
          } else {
            toast.error('Sepet boş!');
          }
        },
      },
      {
        key: POSShortcuts.RETURN,
        description: 'İade işlemi (F3)',
        action: () => {
          setShowReturnDialog(true);
        },
      },
      {
        key: POSShortcuts.RETURN_CTRL,
        ctrl: true,
        description: 'İade işlemi (Ctrl+R)',
        action: () => {
          setShowReturnDialog(true);
        },
      },
      {
        key: POSShortcuts.HOLD,
        description: 'Satışı park et (F4)',
        action: () => {
          holdCurrentSale();
        },
      },
      {
        key: POSShortcuts.HOLD_CTRL,
        ctrl: true,
        description: 'Satışı park et (Ctrl+H)',
        action: () => {
          holdCurrentSale();
        },
      },
      {
        key: POSShortcuts.PAYMENT,
        ctrl: true,
        description: 'Ödeme ekranını aç',
        action: () => {
          if (activeChannel.cart.length > 0) {
            setShowPaymentDialog(true);
          } else {
            toast.error('Sepet boş!');
          }
        },
      },
      {
        key: POSShortcuts.QUICK_CASH,
        ctrl: true,
        description: 'Hızlı nakit satış',
        action: () => {
          if (activeChannel.cart.length > 0) {
            handleQuickCashSale();
          } else {
            toast.error('Sepet boş!');
          }
        },
      },
      {
        key: POSShortcuts.CLEAR_CART,
        ctrl: true,
        description: 'Sepeti temizle',
        action: () => {
          if (activeChannel.cart.length > 0) {
            if (window.confirm('Sepeti temizlemek istediğinizden emin misiniz?')) {
              clearCart();
            }
          }
        },
      },
      {
        key: POSShortcuts.CUSTOMER,
        description: 'Müşteri seçimi',
        action: () => setShowCustomerDialog(true),
      },
      {
        key: POSShortcuts.SEARCH,
        ctrl: true,
        description: 'Arama kutusuna odaklan',
        action: () => {
          searchInputRef.current?.focus();
        },
      },
      {
        key: POSShortcuts.ESCAPE,
        description: 'İptal / Kapat',
        action: () => {
          setShowPaymentDialog(false);
          setShowCustomerDialog(false);
          setShowReceiptDialog(false);
          setShowKeyboardHelp(false);
          setShowDiscountDialog(false);
          setShowStockWarning(false);
          setShowReturnDialog(false);
          setShowSearchResults(false);
          if (isMuhtelifMode) {
            setIsMuhtelifMode(false);
          }
        },
      },
    ],
  });

  // 💠 ENTERPRISE: Calculator - Auto sync with cart total
  const updateCalculator = (paid: string, cartTotal: number) => {
    const paidAmount = parseFloat(paid) || 0;
    const change = paidAmount - cartTotal;
    setCalculatorChange(change);
  };

  // 📸 ZXing - Modern & Fast Barcode Scanner
  const startCamera = async () => {
    try {
      // Set scanning state first to render video element
      setIsScanning(true);
      
      // Wait for video element to be in DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create ZXing reader
      const codeReader = new BrowserMultiFormatReader();
      scannerRef.current = codeReader;

      // Get video devices (static method)
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (!videoInputDevices || videoInputDevices.length === 0) {
        throw new Error('📷 Kamera bulunamadı!');
      }

      // Select camera: prefer back camera (environment)
      let selectedDeviceId = videoInputDevices[0].deviceId;
      
      if (!useFrontCamera) {
        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment') ||
          device.label.toLowerCase().includes('arka')
        );
        if (backCamera) {
          selectedDeviceId = backCamera.deviceId;
        }
      } else {
        const frontCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('front') ||
          device.label.toLowerCase().includes('user') ||
          device.label.toLowerCase().includes('ön')
        );
        if (frontCamera) {
          selectedDeviceId = frontCamera.deviceId;
        }
      }

      // Get video element
      const videoElement = videoRef.current;
      if (!videoElement) {
        throw new Error('📷 Video element bulunamadı! Lütfen sayfayı yenileyin.');
      }

      // Start scanning
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoElement,
        async (result, error) => {
          if (result) {
            // Barcode detected!
            const barcode = result.getText();
            await handleCameraScan(barcode);
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error('Scan error:', error);
          }
        }
      );

      toast.success('🎯 Kamera aktif - Barkodu tarayın');
      soundEffects.beep();
    } catch (error: any) {
      console.error('Camera error:', error);
      
      // Detailed error message
      let errorMsg = 'Kamera başlatılamadı!';
      
      if (error.name === 'NotAllowedError' || error.message?.includes('Permission')) {
        errorMsg = '📷 Kamera izni verilmedi! Lütfen tarayıcı ayarlarından izin verin.';
      } else if (error.name === 'NotFoundError' || error.message?.includes('not found')) {
        errorMsg = '📷 Kamera bulunamadı!';
      } else if (error.name === 'NotReadableError' || error.message?.includes('in use')) {
        errorMsg = '📷 Kamera kullanımda! Diğer uygulamaları kapatın.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
      soundEffects.error();
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    try {
      // Stop video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      // Clear scanner reference
      if (scannerRef.current) {
        scannerRef.current = null;
      }
      
      setIsScanning(false);
      toast.success('Kamera kapatıldı');
    } catch (error) {
      console.error('Stop camera error:', error);
      setIsScanning(false);
    }
  };

  // 💡 Toggle Flash (using MediaStream API directly)
  const toggleFlash = async () => {
    const newFlashState = !useFlash;
    setUseFlash(newFlashState);
    
    try {
      const videoElement = videoRef.current;
      
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        
        if (track) {
          const capabilities = track.getCapabilities() as any;
          
          if (capabilities && 'torch' in capabilities) {
            await track.applyConstraints({
              advanced: [{ torch: newFlashState } as any]
            });
            toast.success(newFlashState ? '💡 Flaş açık' : 'Flaş kapalı');
    } else {
            toast.error('Flaş desteklenmiyor');
            setUseFlash(false);
          }
        }
      }
    } catch (error) {
      console.log('Flash not supported', error);
      toast.error('Flaş kullanılamıyor');
      setUseFlash(false);
    }
  };

  // 🔄 Toggle Camera
  const toggleCamera = async () => {
    if (isScanning) {
      await stopCamera();
      setUseFrontCamera(!useFrontCamera);
      setTimeout(() => startCamera(), 500);
    } else {
      setUseFrontCamera(!useFrontCamera);
    }
  };

  // 💠 ENTERPRISE: Payment Validation
  const validatePayment = (): boolean => {
    if (activeChannel.cart.length === 0) {
      toast.error('Sepet boş!');
      return false;
    }

    // 🚨 VERESIYE İÇİN MÜŞTERİ ZORUNLU
    if ((paymentMethod === 'CREDIT' || paymentMethod === 'SPLIT') && !activeChannel.customer) {
      toast.error('Veresiye satış için müşteri seçmelisiniz!');
      return false;
    }

    // Split payment validation
    if (paymentMethod === 'SPLIT') {
      const totalPayment = splitPayment.cash + splitPayment.card;
      if (Math.abs(totalPayment - total) > 0.01) {
        toast.error(`Ödeme tutarı ${total.toFixed(2)} TL olmalı! (Girilen: ${totalPayment.toFixed(2)} TL)`);
        return false;
      }
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validatePayment()) return;

    setIsProcessing(true);

    try {
      const subtotal = activeChannel.cart.reduce((sum, item) => sum + (item.total || 0), 0);
      const taxAmount = activeChannel.cart.reduce(
        (sum, item) => sum + ((item.total || 0) * (item.taxRate || 0)) / (100 + (item.taxRate || 0)),
        0
      );

    const saleData = {
        customerId: activeChannel.customer?.id,
        items: activeChannel.cart.map((item) => ({
          productId: item.id,
        quantity: item.quantity,
          unitPrice: item.sellPrice || 0,
          taxRate: item.taxRate || 0,
        })),
        paymentMethod: paymentMethod === 'SPLIT' ? 'CASH' : paymentMethod,
        subtotal,
        discountAmount,
        taxAmount,
        total: subtotal,
        splitPayment: paymentMethod === 'SPLIT' ? splitPayment : undefined,
      };

      const response = await api.post('/sales', saleData);

      // Update shift statistics
      updateShiftOnSale(saleData);

      // Save receipt data
      setLastReceipt({
        ...saleData,
        saleId: response.data.id,
        date: new Date().toISOString(),
        channelName: activeChannel.name,
      });

      toast.success('Satış tamamlandı!');
      soundEffects.cashRegister(); // 🔊 Sound: Sale completed
      updateChannel(activeChannelId, { cart: [], customer: null });
      setShowPaymentDialog(false);
      setShowReceiptDialog(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Satış hatası!');
      soundEffects.error(); // 🔊 Sound: Sale error
    } finally {
      setIsProcessing(false);
    }
  };

  // 💠 ENTERPRISE: Quick Cash Sale - Direct cash payment without modal
  const handleQuickCashSale = async () => {
    if (activeChannel.cart.length === 0) {
      toast.error('Sepet boş!');
      return;
    }

    setIsProcessing(true);

    try {
      const subtotal = activeChannel.cart.reduce((sum, item) => sum + (item.total || 0), 0);
      const taxAmount = activeChannel.cart.reduce(
        (sum, item) => sum + ((item.total || 0) * (item.taxRate || 0)) / (100 + (item.taxRate || 0)),
        0
      );

    const saleData = {
        customerId: activeChannel.customer?.id,
        items: activeChannel.cart.map((item) => ({
          productId: item.id,
        quantity: item.quantity,
          unitPrice: item.sellPrice || 0,
          taxRate: item.taxRate || 0,
      })),
      paymentMethod: 'CASH',
        subtotal,
        discountAmount,
        taxAmount,
        total: subtotal,
      };

      const response = await api.post('/sales', saleData);

      // Update shift statistics
      updateShiftOnSale(saleData);

      // Save receipt data
      setLastReceipt({
        ...saleData,
        saleId: response.data.id,
        date: new Date().toISOString(),
        channelName: activeChannel.name,
      });

      toast.success('Nakit satış tamamlandı!');
      soundEffects.cashRegister(); // 🔊 Sound: Sale completed
      updateChannel(activeChannelId, { cart: [], customer: null });
      setCalculatorPaid(''); // Reset calculator
      // Not opening receipt dialog for quick cash sales
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Satış hatası!');
    } finally {
      setIsProcessing(false);
    }
  };

  // 💠 ENTERPRISE: Print Receipt
  const printReceipt = () => {
    window.print();
    toast.success('Fiş yazdırılıyor...');
  };

  // 💠 ENTERPRISE: Send E-Invoice (Mock Implementation)
  const sendEInvoice = async (method: 'email' | 'sms') => {
    try {
      toast.loading(`E-fatura ${method === 'email' ? 'e-posta' : 'SMS'} ile gönderiliyor...`);
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.dismiss();
      toast.success(`E-fatura başarıyla ${method === 'email' ? 'e-posta' : 'SMS'} ile gönderildi!`);
      soundEffects.success();
    } catch (error) {
      toast.error('E-fatura gönderilemedi');
      soundEffects.error();
    }
  };

  // 💠 ENTERPRISE: Print Barcode Label (Mock Implementation)
  const printBarcodeLabel = (product: any) => {
    toast.success(`${product.name} için barkod etiketi yazdırılıyor...`);
    soundEffects.click();
    // In production, this would send to thermal printer
  };

  // Calculate totals
  const subtotal = activeChannel.cart.reduce((sum, item) => sum + (item.total || 0), 0);
  const taxAmount = activeChannel.cart.reduce(
    (sum, item) => sum + ((item.total || 0) * (item.taxRate || 0)) / (100 + (item.taxRate || 0)),
    0
  );

  // 💠 ENTERPRISE: Calculate discount amount
  const discountAmount = activeChannel.discount
    ? activeChannel.discount.type === 'percentage'
      ? (subtotal * activeChannel.discount.value) / 100
      : activeChannel.discount.value
    : 0;

  const total = subtotal - discountAmount;

  // 💠 ENTERPRISE: Format Live Clock
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString('tr-TR', options);
  };

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-auto">
      {/* 💠 ENTERPRISE: Multi-Channel Tabs & Customer Selection */}
      <FluentCard depth="depth-4" className="p-2 shrink-0 space-y-1.5">
        {/* Channel Tabs with Calculator */}
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setActiveChannelId(channel.id)}
                className={cn(
                  'px-4 py-2 rounded transition-all fluent-motion-fast relative shrink-0',
                  channel.id === activeChannelId
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-background-alt text-foreground-secondary hover:bg-background-tertiary'
                )}
              >
                {channel.name}
                {channel.cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-white text-xs rounded-full flex items-center justify-center">
                    {channel.cart.length}
                  </span>
                )}
              </button>
            ))}
            
            {/* 💠 Unified Add/Remove Buttons */}
            <div className="flex items-center gap-1 shrink-0 ml-2 border-l border-border pl-2">
              <button
                onClick={() => {
                  if (channels.length === 1) {
                    toast.error('En az bir kanal açık olmalı!');
                    return;
                  }
                  // Close last channel
                  const lastChannel = channels[channels.length - 1];
                  if (lastChannel.cart.length > 0) {
                    if (!confirm('Son kanalda ürünler var. Kapatmak istediğinize emin misiniz?')) {
                      return;
                    }
                  }
                  const newChannels = channels.slice(0, -1);
                  setChannels(newChannels);
                  if (activeChannelId === lastChannel.id) {
                    setActiveChannelId(newChannels[newChannels.length - 1].id);
                  }
                  toast.success('Kanal kapatıldı');
                }}
                className="w-8 h-8 flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 rounded transition-colors"
                title="Kanal Azalt"
              >
                <X className="w-4 h-4" />
              </button>
              
              <button
                onClick={addNewChannel}
                className="w-8 h-8 flex items-center justify-center bg-success/10 text-success hover:bg-success/20 rounded transition-colors"
                title="Kanal Ekle"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 💠 ENTERPRISE: Calculator & Clock Section */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {/* Calculator Widget */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="fluent-caption text-foreground-secondary mb-0.5">Ödenen</span>
                <input
                type="text"
                  inputMode="decimal"
                  value={calculatorPaid}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers and decimal point
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setCalculatorPaid(value);
                      updateCalculator(value, total);
                    }
                  }}
                  className="w-20 px-2 py-1.5 bg-background border border-border rounded fluent-caption text-foreground text-center focus:border-primary focus:outline-none"
                  placeholder="0.00"
              />
            </div>
              <div className="flex flex-col items-center">
                <span className="fluent-caption text-foreground-secondary mb-0.5">Tutar</span>
                <div className="w-20 px-2 py-1.5 bg-background-alt border border-border rounded fluent-caption text-foreground font-semibold text-center">
                  {total.toFixed(2)}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="fluent-caption text-foreground-secondary mb-0.5">Para Üstü</span>
                <div className={cn(
                  "w-24 px-2 py-1.5 border-2 rounded fluent-caption font-bold text-center",
                  calculatorChange > 0 ? "border-success bg-success/10 text-success" : 
                  calculatorChange < 0 ? "border-destructive bg-destructive/10 text-destructive" : 
                  "border-border bg-background text-foreground-secondary"
                )}>
                  {calculatorChange.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Live Clock */}
            <div className="flex items-center justify-center px-2 py-1 bg-background-alt/50 rounded border border-border/50">
              <p className="fluent-caption text-foreground tabular-nums">
                {formatDate(currentTime)} - {formatTime(currentTime)}
              </p>
            </div>
          </div>
        </div>

        {/* 💠 Compact Customer Selection */}
        <button
          onClick={() => setShowCustomerDialog(true)}
          className="flex items-center gap-2 px-2 py-1 bg-background-alt hover:bg-background-tertiary rounded transition-colors"
        >
          <User className="w-4 h-4 text-primary" />
          <span className="fluent-caption text-foreground">
            {activeChannel.customer ? activeChannel.customer.name : 'Müşteri Seçilmedi'}
          </span>
        </button>
      </FluentCard>

      <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0">
        {/* Left: Scanner & Products */}
        <div className="flex-1 space-y-3">
          {/* 💠 ENTERPRISE: Frequent Products Quick Access */}
          {showFrequentProducts && frequentProducts.length > 0 && (
            <FluentCard depth="depth-4" className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="fluent-body-small font-semibold text-foreground">
                  Sık Satılan Ürünler
                </h3>
                <button
                  onClick={() => setShowFrequentProducts(false)}
                  className="text-foreground-secondary hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {frequentProducts.map((product) => (
                <button
                  key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-2 bg-background-alt hover:bg-primary/10 hover:border-primary border-2 border-transparent rounded transition-all text-left"
                  >
                    <p className="fluent-caption font-medium text-foreground truncate">
                      {product.name}
                    </p>
                    <p className="fluent-caption text-primary font-bold">
                      ₺{product.sellPrice.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
            </FluentCard>
          )}

          {/* 💠 ENTERPRISE: Smart Search (Barcode + Product Name) */}
          <FluentCard depth="depth-4" className="p-3 relative">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <FluentInput
                  ref={searchInputRef}
                  value={searchInput}
                  onChange={(e) => handleSmartSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSmartEnter();
                    } else if (e.key === 'Escape') {
                      setShowSearchResults(false);
                      setSearchResults([]);
                      if (isMuhtelifMode) {
                        setIsMuhtelifMode(false);
                      }
                    }
                  }}
                  onFocus={() => {
                    if (!isMuhtelifMode && searchInput.length >= 2 && searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  placeholder={
                    isMuhtelifMode 
                      ? "Muhtelif ürün ekle... (örn: SÜT 10TL veya EKMEK 5)"
                      : "Barkod veya ürün adı... (örn: 123456 veya coca)"
                  }
                  icon={isMuhtelifMode ? <Tag className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                  className="w-full"
                />

                {/* 💠 Smart Search Dropdown (Disabled in Muhtelif Mode) - DYNAMIC JS SOLUTION */}
                {!isMuhtelifMode && showSearchResults && (
                  <div
                    ref={searchDropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-lg shadow-2xl overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200 overscroll-contain"
                    style={{ 
                      height: `${dropdownHeight}px`,
                      overscrollBehavior: 'contain',
                      transition: 'height 0.25s cubic-bezier(0.4, 0.0, 0.2, 1)' // Smooth height transitions
                    }}
                  >
                    {isSearching ? (
                      <div className="p-8 text-center">
                        <div className="inline-flex items-center gap-3 text-primary">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                          <p className="fluent-body font-medium">Aranıyor...</p>
                        </div>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="fluent-body text-foreground-secondary mb-2">🔍 Sonuç bulunamadı</p>
                        <p className="fluent-caption text-foreground-secondary/60">Farklı bir arama terimi deneyin</p>
                      </div>
                    ) : (
                      <>
                        {/* 💠 Results Count Banner */}
                        <div className="px-5 py-2.5 bg-primary/5 border-b-2 border-primary/20 flex items-center justify-between">
                          <p className="fluent-body-small font-semibold text-primary">
                            {searchResults.length} ürün bulundu
                          </p>
                          <p className="fluent-caption text-foreground-secondary">
                            ↑↓ Gezin • Enter Seç • Esc Kapat
                          </p>
                        </div>
                        {searchResults.map((product, index) => (
                <button
                  key={product.id}
                            onClick={() => selectProductFromSearch(product)}
                            className={`w-full px-5 py-4 text-left transition-all duration-200 border-b border-border last:border-b-0 flex items-center justify-between gap-4
                              ${index === 0 ? 'bg-primary/5' : ''} 
                              hover:bg-primary/10 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="fluent-body-large font-medium text-foreground truncate">
                                  {product.name}
                                </p>
                                {/* 💠 Stock Indicator */}
                                {product.stock <= 0 && (
                                  <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-semibold rounded">
                                    Stok Yok
                                  </span>
                                )}
                                {product.stock > 0 && product.stock < 10 && (
                                  <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs font-semibold rounded">
                                    Az Stok
                                  </span>
                                )}
                              </div>
                              <p className="fluent-body-small text-foreground-secondary mt-1">
                                Barkod: {product.barcode} • Stok: <span className={product.stock <= 0 ? 'text-destructive font-semibold' : product.stock < 10 ? 'text-warning font-semibold' : 'text-success'}>{product.stock}</span>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-bold text-primary">
                                ₺{(product.sellPrice || 0).toFixed(2)}
                              </p>
                              {index === 0 && (
                                <p className="fluent-caption text-primary/60 mt-0.5">En İyi Eşleşme</p>
                              )}
                            </div>
                </button>
              ))}
                      </>
                    )}
            </div>
                )}
              </div>
              
              {/* 💠 ENTERPRISE: Muhtelif Toggle Button */}
              <FluentButton
                appearance={isMuhtelifMode ? 'primary' : 'subtle'}
                onClick={() => {
                  setIsMuhtelifMode(!isMuhtelifMode);
                  setSearchInput('');
                  setSearchResults([]);
                  setShowSearchResults(false);
                  if (isScanning) {
                    stopCamera();
                  }
                }}
                icon={<Tag className="w-4 h-4" />}
              >
                Muhtelif
              </FluentButton>

              {/* 💠 ENTERPRISE: Return/Refund Button */}
              <FluentButton
                appearance="subtle"
                onClick={() => setShowReturnDialog(true)}
                icon={<RotateCcw className="w-4 h-4" />}
                title="İade işlemi (F3 / Ctrl+R)"
              >
                İade
              </FluentButton>

              {/* 💠 ENTERPRISE: Hold Sales Button */}
              <FluentButton
                appearance="subtle"
                onClick={() => setShowHoldSales(true)}
                icon={<Pause className="w-4 h-4" />}
                title="Park edilmiş satışlar (F4 / Ctrl+H)"
              >
                Park ({heldSales.length})
              </FluentButton>

              {/* 💠 ENTERPRISE: Shift Management Button */}
              <FluentButton
                appearance={currentShift ? 'primary' : 'subtle'}
                onClick={() => setShowShiftManagement(true)}
                icon={<Clock className="w-4 h-4" />}
                title="Vardiya yönetimi (F9)"
              >
                {currentShift ? 'Vardiya Aktif' : 'Vardiya'}
              </FluentButton>

              {/* 📱 Camera Button - Hidden on Desktop */}
              <FluentButton
                appearance="primary"
                onClick={() => setShowCameraModal(true)}
                icon={<Camera className="w-4 h-4" />}
                className="md:hidden"
              >
                📸 Kamera
              </FluentButton>
            </div>
          </FluentCard>
      </div>

      {/* Right: Cart */}
        <div className="w-full md:w-96 flex flex-col min-h-0">
          <FluentCard depth="depth-8" className="flex-1 flex flex-col min-h-0">
            {/* Cart Header */}
            <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="fluent-body font-semibold text-foreground">
                Sepet ({activeChannel.cart.length})
              </h3>
              {activeChannel.cart.length > 0 && (
                <FluentButton
                  appearance="subtle"
                  size="small"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={clearCart}
                >
                  Temizle
                </FluentButton>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto fluent-scrollbar p-3 space-y-1.5 min-h-0">
              {activeChannel.cart.length === 0 ? (
                <div className="text-center text-foreground-secondary py-6">
                  <p className="fluent-caption">Sepet boş</p>
                </div>
              ) : (
                activeChannel.cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-1.5 bg-background-alt rounded">
                    <div className="flex-1 min-w-0">
                      <p className="fluent-body-small font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="fluent-caption text-foreground-secondary">
                        ₺{(item.sellPrice || 0).toFixed(2)} x {item.quantity}
                      </p>
                  </div>
                    <div className="flex items-center gap-1">
                      {/* 💠 ENTERPRISE: Price Override Button (Admin Only) */}
                      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                    <button
                          onClick={() => openPriceOverride(item)}
                          className="w-6 h-6 flex items-center justify-center text-warning hover:bg-warning/10 rounded"
                          title="Fiyat değiştir (Admin)"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-background hover:bg-border rounded text-foreground-secondary"
                    >
                        -
                    </button>
                      <span className="fluent-body-small font-medium text-foreground w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-background hover:bg-border rounded text-foreground-secondary"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded"
                      >
                        <X className="w-4 h-4" />
                    </button>
                  </div>
                    <p className="fluent-body font-medium text-foreground w-20 text-right">
                      ₺{(item.total || 0).toFixed(2)}
                    </p>
                </div>
              ))
            )}
            </div>

            {/* Cart Footer */}
            {activeChannel.cart.length > 0 && (
              <div className="p-3 border-t border-border space-y-1.5 shrink-0">
                <div className="flex justify-between fluent-caption text-foreground-secondary">
                  <span>Ara Toplam</span>
                  <span>₺{subtotal.toFixed(2)}</span>
            </div>
                <div className="flex justify-between fluent-caption text-foreground-secondary">
                  <span>KDV</span>
                  <span>₺{taxAmount.toFixed(2)}</span>
                </div>

                {/* 💠 ENTERPRISE: Discount Display */}
                {activeChannel.discount && (
                  <div className="flex justify-between items-center fluent-caption text-destructive font-semibold">
                    <div className="flex items-center gap-2">
                      <span>İndirim</span>
                      <span className="text-xs bg-destructive/10 px-1.5 py-0.5 rounded">
                        {activeChannel.discount.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>-₺{discountAmount.toFixed(2)}</span>
                      <button
                        onClick={removeDiscount}
                        className="p-0.5 hover:bg-destructive/20 rounded transition-colors"
                        title="İndirimi kaldır"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between fluent-body font-semibold text-foreground pt-1.5 border-t border-border">
                  <span>Toplam</span>
                  <span>₺{total.toFixed(2)}</span>
                </div>
                <FluentButton
                  appearance="primary"
                  size="large"
                  className="w-full mt-3"
                  onClick={() => setShowPaymentDialog(true)}
                  icon={<Banknote className="w-5 h-5" />}
                >
                  Ödeme Al
                </FluentButton>
                
                {/* 💠 ENTERPRISE: Quick Cash Sale Button */}
                <FluentButton
                  appearance="primary"
                  size="large"
                  className="w-full mt-1.5 !bg-success hover:!bg-success/90 !border-success"
                  onClick={handleQuickCashSale}
                  disabled={isProcessing}
                  icon={<Banknote className="w-5 h-5" />}
                >
                  {isProcessing ? 'İşleniyor...' : 'Nakit Satış'}
                </FluentButton>
              </div>
            )}
          </FluentCard>
        </div>
            </div>

      {/* 💠 ENTERPRISE: Customer Selection Dialog with Search */}
      <FluentDialog
        open={showCustomerDialog}
        onClose={() => {
          setShowCustomerDialog(false);
          setCustomerSearchQuery('');
        }}
        title="Müşteri Seç"
        size="medium"
      >
        <div className="space-y-2">
          {/* Search Input with Quick Add Button */}
          <div className="flex gap-2">
            <FluentInput
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              placeholder="Müşteri ara... (isim, telefon)"
              icon={<Search className="w-4 h-4" />}
              className="flex-1"
            />
            <FluentButton
              appearance="primary"
              onClick={() => setShowQuickCustomerAdd(true)}
              icon={<UserPlus className="w-4 h-4" />}
              title="Hızlı müşteri ekle"
            >
              Yeni
            </FluentButton>
          </div>

          {/* Customer List */}
          <div className="space-y-1.5 max-h-96 overflow-y-auto fluent-scrollbar">
            {customers
              .filter((customer) => {
                if (!customerSearchQuery) return true;
                const query = customerSearchQuery.toLowerCase();
                return (
                  customer.name.toLowerCase().includes(query) ||
                  customer.phone?.toLowerCase().includes(query) ||
                  customer.email?.toLowerCase().includes(query)
                );
              })
              .map((customer) => (
                      <button
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                  className="w-full p-2 text-left border border-border rounded hover:bg-background-alt hover:border-primary transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="fluent-body-small font-medium text-foreground">{customer.name}</p>
                      <p className="fluent-caption text-foreground-secondary text-xs">
                        {customer.phone && `${customer.phone} • `}
                        Borç: ₺{(customer.debt || 0).toFixed(2)}
                      </p>
                    </div>
                    <User className="w-4 h-4 text-foreground-secondary" />
                  </div>
                      </button>
              ))}
            
            {customers.filter((customer) => {
              if (!customerSearchQuery) return true;
              const query = customerSearchQuery.toLowerCase();
              return (
                customer.name.toLowerCase().includes(query) ||
                customer.phone?.toLowerCase().includes(query) ||
                customer.email?.toLowerCase().includes(query)
              );
            }).length === 0 && (
              <div className="text-center py-8 text-foreground-secondary">
                <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="fluent-body">Müşteri bulunamadı</p>
                    </div>
            )}
                  </div>
                </div>
      </FluentDialog>

      {/* Payment Dialog */}
      <FluentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        title="Ödeme"
        size="medium"
      >
        <div className="space-y-3">
          <div className="flex justify-between fluent-body font-semibold text-foreground">
            <span>Toplam Tutar:</span>
            <span>₺{total.toFixed(2)}</span>
      </div>

          {/* 💠 ENTERPRISE: Payment Method Selection */}
          <div>
            <label className="fluent-caption font-medium text-foreground block mb-1.5">
              Ödeme Yöntemi
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={cn(
                  'p-2 rounded border-2 transition-all flex items-center gap-2',
                  paymentMethod === 'CASH'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-background-alt'
                )}
              >
                <Banknote className="w-4 h-4" />
                <span className="fluent-body-small font-medium">Nakit</span>
              </button>

                    <button
                onClick={() => setPaymentMethod('CARD')}
                className={cn(
                  'p-2 rounded border-2 transition-all flex items-center gap-2',
                  paymentMethod === 'CARD'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-background-alt'
                )}
              >
                <CreditCard className="w-4 h-4" />
                <span className="fluent-body-small font-medium">Kart</span>
                    </button>

                      <button
                onClick={() => setPaymentMethod('CREDIT')}
                className={cn(
                  'p-2 rounded border-2 transition-all flex items-center gap-2',
                  paymentMethod === 'CREDIT'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-background-alt'
                )}
              >
                <User className="w-4 h-4" />
                <span className="fluent-body-small font-medium">Veresiye</span>
                      </button>

                      <button
                onClick={() => setPaymentMethod('SPLIT')}
                className={cn(
                  'p-2 rounded border-2 transition-all flex items-center gap-2',
                  paymentMethod === 'SPLIT'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-background-alt'
                )}
              >
                <Wallet className="w-4 h-4" />
                <span className="fluent-body-small font-medium">Parçalı</span>
                      </button>
                    </div>
            </div>

          {/* 💠 ENTERPRISE: Split Payment Details */}
          {paymentMethod === 'SPLIT' && (
            <div className="p-2.5 bg-background-alt rounded space-y-2">
              <p className="fluent-caption font-medium text-foreground">Parçalı Ödeme Detayları</p>
              
              <div>
                <label className="fluent-caption text-foreground-secondary block mb-0.5 text-xs">Nakit (₺)</label>
                <FluentInput
                type="number"
                step="0.01"
                  value={splitPayment.cash}
                  onChange={(e) => setSplitPayment({ ...splitPayment, cash: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
              />
            </div>

              <div>
                <label className="fluent-caption text-foreground-secondary block mb-0.5 text-xs">Kart (₺)</label>
                <FluentInput
                type="number"
                step="0.01"
                  value={splitPayment.card}
                  onChange={(e) => setSplitPayment({ ...splitPayment, card: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
              />
            </div>

              <div className="flex justify-between pt-1.5 border-t border-border">
                <span className="fluent-caption text-foreground-secondary">Toplam Ödeme:</span>
                <span className={cn(
                  'fluent-body-small font-semibold',
                  Math.abs((splitPayment.cash + splitPayment.card) - total) < 0.01
                    ? 'text-success'
                    : 'text-destructive'
                )}>
                  ₺{(splitPayment.cash + splitPayment.card).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* 🚨 Veresiye Warning */}
          {(paymentMethod === 'CREDIT' || paymentMethod === 'SPLIT') && !activeChannel.customer && (
            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded">
              <p className="fluent-caption text-destructive">
                ⚠️ Veresiye satış için müşteri seçmelisiniz!
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-3">
            <FluentButton
              appearance="subtle"
                className="flex-1"
              onClick={() => setShowPaymentDialog(false)}
            >
              İptal
            </FluentButton>
            <FluentButton
              appearance="primary"
                className="flex-1"
              onClick={handlePayment}
              disabled={isProcessing}
              >
              {isProcessing ? 'İşleniyor...' : 'Ödemeyi Tamamla'}
            </FluentButton>
            </div>
      </div>
      </FluentDialog>

      {/* 💠 ENTERPRISE: Receipt Dialog */}
      <FluentDialog
        open={showReceiptDialog}
        onClose={() => setShowReceiptDialog(false)}
        title="Satış Tamamlandı"
        size="medium"
      >
        {lastReceipt && (
          <div className="space-y-4">
            {/* Receipt Preview */}
            <div className="p-6 bg-background border border-border rounded" id="receipt-print">
              <div className="text-center space-y-2 border-b border-border pb-4">
                <h2 className="fluent-title-2 font-bold">BarcodePOS</h2>
                <p className="fluent-caption text-foreground-secondary">Satış Fişi</p>
                <p className="fluent-caption text-foreground-secondary">
                  {new Date(lastReceipt.date).toLocaleString('tr-TR')}
                </p>
                <p className="fluent-caption text-foreground-secondary">
                  Kanal: {lastReceipt.channelName}
                </p>
              </div>

              <div className="space-y-2 py-4">
                {activeChannel.cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="flex-1">{item.name}</span>
                    <span className="w-16 text-center">{item.quantity}x</span>
                    <span className="w-20 text-right">₺{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span>Ara Toplam:</span>
                  <span>₺{lastReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>KDV:</span>
                  <span>₺{lastReceipt.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-border">
                  <span>TOPLAM:</span>
                  <span>₺{lastReceipt.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span>Ödeme:</span>
                  <span>
                    {lastReceipt.paymentMethod === 'CASH' && 'Nakit'}
                    {lastReceipt.paymentMethod === 'CARD' && 'Kart'}
                    {lastReceipt.paymentMethod === 'CREDIT' && 'Veresiye'}
                    {lastReceipt.splitPayment && 'Parçalı'}
                  </span>
                </div>
                {lastReceipt.splitPayment && (
                  <div className="text-sm pl-4 text-foreground-secondary">
                    <p>Nakit: ₺{lastReceipt.splitPayment.cash.toFixed(2)}</p>
                    <p>Kart: ₺{lastReceipt.splitPayment.card.toFixed(2)}</p>
                  </div>
                )}
              </div>

              <div className="text-center pt-4 border-t border-border mt-4">
                <p className="fluent-caption text-foreground-secondary">Teşekkür ederiz!</p>
              </div>
            </div>

            <div className="space-y-2">
              {/* 💠 ENTERPRISE: E-Invoice Sending */}
              <div className="flex gap-2">
                <FluentButton
                  appearance="default"
                  className="flex-1"
                  onClick={() => sendEInvoice('email')}
                  size="small"
                >
                  📧 E-posta Gönder
                </FluentButton>
                <FluentButton
                  appearance="default"
                  className="flex-1"
                  onClick={() => sendEInvoice('sms')}
                  size="small"
                >
                  📱 SMS Gönder
                </FluentButton>
              </div>

              <div className="flex gap-2">
                <FluentButton
                  appearance="subtle"
                  className="flex-1"
                  onClick={() => setShowReceiptDialog(false)}
                >
                  Kapat
                </FluentButton>
                <FluentButton
                  appearance="primary"
                  className="flex-1"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={printReceipt}
                >
                  Fiş Yazdır
                </FluentButton>
              </div>
            </div>
          </div>
        )}
      </FluentDialog>

      {/* 💠 ENTERPRISE: Discount Dialog */}
      <DiscountDialog
        open={showDiscountDialog}
        onClose={() => setShowDiscountDialog(false)}
        onApply={applyDiscount}
        currentTotal={subtotal}
      />

      {/* 💠 ENTERPRISE: Stock Warning Dialog */}
      <StockWarningDialog
        open={showStockWarning}
        onClose={() => {
          setShowStockWarning(false);
          setPendingProduct(null);
        }}
        onAddAnyway={handleAddAnyway}
        productName={pendingProduct?.name || ''}
        currentStock={pendingProduct?.stock || 0}
      />

      {/* 💠 ENTERPRISE: Return/Refund Dialog */}
      <ReturnDialog
        open={showReturnDialog}
        onClose={() => setShowReturnDialog(false)}
        onReturnComplete={() => {
          // Refresh products/stock if needed
          toast.success('İade işlemi tamamlandı!');
        }}
      />

      {/* 💠 ENTERPRISE: Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        open={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {/* 💠 ENTERPRISE: Quick Customer Add */}
      <QuickCustomerAdd
        open={showQuickCustomerAdd}
        onClose={() => setShowQuickCustomerAdd(false)}
        onCustomerAdded={(newCustomer) => {
          // Add new customer to the list
          setCustomers((prev) => [newCustomer, ...prev]);
          // Automatically select the new customer
          selectCustomer(newCustomer);
          // Close the quick add dialog
          setShowQuickCustomerAdd(false);
          // Also close the customer selection dialog
          setShowCustomerDialog(false);
          setCustomerSearchQuery('');
        }}
      />

      {/* 💠 ENTERPRISE: Hold Sales Dialog */}
      <HoldSalesDialog
        open={showHoldSales}
        onClose={() => setShowHoldSales(false)}
        heldSales={heldSales}
        onRestore={restoreHeldSale}
        onDelete={deleteHeldSale}
      />

      {/* 💠 ENTERPRISE: Price Override Dialog (Admin Only) */}
      <PriceOverrideDialog
        open={showPriceOverride}
        onClose={() => {
          setShowPriceOverride(false);
          setSelectedItemForPriceEdit(null);
        }}
        productName={selectedItemForPriceEdit?.name || ''}
        currentPrice={selectedItemForPriceEdit?.sellPrice || 0}
        onConfirm={handlePriceOverride}
      />

      {/* 💠 ENTERPRISE: Shift Management Dialog */}
      <ShiftManagementDialog
        open={showShiftManagement}
        onClose={() => setShowShiftManagement(false)}
        currentShift={currentShift}
        onStartShift={handleStartShift}
        onEndShift={handleEndShift}
        onViewReport={() => {
          setShowShiftManagement(false);
          setShowZReport(true);
        }}
      />

      {/* 💠 ENTERPRISE: Z Report Dialog */}
      <ZReportDialog
        open={showZReport}
        onClose={() => setShowZReport(false)}
        shift={currentShift}
      />

      {/* 📸 FULLSCREEN CAMERA MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[9999] bg-black">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-xl font-semibold flex items-center gap-2">
                <Camera className="w-6 h-6" />
                Barkod Tarayıcı
              </h2>
              <button
                onClick={async () => {
                  await stopCamera();
                  setShowCameraModal(false);
                }}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Video Container */}
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              id="zxing-video-fullscreen"
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Scan Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Dark overlay with cutout */}
              <div className="absolute inset-0 bg-black/50"></div>
              
              {/* Scan area */}
              <div className="relative w-72 h-72 border-4 border-white rounded-2xl shadow-2xl">
                {/* Corner indicators */}
                <div className="absolute -top-2 -left-2 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl"></div>
                <div className="absolute -top-2 -right-2 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl"></div>
                <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl"></div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl"></div>
                
                {/* Scanning line animation */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="absolute w-full h-1 bg-primary/50 animate-scan"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/80 to-transparent">
            {/* Instructions */}
            <div className="mb-4 text-center">
              <p className="text-white text-lg font-medium mb-1">
                🎯 Barkodu beyaz kare içine getirin
              </p>
              <p className="text-white/70 text-sm">
                Otomatik okuma yapılacak • Yakın tutun
              </p>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              {/* Flash Toggle */}
              <button
                onClick={toggleFlash}
                className={`p-4 rounded-full transition-all ${
                  useFlash 
                    ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50' 
                    : 'bg-white/20 text-white'
                }`}
              >
                <span className="text-2xl">{useFlash ? '💡' : '🔦'}</span>
              </button>

              {/* Camera Switch */}
              <button
                onClick={toggleCamera}
                className="p-4 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
              >
                <span className="text-2xl">🔄</span>
              </button>
            </div>

            {/* Status */}
            {isScanning && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-green-400 font-medium">Tarama aktif...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;

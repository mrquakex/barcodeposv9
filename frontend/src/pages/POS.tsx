import React, { useState, useEffect, useRef } from 'react';
import { Camera, Search, X, Trash2, CreditCard, Banknote, User, Plus, Printer, Wallet } from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { cn } from '../lib/utils';

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

interface Customer {
  id: string;
  name: string;
  debt: number;
}

// 💠 ENTERPRISE: Multi-Channel Tab Interface
interface SalesChannel {
  id: string;
  name: string;
  cart: CartItem[];
  customer: Customer | null;
}

// 💠 ENTERPRISE: Split Payment Interface
interface SplitPayment {
  cash: number;
  card: number;
}

const POS: React.FC = () => {
  const { t } = useTranslation();
  
  // 💠 ENTERPRISE: Multi-Channel States
  const [channels, setChannels] = useState<SalesChannel[]>([
    { id: '1', name: 'Müşteri 1', cart: [], customer: null }
  ]);
  const [activeChannelId, setActiveChannelId] = useState('1');
  
  // Basic States
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  
  // 💠 ENTERPRISE: Payment States
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CREDIT' | 'SPLIT'>('CASH');
  const [splitPayment, setSplitPayment] = useState<SplitPayment>({ cash: 0, card: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Get active channel
  const activeChannel = channels.find(ch => ch.id === activeChannelId) || channels[0];

  useEffect(() => {
    fetchCustomers();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
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

  const handleBarcodeSubmit = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data;

      if (!product || !product.id) {
        toast.error('Ürün verisi eksik!');
        return;
      }

      if (!product.isActive) {
        toast.error('Bu ürün inaktif!');
        return;
      }

      addToCart(product);
      setBarcodeInput('');
      toast.success('Sepete eklendi');
    } catch (error: any) {
      toast.error('Ürün bulunamadı');
    }
  };

  const addToCart = (product: Product) => {
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
  };

  const clearCart = () => {
    updateChannel(activeChannelId, { cart: [], customer: null });
    toast.success('Sepet temizlendi');
  };

  const selectCustomer = (customer: Customer) => {
    updateChannel(activeChannelId, { customer });
    setShowCustomerDialog(false);
    toast.success(`Müşteri: ${customer.name}`);
  };

  const startCamera = () => {
    setIsScanning(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render(
        (decodedText) => {
          handleBarcodeSubmit(decodedText);
          scanner.clear();
          setIsScanning(false);
        },
        (error) => {
          console.error('Scanner error:', error);
        }
      );
      scannerRef.current = scanner;
    }, 100);
  };

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
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
        taxAmount,
        total: subtotal,
        splitPayment: paymentMethod === 'SPLIT' ? splitPayment : undefined,
      };

      const response = await api.post('/sales', saleData);

      // Save receipt data
      setLastReceipt({
        ...saleData,
        saleId: response.data.id,
        date: new Date().toISOString(),
        channelName: activeChannel.name,
      });

      toast.success('Satış tamamlandı!');
      updateChannel(activeChannelId, { cart: [], customer: null });
      setShowPaymentDialog(false);
      setShowReceiptDialog(true);
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

  // Calculate totals
  const subtotal = activeChannel.cart.reduce((sum, item) => sum + (item.total || 0), 0);
  const taxAmount = activeChannel.cart.reduce(
    (sum, item) => sum + ((item.total || 0) * (item.taxRate || 0)) / (100 + (item.taxRate || 0)),
    0
  );
  const total = subtotal;

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-auto">
      {/* 💠 ENTERPRISE: Multi-Channel Tabs */}
      <FluentCard depth="depth-4" className="p-2 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Channel Tabs */}
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
      </FluentCard>

      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* Left: Scanner & Products */}
        <div className="flex-1 space-y-4">
          {/* Scanner */}
          <FluentCard depth="depth-4" className="p-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <FluentInput
                ref={barcodeInputRef}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBarcodeSubmit(barcodeInput);
                  }
                }}
                placeholder="Barkod okutun veya yazın..."
                icon={<Search className="w-4 h-4" />}
                className="flex-1"
              />
              <FluentButton
                appearance={isScanning ? 'subtle' : 'primary'}
                onClick={isScanning ? stopCamera : startCamera}
                icon={<Camera className="w-4 h-4" />}
              >
                {isScanning ? 'Durdur' : 'Kamera'}
              </FluentButton>
            </div>

            {isScanning && (
              <div id="qr-reader" className="mt-4 rounded-lg overflow-hidden"></div>
            )}
          </FluentCard>

          {/* Customer Selection */}
          <FluentCard depth="depth-4" className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-foreground-secondary" />
                <span className="fluent-body text-foreground">
                  {activeChannel.customer ? activeChannel.customer.name : 'Müşteri Seçilmedi'}
                </span>
              </div>
              <FluentButton
                appearance="subtle"
                size="small"
                onClick={() => setShowCustomerDialog(true)}
              >
                {activeChannel.customer ? 'Değiştir' : 'Seç'}
              </FluentButton>
            </div>
          </FluentCard>
        </div>

        {/* Right: Cart */}
        <div className="w-full md:w-96 flex flex-col min-h-0">
          <FluentCard depth="depth-8" className="flex-1 flex flex-col min-h-0">
            {/* Cart Header */}
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="fluent-heading text-foreground">
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
            <div className="flex-1 overflow-y-auto fluent-scrollbar p-4 space-y-2 min-h-0">
              {activeChannel.cart.length === 0 ? (
                <div className="text-center text-foreground-secondary py-8">
                  <p className="fluent-body">Sepet boş</p>
                </div>
              ) : (
                activeChannel.cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-background-alt rounded">
                    <div className="flex-1 min-w-0">
                      <p className="fluent-body-small font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="fluent-caption text-foreground-secondary">
                        ₺{(item.sellPrice || 0).toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
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
              <div className="p-4 border-t border-border space-y-2 shrink-0">
                <div className="flex justify-between fluent-body-small text-foreground-secondary">
                  <span>Ara Toplam</span>
                  <span>₺{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between fluent-body-small text-foreground-secondary">
                  <span>KDV</span>
                  <span>₺{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between fluent-heading text-foreground pt-2 border-t border-border">
                  <span>Toplam</span>
                  <span>₺{total.toFixed(2)}</span>
                </div>
                <FluentButton
                  appearance="primary"
                  size="large"
                  className="w-full mt-4"
                  onClick={() => setShowPaymentDialog(true)}
                  icon={<Banknote className="w-5 h-5" />}
                >
                  Ödeme Al
                </FluentButton>
              </div>
            )}
          </FluentCard>
        </div>
      </div>

      {/* Customer Selection Dialog */}
      <FluentDialog
        open={showCustomerDialog}
        onClose={() => setShowCustomerDialog(false)}
        title="Müşteri Seç"
        size="medium"
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => selectCustomer(customer)}
              className="w-full p-3 text-left border border-border rounded hover:bg-background-alt transition-colors"
            >
              <p className="fluent-body font-medium text-foreground">{customer.name}</p>
              <p className="fluent-caption text-foreground-secondary">
                Borç: ₺{(customer.debt || 0).toFixed(2)}
              </p>
            </button>
          ))}
        </div>
      </FluentDialog>

      {/* Payment Dialog */}
      <FluentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        title="Ödeme"
        size="medium"
      >
        <div className="space-y-4">
          <div className="flex justify-between fluent-title-3 text-foreground">
            <span>Toplam Tutar:</span>
            <span>₺{total.toFixed(2)}</span>
          </div>

          {/* 💠 ENTERPRISE: Payment Method Selection */}
          <div>
            <label className="fluent-body-small font-medium text-foreground block mb-2">
              Ödeme Yöntemi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={cn(
                  'p-3 rounded border-2 transition-all flex items-center gap-2',
                  paymentMethod === 'CASH'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-background-alt'
                )}
              >
                <Banknote className="w-5 h-5" />
                <span className="fluent-body font-medium">Nakit</span>
              </button>

              <button
                onClick={() => setPaymentMethod('CARD')}
                className={cn(
                  'p-3 rounded border-2 transition-all flex items-center gap-2',
                  paymentMethod === 'CARD'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-background-alt'
                )}
              >
                <CreditCard className="w-5 h-5" />
                <span className="fluent-body font-medium">Kart</span>
              </button>

              <button
                onClick={() => setPaymentMethod('CREDIT')}
                className={cn(
                  'p-3 rounded border-2 transition-all flex items-center gap-2',
                  paymentMethod === 'CREDIT'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-background-alt'
                )}
              >
                <User className="w-5 h-5" />
                <span className="fluent-body font-medium">Veresiye</span>
              </button>

              <button
                onClick={() => setPaymentMethod('SPLIT')}
                className={cn(
                  'p-3 rounded border-2 transition-all flex items-center gap-2',
                  paymentMethod === 'SPLIT'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-background-alt'
                )}
              >
                <Wallet className="w-5 h-5" />
                <span className="fluent-body font-medium">Parçalı</span>
              </button>
            </div>
          </div>

          {/* 💠 ENTERPRISE: Split Payment Details */}
          {paymentMethod === 'SPLIT' && (
            <div className="p-4 bg-background-alt rounded space-y-3">
              <p className="fluent-body-small font-medium text-foreground">Parçalı Ödeme Detayları</p>
              
              <div>
                <label className="fluent-caption text-foreground-secondary block mb-1">Nakit (₺)</label>
                <FluentInput
                  type="number"
                  step="0.01"
                  value={splitPayment.cash}
                  onChange={(e) => setSplitPayment({ ...splitPayment, cash: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="fluent-caption text-foreground-secondary block mb-1">Kart (₺)</label>
                <FluentInput
                  type="number"
                  step="0.01"
                  value={splitPayment.card}
                  onChange={(e) => setSplitPayment({ ...splitPayment, card: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-between pt-2 border-t border-border">
                <span className="fluent-body-small text-foreground-secondary">Toplam Ödeme:</span>
                <span className={cn(
                  'fluent-body font-semibold',
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
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
              <p className="fluent-body-small text-destructive">
                ⚠️ Veresiye satış için müşteri seçmelisiniz!
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
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
        )}
      </FluentDialog>
    </div>
  );
};

export default POS;

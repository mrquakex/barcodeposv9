import React, { useState, useEffect, useRef } from 'react';
import { Camera, Search, X, Trash2, CreditCard, DollarSign, User } from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

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

const POS: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CREDIT'>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

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
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleBarcodeSubmit = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data;

      if (product.stock <= 0) {
        toast.error('Product out of stock');
        return;
      }

      addToCart(product);
      setBarcodeInput('');
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error('Product not found');
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Not enough stock');
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.sellPrice }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, total: product.sellPrice }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity, total: quantity * item.sellPrice } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
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

  const handlePayment = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (paymentMethod === 'CREDIT' && !selectedCustomer) {
      toast.error('Please select a customer for credit sale');
      return;
    }

    setIsProcessing(true);

    try {
      const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = cart.reduce(
        (sum, item) => sum + (item.total * item.taxRate) / (100 + item.taxRate),
        0
      );

      await api.post('/sales', {
        customerId: selectedCustomer?.id,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.sellPrice,
          taxRate: item.taxRate,
        })),
        paymentMethod,
        subtotal,
        taxAmount,
        total: subtotal,
      });

      toast.success('Sale completed successfully');
      clearCart();
      setShowPaymentDialog(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sale failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = cart.reduce(
    (sum, item) => sum + (item.total * item.taxRate) / (100 + item.taxRate),
    0
  );
  const total = subtotal;

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4">
      {/* Left: Scanner & Products */}
      <div className="flex-1 space-y-4">
        {/* Scanner */}
        <FluentCard elevation="depth4" className="p-4">
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
              placeholder="Scan or enter barcode..."
              icon={<Search className="w-4 h-4" />}
              className="flex-1"
            />
            <FluentButton
              appearance={isScanning ? 'subtle' : 'primary'}
              onClick={isScanning ? stopCamera : startCamera}
              icon={<Camera className="w-4 h-4" />}
            >
              {isScanning ? 'Stop' : 'Camera'}
            </FluentButton>
          </div>

          {isScanning && (
            <div id="qr-reader" className="mt-4 rounded-lg overflow-hidden"></div>
          )}
        </FluentCard>

        {/* Customer Selection */}
        <FluentCard elevation="depth4" className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-foreground-secondary" />
              <span className="fluent-body text-foreground">
                {selectedCustomer ? selectedCustomer.name : 'No customer selected'}
              </span>
            </div>
            <FluentButton
              appearance="subtle"
              size="small"
              onClick={() => setShowCustomerDialog(true)}
            >
              {selectedCustomer ? 'Change' : 'Select'}
            </FluentButton>
          </div>
        </FluentCard>
      </div>

      {/* Right: Cart */}
      <div className="w-full md:w-96 flex flex-col">
        <FluentCard elevation="depth8" className="flex-1 flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="fluent-heading text-foreground">Cart ({cart.length})</h3>
            {cart.length > 0 && (
              <FluentButton
                appearance="subtle"
                size="small"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={clearCart}
              >
                Clear
              </FluentButton>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto fluent-scrollbar p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center text-foreground-secondary py-8">
                <p className="fluent-body">Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-background-alt rounded">
                  <div className="flex-1 min-w-0">
                    <p className="fluent-body-small font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="fluent-caption text-foreground-secondary">
                      ₺{item.sellPrice.toFixed(2)} x {item.quantity}
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
                    ₺{item.total.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-border space-y-2">
              <div className="flex justify-between fluent-body-small text-foreground-secondary">
                <span>Subtotal</span>
                <span>₺{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between fluent-body-small text-foreground-secondary">
                <span>Tax</span>
                <span>₺{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between fluent-heading text-foreground pt-2 border-t border-border">
                <span>Total</span>
                <span>₺{total.toFixed(2)}</span>
              </div>
              <FluentButton
                appearance="primary"
                size="large"
                className="w-full mt-4"
                onClick={() => setShowPaymentDialog(true)}
                icon={<DollarSign className="w-5 h-5" />}
              >
                Complete Sale
              </FluentButton>
            </div>
          )}
        </FluentCard>
      </div>

      {/* Customer Dialog */}
      <FluentDialog
        open={showCustomerDialog}
        onClose={() => setShowCustomerDialog(false)}
        title="Select Customer"
        size="medium"
      >
        <div className="space-y-2">
          <FluentButton
            appearance="subtle"
            className="w-full justify-start"
            onClick={() => {
              setSelectedCustomer(null);
              setShowCustomerDialog(false);
            }}
          >
            No customer (Cash sale)
          </FluentButton>
          {customers.map((customer) => (
            <FluentButton
              key={customer.id}
              appearance="subtle"
              className="w-full justify-between"
              onClick={() => {
                setSelectedCustomer(customer);
                setShowCustomerDialog(false);
              }}
            >
              <span>{customer.name}</span>
              {customer.debt > 0 && (
                <span className="text-destructive text-sm">
                  Debt: ₺{customer.debt.toFixed(2)}
                </span>
              )}
            </FluentButton>
          ))}
        </div>
      </FluentDialog>

      {/* Payment Dialog */}
      <FluentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        title="Complete Payment"
        size="medium"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="fluent-body-small text-foreground-secondary">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['CASH', 'CARD', 'CREDIT'].map((method) => (
                <FluentButton
                  key={method}
                  appearance={paymentMethod === method ? 'primary' : 'subtle'}
                  onClick={() => setPaymentMethod(method as any)}
                  size="small"
                >
                  {method}
                </FluentButton>
              ))}
            </div>
          </div>

          <div className="p-4 bg-background-alt rounded space-y-2">
            <div className="flex justify-between fluent-body text-foreground">
              <span>Total</span>
              <span className="font-semibold">₺{total.toFixed(2)}</span>
            </div>
            {selectedCustomer && (
              <div className="flex justify-between fluent-body-small text-foreground-secondary">
                <span>Customer</span>
                <span>{selectedCustomer.name}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <FluentButton
              appearance="subtle"
              className="flex-1"
              onClick={() => setShowPaymentDialog(false)}
            >
              Cancel
            </FluentButton>
            <FluentButton
              appearance="primary"
              className="flex-1"
              onClick={handlePayment}
              isLoading={isProcessing}
              icon={<CreditCard className="w-4 h-4" />}
            >
              Confirm
            </FluentButton>
          </div>
        </div>
      </FluentDialog>
    </div>
  );
};

export default POS;


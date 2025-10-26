import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Scan, 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Wallet,
  Trash2,
  Plus,
  Minus,
  Check,
  X
} from 'lucide-react';
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
    name: string;
  };
}

interface CartItem {
  product: Product;
  quantity: number;
}

const QuickSale: React.FC = () => {
  const { user } = useAuthStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [quickProducts, setQuickProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT_CARD' | 'CREDIT'>('CASH');
  const [receivedAmount, setReceivedAmount] = useState(0);

  // Hızlı erişim için en çok satan/popüler ürünleri getir
  useEffect(() => {
    fetchQuickProducts();
  }, []);

  const fetchQuickProducts = async () => {
    try {
      const response = await api.get('/products?limit=12');
      setQuickProducts(response.data.products || []);
    } catch (error) {
      console.error('Quick products fetch error:', error);
    }
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
        toast.error('Ürün stokta yok!');
        return;
      }

      addToCart(product);
      setBarcode('');
      toast.success(`${product.name} sepete eklendi!`);
    } catch (error: any) {
      toast.error('Ürün bulunamadı!');
    } finally {
      setLoading(false);
    }
  };

  // Sepete ürün ekle
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast.error('Stok yetersiz!');
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { product, quantity: 1 }];
    });
  };

  // Sepetten ürün çıkar
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Miktar artır
  const increaseQuantity = (productId: string) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          if (item.quantity >= item.product.stock) {
            toast.error('Stok yetersiz!');
            return item;
          }
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      })
    );
  };

  // Miktar azalt
  const decreaseQuantity = (productId: string) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  // Toplam tutar
  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Para üstü
  const changeAmount = receivedAmount - totalAmount;

  // Hızlı para ekleme
  const addQuickAmount = (amount: number) => {
    setReceivedAmount(prev => prev + amount);
  };

  // Satış tamamla
  const completeSale = async () => {
    if (cart.length === 0) {
      toast.error('Sepet boş!');
      return;
    }

    if (paymentMethod === 'CASH' && receivedAmount < totalAmount) {
      toast.error('Ödenen miktar yetersiz!');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
        paymentMethod,
        totalAmount,
      };

      await api.post('/sales', saleData);

      toast.success('Satış başarıyla tamamlandı!');
      
      // Reset
      setCart([]);
      setReceivedAmount(0);
      setShowPaymentModal(false);
      fetchQuickProducts(); // Stokları güncelle
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Satış başarısız!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sol Panel - Sepet */}
      <div className="w-1/3 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 shadow-xl">
            <ShoppingCart className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-black text-white">Hızlı Satış</h1>
              <p className="text-sm text-blue-100 font-bold">{cart.length} Ürün</p>
            </div>
          </div>
        </motion.div>

        {/* Barkod Input */}
        <form onSubmit={handleBarcodeSubmit} className="mb-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Scan className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Barkod okut veya yaz..."
                className="w-full pl-14 pr-4 py-4 rounded-xl bg-white dark:bg-slate-800 border-3 border-blue-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none font-bold text-lg shadow-lg"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>
        </form>

        {/* Sepet Listesi */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border-3 border-blue-200 dark:border-slate-700 p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ShoppingCart className="w-20 h-20 mb-4" />
              <p className="text-lg font-bold">Sepet Boş</p>
              <p className="text-sm">Ürün eklemek için barkod okutun</p>
            </div>
          ) : (
            cart.map(item => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-slate-900 dark:text-white">{item.product.name}</h3>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decreaseQuantity(item.product.id)}
                      className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-black text-slate-900 dark:text-white w-12 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increaseQuantity(item.product.id)}
                      className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">
                      {item.product.price.toFixed(2)} ₺ × {item.quantity}
                    </p>
                    <p className="text-xl font-black text-blue-600">
                      {(item.product.price * item.quantity).toFixed(2)} ₺
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Toplam ve Ödeme */}
        <div className="mt-4 p-6 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-black text-white">TOPLAM:</span>
            <span className="text-4xl font-black text-white">{totalAmount.toFixed(2)} ₺</span>
          </div>
          
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0 || loading}
            className="w-full py-4 rounded-xl bg-white text-blue-600 font-black text-xl hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105"
          >
            ÖDEME AL
          </button>
        </div>
      </div>

      {/* Sağ Panel - Hızlı Ürünler */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-4">
          {quickProducts.map(product => (
            <motion.button
              key={product.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-3 border-blue-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <h3 className="font-black text-slate-900 dark:text-white mb-2 text-left line-clamp-2 min-h-[3rem]">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-blue-600">
                  {product.price.toFixed(2)} ₺
                </span>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Stok: {product.stock}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Ödeme Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8"
          >
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6">Ödeme Al</h2>

            {/* Ödeme Yöntemi */}
            <div className="mb-6">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Ödeme Yöntemi:</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-4 rounded-xl border-3 font-black transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Banknote className="w-6 h-6 mx-auto mb-2" />
                  NAKİT
                </button>
                <button
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`p-4 rounded-xl border-3 font-black transition-all ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <CreditCard className="w-6 h-6 mx-auto mb-2" />
                  KART
                </button>
                <button
                  onClick={() => setPaymentMethod('CREDIT')}
                  className={`p-4 rounded-xl border-3 font-black transition-all ${
                    paymentMethod === 'CREDIT'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Wallet className="w-6 h-6 mx-auto mb-2" />
                  VERESİYE
                </button>
              </div>
            </div>

            {/* Nakit için alınan tutar */}
            {paymentMethod === 'CASH' && (
              <>
                <div className="mb-6">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Alınan Tutar:</p>
                  <input
                    type="number"
                    value={receivedAmount || ''}
                    onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-700 border-3 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:outline-none font-black text-3xl text-center"
                  />
                  
                  {/* Hızlı para butonları */}
                  <div className="grid grid-cols-6 gap-2 mt-3">
                    {[5, 10, 20, 50, 100, 200].map(amount => (
                      <button
                        key={amount}
                        onClick={() => addQuickAmount(amount)}
                        className="py-3 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-black hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                      >
                        +{amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Para Üstü */}
                {receivedAmount >= totalAmount && (
                  <div className="mb-6 p-6 rounded-xl bg-green-50 dark:bg-green-950/30 border-3 border-green-200 dark:border-green-800">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400 mb-2">Para Üstü:</p>
                    <p className="text-4xl font-black text-green-600 dark:text-green-400">
                      {changeAmount.toFixed(2)} ₺
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Toplam */}
            <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700">
              <p className="text-sm font-bold text-white mb-2">Ödenecek Tutar:</p>
              <p className="text-5xl font-black text-white">{totalAmount.toFixed(2)} ₺</p>
            </div>

            {/* Aksiyonlar */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setReceivedAmount(0);
                }}
                className="flex-1 py-4 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-black hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                İPTAL
              </button>
              <button
                onClick={completeSale}
                disabled={loading || (paymentMethod === 'CASH' && receivedAmount < totalAmount)}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-slate-700 text-white font-black hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {loading ? 'İŞLEM YAPILIYOR...' : 'SATIŞI TAMAMLA'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default QuickSale;


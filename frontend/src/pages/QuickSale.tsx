import React, { useState, useEffect } from 'react';
import { Scan, Trash2, Plus, Minus } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const QuickSale: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [quickProducts, setQuickProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeList, setActiveList] = useState('ANA');

  useEffect(() => {
    fetchQuickProducts();
  }, []);

  const fetchQuickProducts = async () => {
    try {
      const response = await api.get('/products?limit=20');
      setQuickProducts(response.data.products || []);
    } catch (error) {
      console.error('Quick products fetch error:', error);
    }
  };

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

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

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

  const decreaseQuantity = (productId: string) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const completeSale = async (paymentMethod: 'CASH' | 'CREDIT_CARD' | 'CREDIT') => {
    if (cart.length === 0) {
      toast.error('Sepet boş!');
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
      
      setCart([]);
      fetchQuickProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Satış başarısız!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Üst Header - Yeşil Barkod Alanı */}
      <div className="bg-gradient-to-r from-green-400 to-green-500 p-4 shadow-lg">
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-3">
          <Scan className="w-6 h-6 text-white" />
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Ürün barkodunu okutunuz..."
            className="flex-1 px-4 py-3 rounded-lg bg-white text-slate-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-white"
            disabled={loading}
            autoFocus
          />
        </form>
      </div>

      {/* Ana İçerik */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sol Panel - Sepet */}
        <div className="w-80 bg-slate-50 dark:bg-slate-900 border-r-2 border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-4 border-b-2 border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Ürünler</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">
              {cart.length} Ürün - {totalAmount.toFixed(2)} ₺
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-sm font-bold">Sepet Boş</p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.product.id}
                  className="p-3 rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decreaseQuantity(item.product.id)}
                        className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-black text-slate-900 dark:text-white w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQuantity(item.product.id)}
                        className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                        {item.product.price.toFixed(2)} ₺
                      </p>
                      <p className="text-sm font-black text-blue-600">
                        {(item.product.price * item.quantity).toFixed(2)} ₺
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-black text-slate-900 dark:text-white">TOPLAM:</span>
              <span className="text-2xl font-black text-blue-600">{totalAmount.toFixed(2)} ₺</span>
            </div>
          </div>
        </div>

        {/* Sağ Panel - Ödeme ve Ürünler */}
        <div className="flex-1 flex flex-col p-6 bg-slate-100 dark:bg-slate-950">
          {/* Ödeme Yöntemleri */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            <button
              onClick={() => completeSale('CASH')}
              disabled={cart.length === 0 || loading}
              className="p-6 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              (F8)<br />NAKİT
            </button>
            <button
              onClick={() => completeSale('CREDIT_CARD')}
              disabled={cart.length === 0 || loading}
              className="p-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              (F9)<br />POS
            </button>
            <button
              onClick={() => completeSale('CREDIT')}
              disabled={cart.length === 0 || loading}
              className="p-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              (F10)<br />AÇIK HESAP
            </button>
            <button
              disabled={true}
              className="p-6 rounded-xl bg-blue-400 text-white font-black text-lg shadow-lg opacity-50 cursor-not-allowed"
            >
              PARÇALI
            </button>
            <button
              disabled={true}
              className="p-6 rounded-xl bg-red-500 text-white font-black text-lg shadow-lg opacity-50 cursor-not-allowed"
            >
              +<br />DİĞER
            </button>
          </div>

          {/* Liste Sekmeleri */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {['ANA', 'LİSTE 1', 'LİSTE 2', 'LİSTE 3', 'LİSTE 4'].map((list) => (
              <button
                key={list}
                onClick={() => setActiveList(list)}
                className={`py-3 rounded-lg font-black text-sm transition-all ${
                  activeList === list
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
              >
                {list}
              </button>
            ))}
          </div>

          {/* Ürün Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-3">
              {quickProducts.slice(0, 12).map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="h-24 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed p-3 flex flex-col items-center justify-center"
                >
                  <p className="font-black text-sm text-slate-900 dark:text-white mb-1 line-clamp-2 text-center">
                    {product.name.toUpperCase()}
                  </p>
                  <p className="text-sm font-bold text-blue-600">
                    ₺ {product.price.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSale;

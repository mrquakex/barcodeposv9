import React, { useState, useEffect } from 'react';
import { Scan, Trash2 } from 'lucide-react';
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

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

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
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-slate-900">
      {/* Yeşil Barkod Header - Görseldeki gibi */}
      <div className="bg-gradient-to-r from-green-400 to-green-500 p-3 shadow-lg">
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 max-w-4xl">
          <Scan className="w-5 h-5 text-white flex-shrink-0" />
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Ürün barkodunu okutunuz..."
            className="flex-1 px-3 py-2 rounded bg-white text-slate-900 font-semibold text-sm focus:outline-none"
            disabled={loading}
            autoFocus
          />
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold text-sm">
            Ara
          </button>
          <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold text-sm">
            Fiyat Sor
          </button>
          <button className="px-4 py-2 bg-orange-400 hover:bg-orange-500 text-white rounded font-bold text-sm">
            Yazdır
          </button>
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold text-sm">
            Ödeme Ekle
          </button>
        </form>
      </div>

      {/* Ana İçerik - Görseldeki gibi */}
      <div className="flex-1 flex overflow-hidden">
        {/* SOL PANEL - Sepet (Görseldeki Dar Panel) */}
        <div className="w-72 bg-slate-50 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 flex flex-col">
          {/* Sepet Header */}
          <div className="p-3 bg-slate-100 dark:bg-slate-700 border-b border-slate-300 dark:border-slate-600">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ürünler</h3>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                Müşteri Seç
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {totalQuantity} Ürün • {totalAmount.toFixed(2)} ₺
            </p>
          </div>

          {/* Sepet Liste */}
          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-slate-400 font-semibold">Sepet Boş</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="text-left p-1 font-bold text-slate-700 dark:text-slate-300">Barkod</th>
                    <th className="text-left p-1 font-bold text-slate-700 dark:text-slate-300">Ürün</th>
                    <th className="text-center p-1 font-bold text-slate-700 dark:text-slate-300">Miktar</th>
                    <th className="text-right p-1 font-bold text-slate-700 dark:text-slate-300">Fiyat</th>
                    <th className="text-right p-1 font-bold text-slate-700 dark:text-slate-300">Tutar</th>
                    <th className="p-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={item.product.id} className={index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700'}>
                      <td className="p-1 text-slate-600 dark:text-slate-400">{item.product.barcode?.slice(-6)}</td>
                      <td className="p-1 text-slate-900 dark:text-white font-semibold">{item.product.name}</td>
                      <td className="p-1 text-center text-slate-900 dark:text-white font-bold">{item.quantity}</td>
                      <td className="p-1 text-right text-slate-600 dark:text-slate-400">{item.product.price.toFixed(2)}</td>
                      <td className="p-1 text-right text-blue-600 dark:text-blue-400 font-bold">
                        {(item.product.price * item.quantity).toFixed(2)}
                      </td>
                      <td className="p-1">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Sepet Footer - Toplam */}
          <div className="p-3 bg-slate-100 dark:bg-slate-700 border-t border-slate-300 dark:border-slate-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Ödenen</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">0</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Tutar</span>
              <span className="text-xl font-black text-red-600">{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Para Üstü</span>
              <span className="text-lg font-black text-green-600">0</span>
            </div>
          </div>
        </div>

        {/* SAĞ PANEL - Ödeme ve Ürünler (Görseldeki Geniş Alan) */}
        <div className="flex-1 flex flex-col p-4 bg-slate-50 dark:bg-slate-900">
          {/* 1. ÖDEME YÖNTEMLERİ - Görseldeki 5 Büyük Buton */}
          <div className="grid grid-cols-5 gap-3 mb-3">
            <button
              onClick={() => completeSale('CASH')}
              disabled={cart.length === 0 || loading}
              className="h-24 rounded-lg bg-green-500 hover:bg-green-600 text-white font-black text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
            >
              <span className="text-xs mb-1">(F8)</span>
              <span>NAKİT</span>
            </button>
            <button
              onClick={() => completeSale('CREDIT_CARD')}
              disabled={cart.length === 0 || loading}
              className="h-24 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-black text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
            >
              <span className="text-xs mb-1">(F9)</span>
              <span>POS</span>
            </button>
            <button
              onClick={() => completeSale('CREDIT')}
              disabled={cart.length === 0 || loading}
              className="h-24 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-black text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
            >
              <span className="text-xs mb-1">(F10)</span>
              <span>AÇIK HESAP</span>
            </button>
            <button
              disabled
              className="h-24 rounded-lg bg-blue-400 text-white font-black text-base shadow-lg opacity-50 cursor-not-allowed flex items-center justify-center"
            >
              PARÇALI
            </button>
            <button
              disabled
              className="h-24 rounded-lg bg-red-500 text-white font-black text-base shadow-lg opacity-50 cursor-not-allowed flex flex-col items-center justify-center"
            >
              <span className="text-2xl mb-1">+</span>
              <span>DİĞER</span>
            </button>
          </div>

          {/* 2. LİSTE SEKMELERİ - Görseldeki 5 Sekme */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            <button className="py-2 rounded bg-blue-600 text-white font-bold text-sm shadow hover:bg-blue-700 transition-all">
              ANA
            </button>
            <button className="py-2 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm shadow hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              LİSTE 1
            </button>
            <button className="py-2 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm shadow hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              LİSTE 2
            </button>
            <button className="py-2 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm shadow hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              LİSTE 3
            </button>
            <button className="py-2 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm shadow hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              LİSTE 4
            </button>
          </div>

          {/* 3. ÜRÜN GRİDİ - Görseldeki Ürün Butonları */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {quickProducts.slice(0, 20).map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="h-20 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed p-2 flex flex-col items-center justify-center"
                >
                  <p className="font-black text-xs text-slate-900 dark:text-white mb-1 line-clamp-2 text-center leading-tight">
                    {product.name.toUpperCase()}
                  </p>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
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

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
  Users, Calendar, BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../components/ui/StatCard';

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
  const barcodeInputRef = useRef<HTMLInputElement>(null);

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

      <div className="flex-1 flex gap-4 min-h-0">
      {/* Left: Products */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Barcode Scanner */}
          <Card className="border-2 border-blue-200 dark:border-blue-900 shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleBarcodeSubmit}>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
              <Input
                ref={barcodeInputRef}
                type="text"
                    placeholder="Barkod okutun veya ürün arayın... (Enter ile ekle)"
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
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border rounded-md bg-background min-w-[150px]"
                >
                  <option value="">Tüm Kategoriler</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <div className="flex gap-1 border rounded-md p-1">
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
          </CardHeader>
            <CardContent className="flex-1 overflow-y-auto min-h-0">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredProducts.map((product) => (
                    <motion.button
                      key={product.id}
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleProductClick(product)}
                      className={`p-5 rounded-xl border-2 transition-all text-left shadow-md ${
                        product.stock === 0 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300' 
                          : 'hover:border-blue-600 hover:shadow-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                      disabled={product.stock === 0}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-md">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        {product.stock <= product.minStock && product.stock > 0 && (
                          <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full font-bold shadow-md">
                            Düşük
                          </span>
                        )}
                        {product.stock === 0 && (
                          <span className="text-xs bg-gray-600 text-white px-3 py-1 rounded-full font-bold">
                            Yok
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-base truncate mb-2 text-slate-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-muted-foreground mb-3 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded inline-block">
                        Stok: <span className={product.stock <= product.minStock ? 'text-red-600 font-bold' : 'font-semibold'}>{product.stock}</span> {product.unit}
                      </p>
                      <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
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
        <div className="w-[420px] flex flex-col gap-4 min-h-0">
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
                      className="border-2 rounded-xl p-5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:border-blue-600 transition-all shadow-md hover:shadow-lg border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <p className="font-bold text-base text-slate-900 dark:text-white mb-1">{item.product.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">{formatCurrency(item.product.price)} × {item.quantity}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-10 h-10 p-0 border-2 border-slate-300 dark:border-slate-600 hover:border-blue-600 hover:bg-blue-50"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-14 text-center font-black text-xl text-slate-900 dark:text-white">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="w-10 h-10 p-0 border-2 border-slate-300 dark:border-slate-600 hover:border-blue-600 hover:bg-blue-50"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
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
                    className="w-full"
                    onClick={() => setShowCustomerModal(true)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Müşteri Seç (F2)
                  </Button>
                )}
                </div>

              {/* Totals */}
              <div className="space-y-3">
            <div className="flex justify-between text-sm font-semibold">
              <span>Ara Toplam:</span>
              <span className="text-base">{formatCurrency(totalAmount)}</span>
            </div>


                <div className="border-t-2 border-blue-200 dark:border-blue-900 pt-3 flex justify-between items-center bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 p-3 rounded-xl">
                  <span className="text-xl font-black">TOPLAM:</span>
                  <span className="text-3xl font-black text-blue-700 dark:text-blue-400">
                    {formatCurrency(netAmount)}
                  </span>
                </div>
            </div>

              {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                  className="flex-1 h-16 text-xl font-black bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600 shadow-xl hover:shadow-2xl transition-all"
                  onClick={() => setShowPaymentModal(true)}
                disabled={items.length === 0}
              >
                  <CreditCard className="w-6 h-6 mr-3" />
                  Ödeme Al (F5)
              </Button>
            </div>

              {/* Quick Actions & Shortcuts */}
              <div className="pt-3 border-t space-y-3">
                <div className="grid grid-cols-3 gap-2">
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
    </div>
  );
};

export default POS;

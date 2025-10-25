import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useCartStore } from '../store/cartStore';
import { Product } from '../types';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Search, Trash2, Plus, Minus, ShoppingCart, CreditCard } from 'lucide-react';

const POS: React.FC = () => {
  const [barcode, setBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal, getNetTotal, discount, setDiscount } = useCartStore();

  useEffect(() => {
    fetchProducts();
    barcodeInputRef.current?.focus();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', {
        params: { isActive: true },
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Products fetch error:', error);
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
        setBarcode('');
      } else {
        alert('Ürün stokta yok!');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ürün bulunamadı');
      setBarcode('');
    } finally {
      setLoading(false);
      barcodeInputRef.current?.focus();
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.stock > 0) {
      addItem(product, 1);
    } else {
      alert('Ürün stokta yok!');
    }
  };

  const handleCompleteSale = async () => {
    if (items.length === 0) {
      alert('Sepet boş!');
      return;
    }

    const saleData = {
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      discountAmount: discount,
      paymentMethod: 'CASH',
    };

    try {
      await api.post('/sales', saleData);
      alert('Satış başarıyla tamamlandı!');
      clearCart();
      barcodeInputRef.current?.focus();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Satış işlemi başarısız');
    }
  };

  const filteredProducts = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode.includes(searchQuery)
      )
    : products.slice(0, 20);

  const totalAmount = getTotal();
  const netAmount = getNetTotal();

  return (
    <div className="h-full flex gap-6">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Barkod Okuyucu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <Input
                ref={barcodeInputRef}
                type="text"
                placeholder="Barkod okutun veya girin..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Aranıyor...' : 'Ekle'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              <Input
                type="text"
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                  disabled={product.stock === 0}
                >
                  <p className="font-semibold text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">Stok: {product.stock}</p>
                  <p className="text-sm font-bold text-primary mt-1">
                    {formatCurrency(product.price)}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Cart */}
      <div className="w-96 flex flex-col gap-4">
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Sepet ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sepet boş</p>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 border rounded flex items-center justify-center hover:bg-accent"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 border rounded flex items-center justify-center hover:bg-accent"
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-bold">{formatCurrency(item.subtotal)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Total */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Ara Toplam:</span>
              <span className="font-semibold">{formatCurrency(totalAmount)}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">İndirim:</span>
              <Input
                type="number"
                min="0"
                max={totalAmount}
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="h-8"
              />
            </div>

            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Toplam:</span>
              <span className="text-primary">{formatCurrency(netAmount)}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={clearCart}
                disabled={items.length === 0}
              >
                Temizle
              </Button>
              <Button
                className="flex-1"
                onClick={handleCompleteSale}
                disabled={items.length === 0}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Satış Yap
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POS;

